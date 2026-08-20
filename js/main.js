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

//contact-form
const form = document.getElementById("contactForm");

if (form) {
    const addressSearchButton = form.querySelector(".address-search");
    const postalCodeInput = form.querySelector("#contact-address");
    const prefectureSelect = form.querySelector("#prefecture");
    const municipalityInput = form.querySelector("#municipality");
    const postalCodeError = form.querySelector(".zip-error");

    const emailInput = form.querySelector("#contact-email");
    const emailCheckInput = form.querySelector("#email-check");
    //required属性がある項目に郵便番号を追加、郵便番号にもrequiredが付いている場合Setで重複しない
    // required属性がある必須項目だけを対象にする
    const validationFields = [
        ...form.querySelectorAll("[required]")
    ];
    const emptyMessages = {
        lastName: "苗字を入力してください。",
        firstName: "お名前を入力してください。",
        "lastName-check": "みょうじを入力してください。",
        "firstName-check": "おなまえを入力してください。",
        "contact-email": "メールアドレスを入力してください。",
        "email-check": "確認用メールアドレスを入力してください。",
        "contact-address": "7桁の郵便番号を入力してください。",
        "contact-details": "お問い合わせ内容を入力してください。"
    };
    //ひらがな、長音符、空白を許可*
    const hiraganaPattern = /^[ぁ-ゖゝゞー\s　]+$/;
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
        //空欄チェック
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
        if (field.id === "contact-email") {
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
            if (!field.validity.valid) {
                showFieldError(
                    field,
                    "正しいメールアドレスを入力してください。"
                );
                return false;
            }
            if (value !== emailInput.value.trim()) {
                showFieldError(
                    field,
                    "メールアドレスが一致していません。"
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

    // 元のメールアドレスが変更されたら、 確認用メールアドレスも再検証
    emailInput?.addEventListener("input", () => {
        if (
            emailCheckInput.value.trim() !== "" ||
            emailCheckInput.dataset.hasValidated === "true"
        ) {
            emailCheckInput.dataset.hasValidated = "true";
            validateField(emailCheckInput);
        }
    });

    // 住所検索
    addressSearchButton?.addEventListener("click", async (event) => {
        event.preventDefault();
        postalCodeInput.dataset.hasValidated = "true";
        if (!validateField(postalCodeInput)) {
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
                showFieldError(
                    postalCodeInput,
                    "住所が見つかりませんでした。"
                );
                return;
            }
            const address = data.results[0];
            clearFieldError(postalCodeInput);
            if (prefectureSelect) {
                prefectureSelect.value = address.address1;
            }
            if (municipalityInput) {
                municipalityInput.value =
                    address.address2 + address.address3;
            }
        } catch (error) {
            console.error(error);

            showFieldError(
                postalCodeInput,
                "住所検索中にエラーが発生しました。"
            );
        }
    });
}