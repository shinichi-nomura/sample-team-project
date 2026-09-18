'use strict';
// microCMS 設定
const SERVICE_ID = "tokimeki-jinja";
const API_KEY = "oDjBTh4RaD6rT7ZXi2W717XBHx2Xrj3yQWfe";
const ENDPOINT = "posts";
// NEWを表示する日数
const NEW_DISPLAY_DAYS = 7;
// 詳細記事の表示場所
const detailContent = document.getElementById("detail-content");
// URLから投稿IDを取得
const params = new URLSearchParams(window.location.search);
const contentId = params.get("id");
// microCMSから近況報告を1件取得
async function loadLatestDetail() {
    // detail-contentが存在しない場合
    if (!detailContent) {
        console.error(
            "detail-contentが見つかりません。"
        );
        return;
    }
    // URLに投稿IDがない場合
    if (!contentId) {
        detailContent.innerHTML =
            "<p>近況報告の記事が見つかりません。</p>";
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
        // API通信に失敗した場合
        if (!response.ok) {
            throw new Error(
                `microCMS API error: ${response.status}`
            );
        }
        // JSONとして取得
        const item =
            await response.json();
        // ========================================
        // 近況報告の記事か確認
        // ========================================
        if (
            !item.type?.includes("近況報告")
        ) {

            detailContent.innerHTML =
                "<p>近況報告の記事が見つかりません。</p>";

            return;
        }
        // HTMLへ表示
        renderLatestDetail(item);
    } catch (error) {
        console.error(
            "近況報告の読み込みに失敗しました。",
            error
        );
        detailContent.innerHTML =
            "<p>近況報告の記事を読み込めませんでした。</p>";
    }
}
// 近況報告詳細をHTMLへ表示
function renderLatestDetail(item) {
    // 「読み込み中...」を削除
    detailContent.replaceChildren();
    // ========================================
    // NEW
    // ========================================
    if (
        isNewPost(
            item.date,
            NEW_DISPLAY_DAYS
        )
    ) {
        const newBadge = document.createElement("span");
        newBadge.className =
            "detail-new";
        newBadge.textContent =
            "NEW";
        detailContent.appendChild(newBadge);
    }
    // ========================================
    // タイトル
    // ========================================
    const title = document.createElement("h3");
    title.className =
        "detail-title";
    title.textContent =
        item.title ?? "";
    detailContent.appendChild(title);
    // ========================================
    // 画像
    // ========================================
    if (item.photo?.url) {
        const photo = document.createElement("img");
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
    // ========================================
    // 日付
    // ========================================
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
    // ========================================
    // 本文
    // ========================================
    const body = document.createElement("div");
    body.className =
        "detail-body";
    // 詳細ページでは文字数制限なし
    // microCMSのリッチエディタHTMLをそのまま表示
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
// ========================================
function formatDate(value) {
    if (!value) {
        return "";
    }
    const date =
        new Date(value);
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
// ========================================
// CMS読み込み開始
// ========================================
loadLatestDetail();