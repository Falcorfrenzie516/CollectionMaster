import {
  startCollecting,
  buyPack,
  buyConveyorOffer,
  tickConveyor,
  getConveyor,
  tickIncome,
  getPlayer,
  setPage,
  resetGame,
  claimPathNode,
  getPathInfo
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
          <button id="btn-reset" class="danger" style="margin-top:1rem;">Reset Progress</button>
          <p class="hint">Clears all cards, money, and progress</p>
        </div>
      `}

      ${!p.started ? `
        <div class="reset-area">
          <button id="btn-reset" class="danger">Reset Progress</button>
          <p class="hint">Clears all cards, money, and progress</p>
        </div>
      ` : ""}
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

  const resetBtn = document.getElementById("btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset all progress? This cannot be undone.")) {
        resetGame();
        navigate("home");
      }
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
  tickConveyor(); // try refill on view
  const belt = getConveyor();

  let offersHtml = "";
  if (!belt.offers.length) {
    offersHtml = `<p class="empty">Belt is empty — new packs arrive every few seconds.</p>`;
  } else {
    offersHtml = belt.offers.map(o => {
      const canBuy = p.started && p.money >= o.price;
      return `
        <div class="conveyor-offer" data-uid="${o.uid}">
          <div class="offer-name">${o.name}</div>
          <div class="offer-info">${o.desc}</div>
          <button class="primary btn-buy-offer" data-uid="${o.uid}" ${canBuy ? "" : "disabled"}>
            Buy for ${formatMoney(o.price)}
          </button>
        </div>
      `;
    }).join("");
  }

  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Conveyor Belt</h2>
      <p class="page-sub">Packs refill automatically · prices scale with packs opened</p>
      <div class="conveyor-belt">
        ${offersHtml}
      </div>
      <p class="hint">Standard, themed, gold & premium packs appear over time.</p>
    </div>
  `;

  pageContent.querySelectorAll(".btn-buy-offer").forEach(btn => {
    btn.addEventListener("click", () => {
      const result = buyConveyorOffer(btn.dataset.uid);
      if (result.error) {
        alert(result.error);
        return;
      }
      updateHeader();
      renderConveyor();
    });
  });
}

// ----- PATH -----
function renderPath() {
  const p = getPlayer();
  const info = getPathInfo();
  const next = info.nextClaimable;
  const unlocked = info.unlockedCount;

  let nodesHtml = "";
  for (let i = 0; i < 20; i++) {
    const claimed = info.claimedNodes.includes(i);
    const isNext = next === i;
    const isUnlocked = i < unlocked;
    const reward = info.rewards[i];
    const target = info.targets[i];

    let statusClass = "locked";
    if (claimed) statusClass = "claimed";
    else if (isNext) statusClass = "claimable";
    else if (isUnlocked) statusClass = "unlocked";

    const icon = claimed ? "●" : isNext ? "◇" : isUnlocked ? "○" : "·";

    nodesHtml += `
      <div class="path-node ${statusClass}" data-node="${i}">
        <div class="node-num">${i + 1}</div>
        <div class="node-icon">${icon}</div>
        <div class="node-info">
          <div class="node-label">${reward.label}</div>
          <div class="node-meta">${target === 0 ? "Start" : "Needs $" + target.toLocaleString() + " lifetime"}</div>
        </div>
      </div>
    `;
  }

  const canClaim = next !== null;
  const nextLabel = canClaim
    ? `Slide to Node ${next + 1}: ${info.rewards[next].label}`
    : unlocked >= 20
      ? "Path complete!"
      : "Earn more income to unlock the next node";

  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Path</h2>
      <p class="page-sub">
        Node ${info.currentNode + 1} / 20 · Lifetime income $${Math.floor(info.lifetimeIncome).toLocaleString()}
      </p>

      <div class="path-claim-bar">
        <button id="btn-claim-node" class="primary large" ${canClaim ? "" : "disabled"}>
          ${canClaim ? "♟️ " + nextLabel : nextLabel}
        </button>
      </div>

      <div class="path-list">
        ${nodesHtml}
      </div>
    </div>
  `;

  const claimBtn = document.getElementById("btn-claim-node");
  if (claimBtn && canClaim) {
    claimBtn.addEventListener("click", () => {
      const result = claimPathNode();
      if (result.error) {
        alert(result.error);
        return;
      }
      let msg = `Node ${result.node} claimed!`;
      if (result.cashGained) msg += ` +$${result.cashGained}`;
      if (result.card) msg += ` · Got ${result.card.name} (${result.card.rarity})`;
      if (result.flag) msg += ` · Unlocked: ${result.flag}`;
      // brief feedback then re-render
      updateHeader();
      renderPath();
    });
  }
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
  tickConveyor();
}, 1000);

// -----------------------------
// Init
// -----------------------------
const initialPage = getPlayer().currentPage || "home";
navigate(initialPage);
