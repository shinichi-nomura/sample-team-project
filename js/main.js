'use strict';

//==hamburger-menu==
const hamburger = document.querySelector('.hamburger-menu');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll(".nav-list a");
const logoLink = document.querySelector(".logo-link");

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
    link.addEventListener("click", closeMenu);
});

if (logoLink) {
    logoLink.addEventListener("click", closeMenu);
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

// GSAPアニメーション
if (typeof gsap !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        initHeroAnimation();
        initMirrorAnimation();
    });
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
        const loopTimeline = gsap.timeline({
            repeat: -1
        });
        images.forEach((currentImage, index) => {
            const nextImage =
                images[(index + 1) % images.length];
            // 現在の画像を5秒表示
            loopTimeline.to({}, {
                duration: 5
            });
            // 切り替え直前の状態
            loopTimeline.set(currentImage, {
                autoAlpha: 1,
                zIndex: 1
            });
            loopTimeline.set(nextImage, {
                autoAlpha: 0,
                zIndex: 2
            });
            // 現在画像をふわっと消す
            loopTimeline.to(currentImage, {
                autoAlpha: 0,
                duration: 1.8,
                ease: "sine.inOut"
            });
            // 次画像を同時にふわっと表示
            loopTimeline.to(nextImage, {
                autoAlpha: 1,
                duration: 1.8,
                ease: "sine.inOut"
            }, "<");
            // 切り替え後の状態を整理
            loopTimeline.set(currentImage, {
                autoAlpha: 0,
                zIndex: 0
            });
            loopTimeline.set(nextImage, {
                autoAlpha: 1,
                zIndex: 1
            });
        });
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

//鏡アニメーション
function initMirrorAnimation() {
    const sliders = gsap.utils.toArray(
        ".mirror-slider"
    );
    sliders.forEach((slider) => {
        const images = gsap.utils.toArray(
            slider.querySelectorAll(".mirror-slide")
        );

        if (images.length < 2) return;
        // 全画像の初期状態
        gsap.set(images, {
            autoAlpha: 0,
            scale: 1.03,
            zIndex: 0,
            transformOrigin: "50% 50%"
        });
        // 1枚目を表示
        gsap.set(images[0], {
            autoAlpha: 1,
            scale: 1,
            zIndex: 1
        });

        const mirrorTimeline = gsap.timeline({
            repeat: -1,
        });

        images.forEach((currentImage, index) => {
            const nextImage =
                images[(index + 1) % images.length];
            // 現在画像を表示する時間
            mirrorTimeline.to({}, {
                duration: 2.8
            });
            // 切り替え直前の状態
            mirrorTimeline.set(currentImage, {
                autoAlpha: 1,
                scale: 1,
                zIndex: 1
            });
            mirrorTimeline.set(nextImage, {
                autoAlpha: 0,
                scale: 1.03,
                zIndex: 2
            });
            // 現在画像を消す
            mirrorTimeline.to(currentImage, {
                autoAlpha: 0,
                scale: 1.015,
                duration: 1.2,
                ease: "power2.inOut"
            });
            // 次画像を同時に表示
            mirrorTimeline.to(nextImage, {
                autoAlpha: 1,
                scale: 1,
                duration: 1.2,
                ease: "power2.out"
            }, "<");
            // 切り替え後の状態を整理
            mirrorTimeline.set(currentImage, {
                autoAlpha: 0,
                scale: 1.03,
                zIndex: 0
            });
            mirrorTimeline.set(nextImage, {
                autoAlpha: 1,
                scale: 1,
                zIndex: 1
            });
        });
    });
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