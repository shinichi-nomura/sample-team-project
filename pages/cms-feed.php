<?php
declare(strict_types=1);
require_once __DIR__ . '/site-security.php';

function public_article(array $item): ?array {
    // 公開済みのイベント・近況報告だけを返し、CMSの他フィールドは公開しない。
    $types = $item['type'] ?? [];
    if (!is_array($types) || !array_intersect($types, ['イベント','近況報告']) || empty($item['publishedAt'])) return null;
    $result = [];
    foreach (['id','title','body','date'] as $key) $result[$key] = is_string($item[$key] ?? null) ? $item[$key] : '';
    $result['type'] = array_values(array_intersect($types, ['イベント','近況報告']));
    $photo = $item['photo']['url'] ?? '';
    if (is_string($photo) && str_starts_with($photo, 'https://')) $result['photo'] = ['url'=>$photo];
    $linkUrl = $item['linkUrl'] ?? '';
    if (is_string($linkUrl) && filter_var($linkUrl, FILTER_VALIDATE_URL) && parse_url($linkUrl, PHP_URL_SCHEME) === 'https') {
    $result['linkUrl'] = $linkUrl;}
    return $result;
}

function fetch_ogp_image(string $url): ?string {
    $host = parse_url($url, PHP_URL_HOST);
    if ( parse_url($url, PHP_URL_SCHEME) !== 'https' || !is_string($host) || $host === ''
        || parse_url($url, PHP_URL_PORT) !== null || parse_url($url, PHP_URL_USER) !== null || parse_url($url, PHP_URL_PASS) !== null
    ) {
    return null;
}
    // 接続先を公開IPv4アドレスに限定し、そのアドレスへ接続する
    $ip = null;
    foreach (gethostbynamel($host) ?: [] as $candidate) {
        if (filter_var( $candidate, FILTER_VALIDATE_IP,
            FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE )) {
        $ip = $candidate;
        break;
        }
    }
    if ($ip === null) return null;
    $html = '';
    $curl = curl_init($url);
    if ($curl === false) return null;
    curl_setopt_array($curl, [ CURLOPT_RESOLVE => ["{$host}:443:{$ip}"], CURLOPT_PROXY => '', CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 3, CURLOPT_TIMEOUT => 3, CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2, CURLOPT_WRITEFUNCTION => function ($handle, $chunk) use (&$html) {
         if (strlen($html) + strlen($chunk) > 1024 * 1024) return 0;
        $html .= $chunk;
        return strlen($chunk);
        },
    ]);
    $ok = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $contentType = strtolower((string) curl_getinfo($curl, CURLINFO_CONTENT_TYPE));
    curl_close($curl);
    if ($ok === false || $status !== 200 || !str_starts_with($contentType, 'text/html')) {
        return null;
    }
    $document = new DOMDocument();
    $previous = libxml_use_internal_errors(true);
    try {
        if (!$document->loadHTML($html, LIBXML_NONET)) return null;
    } finally {
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
    }
    $xpath = new DOMXPath($document);
    $nodes = $xpath->query('//meta[@property="og:image"]/@content');
    $image = $nodes ? trim($nodes->item(0)?->nodeValue ?? '') : '';
    // この例では絶対URLのHTTPS画像だけを採用。相対URLなら「画像なし」とする。
    if (
        !filter_var($image, FILTER_VALIDATE_URL)
        || parse_url($image, PHP_URL_SCHEME) !== 'https'
    ) {
        return null;
    }
    return $image;
}

function cached_ogp_image(string $url): ?string {
    $dir = sys_get_temp_dir() . '/tokimeki-ogp-' . hash('sha256', __DIR__);
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
        throw new RuntimeException('OGP cache directory unavailable');
    }
    $file = fopen($dir . '/' . hash('sha256', $url) . '.json', 'c+');
    if ($file === false) {
        throw new RuntimeException('OGP cache unavailable');
    }
    if (!flock($file, LOCK_EX)) {
        fclose($file);
        throw new RuntimeException('OGP cache lock unavailable');
    }
    try {
        $raw = stream_get_contents($file);
        $cached = is_string($raw) ? json_decode($raw, true) : null;
        if (
            is_array($cached)
            && ($cached['expiresAt'] ?? 0) > time()
            && array_key_exists('image', $cached)
        ) {
            return is_string($cached['image']) ? $cached['image'] : null;
        }
        $image = fetch_ogp_image($url);
        $ttl = $image === null ? 600 : 86400;
        $encoded = json_encode( ['expiresAt' => time() + $ttl, 'image' => $image], JSON_THROW_ON_ERROR);
        rewind($file);
        if (
            !ftruncate($file, 0)
            || fwrite($file, $encoded) !== strlen($encoded)
            || !fflush($file)
        ) {
            throw new RuntimeException('OGP cache write failed');
        }
        return $image;
    } finally {
        flock($file, LOCK_UN);
        fclose($file);
    }
}

function is_embeddable_social_post(string $url): bool {
    $host = strtolower((string) parse_url($url, PHP_URL_HOST));
    $path = (string) parse_url($url, PHP_URL_PATH);
    if (in_array($host, ['instagram.com', 'www.instagram.com'], true)) {
        return (bool) preg_match('~^/(?:p|reel|tv)/[A-Za-z0-9_-]+/?$~', $path);
    }
    if (in_array($host, ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'], true)) {
        return (bool) preg_match('~^/[A-Za-z0-9_]{1,15}/status/[0-9]+/?$~', $path);
    }
    return false;
}

function add_link_preview(array $item): array {
    if (empty($item['linkUrl'])) return $item;
    // SNSの投稿はブラウザー側の公式埋め込みで表示し、サーバーからは取得しない。
    if (is_embeddable_social_post($item['linkUrl'])) return $item;
    // OGPが取得できなくても記事本文は表示する
    try {
        $image = cached_ogp_image($item['linkUrl']);
        $item['linkPreview'] = $image === null ? [] : ['image' => $image];
    } catch (Throwable $e) {
        $item['linkPreview'] = [];
    }
    return $item;
}

function cms_feed(callable $fetch, string $cache): array {
    $file = fopen($cache, 'c+');
    if (!$file || !flock($file, LOCK_EX)) throw new RuntimeException('cache unavailable');
    try {
        $raw = stream_get_contents($file);
        $stored = $raw === '' ? [] : json_decode($raw, true);
        if (is_array($stored) && ($stored['time'] ?? 0) > time() - 60 && is_array($stored['items'] ?? null)) return $stored['items'];
        // エラー時も毎回APIを叩かず短時間だけ再試行を抑える。古い記事は返さない。
        if (is_array($stored) && ($stored['retryAfter'] ?? 0) > time()) throw new RuntimeException('upstream cooldown');
        try {
            $data = $fetch();
            if (!is_array($data['contents'] ?? null)) throw new RuntimeException('invalid feed');
            $items = [];
            foreach ($data['contents'] as $item) if (is_array($item) && ($public = public_article($item)) !== null) $items[] = $public;
            $next = ['time'=>time(),'items'=>$items];
        } catch (Throwable $e) {
            rewind($file); ftruncate($file, 0);
            fwrite($file, json_encode(['retryAfter'=>time()+15])); fflush($file);
            throw $e;
        }
        $encoded = json_encode($next, JSON_THROW_ON_ERROR);
        rewind($file);
        if (!ftruncate($file, 0) || fwrite($file, $encoded) !== strlen($encoded) || !fflush($file)) throw new RuntimeException('cache write');
        return $items;
    } finally { flock($file, LOCK_UN); fclose($file); }
}

// 古い記事の直接リンクも維持。ID別のファイルを作らず、1ファイルに最大100件だけ保持。
function cms_article(string $id, callable $fetch, string $cache): ?array {
    $file = fopen($cache, 'c+');
    if (!$file || !flock($file, LOCK_EX)) throw new RuntimeException('cache unavailable');
    try {
        $raw = stream_get_contents($file);
        $stored = $raw === '' ? [] : json_decode($raw, true);
        if (!is_array($stored)) $stored = [];
        foreach ($stored as $key=>$entry) if (($entry['time'] ?? 0) <= time() - 60) unset($stored[$key]);
        if (isset($stored[$id])) {
            if ($stored[$id]['error'] ?? false) throw new RuntimeException('upstream cooldown');
            return $stored[$id]['item'];
        }
        if (count($stored) >= 100) throw new RuntimeException('detail request limit');
        $error = null;
        try { $item = $fetch(); }
        catch (Throwable $e) { $item = null; $error = $e; }
        $stored[$id] = ['time'=>time(), 'item'=>$item, 'error'=>$error !== null];
        $encoded = json_encode($stored, JSON_THROW_ON_ERROR);
        rewind($file);
        if (!ftruncate($file, 0) || fwrite($file, $encoded) !== strlen($encoded) || !fflush($file)) throw new RuntimeException('cache write');
        if ($error) throw $error;
        return $item;
    } finally { flock($file, LOCK_UN); fclose($file); }
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    ini_set('display_errors', '0');
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    set_error_handler(function() { throw new RuntimeException('cms runtime error'); });
    try {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') { header('Allow: GET'); http_response_code(405); echo '{}'; exit; }
        if (array_diff(array_keys($_GET), ['id']) || (isset($_GET['id']) && (!is_string($_GET['id']) || !preg_match('/\A[a-zA-Z0-9_-]{1,100}\z/', $_GET['id'])))) {
            http_response_code(400); echo '{}'; exit;
        }
        $config = site_config();
        $dir = sys_get_temp_dir() . '/tokimeki-feed-' . hash('sha256', __DIR__);
        if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) throw new RuntimeException('cache directory');
        $items = cms_feed(fn()=>site_json_request('https://tokimeki-jinja.microcms.io/api/v1/posts?limit=100&orders=-date',
            ['X-MICROCMS-API-KEY: ' . $config['cms_key']]), $dir . '/feed.json');
        if (isset($_GET['id'])) {
            foreach ($items as $item) if ($item['id'] === $_GET['id']) { echo json_encode(add_link_preview($item), JSON_UNESCAPED_UNICODE); exit; }
            $id = $_GET['id'];
            $item = cms_article($id, function() use ($id, $config) {
                try {
                    return public_article(site_json_request('https://tokimeki-jinja.microcms.io/api/v1/posts/' . rawurlencode($id),
                        ['X-MICROCMS-API-KEY: ' . $config['cms_key']]));
                } catch (RuntimeException $e) { if ($e->getCode() === 404) return null; throw $e; }
            }, $dir . '/details.json');
            if ($item !== null) { echo json_encode(add_link_preview($item), JSON_UNESCAPED_UNICODE); exit; }
            http_response_code(404); echo '{}'; exit;
        }
        echo json_encode(['contents'=>$items], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        http_response_code(503);
        echo '{"message":"現在記事を取得できません。時間をおいてお試しください。"}';
        error_log('CMS feed unavailable: ' . get_class($e));
    }
}
