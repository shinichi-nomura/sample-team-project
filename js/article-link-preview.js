'use strict';

// InstagramとXの投稿は、各サービスの公式埋め込みを使って表示する。
// 画像が取得できない場合も、投稿へのリンクは必ず残す。
const articleEmbedScripts = new Map();

function articleEmbedScript(src) {
    if (!articleEmbedScripts.has(src)) {
        articleEmbedScripts.set(src, new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        }));
    }
    return articleEmbedScripts.get(src);
}

function articleLinkUrl(value) {
    try {
        const url = new URL(value);
        if (url.protocol === 'https:' && !url.username && !url.password) return url;
    } catch {
        // 無効なURLは表示しない。
    }
    return null;
}

function articleSocialPost(url) {
    const host = url.hostname.toLowerCase();
    const instagram = /^(www\.)?instagram\.com$/.test(host);
    const x = /^(www\.)?(x|twitter)\.com$/.test(host);
    if (instagram) {
        const match = url.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)\/?$/);
        if (match) return { platform: 'instagram', url: `https://www.instagram.com/${match[1]}/${match[2]}/` };
    }
    if (x) {
        const match = url.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)\/?$/);
        if (match) return { platform: 'x', url: `https://x.com/${match[1]}/status/${match[2]}` };
    }
    return null;
}

function articleLink(url, label) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    return link;
}

function renderArticleLinkPreview(container, item) {
    const url = articleLinkUrl(item.linkUrl);
    const ogpImage = window.safeArticleImage(item.linkPreview?.image);
    const cmsImage = window.safeArticleImage(item.photo?.url);

    if (url) {
        const post = articleSocialPost(url);
        if (post) {
            const wrapper = document.createElement('div');
            wrapper.className = 'article-social-embed';
            const quote = document.createElement('blockquote');
            if (post.platform === 'instagram') {
                quote.className = 'instagram-media';
                quote.setAttribute('data-instgrm-permalink', post.url);
                quote.setAttribute('data-instgrm-version', '14');
            } else {
                quote.className = 'twitter-tweet';
            }
            quote.appendChild(articleLink(post.url, '投稿を見る'));
            wrapper.appendChild(quote);
            container.appendChild(wrapper);

            if (post.platform === 'instagram') {
                articleEmbedScript('https://www.instagram.com/embed.js')
                    .then(() => window.instgrm?.Embeds?.process())
                    .catch(() => {});
            } else {
                articleEmbedScript('https://platform.x.com/widgets.js')
                    .then(() => window.twttr?.widgets?.load(wrapper))
                    .catch(() => {});
            }
            return;
        }

        const link = articleLink(url.href, 'リンク先を見る');
        const imageUrl = ogpImage || cmsImage;
        if (imageUrl) {
            const image = document.createElement('img');
            image.className = 'detail-photo';
            image.src = imageUrl;
            image.alt = item.title ?? 'リンク先の画像';
            image.loading = 'lazy';
            link.replaceChildren(image);
        }
        container.appendChild(link);
    } else if (cmsImage) {
        const image = document.createElement('img');
        image.className = 'detail-photo';
        image.src = cmsImage;
        image.alt = item.title ?? '';
        image.loading = 'lazy';
        container.appendChild(image);
    }
}
