'use strict';

const SERVICE_ID = "tokimekijinja";
const API_KEY = "oDjBTh4RaD6rT7ZXi2W717XBHx2Xrj3yQWfe";
const ENDPOINT = "https://tokimeki-jinja.microcms.io/api/v1/posts";

async function loadNotices() {
    // HTMLの表示場所を取得
    const eventContainer = document.getElementById("event-contents");
    const latestContainer = document.getElementById("latest-contents");

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
        // 取得に失敗した場合
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        // 取得結果をJavaScriptで扱える形に変換
        const data = await response.json();
        // イベントの記事を最大3件取得
        const events = data.contents
            .filter((item) => item.category === "event")
            .slice(0, 3);
        // 近況報告の記事を最大3件取得
        const latestItems = data.contents
            .filter((item) => item.category === "latest")
            .slice(0, 3);
        // HTMLに表示
        renderItems(eventContainer, events);
        renderItems(latestContainer, latestItems);
    } catch (error) {
        console.error(error);
        eventContainer.innerHTML = "<p>情報を読み込めませんでした。</p>";
        latestContainer.innerHTML = "<p>情報を読み込めませんでした。</p>";
    }
}

function renderItems(container, items) {
    // 「読み込み中...」など、現在の中身を消す
    container.replaceChildren();
    // 記事がない場合
    if (items.length === 0) {
        const message = document.createElement("p");
        message.textContent = "現在、お知らせはありません。";
        container.appendChild(message);
        return;
    }
    // 取得した記事を1件ずつ表示
    items.forEach((item) => {
        const paragraph = document.createElement("p");
        const date = document.createElement("span");
        date.textContent = formatDate(item.date);

        const body = document.createElement("span");
        body.className = "notice-body";
        body.textContent = item.body;
        paragraph.append(
            date,
            document.createElement("br"),
            body
        );
        container.appendChild(paragraph);
    });
}

function formatDate(value) {
    if (!value) return "";

    return new Intl.DateTimeFormat("ja-JP", {
        month: "long",
        day: "numeric"
    }).format(new Date(value));
}
// CMSの読み込みを開始
loadNotices();
