'use strict';

// ========================================
// microCMS 設定
// ========================================
const SERVICE_ID = "tokimeki-jinja";
const API_KEY = "oDjBTh4RaD6rT7ZXi2W717XBHx2Xrj3yQWfe";
const ENDPOINT = "posts";



// ========================================
// microCMSから記事を取得
// ========================================
async function loadNotices() {

    // TOPページの表示場所
    const eventContainer =
        document.getElementById("event-contents");

    const latestContainer =
        document.getElementById("latest-contents");

    // event-contents / latest-contents が無いページでは
    // CMS処理を実行しない
    if (!eventContainer || !latestContainer) {
        return;
    }

    try {

        // microCMSから記事一覧を取得
        const response = await fetch(
            `https://${SERVICE_ID}.microcms.io/api/v1/${ENDPOINT}?limit=100&orders=-date`,
            {
                headers: {
                    "X-MICROCMS-API-KEY": API_KEY
                }
            }
        );

        // API通信に失敗した場合
        if (!response.ok) {
            throw new Error(
                `microCMS API error: ${response.status}`
            );
        }

        // JSONデータとして取得
        const data = await response.json();



        // ========================================
        // イベント
        // ========================================

        const events = data.contents
            .filter((item) => item.type?.includes("イベント"))
            .slice(0, 3);





        // ========================================
        // 近況報告
        // ========================================

        const latestItems = data.contents
            .filter((item) => item.type?.includes("近況報告"))
            .slice(0, 3);



        // HTMLへ表示
        renderItems(eventContainer, events);
        renderItems(latestContainer, latestItems);

    } catch (error) {

        console.error(
            "microCMSの読み込みに失敗しました。",
            error
        );

        eventContainer.innerHTML =
            "<p>情報を読み込めませんでした。</p>";

        latestContainer.innerHTML =
            "<p>情報を読み込めませんでした。</p>";
    }
}



// ========================================
// 記事をHTMLへ表示
// ========================================
function renderItems(container, items) {

    // 「読み込み中...」を削除
    container.replaceChildren();



    // 記事が0件の場合
    if (items.length === 0) {

        const message =
            document.createElement("p");

        message.textContent =
            "現在、お知らせはありません。";

        container.appendChild(message);

        return;
    }



    // 記事を1件ずつ表示
    items.forEach((item) => {

        const article =
            document.createElement("article");

        article.className = "notice-item";



        // 日付
        const date =
            document.createElement("time");

        date.className = "notice-date";

        date.textContent =
            formatDate(item.date);



        // タイトル
        const title =
            document.createElement("h4");

        title.className = "notice-title";

        title.textContent =
            item.title;



        // 本文
        const body =
            document.createElement("div");

        body.className = "notice-body";

        // microCMSのリッチエディタで作成したHTMLを表示
        body.innerHTML =
            item.body ?? "";



        // articleに追加
        article.append(
            date,
            title,
            body
        );



        // 表示場所へ追加
        container.appendChild(article);
    });
}



// ========================================
// 日付を日本語表示へ変換
// ========================================
function formatDate(value) {

    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "ja-JP",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(
        new Date(value)
    );
}



// ========================================
// CMS読み込み開始
// ========================================
loadNotices();
