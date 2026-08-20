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
    const requiredFields = form.querySelectorAll("[required]");
    // 項目ごとのエラーメッセージ
    const errorMessages = {
        "lastName": "苗字を入力してください。",
        "firstName": "お名前を入力してください。",
        "lastName-check": "みょうじを入力してください。",
        "firstName-check": "おなまえを入力してください。",
        "contact-email": "メールアドレスを入力してください。",
        "email-check": "確認用メールアドレスを入力してください。",
        "contact-details": "お問い合わせ内容を入力してください。"
    };

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        let firstInvalid = null;
        requiredFields.forEach((field) => {
            // エラー表示を一旦リセット
            field.classList.remove("input-error");
            const errorMessage =
                field.parentElement.querySelector(".error-message");
            if (errorMessage) {
                errorMessage.textContent = "";
            }
            // 未入力チェック
            if (field.value.trim() === "") {
                // 一度エラーになったことを記録
                field.dataset.hasError = "true";
                field.classList.add("input-error");
                if (errorMessage) {
                    errorMessage.textContent =
                        errorMessages[field.id] ||
                        "この項目を入力してください。";
                }
                if (!firstInvalid) {
                    firstInvalid = field;
                }
            }
        });

        // エラーがある場合
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
        // 問題なければ送信
        form.submit();
    });

    // 入力されたらその項目のエラーだけ解除
    requiredFields.forEach((field) => {
        field.addEventListener("input", function () {
            // まだ一度もエラーになっていない項目なら何もしない
            if (field.dataset.hasError !== "true") {
                return;
            }
            const errorMessage =
                field.parentElement.querySelector(".error-message");
            if (field.value.trim() !== "") {
                // 入力されている場合
                field.classList.remove("input-error");
                if (errorMessage) {
                    errorMessage.textContent = "";
                }
            } else {
                // 再び空欄になった場合
                field.classList.add("input-error");
                if (errorMessage) {
                    errorMessage.textContent =
                        errorMessages[field.id] ||
                        "この項目を入力してください。";
                }
            }
        });
    });
    const addressSearchButton = form.querySelector(".address-search");
    const postalCodeInput = form.querySelector("#contact-address");
    const prefectureSelect = form.querySelector("#prefecture");
    const municipalityInput = form.querySelector("#municipality");
    const postalCodeError = form.querySelector(".zip-error");

    let postalCodeHasError = false;

    function showPostalCodeError(message) {
        postalCodeHasError = true;
        postalCodeInput.classList.add("input-error");
        postalCodeError.textContent = message;
    }

    function clearPostalCodeError() {
        postalCodeHasError = false;
        postalCodeInput.classList.remove("input-error");
        postalCodeError.textContent = "";
    }

    function validatePostalCode() {
        const postalCode = postalCodeInput.value.replace(/\D/g, "");

        if (postalCode.length === 0) {
            showPostalCodeError("郵便番号を入力してください。");
            return false;
        }

        if (postalCode.length !== 7) {
            showPostalCodeError("7桁の郵便番号を入力してください。");
            return false;
        }

        clearPostalCodeError();
        return true;
    }

    /* 一度エラーが表示された後は、入力のたびに再チェックする */
    postalCodeInput.addEventListener("input", () => {
        validatePostalCode();
    });

    /* 住所検索 */
    addressSearchButton.addEventListener("click", async (event) => {
        event.preventDefault();
        if (!validatePostalCode()) {
            postalCodeInput.focus();
            return;
        }

        const postalCode = postalCodeInput.value.replace(/\D/g, "");
        try {
            const response = await fetch(
                `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`
            );
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();
            if (!data.results) {
                showPostalCodeError("住所が見つかりませんでした。");
                return;
            }

            const address = data.results[0];

            clearPostalCodeError();
            prefectureSelect.value = address.address1;
            municipalityInput.value = address.address2 + address.address3;
        } catch (error) {
            console.error(error);
            showPostalCodeError("住所検索中にエラーが発生しました。");
        }
    });
}