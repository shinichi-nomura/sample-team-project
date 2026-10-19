<?php
declare(strict_types=1);
require_once __DIR__ . '/site-security.php';

// PHP 8.2以上。受信先は訪問者の入力から決めない。
const CONTACT_TO = 'info@mizu-tokimeki.com';
const CONTACT_FROM = 'info@mizu-tokimeki.com';
const CONTACT_ORIGIN = 'https://mizu-tokimeki.com';

function reply(int $status, array $data): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function validate_contact(array $input): array {
    $fields = ['lastName'=>100, 'firstName'=>100, 'lastName-kana'=>100,
        'firstName-kana'=>100, 'email'=>254, 'email-check'=>254, 'company'=>200,
        'tel'=>40, 'phone'=>40, 'postalCode'=>20, 'prefecture'=>20,
        'municipality'=>300, 'building'=>300, 'details'=>5000, 'website'=>200];
    $data = [];
    foreach ($fields as $key=>$limit) {
        $value = $input[$key] ?? '';
        if (!is_string($value) || !preg_match('//u', $value) || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
            throw new InvalidArgumentException('入力内容を確認してください。');
        }
        $value = trim($value);
        if (preg_match_all('/./us', $value) > $limit || ($key !== 'details' && preg_match('/[\r\n]/', $value))) {
            throw new InvalidArgumentException('入力が長すぎるか、使用できない改行があります。');
        }
        $data[$key] = $value;
    }
    foreach (['lastName','firstName','lastName-kana','firstName-kana','email','email-check','details'] as $key) {
        if ($data[$key] === '') throw new InvalidArgumentException('必須項目を入力してください。');
    }
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL) || $data['email'] !== $data['email-check']) {
        throw new InvalidArgumentException('メールアドレスと確認欄を確認してください。');
    }
    foreach (['lastName-kana','firstName-kana'] as $key) {
        if (!preg_match('/\A[ぁ-ゖゝゞー\s　]+\z/u', $data[$key])) throw new InvalidArgumentException('ふりがなはひらがなで入力してください。');
    }
    foreach (['tel','phone','postalCode'] as $key) {
        if ($data[$key] !== '' && !preg_match('/\A[0-9０-９+＋()（）\sー－-]+\z/u', $data[$key])) throw new InvalidArgumentException('電話番号・郵便番号を確認してください。');
    }
    if (($input['privacy'] ?? '') !== 'agree' || $data['website'] !== '') throw new InvalidArgumentException('入力内容と個人情報の取り扱いへの同意を確認してください。');
    return $data;
}

function contact_message(array $data): string {
    $labels = ['lastName'=>'苗字','firstName'=>'名前','lastName-kana'=>'みょうじ',
        'firstName-kana'=>'おなまえ','email'=>'返信先メール','company'=>'会社名',
        'tel'=>'電話番号','phone'=>'携帯電話番号','postalCode'=>'郵便番号',
        'prefecture'=>'都道府県','municipality'=>'市区町村番地','building'=>'建物・部屋名','details'=>'お問い合わせ内容'];
    $body = "Webサイトからのお問い合わせ\n\n";
    foreach ($labels as $key=>$label) $body .= $label . ":\n" . $data[$key] . "\n\n";
    return $body;
}

// 1つのロック付きファイルで同時実行も制限。本文・メール・生IPは保存しない。
function contact_rate_limit(string $path, string $ip, int $now, int $maxPerIp = 5, int $interval = 60, int $maxGlobal = 100): bool {
    $file = fopen($path, 'c+');
    if (!$file || !flock($file, LOCK_EX)) throw new RuntimeException('rate storage');
    try {
        $raw = stream_get_contents($file);
        $state = $raw === '' ? [] : json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($state)) throw new RuntimeException('invalid rate storage');
        foreach ($state as $key=>$times) {
            $state[$key] = array_values(array_filter($times, fn($t)=>$t > $now - 3600));
            if (!$state[$key]) unset($state[$key]);
        }
        $key = hash('sha256', $ip);
        $times = $state[$key] ?? [];
        $total = array_sum(array_map('count', $state));
        if (count($times) >= $maxPerIp || $total >= $maxGlobal || ($times && $now - end($times) < $interval)) return false;
        $state[$key][] = $now;
        $json = json_encode($state, JSON_THROW_ON_ERROR);
        rewind($file);
        if (!ftruncate($file, 0) || fwrite($file, $json) !== strlen($json) || !fflush($file)) throw new RuntimeException('rate write');
        return true;
    } finally { flock($file, LOCK_UN); fclose($file); }
}

function send_contact_mail(array $data, callable $deliver): void {
    $subject = '=?UTF-8?B?' . base64_encode('【一朗堂ときめき部】お問い合わせ') . '?=';
    $headers = ['From'=>CONTACT_FROM, 'Reply-To'=>$data['email'], 'MIME-Version'=>'1.0',
        'Content-Type'=>'text/plain; charset=UTF-8', 'Content-Transfer-Encoding'=>'base64'];
    $body = chunk_split(base64_encode(contact_message($data)), 76, "\r\n");
    if (!$deliver(CONTACT_TO, $subject, $body, $headers, '-f' . CONTACT_FROM)) throw new RuntimeException('mail rejected');
}

function handle_contact(): void {
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($method, ['GET','POST'], true)) { header('Allow: GET, POST'); reply(405, ['message'=>'使用できない送信方法です。']); }
    if (($_SERVER['HTTP_X_CONTACT_REQUEST'] ?? '') !== '1') reply(403, ['message'=>'お問い合わせページから操作してください。']);
    if ($method === 'POST' && ($_SERVER['HTTP_ORIGIN'] ?? '') !== CONTACT_ORIGIN) reply(403, ['message'=>'お問い合わせページから送信してください。']);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 65536) reply(413, ['message'=>'入力が長すぎます。']);
    $dir = sys_get_temp_dir() . '/tokimeki-contact-' . hash('sha256', __DIR__);
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) throw new RuntimeException('rate directory');
    // トークン発行や失敗リクエストも制限し、メール制限とは別に管理する。
    if (!contact_rate_limit($dir . '/requests.json', $_SERVER['REMOTE_ADDR'] ?? 'unknown', time(), 120, 0, 3000)) {
        header('Retry-After: 3600'); reply(429, ['message'=>'アクセスが集中しています。時間をおいてお試しください。']);
    }
    $config = site_config();
    ini_set('session.use_strict_mode', '1');
    session_name('tokimeki_contact');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/pages/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
    if (!session_start()) throw new RuntimeException('session');
    if ($method === 'GET') {
        if (!isset($_SESSION['token']) || ($_SESSION['delivered'] ?? '') === $_SESSION['token'] || time() - ($_SESSION['issued'] ?? 0) > 3600) {
            $_SESSION['token'] = bin2hex(random_bytes(32));
            $_SESSION['issued'] = time();
        }
        reply(200, ['token'=>$_SESSION['token'], 'siteKey'=>$config['turnstile_site']]);
    }
    $token = $_POST['token'] ?? '';
    if (!is_string($token) || !isset($_SESSION['token']) || !hash_equals($_SESSION['token'], $token) || time() - ($_SESSION['issued'] ?? 0) > 3600) {
        reply(403, ['message'=>'受付の有効期限が切れました。もう一度送信してください。']);
    }
    // 応答が途切れた後の再送でも、同じメールを二重に送らない。
    if (($_SESSION['delivered'] ?? '') === $token) reply(200, ['ok'=>true]);
    try { $data = validate_contact($_POST); }
    catch (InvalidArgumentException $e) { reply(422, ['message'=>$e->getMessage()]); }
    if (!verify_turnstile($_POST['cf-turnstile-response'] ?? '', $config['turnstile_secret'])) {
        reply(422, ['message'=>'自動投稿防止の確認をやり直してください。']);
    }
    if (!contact_rate_limit($dir . '/rate.json', $_SERVER['REMOTE_ADDR'] ?? 'unknown', time())) {
        header('Retry-After: 3600'); reply(429, ['message'=>'送信回数の上限です。時間をおいてお試しください。']);
    }
    send_contact_mail($data, 'mail');
    $_SESSION['delivered'] = $token;
    reply(200, ['ok'=>true]);
}

// テスト時は関数だけ読み込み、外部へのメール送信は行わない。
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    ini_set('display_errors', '0');
    set_error_handler(function($severity, $message, $file, $line) { throw new ErrorException('contact runtime error', 0, $severity, $file, $line); });
    try { handle_contact(); }
    catch (Throwable $e) {
        error_log('Contact failed: ' . get_class($e));
        reply(503, ['message'=>'現在送信できません。入力内容を控えて、時間をおいて再度お試しいただくか、info@mizu-tokimeki.comへ直接ご連絡ください。']);
    }
}
