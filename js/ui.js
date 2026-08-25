import {
  startCollecting,
  buyPack,
  tickIncome,
  getPlayer,
  setPage,
  resetGame
} from "./main.js";
import { getCardEarnings, getCollectionSorted } from "./systems/collection.js";

// -----------------------------
// DOM refs
// -----------------------------
const moneyEl = document.getElementById("money");
const incomeEl = document.getElementById("income");
const pageContent = document.getElementById("page-content");
const tabButtons = document.querySelectorAll("[data-page]");

// -----------------------------
// Formatting
// -----------------------------
function formatMoney(n) {
  return "$" + Math.floor(n).toLocaleString();
}

// -----------------------------
// Header stats
// -----------------------------
function updateHeader() {
  const p = getPlayer();
  moneyEl.textContent = formatMoney(p.money);
  incomeEl.textContent = formatMoney(p.incomePerSecond) + "/s";
}

// -----------------------------
// Navigation
// -----------------------------
function navigate(page) {
  setPage(page);
  tabButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });
  renderPage(page);
  updateHeader();
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => navigate(btn.dataset.page));
});

// -----------------------------
// Page renderers
// -----------------------------
function renderPage(page) {
  switch (page) {
    case "home":
      renderHome();
      break;
    case "path":
      renderPath();
      break;
    case "conveyor":
      renderConveyor();
      break;
    case "expeditions":
      renderExpeditions();
      break;
    case "collections":
      renderCollections();
      break;
    case "events":
      renderEvents();
      break;
    case "achievements":
      renderAchievements();
      break;
    case "tokens":
      renderTokens();
      break;
    default:
      renderHome();
  }
}

// ----- HOME -----
function renderHome() {
  const p = getPlayer();
  pageContent.innerHTML = `
    <div class="home-room">
      <h2 class="page-title">Collector's Room</h2>
      <p class="page-sub">Tap any area to open it</p>

      <div class="room-grid">
        <button class="room-card" data-goto="path">
          <div class="room-icon">🗺️</div>
          <div class="room-label">Path Table</div>
          <div class="room-desc">Progress & rewards</div>
        </button>

        <button class="room-card" data-goto="collections">
          <div class="room-icon">📘</div>
          <div class="room-label">Dinosaur Book</div>
          <div class="room-desc">${p.totalDiscovered}/12 discovered</div>
        </button>

        <button class="room-card" data-goto="conveyor">
          <div class="room-icon">📦</div>
          <div class="room-label">Conveyor</div>
          <div class="room-desc">Buy packs</div>
        </button>

        <button class="room-card" data-goto="expeditions">
          <div class="room-icon">🏕️</div>
          <div class="room-label">Expeditions</div>
          <div class="room-desc">Coming soon</div>
        </button>

        <button class="room-card" data-goto="events">
          <div class="room-icon">🎄</div>
          <div class="room-label">Event Books</div>
          <div class="room-desc">Seasonal collections</div>
        </button>

        <button class="room-card" data-goto="achievements">
          <div class="room-icon">🏆</div>
          <div class="room-label">Achievements</div>
          <div class="room-desc">Permanent progress</div>
        </button>

        <button class="room-card" data-goto="tokens">
          <div class="room-icon">♟️</div>
          <div class="room-label">Tokens</div>
          <div class="room-desc">Path pieces</div>
        </button>
      </div>

      ${!p.started ? `
        <div class="start-area">
          <button id="btn-start" class="primary large">Start Collecting</button>
          <p class="hint">Opens 2 starter packs + first token</p>
        </div>
      ` : `
        <div class="start-area">
          <p class="hint">Income is running. Explore the room.</p>
        </div>
      `}
    </div>
  `;

  pageContent.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.goto));
  });

  const startBtn = document.getElementById("btn-start");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const result = startCollecting();
      if (result.error) {
        alert(result.error);
        return;
      }
      navigate("collections");
    });
  }
}

// ----- COLLECTIONS -----
function renderCollections() {
  const p = getPlayer();
  const cards = getCollectionSorted(p);

  let listHtml = "";
  if (cards.length === 0) {
    listHtml = `<p class="empty">No cards yet. Start Collecting from Home.</p>`;
  } else {
    listHtml = cards.map(c => {
      const earnings = getCardEarnings(c);
      return `
        <div class="card-row rarity-${c.rarity}">
          <span class="name">${c.name}</span>
          <span class="rarity">${c.rarity}</span>
          <span class="rank">Rank ${c.rank}</span>
          <span class="earnings">${formatMoney(earnings)}/s</span>
        </div>
      `;
    }).join("");
  }

  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Dinosaur Book</h2>
      <p class="page-sub">${p.totalDiscovered}/12 species discovered</p>
      <div class="card-list">${listHtml}</div>
    </div>
  `;
}

// ----- CONVEYOR -----
function renderConveyor() {
  const p = getPlayer();
  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Conveyor Belt</h2>
      <p class="page-sub">Pack shop (basic version)</p>

      <div class="conveyor-offer">
        <div class="offer-name">Standard Pack</div>
        <div class="offer-info">4 cards · Normal odds</div>
        <button id="btn-buy" class="primary" ${!p.started || p.money < 100 ? "disabled" : ""}>
          Buy for $100
        </button>
      </div>

      <p class="hint">Themed packs & scaling prices coming in a later build.</p>
    </div>
  `;

  const buyBtn = document.getElementById("btn-buy");
  if (buyBtn) {
    buyBtn.addEventListener("click", () => {
      const result = buyPack(100);
      if (result.error) {
        alert(result.error);
        return;
      }
      updateHeader();
      // Stay on conveyor, just refresh button state
      renderConveyor();
    });
  }
}

// ----- PATH -----
function renderPath() {
  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Path</h2>
      <p class="page-sub">20-node progression (placeholder)</p>
      <div class="placeholder-box">
        <p>Path table + token movement will live here.</p>
        <p>Income unlocks nodes. Slide token one at a time.</p>
      </div>
    </div>
  `;
}

// ----- EXPEDITIONS -----
function renderExpeditions() {
  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Expeditions</h2>
      <p class="page-sub">Timer-based hunts</p>
      <div class="placeholder-box">
        <p>Expedition camp unlocks later on the Path.</p>
        <p>Free to start once unlocked. Scaling timers.</p>
      </div>
    </div>
  `;
}

// ----- EVENTS -----
function renderEvents() {
  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Event Books</h2>
      <p class="page-sub">Persistent seasonal collections</p>
      <div class="placeholder-box">
        <p>🎄 Christmas</p>
        <p>🌌 The Void</p>
        <p>These stay through prestige.</p>
      </div>
    </div>
  `;
}

// ----- ACHIEVEMENTS -----
function renderAchievements() {
  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Achievements</h2>
      <p class="page-sub">Permanent · grant Prestige Points</p>
      <div class="placeholder-box">
        <p>Coming soon. Will persist through prestige.</p>
      </div>
    </div>
  `;
}

// ----- TOKENS -----
function renderTokens() {
  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Tokens</h2>
      <p class="page-sub">Path pieces you can switch anytime</p>
      <div class="placeholder-box">
        <p>♟️ The Explorer (starter token)</p>
        <p>Set tokens unlock when you complete all rarities of a dinosaur.</p>
      </div>
    </div>
  `;
}

// -----------------------------
// Income tick
// -----------------------------
setInterval(() => {
  const p = getPlayer();
  if (p.started && p.incomePerSecond > 0) {
    tickIncome();
    updateHeader();
  }
}, 1000);

// -----------------------------
// Init
// -----------------------------
const initialPage = getPlayer().currentPage || "home";
navigate(initialPage);
