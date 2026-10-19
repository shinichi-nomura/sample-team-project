'use strict';
{
  const form = document.getElementById('contactForm');
  const status = document.getElementById('contact-security-status');
  const retry = document.getElementById('contact-security-retry');
  // 確認欄の高さが後から変わっても、スクロール演出の位置を補正する。
  const challengeObserver = new ResizeObserver(() => {
    requestAnimationFrame(() => window.ScrollTrigger?.refresh());
  });
  challengeObserver.observe(document.getElementById('contact-challenge'));
  let pending = null;
  let widget = null;
  let scriptPromise = null;
  function loadScript() {
    if (window.turnstile) return Promise.resolve();
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      const timeout = setTimeout(() => fail(), 15000);
      function fail() {
        clearTimeout(timeout);
        script.remove();
        scriptPromise = null;
        reject(new Error('確認機能を読み込めません。再試行するか、メールでご連絡ください。'));
      }
      script.onload = () => { clearTimeout(timeout); resolve(); };
      script.onerror = fail;
      document.head.appendChild(script);
    });
    return scriptPromise;
  }
  function initialize() {
    if (pending) return pending;
    retry.hidden = true;
    status.textContent = '自動投稿防止の確認を準備しています。';
    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      let data;
      try {
        const response = await fetch(form.action, {cache:'no-store', credentials:'same-origin',
          headers:{'X-Contact-Request':'1'}, signal:controller.signal});
        if (!response.ok) throw new Error('確認の準備に失敗しました。時間をおいて再試行してください。');
        data = await response.json();
        if (typeof data.token !== 'string' || typeof data.siteKey !== 'string') throw new Error('設定を確認できません。');
      } finally { clearTimeout(timer); }
      await loadScript();
      if (widget !== null) window.turnstile.remove(widget);
      widget = window.turnstile.render('#contact-challenge', {
        sitekey:data.siteKey, action:'contact', size:form.clientWidth < 360 ? 'compact' : 'flexible', language:'ja',
        callback:() => { status.textContent = '確認が完了しました。'; },
        'expired-callback':() => { status.textContent = '確認の有効期限が切れました。もう一度確認してください。'; window.turnstile.reset(widget); },
        'error-callback':() => { status.textContent = '確認に失敗しました。再試行してください。'; retry.hidden = false; return true; },
      });
      status.textContent = '必要に応じて確認欄を操作してください。';
      return data;
    })().catch(error => {
      pending = null;
      status.textContent = '確認を準備できませんでした。再試行するか、info@mizu-tokimeki.comへご連絡ください。';
      retry.hidden = false;
      throw error;
    });
    return pending;
  }
  window.contactSecurity = {
    async prepare() {
      const data = await initialize();
      return {token:data.token, challenge:window.turnstile.getResponse(widget)};
    },
    refresh() { pending = null; initialize().catch(() => {}); },
    resetChallenge() { if (widget !== null && window.turnstile) window.turnstile.reset(widget); },
  };
  retry.addEventListener('click', () => { pending = null; initialize().catch(() => {}); });
  initialize().catch(() => {});
}
