'use strict';
console.log('Git練習開始');

//==hamburger-menu==
const hamburger = document.querySelector('.hamburger-menu');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle('active');
});


//==background==
const container = document.querySelector('.particles');
//粒を入れる親要素取得
const count = 30;
// 作る個数
for (let i = 0; i < count; i++) {
    //ループの中で「粒を 1 個つくる」処理
    const p = document.createElement('div');
    //JavaScript で新しく子要素を作成
    p.className = 'particle';
    //クラス名付与でCSSの「光る粒の見た目」がつく

    p.style.top = Math.random() * 100 + '%';
    //位置を0〜100でランダムに決める
    p.style.left = Math.random() * 100 + '%';

    const size = 10 + Math.random() * 40;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    //ランダムな大きさ（20〜80px）

    const isGold = Math.random() < 0.5;

    if (isGold) {
        p.style.setProperty('--c1', 'rgba(255,255,245,1)');
        p.style.setProperty('--c2', 'rgba(255,240,200,0.9)');
        p.style.setProperty('--c3', 'rgba(255,225,150,0.4)');
        p.style.setProperty('--c4', 'rgba(255,215,130,0.15)');
    } else {
        p.style.setProperty('--c1', 'rgba(255,255,255,1)');
        p.style.setProperty('--c2', 'rgba(240,245,255,0.9)');
        p.style.setProperty('--c3', 'rgba(220,230,255,0.4)');
        p.style.setProperty('--c4', 'rgba(210,220,255,0.15)');
    }
    // ゴールド or シルバーをランダムに決定

    const moveX = (Math.random() * 80) - 40; // -40〜40px
    const moveY = (Math.random() * 80) - 40; // -40〜40px
    p.style.setProperty('--move-x', `${moveX}px`);
    p.style.setProperty('--move-y', `${moveY}px`);
    //ランダムな動きの強さ

    const duration = 5 + Math.random() * 5; // 5〜10秒
    p.style.animationDuration = `${duration}s`;
    //ランダムなアニメーション時間

    const delay = Math.random() * 5;
    p.style.animationDelay = `${delay}s`;
    //ランダムな遅延

    const fadeSpeed = 6 + Math.random() * 6;
    p.style.setProperty('--fade-speed', `${fadeSpeed}s`);
    //ランダムなフェード速度(6〜12秒)

    container.appendChild(p);
    //作った粒を.particlesの中に入れる
}
