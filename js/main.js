'use strict';
{
    const initialPageHash = window.location.hash;
    // 通常遷移か再読み込みかを判定
    const navigationEntry =
        performance.getEntriesByType("navigation")[0];
    const isReload =
        navigationEntry?.type === "reload" ||
        (
            performance.navigation &&
            performance.navigation.type === 1
        );
    const isSectionHash =
        initialPageHash === "#about" ||
        initialPageHash === "#book";
    //#aboutまたは#bookで再読み込みした場合はHeroへ戻す
    if (isReload && isSectionHash) {
        //ブラウザによる以前のスクロール位置復元を停止
        if ("scrollRestoration" in history) {
            history.scrollRestoration = "manual";
        }
        // URLを#topへ変更 replaceStateなので、この時点では自動移動しない
        history.replaceState(
            null,
            "",
            window.location.pathname +
            window.location.search +
            "#top"
        );
        const moveToHero = () => {
            const html = document.documentElement;
            const previousBehavior =
                html.style.scrollBehavior;
            html.style.scrollBehavior = "auto";
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "auto"
            });
            requestAnimationFrame(() => {
                html.style.scrollBehavior =
                    previousBehavior;

                if ("scrollRestoration" in history) {
                    history.scrollRestoration = "auto";
                }
            });
        };
        //すぐにページ上部へ戻す
        moveToHero();
        //ブラウザのスクロール位置復元より後にも実行
        window.addEventListener(
            "load",
            () => {
                window.setTimeout(moveToHero, 50);
            },
            { once: true }
        );
        window.addEventListener(
            "pageshow",
            () => {
                window.setTimeout(moveToHero, 100);
            },
            { once: true }
        );
    }
    //再読み込みではなく、別ページから#about・#bookへ来た場合
    if (!isReload && isSectionHash) {
        document.documentElement.classList.add(
            "initial-anchor-moving"
        );
    }

    //==hamburger-menu==
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll(".nav-list a");
    const logoLink = document.querySelector(".header-logo a");

    function closeMenu() {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
        document.body.classList.remove("menu-open");
        hamburger.setAttribute("aria-label", "メニューを開く");
        hamburger.setAttribute("aria-expanded", "false");
    }

    hamburger.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle("active")
        hamburger.classList.toggle("active", isOpen);
        document.body.classList.toggle("menu-open", isOpen);
        hamburger.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");
        hamburger.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            closeMenu();
            const url = new URL(
                link.getAttribute("href"),
                window.location.href
            );
            //現在表示しているページとリンク先が同じか判定
            const isSamePage =
                url.origin === window.location.origin &&
                url.pathname === window.location.pathname &&
                url.search === window.location.search;
            //別ページへのリンクは通常どおり遷移
            if (!isSamePage) {
                return;
            }
            //同じページへのリンクで#指定がない場合
            if (!url.hash) {
                event.preventDefault();
                document.documentElement.classList.remove(
                    "initial-anchor-moving"
                );
                document.documentElement.style.scrollBehavior = "";
                history.replaceState(
                    null,
                    "",
                    url.pathname + url.search
                );
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "smooth"
                });
                return;
            }
            //同じページ内の#リンク
            const targetId = decodeURIComponent(
                url.hash.slice(1)
            );
            const target =
                document.getElementById(targetId);
            if (!target) return;
            event.preventDefault();
            document.documentElement.classList.remove(
                "initial-anchor-moving"
            );
            document.documentElement.style.scrollBehavior = "";
            const header =
                document.querySelector("header");
            const headerHeight = header
                ? Math.ceil(
                    header.getBoundingClientRect().height
                )
                : 0;
            const anchorGap = 24;
            const targetTop =
                target.getBoundingClientRect().top +
                window.scrollY -
                headerHeight -
                anchorGap;
            if (window.location.hash === url.hash) {
                history.replaceState(
                    null,
                    "",
                    url.hash
                );
            } else {
                history.pushState(
                    null,
                    "",
                    url.hash
                );
            }
            window.scrollTo({
                top: Math.max(0, targetTop),
                left: 0,
                behavior: "smooth"
            });
        });
    });
    if (logoLink) {
        logoLink.addEventListener(
            "click",
            (event) => {
                closeMenu();
                const url = new URL(
                    logoLink.getAttribute("href"),
                    window.location.href
                );
                const isSamePage =
                    url.origin ===
                    window.location.origin &&
                    url.pathname ===
                    window.location.pathname &&
                    url.search ===
                    window.location.search;
                //別ページのトップへ移動する場合は通常のページ遷移を行う
                if (!isSamePage) {
                    return;
                }
                //同じページ内の場合はページを再読み込みせず、最上部へスムーズに移動
                event.preventDefault();
                document.documentElement.classList.remove(
                    "initial-anchor-moving"
                );
                document.documentElement.style
                    .scrollBehavior = "";
                //URLを#topへ更新する
                history.replaceState(
                    null,
                    "",
                    url.pathname +
                    url.search +
                    "#top"
                );
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "smooth"
                });
            }
        );
    }

    //==background==
    const container = document.querySelector('.particles');
    if (container) {
        //粒を入れる親要素取得
        const count = 60;
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
            const moveX = (Math.random() * 90) - 50; // -50〜50px
            const moveY = (Math.random() * 90) - 50; // -50〜50px
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
    }

    function initInitialAnchorFix() {
        const hash = window.location.hash;
        if (
            hash !== "#about" &&
            hash !== "#book"
        ) {
            return;
        }
        const targetId = hash.slice(1);
        const target = document.getElementById(targetId);
        if (!target) return;
        const moveToTarget = () => {
            //ユーザーが別のアンカーを押した場合は、古い初回位置補正を実行しない
            if (window.location.hash !== hash) {
                return;
            }
            if (typeof ScrollTrigger !== "undefined") {
                ScrollTrigger.refresh();
            }
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const header =
                        document.querySelector("header");
                    const headerHeight = header
                        ? Math.ceil(
                            header.getBoundingClientRect().height
                        )
                        : 0;
                    const anchorGap = 24;
                    const targetTop =
                        target.getBoundingClientRect().top +
                        window.scrollY -
                        headerHeight -
                        anchorGap;
                    const html = document.documentElement;
                    const previousBehavior =
                        html.style.scrollBehavior;
                    html.style.scrollBehavior = "auto";
                    window.scrollTo({
                        top: Math.max(0, targetTop),
                        left: 0,
                        behavior: "auto"
                    });
                    requestAnimationFrame(() => {
                        html.style.scrollBehavior =
                            previousBehavior;

                        html.classList.remove(
                            "initial-anchor-moving"
                        );
                    });
                });
            });
        };
        //ブラウザ標準のアンカー移動が完了してから補正
        const moveAfterBrowser = () => {
            window.setTimeout(moveToTarget, 150);
        };
        if (document.readyState === "complete") {
            moveAfterBrowser();
        } else {
            window.addEventListener(
                "load",
                moveAfterBrowser,
                { once: true }
            );
        }
        //ブラウザの戻る・進むにも対応
        window.addEventListener(
            "pageshow",
            moveAfterBrowser,
            { once: true }
        );
        //Webフォント適用後の位置変化を補正
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready
                .then(() => {
                    window.setTimeout(moveToTarget, 100);
                })
                .catch(() => { });
        }
        //#bookより上にあるCMSの読み込み後に再調整
        if (targetId === "book") {
            const cmsContainers = [
                document.querySelector("#event-contents"),
                document.querySelector("#latest-contents")
            ].filter(Boolean);
            if (cmsContainers.length > 0) {
                const observer = new MutationObserver(() => {
                    window.setTimeout(moveToTarget, 50);
                    const loadingFinished =
                        cmsContainers.every((container) => {
                            return !container.textContent.includes(
                                "読み込み中"
                            );
                        });
                    if (loadingFinished) {
                        window.setTimeout(() => {
                            observer.disconnect();
                        }, 300);
                    }
                });
                cmsContainers.forEach((container) => {
                    observer.observe(container, {
                        childList: true,
                        subtree: true,
                        characterData: true
                    });
                });
                // 念のため10秒で監視終了
                window.setTimeout(() => {
                    observer.disconnect();
                }, 10000);
            }
        }
    }

    // GSAPアニメーション
    function initAnimations() {
        if (typeof gsap === "undefined") {
            console.error("GSAPが読み込まれていません。");
            return;
        }
        // Heroアニメーション
        initHeroAnimation();
        //eighttipsアニメーション
        initEightTipsAnimation();
        // ScrollTriggerを使用するアニメーション
        if (typeof ScrollTrigger !== "undefined") {
            gsap.registerPlugin(ScrollTrigger);
            // Greetingアニメーション
            initGreetingAnimation();
            //suisoアニメーション
            initSuisoAnimation();
            //koseisinrigakuアニメーション
            initKoseiAnimation();
            //eventsアニメーション
            initEventsAnimation();
            //bookアニメーション
            initBookAnimation();
            // firstアニメーション
            initFirstGreetAnimation();
            // mirrorアニメーション
            initMirrorAnimation();
            //pegasusアニメーション
            initPegasusAnimation();
            //eventPageアニメーション
            initEventPageAnimation();
            //contactアニメーション
            initContactPageAnimation();
            //footerアニメーション
            initFooterAnimation();
            requestAnimationFrame(() => {
                ScrollTrigger.refresh();
            });
        } else {
            console.error(
                "ScrollTriggerが読み込まれていません。"
            );
        }
        //全アニメーション設定後にアンカー位置を修正
        initInitialAnchorFix();
    }
    // HTML読み込み後に実行
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initAnimations,
            { once: true }
        );
    } else {
        initAnimations();
    }

    //Heroアニメーション
    async function initHeroAnimation() {
        const images = gsap.utils.toArray(
            ".hero-images > .hero-image"
        );
        const frame = document.querySelector(
            ".hero-frame-picture"
        );
        const logo = document.querySelector(
            ".logo-content"
        );
        if (images.length === 0) return;
        // Hero画像の初期状態
        gsap.set(images, {
            autoAlpha: 0,
            zIndex: 0,
            clearProps: "transform"
        });
        // フレームの初期状態
        if (frame) {
            gsap.set(frame, {
                autoAlpha: 0
            });
        }
        // ロゴの初期状態
        if (logo) {
            gsap.set(logo, {
                autoAlpha: 0,
                yPercent: 150
            });
        }
        // Hero画像のデコード完了を待つ
        await Promise.all(
            images.map((image) => {
                if (typeof image.decode === "function") {
                    return image.decode().catch(() => { });
                }
                if (image.complete) {
                    return Promise.resolve();
                }
                return new Promise((resolve) => {
                    image.addEventListener(
                        "load",
                        resolve,
                        { once: true }
                    );
                    image.addEventListener(
                        "error",
                        resolve,
                        { once: true }
                    );
                });
            })
        );
        // Hero画像の無限ループ
        const startHeroLoop = () => {
            let currentIndex = 0;
            const changeImage = () => {
                const currentImage = images[currentIndex];
                const nextIndex =
                    (currentIndex + 1) % images.length;
                const nextImage = images[nextIndex];
                // 現在画像の状態
                gsap.set(currentImage, {
                    autoAlpha: 1,
                    zIndex: 1
                });
                // 次画像を透明な状態で前面に準備
                gsap.set(nextImage, {
                    autoAlpha: 0,
                    zIndex: 2
                });
                const changeTimeline = gsap.timeline({
                    delay: 5,
                    onComplete: () => {
                        // 切り替え後の状態を整理
                        gsap.set(currentImage, {
                            autoAlpha: 0,
                            zIndex: 0
                        });
                        gsap.set(nextImage, {
                            autoAlpha: 1,
                            zIndex: 1
                        });
                        currentIndex = nextIndex;
                        // 次の切り替えを開始
                        changeImage();
                    }
                });
                // 現在画像をふわっと消す
                changeTimeline.to(
                    currentImage,
                    {
                        autoAlpha: 0,
                        duration: 1.8,
                        ease: "sine.inOut"
                    },
                    0
                );
                // 次画像を同時にふわっと表示
                changeTimeline.fromTo(
                    nextImage,
                    {
                        autoAlpha: 0
                    },
                    {
                        autoAlpha: 1,
                        duration: 1.8,
                        ease: "sine.inOut"
                    },
                    0
                );
            };
            changeImage();
        };
        // 最初だけのイントロ
        const introTimeline = gsap.timeline({
            onComplete: startHeroLoop
        });
        // 1. 最初のHero画像
        introTimeline.to(images[0], {
            autoAlpha: 1,
            zIndex: 1,
            duration: 1.8,
            ease: "sine.out"
        });
        // 少し待つ
        introTimeline.to({}, {
            duration: 0.3
        });
        // 2. フレーム
        if (frame) {
            introTimeline.to(frame, {
                autoAlpha: 1,
                duration: 1.8,
                ease: "sine.out"
            });
        }
        // 3. ロゴ
        if (logo) {
            introTimeline.to(
                logo,
                {
                    autoAlpha: 1,
                    yPercent: 0,
                    duration: 1.4,
                    ease: "power3.out"
                },
                ">-0.2"
            );
        }
    }

    /* 文字を1文字ずつspanで囲む */
    function splitTextIntoChars(element) {
        if (!element) return [];
        // 二重変換を防ぐ
        if (element.dataset.textSplit === "true") {
            return gsap.utils.toArray(
                element.querySelectorAll(".greeting-char")
            );
        }
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT
        );
        let currentNode;
        while ((currentNode = walker.nextNode())) {
            // 空白しかないノードは対象外
            if (currentNode.textContent.trim() !== "") {
                textNodes.push(currentNode);
            }
        }
        textNodes.forEach((textNode) => {
            const fragment = document.createDocumentFragment();
            Array.from(textNode.textContent).forEach((char) => {
                // 空白はそのまま残す
                if (/\s/.test(char)) {
                    fragment.appendChild(
                        document.createTextNode(char)
                    );
                    return;
                }
                const span = document.createElement("span");
                span.className = "greeting-char";
                span.textContent = char;
                fragment.appendChild(span);
            });
            textNode.replaceWith(fragment);
        });
        element.dataset.textSplit = "true";

        return gsap.utils.toArray(
            element.querySelectorAll(".greeting-char")
        );
    }

    /* Greetingアニメーション */
    function initGreetingAnimation() {
        const greeting = document.querySelector(".greeting");
        if (!greeting) return;
        const heading = greeting.querySelector("h4");
        const profile = greeting.querySelector(".greet");
        const content = greeting.querySelector(".greet-content");
        const button = greeting.querySelector(".profile-button");
        // 見出し、本文一文字ずつ分割
        const headingChars = splitTextIntoChars(heading);
        const contentChars = splitTextIntoChars(content);
        //見出しの中央配置を維持
        gsap.set(heading, {
            autoAlpha: 1,
            xPercent: -50,
            x: 0
        });
        //見出し各文字の初期状態
        gsap.set(headingChars, {
            autoAlpha: 0,
            x: -24
        });
        //プロフィール画像と名前の初期状態
        gsap.set(profile, {
            autoAlpha: 0,
            x: 0,
            y: 0
        });
        //本文の初期状態、中央配置は維持する
        gsap.set(content, {
            autoAlpha: 1,
            xPercent: -50,
            x: 0,
            y: 0
        });
        //本文の各文字を透明にします
        gsap.set(contentChars, {
            autoAlpha: 0,
            x: 0,
            y: 0
        });
        //ボタンの初期状態
        if (button) {
            gsap.set(button, {
                autoAlpha: 0,
                xPercent: -50,
                y: 60
            });
        }
        const contentTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: greeting,
                start: "top 98%",
                once: true
                // markers: true
            }
        });
        //見出しを左から一文字ずつ表示
        contentTimeline.to(headingChars, {
            autoAlpha: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.12,
            ease: "power3.out"
        });
        //プロフィール画像と名前を位置固定でふわっと表示
        contentTimeline.to(
            profile,
            {
                autoAlpha: 1,
                duration: 1.4,
                ease: "sine.out"
            },
            ">-0.2"
        );
        // 本文を左側の文字から順番にふわっと表示
        gsap.to(contentChars, {
            autoAlpha: 1,
            duration: 1,
            stagger: 0.025,
            ease: "sine.out",
            scrollTrigger: {
                trigger: greeting,
                start: "top 90%",
                once: true
                // markers: true
            }
        });
        //ボタンを下から表示
        if (button) {
            gsap.to(button, {
                autoAlpha: 1,
                y: 0,
                duration: 1.3,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: button,
                    start: "top 90%",
                    once: true
                    // markers: true
                }
            });
        }
    }

    //Suisoアニメーション
    function initSuisoAnimation() {
        const suiso = document.querySelector(".suiso");
        if (!suiso) return;
        const content = suiso.querySelector(".suiso-content");
        const heading = suiso.querySelector("h3");
        const text = suiso.querySelector("p");
        if (!content || !heading || !text) return;
        //Greetingで使用している関数でh3とpを一文字ずつ分割
        const headingChars = splitTextIntoChars(heading);
        const textChars = splitTextIntoChars(text);
        const allChars = [
            ...headingChars,
            ...textChars
        ];
        const button = suiso.querySelector(".suiso-button");
        //親要素の座標は一切変更しない
        gsap.set(content, {
            autoAlpha: 1,
            x: 0,
            y: 0
        });
        //各文字は透明にするだけ
        gsap.set(allChars, {
            autoAlpha: 0,
            x: 24,
            y: 0
        });
        // 水素ボタンの初期状態
        if (button) {
            gsap.set(button, {
                autoAlpha: 0,
                xPercent: -50,
                y: 60
            });
            //h3の先頭からpの最後まで一文字ずつ順番に表示
            gsap.to(allChars, {
                autoAlpha: 1,
                x: 0,
                y: 0,
                duration: 0.7,
                stagger: 0.04,
                ease: "sine.out",
                scrollTrigger: {
                    trigger: suiso,
                    start: "top 90%",
                    once: true
                    // markers: true
                }
            });
            // 水素ボタンを下からふわっと表示
            gsap.to(button, {
                autoAlpha: 1,
                y: 0,
                duration: 1.3,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: button,
                    start: "top 80%",
                    once: true
                    // markers: true
                }
            });
        }
    }

    //個性心理學セクションのアニメーション
    function initKoseiAnimation() {
        const section = document.querySelector(
            ".koseisinrigaku"
        );
        if (!section) return;
        //ぼかし・透明状態からスクロールに合わせて鮮明にする
        gsap.fromTo(
            section,
            {
                autoAlpha: 0,
                filter: "blur(20px)"
            },
            {
                autoAlpha: 1,
                filter: "blur(0px)",
                ease: "none",
                scrollTrigger: {
                    trigger: section,
                    // セクションが画面下部へ入ると開始
                    start: "top 90%",
                    // セクション上端が画面45%地点に来たら完成
                    end: "top 45%",
                    // スクロール量とアニメーションを連動
                    scrub: 1,
                    // 完成後は元に戻さない
                    once: true
                    // markers: true
                }
            }
        );
    }

    //八つのヒントアニメーション
    function initEightTipsAnimation() {
        const section = document.querySelector(".eightTips");
        if (!section) return;
        const tips = gsap.utils.toArray(
            section.querySelectorAll(".tip")
        );
        if (tips.length < 8) return;
        //HTML上の並びtips[0] tips[1] tips[2] tips[3] tips[4] tips[5] tips[6] tips[7]
        //グループ1 一番左下段,二番目左上段.三番目左下段,四番目左上段
        const group1 = [
            tips[4],
            tips[1],
            tips[6],
            tips[3]
        ];
        //グループ2 一番左上段,二番目左下段,三番目左上段,四番目左下段
        const group2 = [
            tips[0],
            tips[5],
            tips[2],
            tips[7]
        ];
        //左右の開始位置,数値を大きくするとより遠くから登場
        const moveDistance = Math.max(
            200,
            section.clientWidth * 0.25
        );
        // 全Tipを最初は非表示
        gsap.set(tips, {
            autoAlpha: 0,
            scale: 0.92
        });
        // グループ1は左側に配置
        gsap.set(group1, {
            x: -moveDistance
        });
        // グループ2は右側に配置
        gsap.set(group2, {
            x: moveDistance
        });
        //通常のGSAPタイムライン,スクロール量とは連動ない
        const timeline = gsap.timeline({
            paused: true,
            defaults: {
                duration: 2.4,
                ease: "power3.out"
            }
        });
        //グループ1を左から表示
        timeline.to(
            group1,
            {
                autoAlpha: 1,
                x: 0,
                scale: 1,
                stagger: {
                    each: 0.25,
                    from: "start"
                }
            },
            0
        );
        //グループ2を右から表示,右端のTipから順番に登場
        timeline.to(
            group2,
            {
                autoAlpha: 1,
                x: 0,
                scale: 1,
                stagger: {
                    each: 0.25,
                    from: "end"
                }
            },
            0.15
        );
        //アニメーション完了後、GSAPが付けたtransformを削除
        timeline.set(tips, {
            clearProps: "transform,opacity,visibility"
        });
        //セクションが画面に入ったことだけ検知,アニメーション自体はスクロール量に連動しない
        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                const entry = entries[0];
                if (!entry.isIntersecting) return;
                timeline.play();
                // 一度だけ実行
                currentObserver.disconnect();
            },
            {
                threshold: 0.2,
                rootMargin: "0px 0px -10% 0px"
            }
        );
        observer.observe(section);
    }

    //イベント近況報告アニメーション
    function initEventsAnimation() {
        const eventsSection =
            document.querySelector(".events");
        if (!eventsSection) return;
        if (typeof ScrollTrigger === "undefined") return;
        const panels = gsap.utils.toArray(
            eventsSection.querySelectorAll(
                ".event, .latest"
            )
        );
        if (panels.length === 0) return;
        //初期状態
        gsap.set(panels, {
            autoAlpha: 0
        });
        //同時にふわっと再生
        gsap.to(panels, {
            autoAlpha: 1,
            duration: 1.6,
            ease: "sine.out",
            scrollTrigger: {
                trigger: eventsSection,
                start: "top 80%",
                once: true
                // markers: true
            },
            onComplete: () => {
                //アニメーション後にGSAPのインライン指定を削除
                gsap.set(panels, {
                    clearProps: "opacity,visibility"
                });
            }
        });
    }

    //著書アニメーション
    function initBookAnimation() {
        const book = document.querySelector(".book");
        if (!book) return;
        if (typeof ScrollTrigger === "undefined") return;
        const heading = book.querySelector("h4");
        const bookItems = gsap.utils.toArray(
            book.querySelectorAll(".book-item")
        );
        //「著書」を位置固定で表示
        if (heading) {
            gsap.set(heading, {
                autoAlpha: 0
            });
            gsap.to(heading, {
                autoAlpha: 1,
                duration: 1.5,
                ease: "sine.out",
                scrollTrigger: {
                    trigger: book,
                    start: "top 80%",
                    once: true
                    // markers: true
                }
            });
        }
        bookItems.forEach((item) => {
            const content =
                item.querySelector(".book-content");
            //親の.book-imagesではなく画像本体を取得
            const image = item.querySelector(
                ".book-image, .book-image-2"
            );
            //文章は左側から表示
            if (content) {
                gsap.set(content, {
                    autoAlpha: 0,
                    clipPath:
                        "inset(0 100% 0 0)"
                });
            }
            //画像は右側から表示,上下左右をマイナス値で広げ拡大・移動した画像や影が途中で切れないようにする
            if (image) {
                gsap.set(image, {
                    autoAlpha: 0,
                    clipPath:
                        "inset(-35% -35% -35% 135%)"
                });
            }
            const itemTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: item,
                    start: "top 80%",
                    once: true
                    // markers: true
                }
            });
            //文章全体を左から表示
            if (content) {
                itemTimeline.to(
                    content,
                    {
                        autoAlpha: 1,
                        clipPath:
                            "inset(0 0% 0 0)",
                        duration: 1.8,
                        ease: "power2.out"
                    },
                    0
                );
            }
            //画像全体を右から表示
            if (image) {
                itemTimeline.to(
                    image,
                    {
                        autoAlpha: 1,
                        //最終状態にも上下左右の余裕を残す
                        clipPath:
                            "inset(-35% -35% -35% -35%)",
                        duration: 1.8,
                        ease: "power2.out"
                    },
                    0
                );
            }
            //文章側だけclip-pathを削除
            if (content) {
                itemTimeline.set(content, {
                    clearProps:
                        "clipPath,opacity,visibility"
                });
            }
            //画像側はclip-pathを削除しない,削除時のカクつきを防ぐ
            if (image) {
                itemTimeline.set(image, {
                    clearProps:
                        "opacity,visibility"
                });
            }
        });
    }

    //footerアニメーション
    async function initFooterAnimation() {
        const footer = document.querySelector("footer");
        if (!footer) return;
        // 二重実行を防止
        if (footer.dataset.footerAnimationInitialized === "true") {
            return;
        }
        footer.dataset.footerAnimationInitialized = "true";
        const footerTop = footer.querySelector(".footer-top");
        const footerTopImages = gsap.utils.toArray(
            footer.querySelectorAll(".footer-top-image")
        );
        const footerTopText = footer.querySelector(".footer-right p");
        const footerBottom = footer.querySelector(".footer-bottom");
        const copyright = footer.querySelector(".copyright-content");
        const snsBoxes = gsap.utils.toArray(
            footer.querySelectorAll(".sns-box")
        );
        const snsIcons = gsap.utils.toArray(
            footer.querySelectorAll(".sns-icon")
        );
        const privacy = footer.querySelector(".privacy-policy");
        //SNS画像の読み込み完了を待つ
        await Promise.all(
            snsIcons.map((icon) => {
                if (typeof icon.decode === "function") {
                    return icon.decode().catch(() => { });
                }
                if (icon.complete) {
                    return Promise.resolve();
                }
                return new Promise((resolve) => {
                    icon.addEventListener("load", resolve, {
                        once: true
                    });

                    icon.addEventListener("error", resolve, {
                        once: true
                    });
                });
            })
        );
        //footer-top本体は隠さない
        if (footerTop) {
            gsap.set(footerTop, {
                opacity: 1,
                visibility: "visible"
            });
        }
        const footerTopParts = [
            ...footerTopImages,
            footerTopText
        ].filter(Boolean);
        //footer-top内の画像とテキスト
        gsap.set(footerTopParts, {
            opacity: 0,
            visibility: "visible"
        });
        //footer-bottom
        if (footerBottom) {
            gsap.set(footerBottom, {
                opacity: 0,
                visibility: "visible"
            });
        }
        //copyright
        if (copyright) {
            gsap.set(copyright, {
                opacity: 0,
                visibility: "visible",
                y: 40
            });
        }
        //SNSアイコン opacityを完全な0にせず、ごく小さい値にすることで,アニメーション前にブラウザへ描画させておく
        gsap.set(snsBoxes, {
            clearProps: "transform"
        });
        gsap.set(snsBoxes, {
            opacity: 0.001,
            visibility: "visible"
        });
        gsap.set(snsIcons, {
            opacity: 1,
            visibility: "visible"
        });
        //privacy-policy
        if (privacy) {
            gsap.set(privacy, {
                opacity: 0,
                visibility: "visible",
                y: 40
            });
        }
        //CSSの初期非表示クラスを解除
        footer.classList.remove("footer-animation-pending");
        //2フレーム待ち、SNS画像を先に描画させる
        await new Promise((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });
        //Footer全体のタイムライン
        const footerTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: footer,
                start: "top 75%",
                once: true
                // markers: true
            }
        });
        //1. footer-top
        if (footerTopParts.length > 0) {
            footerTimeline.to(footerTopParts, {
                opacity: 1,
                duration: 1.8,
                ease: "sine.out"
            });
        }
        //2. footer-bottom
        if (footerBottom) {
            footerTimeline.to(
                footerBottom,
                {
                    opacity: 1,
                    duration: 1,
                    ease: "sine.out"
                },
                "<"
            );
        }
        //3. copyright
        if (copyright) {
            footerTimeline.to(copyright, {
                opacity: 1,
                y: 0,
                duration: 1.4,
                ease: "power2.out"
            },
                "<+=0.6"
            );
        }
        //copyright完了後に少し待つ
        footerTimeline.to({}, {
            duration: 0.2
        });
        //4. SNSアイコン DOMの並び順、つまり左から順番に表示,移動させず、不透明度だけを変化させる
        if (snsBoxes.length > 0) {
            footerTimeline.to(snsBoxes, {
                opacity: 1,
                duration: 0.5,
                stagger: {
                    each: 0.25,
                    from: "start"
                },
                ease: "sine.inOut",
                lazy: false
            });
        }
        //5. privacy-policy
        if (privacy) {
            footerTimeline.to(
                privacy,
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power2.out"
                },
                ">+=0.3"
            );
        }
    }

    //初めての方アニメーション
    function initFirstGreetAnimation() {
        const section = document.querySelector(
            ".first-greet"
        );
        if (!section) return;
        //二重実行を防止
        if (
            section.dataset.firstGreetAnimationInitialized ===
            "true"
        ) {
            return;
        }
        section.dataset.firstGreetAnimationInitialized =
            "true";
        const profileImage = section.querySelector(
            ".first-greet-image"
        );
        const profileName = section.querySelector(
            ".name"
        );
        const titles = gsap.utils.toArray(
            section.querySelectorAll(
                ".title-1, .title-2, .title-3, .title-4"
            )
        );
        const messageFrame = section.querySelector(
            ".message-frame"
        );
        const messages = gsap.utils.toArray(
            section.querySelectorAll(".message-content")
        );
        const profileParts = [
            profileImage,
            profileName
        ].filter(Boolean);
        //プロフィール画像・名前 座標を動かさず透明にする
        gsap.set(profileParts, {
            autoAlpha: 0,
            x: 0,
            y: 0
        });
        //タイトル 元の位置より少し下へ置いて透明にする
        gsap.set(titles, {
            autoAlpha: 0,
            x: 0,
            y: 36
        });
        //メッセージフレーム 座標を動かさず透明にする
        if (messageFrame) {
            gsap.set(messageFrame, {
                autoAlpha: 0,
                x: 0,
                y: 0
            });
        }
        //フレーム内の文章 座標を動かさず透明にする
        gsap.set(messages, {
            autoAlpha: 0,
            x: 0,
            y: 36
        });
        //GSAPの初期状態を設定したあとCSSの待機用クラスを解除
        section.classList.remove(
            "first-greet-animation-pending"
        );
        //ページ遷移後すぐに動くイントロ
        const introTimeline = gsap.timeline();
        //1. プロフィール画像・名前を同時表示
        if (profileParts.length > 0) {
            introTimeline.to(profileParts, {
                autoAlpha: 1,
                duration: 1.5,
                ease: "sine.out"
            });
        }
        //2. タイトルを上から順番に表示,プロフィール表示開始の0.2秒後から開始
        if (titles.length > 0) {
            introTimeline.to(
                titles,
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 1.2,
                    // title-1からtitle-4まで順番に表示
                    stagger: {
                        each: 0.18,
                        from: "start"
                    },
                    ease: "power2.out"
                },
                "<+=0.2"
            );
        }
        //3. メッセージフレームを表示
        if (messageFrame) {
            introTimeline.to(
                messageFrame,
                {
                    autoAlpha: 1,
                    duration: 1,
                    ease: "sine.out"
                },
                ">-0.4"
            );
        }
        //プロフィール・タイトル・フレームがすべて表示されたあとに文章を有効にする
        if (typeof ScrollTrigger !== "undefined") {
            introTimeline.eventCallback(
                "onComplete",
                () => {
                    messages.forEach((message, index) => {
                        gsap.to(message, {
                            autoAlpha: 1,
                            y: 0,
                            duration: 1.5,
                            //ScrollTrigger発動後も少し待つ 最初の文章は0.5秒待つ
                            delay: index === 0 ? 0.5 : 0.2,
                            ease: "sine.out",
                            scrollTrigger: {
                                trigger: message,
                                start: "top 85%",
                                once: true,
                                invalidateOnRefresh: true
                                // markers: true
                            }
                        });
                    });
                    requestAnimationFrame(() => {
                        ScrollTrigger.refresh();
                    });
                }
            );
        } else {
            gsap.set(messages, {
                autoAlpha: 1
            });
        }
    }

    //鏡アニメーション
    async function initMirrorAnimation() {
        const mirrorSection =
            document.querySelector(".mirror");
        if (!mirrorSection) return;
        //二重実行を防止
        if (
            mirrorSection.dataset
                .mirrorAnimationInitialized === "true"
        ) {
            return;
        }
        mirrorSection.dataset
            .mirrorAnimationInitialized = "true";
        const mirrorUnits = gsap.utils.toArray(
            mirrorSection.querySelectorAll(
                ".left-mirror, .right-mirror"
            )
        );
        const sliders = gsap.utils.toArray(
            mirrorSection.querySelectorAll(
                ".mirror-slider"
            )
        );
        const loadingImages = gsap.utils.toArray(
            mirrorSection.querySelectorAll(
                [
                    ".mirror-slide",
                    ".l-mirror-frame",
                    ".r-mirror-frame"
                ].join(",")
            )
        );
        //左右の鏡全体を透明にする, x・y座標は変更しない
        gsap.set(mirrorUnits, {
            autoAlpha: 0
        });
        //各スライダーの初期状態
        sliders.forEach((slider) => {
            const images = gsap.utils.toArray(
                slider.querySelectorAll(".mirror-slide")
            );
            if (images.length === 0) return;
            gsap.set(images, {
                autoAlpha: 0,
                scale: 1.03,
                zIndex: 0,
                transformOrigin: "50% 50%"
            });
            //1枚目を表示状態にしておく 親の鏡が透明なので、この時点では見えない
            gsap.set(images[0], {
                autoAlpha: 1,
                scale: 1,
                zIndex: 1
            });
        });
        //鏡とスライド画像の読み込み完了を待つ
        await Promise.all(
            loadingImages.map((image) => {
                if (typeof image.decode === "function") {
                    return image.decode().catch(() => { });
                }
                if (image.complete) {
                    return Promise.resolve();
                }
                return new Promise((resolve) => {
                    image.addEventListener(
                        "load",
                        resolve,
                        { once: true }
                    );
                    image.addEventListener(
                        "error",
                        resolve,
                        { once: true }
                    );
                });
            })
        );
        //CSSの待機状態を解除 GSAPのopacity: 0は残っているため、この時点で突然表示されることはない
        mirrorSection.classList.remove(
            "mirror-animation-pending"
        );
        //既存の画像切り替えアニメーション
        const startMirrorSliders = () => {
            sliders.forEach((slider) => {
                const images = gsap.utils.toArray(
                    slider.querySelectorAll(
                        ".mirror-slide"
                    )
                );
                if (images.length < 2) return;
                const mirrorTimeline = gsap.timeline({
                    repeat: -1
                });
                images.forEach(
                    (currentImage, index) => {
                        const nextImage =
                            images[
                            (index + 1) %
                            images.length
                            ];
                        //現在の画像を表示しておく時間
                        mirrorTimeline.to({}, {
                            duration: 2.8
                        });
                        //切り替え直前の状態
                        mirrorTimeline.set(
                            currentImage,
                            {
                                autoAlpha: 1,
                                scale: 1,
                                zIndex: 1
                            }
                        );
                        mirrorTimeline.set(
                            nextImage,
                            {
                                autoAlpha: 0,
                                scale: 1.03,
                                zIndex: 2
                            }
                        );
                        //現在の画像を消す
                        mirrorTimeline.to(
                            currentImage,
                            {
                                autoAlpha: 0,
                                scale: 1.015,
                                duration: 1.2,
                                ease: "power2.inOut"
                            }
                        );
                        //次の画像を同時に表示
                        mirrorTimeline.to(
                            nextImage,
                            {
                                autoAlpha: 1,
                                scale: 1,
                                duration: 1.2,
                                ease: "power2.out"
                            },
                            "<"
                        );
                        //切り替え後の状態を整理
                        mirrorTimeline.set(
                            currentImage,
                            {
                                autoAlpha: 0,
                                scale: 1.03,
                                zIndex: 0
                            }
                        );
                        mirrorTimeline.set(
                            nextImage,
                            {
                                autoAlpha: 1,
                                scale: 1,
                                zIndex: 1
                            }
                        );
                    }
                );
            });
        };
        //左右の鏡を同時に表示
        const revealMirrors = () => {
            gsap.to(mirrorUnits, {
                autoAlpha: 1,
                duration: 1.8,
                ease: "sine.out",
                //鏡の表示完了後に画像切り替えを開始
                onComplete: startMirrorSliders
            });
        };
        //鏡セクションが画面内に入ったら実行
        if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.create({
                trigger: mirrorSection,
                start: "top 80%",
                once: true,
                onEnter: revealMirrors
                // markers: true
            });
            requestAnimationFrame(() => {
                ScrollTrigger.refresh();
            });
        } else {
            //ScrollTriggerがない場合はすぐに表示を開始
            revealMirrors();
        }
    }

    //ペガサスアニメーション
    function initPegasusAnimation() {
        const section = document.querySelector(
            ".with-pegasus"
        );
        if (!section) return;
        //二重実行を防止
        if (
            section.dataset.pegasusAnimationInitialized ===
            "true"
        ) {
            return;
        }
        section.dataset.pegasusAnimationInitialized =
            "true";
        const titles = gsap.utils.toArray(
            section.querySelectorAll(
                [
                    ".pegasus-title-1",
                    ".pegasus-title-2",
                    ".pegasus-title-3"
                ].join(",")
            )
        );
        const contents = gsap.utils.toArray(
            section.querySelectorAll(
                [
                    ".pegasus-content-1",
                    ".pegasus-content-2"
                ].join(",")
            )
        );
        //タイトルの初期状態 CSSのtranslateX(-50%)をxPercent: -50で維持する
        gsap.set(titles, {
            autoAlpha: 0,
            xPercent: -50,
            x: 0,
            y: 36
        });
        //本文は座標を変更せず透明にする,transformには触れない
        gsap.set(contents, {
            autoAlpha: 0
        });
        //GSAPの初期状態を設定してからCSS待機用classを解除
        section.classList.remove(
            "pegasus-animation-pending"
        );
        if (typeof ScrollTrigger === "undefined") {
            gsap.set(titles, {
                autoAlpha: 1,
                xPercent: -50,
                y: 0
            });
            gsap.set(contents, {
                autoAlpha: 1
            });
            return;
        }
        //タイトルを上から順番に表示
        gsap.to(titles, {
            autoAlpha: 1,
            xPercent: -50,
            x: 0,
            y: 0,
            duration: 1.4,
            stagger: {
                each: 0.2,
                from: "start"
            },
            ease: "power2.out",
            scrollTrigger: {
                trigger: section,
                start: "top 82%",
                once: true,
                invalidateOnRefresh: true
                // markers: true
            }
        });
        //本文1・本文2を別々のScrollTriggerで表示
        contents.forEach((content) => {
            gsap.to(content, {
                autoAlpha: 1,
                duration: 1.6,
                ease: "sine.out",
                scrollTrigger: {
                    trigger: content,
                    start: "top 85%",
                    once: true,
                    invalidateOnRefresh: true
                    // markers: true
                }
            });
        });
        window.addEventListener(
            "load",
            () => {
                ScrollTrigger.refresh();
            },
            { once: true }
        );
    }

    //eventPageアニメーション
    function initEventPageAnimation() {
        const section = document.querySelector(
            ".event-page"
        );
        if (!section) return;
        //二重実行を防止
        if (
            section.dataset.eventPageAnimationInitialized ===
            "true"
        ) {
            return;
        }
        section.dataset.eventPageAnimationInitialized =
            "true";
        const eventDetail = section.querySelector(
            ".event-detail"
        );
        const eventTitle = section.querySelector(
            ".event-title"
        );
        //.event-content直下のpをHTMLに書かれている順番で取得
        const paragraphs = gsap.utils.toArray(
            section.querySelectorAll(
                ".event-content > p"
            )
        );
        /*HTMLの並び順でグループを作る
         * 0・1   義父との別れ
         * 2・3   寒川神社参拝
         * 4・5   ありがとうを伝えよう
         * 6・7   震災から15年
         * 8・9   弥栄
         * 10     宇宙の金卵大鏡369
         * 11     令和9年9月9日納品
         * 12     3月20日以降の文章
         * 13     ルン・ルの会の文章
         * 14     御守の文章*/
        const paragraphGroups = [
            [paragraphs[0], paragraphs[1]],
            [paragraphs[2], paragraphs[3]],
            [paragraphs[4], paragraphs[5]],
            [paragraphs[6], paragraphs[7]],
            [paragraphs[8], paragraphs[9]],
            [paragraphs[10]],
            [paragraphs[11]],
            [paragraphs[12]],
            [paragraphs[13]],
            [paragraphs[14]]
        ].map((group) => {
            return group.filter(Boolean);
        });
        //event-detailは座標を変更せず透明にする,CSSでtranslateX(-50%)を使っているためx・yはGSAPで設定しない
        if (eventDetail) {
            gsap.set(eventDetail, {
                autoAlpha: 0
            });
        }
        //event-titleも座標を変更せず透明にする
        if (eventTitle) {
            gsap.set(eventTitle, {
                autoAlpha: 0
            });
        }
        //各段落を36px下へ移動して透明にする
        gsap.set(paragraphs, {
            autoAlpha: 0,
            y: 36
        });
        //GSAPの初期状態を設定してからCSS待機用classを解除
        section.classList.remove(
            "event-page-animation-pending"
        );
        //ページ表示直後のイントロ
        const introTimeline = gsap.timeline();
        //1. event-detailを早めに表示
        if (eventDetail) {
            introTimeline.to(eventDetail, {
                autoAlpha: 1,
                duration: 0.9,
                ease: "sine.out"
            });
        }
        //2. event-detail表示直後にタイトル表示
        if (eventTitle) {
            introTimeline.to(
                eventTitle,
                {
                    autoAlpha: 1,
                    duration: 1,
                    ease: "sine.out"
                },
                ">+=0.1"
            );
        }
        //イントロ完了後に各文章のScrollTriggerを有効にする
        introTimeline.eventCallback(
            "onComplete",
            () => {
                if (
                    typeof ScrollTrigger === "undefined"
                ) {
                    gsap.set(paragraphs, {
                        autoAlpha: 1,
                        y: 0
                    });
                    return;
                }
                //最初から画面内にある3グループ
                const firstVisibleGroups =
                    paragraphGroups.slice(0, 3);
                //4グループ目以降
                const remainingGroups =
                    paragraphGroups.slice(3);
                //最初の3グループを上から順番に表示
                if (
                    firstVisibleGroups.length > 0 &&
                    firstVisibleGroups[0].length > 0
                ) {
                    const firstGroupsTimeline = gsap.timeline({
                        scrollTrigger: {
                            trigger: firstVisibleGroups[0][0],
                            start: "top 90%",
                            once: true,
                            invalidateOnRefresh: true
                            // markers: true
                        }
                    });
                    //タイトル表示後、少し待つ
                    firstGroupsTimeline.to({}, {
                        duration: 0.3
                    });
                    firstVisibleGroups.forEach(
                        (group, index) => {
                            if (group.length === 0) return;
                            firstGroupsTimeline.to(
                                group,
                                {
                                    autoAlpha: 1,
                                    y: 0,
                                    duration: 1.2,
                                    ease: "power2.out"
                                },
                                //2グループ目以降は、前のグループと少し重ねる
                                index === 0
                                    ? ">"
                                    : ">-0.4"
                            );
                        }
                    );
                }
                //4グループ目以降はそれぞれの位置で表示
                remainingGroups.forEach((group) => {
                    if (group.length === 0) return;
                    const triggerElement = group[0];
                    gsap.to(group, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.5,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: triggerElement,
                            start: "top 85%",
                            once: true,
                            invalidateOnRefresh: true
                            // markers: true
                        }
                    });
                });
                requestAnimationFrame(() => {
                    ScrollTrigger.refresh();
                });
            }
        );
    }

    //お問い合わせアニメーション
    function initContactPageAnimation() {
        const section = document.querySelector(
            ".contact-form"
        );
        if (!section) return;
        //二重実行を防止
        if (
            section.dataset.contactPageAnimationInitialized ===
            "true"
        ) {
            return;
        }
        section.dataset.contactPageAnimationInitialized =
            "true";
        const contact = section.querySelector(
            ".contact"
        );
        if (!contact) return;
        const contactTitle = contact.querySelector(
            ".contact-title"
        );
        //contact直下の要素からアニメーション対象をHTML順で取得
        const formUnits = Array.from(
            contact.children
        ).filter((element) => {
            return element.matches(
                [
                    ".form-row",
                    ".full-group",
                    ".address-group",
                    ".details",
                    ".decision-button"
                ].join(",")
            );
        });
        //最初から画面内にある2段,0：苗字・お名前,1：みょうじ・おなまえ
        const firstVisibleUnits =
            formUnits.slice(0, 2);
        //それ以降のフォーム
        const remainingUnits =
            formUnits.slice(2);
        //contact全体を座標変更せず透明にする CSSのtranslateX(-50%)を守るため,x・yは指定しない
        gsap.set(contact, {
            autoAlpha: 0
        });
        //タイトルも座標変更せず透明にする
        if (contactTitle) {
            gsap.set(contactTitle, {
                autoAlpha: 0
            });
        }
        //フォーム各段を少し下へ置いて透明にする
        gsap.set(formUnits, {
            autoAlpha: 0,
            y: 36
        });
        //GSAPの初期状態設定後にCSS待機用classを解除
        section.classList.remove(
            "contact-page-animation-pending"
        );
        //ページ表示直後のイントロ
        const introTimeline = gsap.timeline();
        //1. contactの背景・外枠を表示
        introTimeline.to(contact, {
            autoAlpha: 1,
            duration: 0.9,
            ease: "sine.out"
        });
        //2. タイトルを表示
        if (contactTitle) {
            introTimeline.to(
                contactTitle,
                {
                    autoAlpha: 1,
                    duration: 1,
                    ease: "sine.out"
                },
                ">+=0.1"
            );
        }
        //3. 苗字・お名前の段
        if (firstVisibleUnits[0]) {
            introTimeline.to(
                firstVisibleUnits[0],
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 1.2,
                    ease: "power2.out"
                },
                ">-0.2"
            );
        }
        //4. みょうじ・おなまえの段
        if (firstVisibleUnits[1]) {
            introTimeline.to(
                firstVisibleUnits[1],
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 1.2,
                    ease: "power2.out"
                },
                ">-0.4"
            );
        }
        //最初の表示が完了してから残りのScrollTriggerを作成する
        introTimeline.eventCallback(
            "onComplete",
            () => {
                if (
                    typeof ScrollTrigger === "undefined"
                ) {
                    //ScrollTriggerがない場合は残りを順番に表示
                    gsap.to(remainingUnits, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 1.2,
                        stagger: 0.2,
                        ease: "power2.out"
                    });
                    return;
                }
                //同時に画面へ入った項目も上から順番に少しずらして表示
                ScrollTrigger.batch(
                    remainingUnits,
                    {
                        start: "top 88%",
                        once: true,
                        interval: 0.15,
                        batchMax: 3,
                        onEnter: (batch) => {
                            gsap.to(batch, {
                                autoAlpha: 1,
                                y: 0,
                                duration: 1.2,
                                stagger: {
                                    each: 0.22,
                                    from: "start"
                                },
                                ease: "power2.out",
                                overwrite: "auto"
                            });
                        }
                        // markers: true
                    }
                );
                requestAnimationFrame(() => {
                    ScrollTrigger.refresh();
                });
            }
        );
        //画像読み込み後に再計算
        window.addEventListener(
            "load",
            () => {
                if (
                    typeof ScrollTrigger !== "undefined"
                ) {
                    ScrollTrigger.refresh();
                }
            },
            { once: true }
        );
    }

    // contact-form
    const form = document.getElementById("contactForm");

    if (form) {
        const addressSearchButton = form.querySelector(".address-search");
        const postalCodeInput = form.querySelector("#contact-address");
        const prefectureSelect = form.querySelector("#prefecture");
        const municipalityInput = form.querySelector("#municipality");
        const postalCodeError = form.querySelector(".zip-error");
        const emailInput = form.querySelector("#email");
        const emailCheckInput = form.querySelector("#email-check");
        const telephoneInput = form.querySelector("#contact-tell");
        const mobilePhoneInput = form.querySelector("#contact-phone");

        //必須項目に任意入力の電話番号と携帯電話番号を加えて検証対象にする
        const validationFields = [
            ...new Set([
                ...form.querySelectorAll("[required]"),
                telephoneInput,
                mobilePhoneInput
            ].filter(Boolean))
        ];

        const emptyMessages = {
            lastName: "苗字を入力してください。",
            firstName: "お名前を入力してください。",
            "lastName-check": "みょうじを入力してください。",
            "firstName-check": "おなまえを入力してください。",
            email: "メールアドレスを入力してください。",
            "email-check":
                "確認用メールアドレスを入力してください。",
            "contact-address":
                "7桁の郵便番号を入力してください。",
            "contact-details":
                "お問い合わせ内容を入力してください。"
        };

        // ひらがな、長音符、空白を許可
        const hiraganaPattern = /^[ぁ-ゖゝゞー\s　]+$/;
        // 半角数字とハイフンのみ、数字は最低1文字含む
        const phonePattern = /^(?=.*\d)[0-9-]+$/;
        // 任意入力の電話番号
        const optionalPhoneIds = new Set([
            "contact-tell",
            "contact-phone"
        ]);
        // 最後に住所検索へ成功した郵便番号
        let lastSearchedPostalCode = "";

        //郵便番号を半角数字だけにする
        function normalizePostalCode(value) {
            return value
                // 全角数字を半角数字へ変換
                .replace(/[０-９]/g, (number) =>
                    String.fromCharCode(
                        number.charCodeAt(0) - 0xFEE0
                    )
                )
                // 数字以外を除去
                .replace(/\D/g, "");
        }

        // 各入力欄に対応するエラー表示要素を取得
        function getErrorElement(field) {
            if (field === postalCodeInput) {
                return postalCodeError;
            }
            const wrapper = field.closest(
                ".field, .full-group, .zip-field, " +
                ".textarea-wrapper, .form-group"
            );
            return (
                wrapper?.querySelector(".error-message") ??
                null
            );
        }

        // エラーを表示
        function showFieldError(field, message) {
            const errorElement =
                getErrorElement(field);
            field.classList.add("input-error");
            field.setAttribute(
                "aria-invalid",
                "true"
            );
            if (errorElement) {
                errorElement.textContent = message;
            }
        }

        // エラーを解除
        function clearFieldError(field) {
            const errorElement =
                getErrorElement(field);
            field.classList.remove("input-error");
            field.removeAttribute("aria-invalid");
            if (errorElement) {
                errorElement.textContent = "";
            }
        }

        //入力欄1項目を検証
        function validateField(field) {
            const value = field.value.trim();
            // 電話番号・携帯電話番号は任意項目、空欄なら有効
            if (
                optionalPhoneIds.has(field.id) &&
                value === ""
            ) {
                clearFieldError(field);
                return true;
            }

            //必須項目の空欄チェック
            //郵便番号は必須項目ではないが、住所検索ボタンからvalidateField()を呼び出したときはここで検証
            if (value === "") {
                showFieldError(
                    field,
                    emptyMessages[field.id] ??
                    "この項目を入力してください。"
                );
                return false;
            }

            //ふりがな
            if (
                field.id === "lastName-check" ||
                field.id === "firstName-check"
            ) {
                if (!hiraganaPattern.test(value)) {
                    showFieldError(
                        field,
                        "ひらがなで入力してください。"
                    );
                    return false;
                }
            }

            //メールアドレス
            if (field.id === "email") {
                if (!field.validity.valid) {
                    showFieldError(
                        field,
                        "正しいメールアドレスを入力してください。"
                    );
                    return false;
                }
            }

            //確認用メールアドレス
            if (field.id === "email-check") {
                const originalEmail =
                    emailInput.value.trim();
                if (!field.validity.valid) {
                    showFieldError(
                        field,
                        "正しい確認用メールアドレスを入力してください。"
                    );
                    return false;
                }
                if (
                    emailInput.validity.valid &&
                    value !== originalEmail
                ) {
                    showFieldError(
                        field,
                        "メールアドレスが一致していません。入力内容をご確認ください。"
                    );
                    return false;
                }
            }

            //電話番号・携帯電話番号
            if (optionalPhoneIds.has(field.id)) {
                if (!phonePattern.test(value)) {
                    showFieldError(
                        field,
                        "半角数字とハイフンのみで入力してください。"
                    );
                    return false;
                }
            }

            //郵便番号
            if (field.id === "contact-address") {
                const postalCode =
                    normalizePostalCode(field.value);
                if (postalCode.length !== 7) {
                    showFieldError(
                        field,
                        "7桁の郵便番号を入力してください。"
                    );
                    return false;
                }
            }
            clearFieldError(field);
            return true;
        }

        //フォーム全体を検証
        function validateForm() {
            let firstInvalid = null;
            validationFields.forEach((field) => {
                //決定ボタンを押した後は入力のたびに再検証
                field.dataset.hasValidated = "true";

                const isValid =
                    validateField(field);
                if (!isValid && !firstInvalid) {
                    firstInvalid = field;
                }
            });
            if (firstInvalid) {
                firstInvalid.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
                setTimeout(() => {
                    firstInvalid.focus();
                }, 500);
                return false;
            }
            return true;
        }

        //決定ボタン
        form.addEventListener(
            "submit",
            (event) => {
                // 制作途中のため送信を必ず停止、入力内容はURLにも追加されない
                event.preventDefault();
                if (!validateForm()) {
                    return;
                }
                // 入力に問題がなくても送信しない
                alert(
                    "お問い合わせ機能は現在準備中です。"
                );
            }
        );
        //一度検証された項目は、入力のたびに再検証
        validationFields.forEach((field) => {
            field.addEventListener(
                "input",
                () => {
                    if (
                        field.dataset.hasValidated !==
                        "true"
                    ) {
                        return;
                    }
                    validateField(field);
                }
            );
        });

        //元メールを変更したとき、確認用メールも再検証
        emailInput?.addEventListener(
            "input",
            () => {
                if (!emailCheckInput) {
                    return;
                }

                const wasValidated =
                    emailCheckInput.dataset
                        .hasValidated === "true";
                const hasError =
                    emailCheckInput.classList
                        .contains("input-error");

                if (wasValidated || hasError) {
                    validateField(emailCheckInput);
                }
            }
        );

        //検索によって自動入力された住所を消す
        function clearSearchedAddress() {
            if (prefectureSelect) {
                prefectureSelect.selectedIndex = 0;
            }
            if (municipalityInput) {
                municipalityInput.value = "";
            }
            lastSearchedPostalCode = "";
        }

        //郵便番号を変更したとき
        postalCodeInput?.addEventListener(
            "input",
            () => {
                const currentPostalCode =
                    normalizePostalCode(
                        postalCodeInput.value
                    );

                //最後に検索した郵便番号から変更されたら検索結果を消す
                if (
                    lastSearchedPostalCode !== "" &&
                    currentPostalCode !==
                    lastSearchedPostalCode
                ) {
                    clearSearchedAddress();
                }
                //一度住所検索ボタンを押した後だけ入力のたびに再検証
                if (
                    postalCodeInput.dataset
                        .hasValidated === "true"
                ) {
                    validateField(postalCodeInput);
                }
            }
        );

        //住所検索
        addressSearchButton?.addEventListener(
            "click",
            async (event) => {
                event.preventDefault();
                if (!postalCodeInput) {
                    return;
                }
                postalCodeInput.dataset
                    .hasValidated = "true";
                if (!validateField(postalCodeInput)) {
                    clearSearchedAddress();
                    postalCodeInput.focus();
                    return;
                }

                const postalCode =
                    normalizePostalCode(
                        postalCodeInput.value
                    );
                try {
                    const response = await fetch(
                        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`
                    );
                    if (!response.ok) {
                        throw new Error(
                            `HTTP error: ${response.status}`
                        );
                    }

                    const data =
                        await response.json();
                    if (!data.results) {
                        clearSearchedAddress();

                        showFieldError(
                            postalCodeInput,
                            "住所が見つかりませんでした。"
                        );
                        return;
                    }

                    const address =
                        data.results[0];
                    clearFieldError(
                        postalCodeInput
                    );
                    //検索に成功した郵便番号を記録
                    lastSearchedPostalCode =
                        postalCode;
                    if (prefectureSelect) {
                        prefectureSelect.value =
                            address.address1;
                    }
                    if (municipalityInput) {
                        municipalityInput.value =
                            address.address2 +
                            address.address3;
                    }
                } catch (error) {
                    console.error(error);
                    clearSearchedAddress();
                    showFieldError(
                        postalCodeInput,
                        "住所検索中にエラーが発生しました。"
                    );
                }
            }
        );
    }
}