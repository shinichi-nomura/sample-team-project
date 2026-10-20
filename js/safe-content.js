'use strict';

// CMS本文からスクリプト・イベント属性などを除去し、記事の書式だけを許可する。
window.safeArticle = (html) => {
  if (!window.DOMPurify?.isSupported) {
    const fallback = document.createDocumentFragment();
    fallback.appendChild(document.createTextNode(String(html ?? '')));
    return fallback;
  }
  const fragment = DOMPurify.sanitize(String(html ?? ''), {
    RETURN_DOM_FRAGMENT: true,
    ALLOWED_TAGS: ['p','br','strong','b','em','i','u','s','h2','h3','h4','h5','h6',
      'ul','ol','li','blockquote','pre','code','a','img','figure','figcaption','hr',
      'table','thead','tbody','tr','th','td','span','div'],
    ALLOWED_ATTR: ['href','src','alt','title','width','height','colspan','rowspan'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
  fragment.querySelectorAll('[href], [src]').forEach(element => {
    for (const attr of ['href','src']) {
      if (!element.hasAttribute(attr)) continue;
      try {
        const url = new URL(element.getAttribute(attr), location.href);
        const allowed = attr === 'src' ? ['https:'] : ['https:','http:','mailto:','tel:'];
        if (!allowed.includes(url.protocol)) element.removeAttribute(attr);
      } catch { element.removeAttribute(attr); }
    }
  });
  // テキスト欄に直接書かれたURLだけをリンクにする。既存リンクやコードには触れない。
  const textNodes = [];
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const node of textNodes) {
    if (node.parentElement?.closest('a,code,pre')) continue;
    const text = node.textContent;
    const urls = /https?:\/\/[^\s<>"']+/g;
    let match;
    let start = 0;
    const replacement = document.createDocumentFragment();
    while ((match = urls.exec(text)) !== null) {
      const urlText = match[0].replace(/[.,!?;:。！？，、）)\]]+$/u, '');
      if (!urlText) continue;
      try {
        const url = new URL(urlText);
        if (!['http:', 'https:'].includes(url.protocol)) continue;
        replacement.appendChild(document.createTextNode(text.slice(start, match.index)));
        const link = document.createElement('a');
        link.href = url.href;
        link.textContent = urlText;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        replacement.appendChild(link);
        start = match.index + urlText.length;
      } catch { /* 不正なURLは文字のまま残す。 */ }
    }
    if (start > 0) {
      replacement.appendChild(document.createTextNode(text.slice(start)));
      node.replaceWith(replacement);
    }
  }
  return fragment;
};

window.safeArticleImage = value => {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; }
  catch { return ''; }
};
