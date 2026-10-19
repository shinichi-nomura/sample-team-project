<?php
declare(strict_types=1);

// 設定はGitHub Secretsから公開時に生成。直接アクセスでは返さない。
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

function site_config(): array {
    $path = __DIR__ . '/site-config.php';
    if (!is_file($path)) throw new RuntimeException('configuration missing');
    $config = require $path;
    foreach (['cms_key','turnstile_site','turnstile_secret'] as $key) {
        if (!is_array($config) || !is_string($config[$key] ?? null) || $config[$key] === '') {
            throw new RuntimeException('configuration invalid');
        }
    }
    return $config;
}

// HTTPSだけを使用し、転送先へのリダイレクトは許可しない。
function site_json_request(string $url, array $headers = [], ?array $post = null): array {
    $curl = curl_init($url);
    $body = '';
    curl_setopt_array($curl, [CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_CONNECTTIMEOUT=>5, CURLOPT_TIMEOUT=>12,
        CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2,
        CURLOPT_HTTPHEADER=>$headers,
        CURLOPT_WRITEFUNCTION=>function($handle, $chunk) use (&$body) {
            if (strlen($body) + strlen($chunk) > 4 * 1024 * 1024) return 0;
            $body .= $chunk;
            return strlen($chunk);
        }]);
    if ($post !== null) curl_setopt_array($curl, [CURLOPT_POST=>true, CURLOPT_POSTFIELDS=>http_build_query($post)]);
    $ok = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    unset($curl);
    if ($ok === false || $status !== 200) throw new RuntimeException('upstream unavailable', $status);
    $result = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($result)) throw new RuntimeException('upstream invalid');
    return $result;
}

function turnstile_valid(array $result): bool {
    return ($result['success'] ?? false) === true
        && ($result['hostname'] ?? '') === 'mizu-tokimeki.com'
        && ($result['action'] ?? '') === 'contact';
}

function verify_turnstile($token, string $secret): bool {
    if (!is_string($token) || $token === '' || strlen($token) > 2048) return false;
    $result = site_json_request('https://challenges.cloudflare.com/turnstile/v0/siteverify',
        ['Content-Type: application/x-www-form-urlencoded'], ['secret'=>$secret,'response'=>$token]);
    return turnstile_valid($result);
}
