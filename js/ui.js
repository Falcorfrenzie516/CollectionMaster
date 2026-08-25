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
  getPathInfo,
  tryUnlockExpedition,
  tryStartExpedition,
  claimExpedition,
  tickAllExpeditions,
  getExpeditionsInfo,
  tryEquipToken,
  getTokensInfo,
  getAchievementsInfo,
  getPrestigeInfo,
  tryPrestige
} from "./main.js";
import { getCardEarnings, getCollectionSorted, getCardKey } from "./systems/collection.js";
import { DINOSAURS, RARITIES } from "./data/dinosaurs.js";

// Which dino page is open in the Collection Book (null = index)
let openDinoId = null;

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

      <div class="prestige-area" id="prestige-panel"></div>
      <div class="reset-area">
        <button id="btn-reset" class="danger">Reset Progress</button>
        <p class="hint">Full wipe including achievements (dev)</p>
      </div>
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
        openDinoId = null;
        navigate("home");
      }
    });
  }

  // Prestige panel
  const panel = document.getElementById("prestige-panel");
  if (panel) {
    const info = getPrestigeInfo();
    const p2 = getPlayer();
    if (!p2.started) {
      panel.innerHTML = `<p class="hint">Prestige unlocks after you start collecting.</p>`;
    } else {
      panel.innerHTML = `
        <h3 class="section-title">Prestige</h3>
        <p class="hint">Resets collection, money, path & conveyor. Keeps achievements, tokens & Prestige Points.</p>
        <div class="prestige-stats">
          <div>Prestiges: <strong>${info.prestigeCount}</strong></div>
          <div>Current PP: <strong>${info.currentPP}</strong></div>
          <div>From money: <strong>+${info.fromMoney} PP</strong></div>
          <div>Rate: <strong>$${info.rate.toLocaleString()}</strong> / PP</div>
        </div>
        <button id="btn-prestige" class="primary">Prestige Now</button>
      `;
      const pb = document.getElementById("btn-prestige");
      if (pb) {
        pb.addEventListener("click", () => {
          if (!confirm("Prestige? This resets the main collection. Achievements, tokens, and Prestige Points are kept.")) return;
          const r = tryPrestige();
          if (r.error) { alert(r.error); return; }
          alert(`Prestiged! +${r.fromMoney} PP from money. Total PP: ${r.prestigePoints}. Prestige #${r.prestigeCount}`);
          openDinoId = null;
          navigate("home");
        });
      }
    }
  }
}

// ----- COLLECTIONS -----
function renderCollections() {
  const p = getPlayer();

  // Detail page for one dinosaur
  if (openDinoId) {
    const dino = DINOSAURS.find(d => d.id === openDinoId);
    if (!dino) {
      openDinoId = null;
      renderCollections();
      return;
    }

    const slots = RARITIES.map(rarity => {
      const key = getCardKey(dino.id, rarity);
      const card = p.cards[key];
      if (!card) {
        return `
          <div class="rarity-slot empty-slot">
            <span class="slot-rarity">${rarity}</span>
            <span class="slot-status">?</span>
            <span class="slot-rank">—</span>
            <span class="slot-earn">—</span>
          </div>
        `;
      }
      const earn = getCardEarnings(card);
      return `
        <div class="rarity-slot rarity-${rarity}">
          <span class="slot-rarity">${rarity}</span>
          <span class="slot-status">Owned</span>
          <span class="slot-rank">Rank ${card.rank}/5</span>
          <span class="slot-earn">${formatMoney(earn)}/s</span>
        </div>
      `;
    }).join("");

    const ownedCount = RARITIES.filter(r => p.cards[getCardKey(dino.id, r)]).length;

    pageContent.innerHTML = `
      <div class="page">
        <button id="btn-book-back" class="text-btn">← Back to Book</button>
        <h2 class="page-title">${dino.name}</h2>
        <p class="page-sub">${dino.diet} · ${dino.environment.replace(/_/g, " ")} · ${ownedCount}/7 rarities</p>
        <div class="rarity-slots">
          ${slots}
        </div>
      </div>
    `;

    document.getElementById("btn-book-back").addEventListener("click", () => {
      openDinoId = null;
      renderCollections();
    });
    return;
  }

  // Index — all dinos, lowest base earnings first
  const sorted = [...DINOSAURS].sort((a, b) => a.baseEarnings - b.baseEarnings);

  const rows = sorted.map(dino => {
    const discovered = !!p.discovered[dino.id];
    const ownedRarities = RARITIES.filter(r => p.cards[getCardKey(dino.id, r)]).length;
    let totalEarn = 0;
    for (const r of RARITIES) {
      const c = p.cards[getCardKey(dino.id, r)];
      if (c) totalEarn += getCardEarnings(c);
    }

    return `
      <button class="book-row ${discovered ? "discovered" : "unknown"}" data-dino="${dino.id}">
        <span class="book-name">${discovered ? dino.name : "???"}</span>
        <span class="book-progress">${discovered ? ownedRarities + "/7" : "—"}</span>
        <span class="book-earn">${discovered ? formatMoney(totalEarn) + "/s" : "—"}</span>
      </button>
    `;
  }).join("");

  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Dinosaur Book</h2>
      <p class="page-sub">${p.totalDiscovered}/12 species · tap a page</p>
      <div class="book-index">
        ${rows}
      </div>
    </div>
  `;

  pageContent.querySelectorAll("[data-dino]").forEach(btn => {
    btn.addEventListener("click", () => {
      openDinoId = btn.dataset.dino;
      renderCollections();
    });
  });
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
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}

function renderExpeditions() {
  tickAllExpeditions();
  const p = getPlayer();
  const info = getExpeditionsInfo();

  if (!info.unlockedSystem) {
    pageContent.innerHTML = `
      <div class="page">
        <h2 class="page-title">Expeditions</h2>
        <p class="page-sub">Timer-based hunts</p>
        <div class="placeholder-box">
          <p>Expedition Camp is locked.</p>
          <p>Claim the <strong>Expeditions Unlock</strong> node on the Path to open this area.</p>
        </div>
      </div>
    `;
    return;
  }

  const cards = info.defs.map(def => {
    const status = info.statuses[def.id];
    const remaining = info.remaining[def.id];
    let action = "";

    if (status === "locked") {
      const cost = def.unlockCost === 0 ? "Free" : ("$" + def.unlockCost.toLocaleString());
      action = `<button class="primary btn-exp-unlock" data-id="${def.id}">Unlock · ${cost}</button>`;
    } else if (status === "idle") {
      action = `<button class="primary btn-exp-start" data-id="${def.id}">Start · ${formatTime(def.durationSec)}</button>`;
    } else if (status === "running") {
      action = `<button class="primary" disabled>Running · ${formatTime(remaining)}</button>`;
    } else if (status === "ready") {
      action = `<button class="primary btn-exp-claim" data-id="${def.id}">Claim Pack</button>`;
    }

    return `
      <div class="exp-card status-${status}">
        <div class="exp-name">${def.name}</div>
        <div class="exp-desc">${def.desc}</div>
        <div class="exp-meta">${formatTime(def.durationSec)} · free to run</div>
        ${action}
      </div>
    `;
  }).join("");

  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Expedition Camp</h2>
      <p class="page-sub">Free to start · no cooldowns · claim when ready</p>
      <div class="exp-list">${cards}</div>
    </div>
  `;

  pageContent.querySelectorAll(".btn-exp-unlock").forEach(btn => {
    btn.addEventListener("click", () => {
      const r = tryUnlockExpedition(btn.dataset.id);
      if (r.error) { alert(r.error); return; }
      updateHeader();
      renderExpeditions();
    });
  });
  pageContent.querySelectorAll(".btn-exp-start").forEach(btn => {
    btn.addEventListener("click", () => {
      const r = tryStartExpedition(btn.dataset.id);
      if (r.error) { alert(r.error); return; }
      renderExpeditions();
    });
  });
  pageContent.querySelectorAll(".btn-exp-claim").forEach(btn => {
    btn.addEventListener("click", () => {
      const r = claimExpedition(btn.dataset.id);
      if (r.error) { alert(r.error); return; }
      updateHeader();
      renderExpeditions();
    });
  });
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
  const info = getAchievementsInfo();
  const rows = info.list.map(a => {
    if (a.unlocked) {
      return `
        <div class="ach-card unlocked">
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
          <div class="ach-points">+${a.points} Prestige</div>
        </div>
      `;
    }
    return `
      <div class="ach-card locked">
        <div class="ach-name">???</div>
        <div class="ach-desc">${a.desc}</div>
        <div class="ach-points">+${a.points} Prestige</div>
      </div>
    `;
  }).join("");

  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Achievements</h2>
      <p class="page-sub">${info.unlockedCount}/${info.total} unlocked · ${info.prestigePoints} Prestige Points</p>
      <div class="ach-list">${rows}</div>
      <p class="hint">Achievements stay through Prestige (when added). Full Reset still clears them.</p>
    </div>
  `;
}

// ----- TOKENS -----
function renderTokens() {
  const info = getTokensInfo();
  const current = info.current;

  const list = info.defs.map(def => {
    const unlocked = !!info.unlocked[def.id];
    const isEquipped = info.equipped === def.id;
    const colors = info.colors[def.id] || {};
    const colorKeys = Object.keys(colors).filter(c => colors[c]);

    if (!unlocked) {
      return `
        <div class="token-card locked">
          <div class="token-icon">?</div>
          <div class="token-name">${def.type === "set" ? "???" : def.name}</div>
          <div class="token-desc">${def.desc}</div>
          <div class="token-status">Locked</div>
        </div>
      `;
    }

    const colorBtns = colorKeys.map(c => {
      const active = isEquipped && info.equippedColor === c;
      return `<button class="color-chip rarity-${c} ${active ? "active" : ""}" data-token="${def.id}" data-color="${c}">${c}</button>`;
    }).join("");

    return `
      <div class="token-card ${isEquipped ? "equipped" : ""}">
        <div class="token-icon">${def.icon}</div>
        <div class="token-name">${def.name}</div>
        <div class="token-desc">${def.desc}</div>
        <div class="token-colors">${colorBtns || "<span class='token-status'>Basic</span>"}</div>
        ${isEquipped ? '<div class="token-status equipped-label">Equipped</div>' : ""}
      </div>
    `;
  }).join("");

  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Tokens</h2>
      <p class="page-sub">Path pieces · switch anytime</p>
      <div class="equipped-banner">
        <span class="token-icon">${current.icon}</span>
        <span>Using <strong>${current.name}</strong> (${current.color})</span>
      </div>
      <div class="token-list">${list}</div>
      <p class="hint">Complete all 7 rarities of a dinosaur to unlock its set token. Max Rank 5 on a rarity unlocks that color.</p>
    </div>
  `;

  pageContent.querySelectorAll(".color-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const r = tryEquipToken(btn.dataset.token, btn.dataset.color);
      if (r.error) { alert(r.error); return; }
      renderTokens();
    });
  });
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
  const before = getConveyor().offers.length;
  tickConveyor();
  const after = getConveyor().offers.length;
  if (p.currentPage === "conveyor" && after !== before) {
    renderConveyor();
  }
  const expChanged = tickAllExpeditions();
  if (p.currentPage === "expeditions") {
    // Refresh timers / claim buttons every second while on page
    renderExpeditions();
  }
}, 1000);

// -----------------------------
// Init
// -----------------------------
const initialPage = getPlayer().currentPage || "home";
navigate(initialPage);
