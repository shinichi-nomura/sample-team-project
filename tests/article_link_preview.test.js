'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
    constructor(tagName) {
        this.tagName = tagName;
        this.children = [];
        this.attributes = {};
    }
    appendChild(child) { this.children.push(child); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes[name] = value; }
}

const scripts = [];
const document = {
    createElement: tagName => new Element(tagName),
    head: { appendChild: script => { scripts.push(script); } },
};
const context = {
    document,
    URL,
    window: { safeArticleImage: value => typeof value === 'string' && value.startsWith('https://') ? value : '' },
};
vm.runInNewContext(
    fs.readFileSync(require.resolve('../js/article-link-preview.js'), 'utf8') +
        '\nthis.preview = { articleSocialPost, renderArticleLinkPreview };',
    context
);

const instagram = new Element('div');
context.preview.renderArticleLinkPreview(instagram, {
    linkUrl: 'https://www.instagram.com/p/DenRgk-E_X5/?srtk=test',
});
assert.equal(instagram.children[0].children[0].attributes['data-instgrm-permalink'],
    'https://www.instagram.com/p/DenRgk-E_X5/');
assert.equal(instagram.children[0].children[0].children[0].textContent, '投稿を見る');
assert.equal(scripts[0].src, 'https://www.instagram.com/embed.js');

const x = new Element('div');
context.preview.renderArticleLinkPreview(x, {
    linkUrl: 'https://twitter.com/example/status/123456789?ref_src=example',
});
assert.equal(x.children[0].children[0].className, 'twitter-tweet');
assert.equal(x.children[0].children[0].children[0].href, 'https://x.com/example/status/123456789');
assert.equal(scripts[1].src, 'https://platform.x.com/widgets.js');

const ordinary = new Element('div');
context.preview.renderArticleLinkPreview(ordinary, {
    linkUrl: 'https://example.com/story',
    linkPreview: { image: 'https://example.com/image.jpg' },
    title: '記事',
});
assert.equal(ordinary.children[0].children[0].src, 'https://example.com/image.jpg');
assert.equal(scripts.length, 2);

assert.equal(context.preview.articleSocialPost(new URL('https://instagram.com.evil.example/p/test/')), null);
console.log('PASS: Instagram/X embeds, original OGP preview, safe host matching');
