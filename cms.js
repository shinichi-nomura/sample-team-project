'use strict';

const SERVICE_ID = "あなたのサービスID";
const API_KEY = "GET専用のAPIキー";
const ENDPOINT = "notices";

async function loadNotices() {
    const eventContainer = document.getElementById("event-contents");
    const latestContainer = document.getElementById("latest-contents");

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
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const events = data.contents
            .filter((item) => item.category === "event")
            .slice(0, 3);

        const latestItems = data.contents
            .filter((item) => item.category === "latest")
            .slice(0, 3);

        renderItems(eventContainer, events);
        renderItems(latestContainer, latestItems);
    } catch (error) {
        console.error(error);
        eventContainer.innerHTML = "<p>情報を読み込めませんでした。</p>";
        latestContainer.innerHTML = "<p>情報を読み込めませんでした。</p>";
    }
}

function renderItems(container, items) {
    container.replaceChildren();

    if (items.length === 0) {
        const message = document.createElement("p");
        message.textContent = "現在、お知らせはありません。";
        container.appendChild(message);
        return;
    }

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

loadNotices();
