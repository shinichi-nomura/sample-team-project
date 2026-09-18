'use strict';

const SERVICE_ID = "tokimeki-jinja";
const API_KEY = "oDjBTh4RaD6rT7ZXi2W717XBHx2Xrj3yQWfe";
const ENDPOINT = "posts";

// NEWを表示する日数
const NEW_DISPLAY_DAYS = 7;
// microCMSから記事を取得
async function loadNotices() {
    const eventContainer = document.getElementById("event-contents");
    const latestContainer = document.getElementById("latest-contents");
    // TOPページ以外では実行しない
    if (!eventContainer || !latestContainer) {
        return;
    }
    try {
        const response = await fetch(
            `https://${SERVICE_ID}.microcms.io/api/v1/${ENDPOINT}?limit=100&orders=-date`,
            {
                headers: {
                    "X-MICROCMS-API-KEY": API_KEY
                }
            }
        );
        if (!response.ok) {
            throw new Error(
                `microCMS API error: ${response.status}`
            );
        }
        const data = await response.json();
        // イベント（最新3件）
        const events = data.contents
            .filter(
                (item) =>
                    item.type?.includes("イベント")
            )
            .slice(0, 3);
        // 近況報告（最新3件）
        const latestItems = data.contents
            .filter(
                (item) =>
                    item.type?.includes("近況報告")
            )
            .slice(0, 3);
        renderItems(
            eventContainer,
            events,
            "event"
        );
        renderItems(
            latestContainer,
            latestItems,
            "latest"
        );
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
// 記事をHTMLへ表示
function renderItems(container, items, type) {
    container.replaceChildren();
    if (items.length === 0) {
        const message = document.createElement("p");
        message.textContent =
            "現在、お知らせはありません。";
        container.appendChild(message);
        return;
    }
    items.forEach((item) => {
        const article = document.createElement("article");
        article.className = "notice-item";
        // 日付とNEW
        const dateLine = document.createElement("div");
        dateLine.className =
            "notice-date-line";
        const date = document.createElement("time");
        date.className = "notice-date";
        date.textContent =
            formatDate(item.date);
        if (item.date) {
            date.dateTime = item.date;
        }
        dateLine.appendChild(date);
        if (
            isNewPost(
                item.date,
                NEW_DISPLAY_DAYS
            )
        ) {
            const newBadge = document.createElement("span");
            newBadge.className =
                "notice-new";
            newBadge.textContent = "NEW";
            dateLine.appendChild(newBadge);
        }
        // 詳細ページへのリンク
        const link = document.createElement("a");
        link.className = "notice-link";
        // イベント
        if (type === "event") {
            link.href =
                `pages/event-detail.html?id=${item.id}`;
        }
        // 近況報告
        if (type === "latest") {
            link.href =
                `pages/latest-detail.html?id=${item.id}`;
        }
        // タイトル
        const title = document.createElement("h4");
        title.className =
            "notice-title";
        title.textContent =
            item.title ?? "";
        // 本文
        const body = document.createElement("p");
        body.className =
            "notice-body";
        // microCMSのHTMLから文字だけ取得
        const temp = document.createElement("div");
        temp.innerHTML =
            item.body ?? "";
        const text = temp.textContent ?? "";
        // TOPページは100文字まで
        body.textContent =
            text.length > 80
                ? text.slice(0, 80) + "…"
                : text;
        // タイトル＋本文をクリック可能にする
        link.append(
            title,
            body
        );
        article.append(
            dateLine,
            link
        );
        container.appendChild(article);
    });
}
// NEW表示期間の判定
function isNewPost(publishedAt, days) {
    if (!publishedAt) {
        return false;
    }
    const publishedTime =
        new Date(publishedAt).getTime();
    if (Number.isNaN(publishedTime)) {
        return false;
    }
    const elapsedTime =
        Date.now() - publishedTime;
    const displayPeriod =
        days * 24 * 60 * 60 * 1000;
    return (
        elapsedTime >= 0 &&
        elapsedTime < displayPeriod
    );
}
// 日付を日本語表示へ変換
function formatDate(value) {
    if (!value) {
        return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    return new Intl.DateTimeFormat(
        "ja-JP",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(date);
}
// CMS読み込み開始
loadNotices();