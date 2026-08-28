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

if (typeof gsap !== "undefined") {
    //hero-animation
    document.addEventListener("DOMContentLoaded", async () => {
        const images = gsap.utils.toArray(
            ".hero-images > .hero-image"
        );
        const frame = document.querySelector(".hero-frame-picture");
        const logo = document.querySelector(".logo-content");

        if (images.length === 0) return;
        /* Hero画像の初期状態 */
        gsap.set(images, {
            autoAlpha: 0,
            scale: 1.03,
            x: 0,
            xPercent: 0,
            zIndex: 0,
            transformOrigin: "50% 50%"
        });
        if (frame) {
            gsap.set(frame, {
                autoAlpha: 0
            });
        }
        if (logo) {
            gsap.set(logo, {
                autoAlpha: 0,
                yPercent: 150
            });
        }
        //カクつき防止の先にデコード処理
        await Promise.all(
            images.map((image) => {
                if (typeof image.decode === "function") {
                    return image.decode().catch(() => { });
                }
                if (image.complete) {
                    return Promise.resolve();
                }
                return new Promise((resolve) => {
                    image.addEventListener("load", resolve, { once: true });
                    image.addEventListener("error", resolve, { once: true });
                });
            })
        );
        //Hero画像の繰り返し部分
        const startHeroLoop = () => {
            const loopTimeline = gsap.timeline({
                repeat: -1
            });

            images.forEach((currentImage, index) => {
                const nextImage = images[(index + 1) % images.length];
                /* 現在の画像を5秒間表示 */
                loopTimeline.to({}, {
                    duration: 5
                });

                //z-index: 1にする(カクつき防止)
                loopTimeline.set(currentImage, {
                    zIndex: 1
                });
                /* 次の画像を前面に準備 */
                loopTimeline.set(nextImage, {
                    autoAlpha: 0,
                    scale: 1.03,
                    x: 0,
                    xPercent: 0,
                    zIndex: 2
                });
                /* 現在の画像を消す */
                loopTimeline.to(currentImage, {
                    autoAlpha: 0,
                    scale: 1.015,
                    duration: 1.2,
                    ease: "power2.inOut",
                });
                /* 次の画像を同時に表示 */
                loopTimeline.to(nextImage, {
                    autoAlpha: 1,
                    scale: 1,
                    x: 0,
                    xPercent: 0,
                    duration: 1.2,
                    ease: "power2.inOut",
                }, "<");
                /* 切り替え後の重なり順を整理 */
                loopTimeline.set(currentImage, {
                    autoAlpha: 0,
                    scale: 1.03,
                    zIndex: 0
                });
                loopTimeline.set(nextImage, {
                    autoAlpha: 1,
                    scale: 1,
                    zIndex: 1
                });
            });
        };
        //初回のみのイントロアニメーション
        const introTimeline = gsap.timeline({
            onComplete: startHeroLoop
        });
        /* 1. 最初のHero画像 */
        introTimeline.to(images[0], {
            autoAlpha: 1,
            scale: 1,
            zIndex: 1,
            duration: 1.6,
            ease: "power2.out",
        });
        /* 少し間を空ける */
        introTimeline.to({}, {
            duration: 0.2
        });
        /* 2. フレーム */
        if (frame) {
            introTimeline.to(frame, {
                autoAlpha: 1,
                duration: 1.8,
                ease: "sine.out"
            });
        }
        /* 3. ロゴ */
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
    });
}

//contact-form
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
    //必須項目に、任意入力の電話番号2項目を加えてバリデーション対象にする
    //required属性がある項目に郵便番号を追加、郵便番号にもrequiredが付いている場合Setで重複しない
    // required属性がある必須項目だけを対象にする
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
        "email-check": "確認用メールアドレスを入力してください。",
        "contact-address": "7桁の郵便番号を入力してください。",
        "contact-details": "お問い合わせ内容を入力してください。"
    };
    //ひらがな、長音符、空白を許可*
    const hiraganaPattern = /^[ぁ-ゖゝゞー\s　]+$/;
    // 半角数字とハイフンのみ
    const phonePattern = /^(?=.*\d)[0-9-]+$/;
    const optionalPhoneIds = new Set([
        "contact-tell",
        "contact-phone"
    ]);

    function normalizePostalCode(value) {
        return value
            //全角数字を半角数字へ変換
            .replace(/[０-９]/g, (number) =>
                String.fromCharCode(number.charCodeAt(0) - 0xFEE0)
            )
            //数字以外を除去
            .replace(/\D/g, "");
    }

    function getErrorElement(field) {
        if (field === postalCodeInput) {
            return postalCodeError;
        }
        const wrapper = field.closest(
            ".field, .full-group, .zip-field, .textarea-wrapper, .form-group"
        );
        return wrapper?.querySelector(".error-message") ?? null;
    }

    function showFieldError(field, message) {
        const errorElement = getErrorElement(field);
        field.classList.add("input-error");
        field.setAttribute("aria-invalid", "true");
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function clearFieldError(field) {
        const errorElement = getErrorElement(field);
        field.classList.remove("input-error");
        field.removeAttribute("aria-invalid");
        if (errorElement) {
            errorElement.textContent = "";
        }
    }
    //すべての検証をこの関数にまとめる
    function validateField(field) {
        const value = field.value.trim();
        //電話番号・携帯電話番号は任意項目なので空欄の場合はエラーにしない
        if (
            optionalPhoneIds.has(field.id) &&
            value === ""
        ) {
            clearFieldError(field);
            return true;
        }

        // 必須項目の空欄チェック
        if (value === "") {
            showFieldError(
                field,
                emptyMessages[field.id] ??
                "この項目を入力してください。"
            );

            return false;
        }
        //苗字・名前のふりがなチェック
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
        //メールアドレスの形式チェック
        if (field.id === "email") {
            if (!field.validity.valid) {
                showFieldError(
                    field,
                    "正しいメールアドレスを入力してください。"
                );
                return false;
            }
        }
        //確認用メールアドレスの検証
        if (field.id === "email-check") {
            const originalEmail = emailInput.value.trim();
            // 確認用メールアドレス自体の形式が正しくない
            if (!field.validity.valid) {
                showFieldError(
                    field,
                    "正しい確認用メールアドレスを入力してください。"
                );
                return false;
            }

            // 元メールが正しい形式で、確認欄と一致していない
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
        // 電話番号・携帯電話番号の検証
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
            const postalCode = normalizePostalCode(field.value);
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
    //決定ボタンを押したとき
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        let firstInvalid = null;
        validationFields.forEach((field) => {
            // 送信後は入力のたびに検証
            field.dataset.hasValidated = "true";
            const isValid = validateField(field);
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
            return;
        }
        //エラーがなければ送信
        form.submit();
    });

    //一度検証された項目は入力のたびに再検証
    validationFields.forEach((field) => {
        field.addEventListener("input", () => {
            if (field.dataset.hasValidated !== "true") {
                return;
            }
            validateField(field);
        });
    });

    // 確認欄が一度検証されている、または現在エラー中なら元メールの変更に合わせて確認欄も再検証
    emailInput.addEventListener("input", () => {
        const emailCheckWasValidated =
            emailCheckInput.dataset.hasValidated === "true";
        const emailCheckHasError =
            emailCheckInput.classList.contains("input-error");
        if (emailCheckWasValidated || emailCheckHasError) {
            validateField(emailCheckInput);
        }
    });

    //郵便番号の入力イベント（一文字でも消えたら検索結果を消去）
    postalCodeInput?.addEventListener("input", () => {
        const currentPostalCode = normalizePostalCode(
            postalCodeInput.value
        );
        //最後に検索した郵便番号から変更されたら検索によって入力された住所を消す
        if (
            lastSearchedPostalCode !== "" &&
            currentPostalCode !== lastSearchedPostalCode
        ) {
            clearSearchedAddress();
        }
        //一度住所検索ボタンを押した後だけ入力のたびに郵便番号を再検証
        if (
            postalCodeInput.dataset.hasValidated === "true"
        ) {
            validateField(postalCodeInput);
        }
    });

    // 住所検索
    addressSearchButton?.addEventListener("click", async (event) => {
        event.preventDefault();
        postalCodeInput.dataset.hasValidated = "true";
        if (!validateField(postalCodeInput)) {
            clearSearchedAddress();
            postalCodeInput.focus();
            return;
        }

        const postalCode = normalizePostalCode(
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
            const data = await response.json();
            if (!data.results) {
                clearSearchedAddress();
                showFieldError(
                    postalCodeInput,
                    "住所が見つかりませんでした。"
                );
                return;
            }
            const address = data.results[0];
            clearFieldError(postalCodeInput);
            // 検索に成功した郵便番号を記録
            lastSearchedPostalCode = postalCode;
            if (prefectureSelect) {
                prefectureSelect.value = address.address1;
            }
            if (municipalityInput) {
                municipalityInput.value =
                    address.address2 + address.address3;
            }
        } catch (error) {
            console.error(error);
            clearSearchedAddress();
            showFieldError(
                postalCodeInput,
                "住所検索中にエラーが発生しました。"
            );
        }
    });

    // 最後に住所検索へ成功した郵便番号
    let lastSearchedPostalCode = "";
    function clearSearchedAddress() {
        // 都道府県を最初の選択肢に戻す
        if (prefectureSelect) {
            prefectureSelect.selectedIndex = 0;
        }
        // 自動入力された市区町村番地を消す
        if (municipalityInput) {
            municipalityInput.value = "";
        }
        lastSearchedPostalCode = "";
    }
}