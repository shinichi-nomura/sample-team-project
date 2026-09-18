'use strict';
// microCMS 設定
const SERVICE_ID = "tokimeki-jinja";
const API_KEY = "oDjBTh4RaD6rT7ZXi2W717XBHx2Xrj3yQWfe";
const ENDPOINT = "posts";
// 詳細記事の表示場所
const detailContent = document.getElementById("detail-content");
// URLから投稿IDを取得
const params = new URLSearchParams(window.location.search);
const contentId = params.get("id");
// NEWを表示する日数
const NEW_DISPLAY_DAYS = 7;
// microCMSからイベントを1件取得
async function loadEventDetail() {
    // detail-contentが存在しない場合
    if (!detailContent) {
        console.error(
            "detail-contentが見つかりません。"
        );
        return;
    }
    // URLにidがない場合
    if (!contentId) {
        detailContent.innerHTML =
            "<p>記事が見つかりません。</p>";
        return;
    }
    try {
        // microCMSから指定IDの記事を1件取得
        const response = await fetch(
            `https://${SERVICE_ID}.microcms.io/api/v1/${ENDPOINT}/${contentId}`,
            {
                headers: {
                    "X-MICROCMS-API-KEY": API_KEY
                }
            }
        );
        // API通信失敗
        if (!response.ok) {

            throw new Error(
                `microCMS API error: ${response.status}`
            );
        }
        // JSONとして取得
        const item = await response.json();
        // イベントの記事か確認
        if (
            !item.type?.includes("イベント")
        ) {
            detailContent.innerHTML =
                "<p>イベントの記事が見つかりません。</p>";
            return;
        }
        // HTMLへ表示
        renderEventDetail(item);
    } catch (error) {
        console.error(
            "イベントの読み込みに失敗しました。",
            error
        );
        detailContent.innerHTML =
            "<p>記事を読み込めませんでした。</p>";
    }
}
// ========================================
// イベント詳細をHTMLへ表示
// ========================================
function renderEventDetail(item) {
    // 「読み込み中...」を削除
    detailContent.replaceChildren();
    // NEW
    if (
        isNewPost(
            item.date,
            NEW_DISPLAY_DAYS
        )
    ) {
        const newBadge = document.createElement("span");
        newBadge.className =
            "detail-new"
        newBadge.textContent =
            "NEW";
        detailContent.appendChild(newBadge);
    }
    // タイトル
    const title = document.createElement("h3");
    title.className =
        "detail-title";
    title.textContent =
        item.title ?? "";
    detailContent.appendChild(title);
    // 画像
    if (item.photo?.url) {
        const photo =
            document.createElement("img");
        photo.className =
            "detail-photo";
        photo.src =
            item.photo.url;
        photo.alt =
            item.title ?? "";
        photo.loading =
            "lazy";
        detailContent.appendChild(photo);
    }
    // 日付
    const date = document.createElement("time");
    date.className =
        "detail-date";
    date.textContent =
        formatDate(item.date);
    if (item.date) {
        date.dateTime =
            item.date;
    }
    detailContent.appendChild(date);
    // 本文
    const body = document.createElement("div");
    body.className =
        "detail-body";
    // 詳細ページでは全文表示
    body.innerHTML =
        item.body ?? "";
    detailContent.appendChild(body);
}
// ========================================
// NEW表示期間の判定
// ========================================
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
// ========================================
// 日付を日本語表示へ変換
// ========================================s
function formatDate(value) {
    // 日付がない場合
    if (!value) {
        return "";
    }
    const date = new Date(value);
    // 正しい日付ではない場合
    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
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
loadEventDetail();