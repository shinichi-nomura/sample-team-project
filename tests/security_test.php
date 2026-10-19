<?php
require __DIR__ . '/../pages/cms-feed.php';
function security_check($condition, $label) { if (!$condition) throw new RuntimeException($label); }
security_check(turnstile_valid(['success'=>true,'hostname'=>'mizu-tokimeki.com','action'=>'contact']), 'valid challenge');
foreach ([[], ['success'=>false], ['success'=>true,'hostname'=>'evil.example','action'=>'contact'],
    ['success'=>true,'hostname'=>'mizu-tokimeki.com','action'=>'login']] as $result) {
    security_check(!turnstile_valid($result), 'challenge must be rejected');
}
security_check(!verify_turnstile('', 'unused') && !verify_turnstile(['bad'], 'unused'), 'missing/malformed challenge');
$item = ['id'=>'post1','title'=>'記事','body'=>'<p>本文</p>','date'=>'2026-10-19',
    'type'=>['イベント'],'publishedAt'=>'2026-10-19','internalSecret'=>'not-public'];
security_check(!array_key_exists('internalSecret', public_article($item)), 'field projection');
security_check(public_article(array_replace($item, ['publishedAt'=>''])) === null, 'draft rejection');
security_check(public_article(array_replace($item, ['type'=>['非公開']])) === null, 'type rejection');
$path = tempnam(sys_get_temp_dir(), 'cms-test-');
try {
    $calls = 0;
    $fetch = function() use (&$calls, $item) { $calls++; return ['contents'=>[$item]]; };
    security_check(count(cms_feed($fetch, $path)) === 1, 'fetch');
    cms_feed($fetch, $path);
    security_check($calls === 1, 'cache avoids repeat API call');
    file_put_contents($path, '{}');
    $fail = function() use (&$calls) { $calls++; throw new RuntimeException('test failure'); };
    for ($i=0;$i<2;$i++) {
        $rejected = false;
        try { cms_feed($fail, $path); } catch (RuntimeException $e) { $rejected = true; }
        security_check($rejected, 'upstream fails closed');
    }
    security_check($calls === 2, 'failure cooldown');
    file_put_contents($path, '{}');
    $detailCalls = 0;
    $detailFetch = function() use (&$detailCalls, $item) { $detailCalls++; return public_article($item); };
    security_check(cms_article('old-post', $detailFetch, $path)['id'] === 'post1', 'old detail');
    cms_article('old-post', $detailFetch, $path);
    security_check($detailCalls === 1, 'detail cache');
    security_check(cms_article('missing', fn()=>null, $path) === null, 'missing detail');
    security_check(cms_article('missing', fn()=>throw new RuntimeException('must not fetch'), $path) === null, 'negative cache');
} finally { unlink($path); }
echo "PASS: Turnstile result checks, public field filtering, cache, failure cooldown\n";
