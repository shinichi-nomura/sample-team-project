<?php
require __DIR__ . '/../pages/contact-send.php';
function check($condition, $name) { if (!$condition) throw new RuntimeException($name); }
$valid = ['lastName'=>'山田','firstName'=>'花子','lastName-kana'=>'やまだ','firstName-kana'=>'はなこ',
    'email'=>'visitor@example.com','email-check'=>'visitor@example.com','details'=>'テスト内容です。','privacy'=>'agree'];
$data = validate_contact($valid);
check(str_contains(contact_message($data), 'テスト内容です。'), 'Japanese body');
foreach ([['email'=>"x@example.com\r\nBcc: other@example.com"], ['email'=>['x']], ['details'=>''],
    ['details'=>str_repeat('あ',5001)], ['privacy'=>''], ['website'=>'spam'], ['email-check'=>'other@example.com'],
    ['lastName'=>"a\0b"], ['lastName-kana'=>'ABC']] as $change) {
    $rejected = false;
    try { validate_contact(array_replace($valid, $change)); } catch (InvalidArgumentException $e) { $rejected = true; }
    check($rejected, 'Invalid request accepted');
}
$calls = 0;
send_contact_mail($data, function($to, $subject, $body, $headers, $params) use (&$calls) {
    $calls++;
    check($to === CONTACT_TO && $headers['From'] === CONTACT_FROM, 'fixed destination');
    check($headers['Reply-To'] === 'visitor@example.com', 'reply address');
    check(str_contains(base64_decode($body), 'テスト内容です。'), 'encoded body');
    return true;
});
check($calls === 1, 'one delivery');
$failed = false;
try { send_contact_mail($data, fn()=>false); } catch (RuntimeException $e) { $failed = true; }
check($failed, 'mail failure must not be success');
$file = tempnam(sys_get_temp_dir(), 'contact-test-');
try {
    check(contact_rate_limit($file,'192.0.2.1',10000), 'first');
    check(!contact_rate_limit($file,'192.0.2.1',10001), 'interval');
    for ($i=1;$i<5;$i++) check(contact_rate_limit($file,'192.0.2.1',10000+$i*61), 'allowed');
    check(!contact_rate_limit($file,'192.0.2.1',10400), 'hourly');
    check(contact_rate_limit($file,'192.0.2.1',14000), 'expiry');
    check(!str_contains(file_get_contents($file),'192.0.2.1'), 'raw IP');
} finally { unlink($file); }
echo "PASS: validation, Japanese mail body, injection rejection, consent, honeypot, rate limit\n";
