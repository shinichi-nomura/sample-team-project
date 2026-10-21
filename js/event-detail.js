'use strict';
// microCMS 設定
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
        const response = await fetch(`cms-feed.php?id=${encodeURIComponent(contentId)}`);
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
    // リンク先URLを確認
    let linkUrl = "";
    try {
        if (typeof item.linkUrl === "string") {
            const url = new URL(item.linkUrl);
            if (url.protocol === "https:" && !url.username && !url.password) {
                linkUrl = url.href;
            }
        }
    } catch {
        // 不正なURLならリンクを表示しない
    }
    // OGP画像を優先し、なければCMSの画像を使う
    const ogpImage = window.safeArticleImage(item.linkPreview?.image);
    const cmsImage = window.safeArticleImage(item.photo?.url);
    const imageUrl = ogpImage || cmsImage;

    if (linkUrl) {
        const link = document.createElement("a");
        link.href = linkUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        if (imageUrl) {
            const image = document.createElement("img");
            image.className = "detail-photo";
            image.src = imageUrl;
            image.alt = item.title ?? "リンク先の画像";
            image.loading = "lazy";
            link.appendChild(image);
        } else {
            link.textContent = "リンク先を見る";
        }
        detailContent.appendChild(link);
    } else if (cmsImage) {
        // linkUrlがない記事は従来どおり単独の画像を表示
        const image = document.createElement("img");
        image.className = "detail-photo";
        image.src = cmsImage;
        image.alt = item.title ?? "";
        image.loading = "lazy";
        detailContent.appendChild(image);
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
    body.replaceChildren(window.safeArticle(item.body));
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