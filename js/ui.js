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
  tryPrestige,
  getShop,
  tryBuyShopItem,
  getTableInfo,
  openTablePack,
  fileSortCard,
  autoSortTable
} from "./main.js";
import { getCardEarnings, getCollectionSorted, getCardKey } from "./systems/collection.js";
import { DINOSAURS, RARITIES } from "./data/dinosaurs.js";
import { SHOP_CATEGORIES } from "./systems/shop.js";

// Which dino page is open in the Collection Book (null = index)
let openDinoId = null;

// -----------------------------
// DOM refs
// -----------------------------
const moneyEl = document.getElementById("money");
const incomeEl = document.getElementById("income");
const ppEl = document.getElementById("pp-stat");
const pageContent = document.getElementById("page-content");
const tabButtons = document.querySelectorAll("[data-page]");

// -----------------------------
// Formatting
// -----------------------------
function formatMoney(n) {
  return "$" + Math.floor(n).toLocaleString();
}

function formatRate(n) {
  const v = Math.floor(n || 0);
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, "") + "m /s";
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, "") + "k /s";
  return v + " /s";
}

/** Frame art is 784x1168. Slots are locked pixel centers from the approved sample. */
const CARD_FRAME = { w: 784, h: 1168 };
const CARD_FRAME_RARITIES = ["basic", "gold", "emerald", "sapphire", "ruby", "diamond", "rainbow"];
const CARD_SLOTS = {
  rank: { x: 128.9, y: 110.8 },
  name: { x: 348.5, y: 93.6 },
  earn: { x: 124.2, y: 1033.6 },
};

function frameSrc(rarity) {
  const id = CARD_FRAME_RARITIES.includes(rarity) ? rarity : "basic";
  return `assets/frames/frame-${id}.png`;
}

function formatCardRate(n) {
  const v = Math.floor(n || 0);
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, "") + "m/s";
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, "") + "k/s";
  return v + "/s";
}

function slotStyle(slot) {
  const s = CARD_SLOTS[slot];
  const left = ((s.x / CARD_FRAME.w) * 100).toFixed(3);
  const top = ((s.y / CARD_FRAME.h) * 100).toFixed(3);
  return `left:${left}%;top:${top}%`;
}

function cardTextOverlay({ name = "", rank = "", earn = null } = {}) {
  const earnText = earn === null || earn === undefined ? "" : formatCardRate(earn);
  return `
    <span class="dino-rank" style="${slotStyle("rank")}">${rank}</span>
    <span class="dino-name" style="${slotStyle("name")}">${name}</span>
    ${earnText ? `<span class="dino-earn" style="${slotStyle("earn")}">${earnText}</span>` : ""}
  `;
}

function tokenFigure(defOrId, color = "basic", extraClass = "") {
  const id = typeof defOrId === "string" ? defOrId : (defOrId?.id || "explorer");
  const name = typeof defOrId === "string" ? "" : (defOrId?.name || "Token");
  const src = (typeof defOrId === "object" && defOrId?.image) || tokenImageFor(id);
  return `
    <div class="token-figure rarity-${color} ${extraClass}">
      <img src="${src}" alt="${name}" />
    </div>
  `;
}

function dietLabel(diet) {
  return diet === "herbivore" ? "Herbivore" : "Carnivore";
}

function classIcon(diet) {
  if (diet === "herbivore") {
    return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2c2 3 3 6 3 8a3 3 0 0 1-6 0c0-2 1-5 3-8zm-1 11.2V22h2v-8.8A6.2 6.2 0 0 1 8 20h2c0-2.2.6-4.2 1-6.8z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 14c4-1 7-4 9-8l7 3-3 3c-2 2-5 4-9 5l-4-3zm2.2 1.6L8 19l3.2-1.2C8.8 17.2 6.8 16.4 6.2 15.6z"/></svg>`;
}

function bestOwnedCard(state, dinoId) {
  for (let i = RARITIES.length - 1; i >= 0; i--) {
    const card = state.cards[getCardKey(dinoId, RARITIES[i])];
    if (card) return card;
  }
  return null;
}

function renderDinoCard(dino, card = null, opts = {}) {
  const unknown = !!opts.unknown;
  const compact = !!opts.compact;
  const rarity = card?.rarity || opts.rarity || "basic";
  const rank = card?.rank || 0;
  const earn = card ? getCardEarnings(card, getPlayer()) : (dino.baseEarnings || 0);
  const maxed = rank >= 5;
  const name = (dino.short || dino.name || "Unknown").toUpperCase();

  if (unknown) {
    return `
      <article class="dino-card unknown ${compact ? "compact" : ""}">
        <div class="dino-window">
          <img class="dino-photo" src="assets/card-back.png" alt="" />
        </div>
        <img class="dino-frame" src="${frameSrc("basic")}" alt="" />
        ${cardTextOverlay({ name: "???", rank: "?" })}
      </article>
    `;
  }

  const fxRank = rank >= 2 && rank <= 5 ? rank : 0;
  const fx = fxRank
    ? `<img class="dino-fx" src="assets/fx/${dino.id}/r${fxRank}.png" alt="" onerror="this.remove()" />`
    : "";

  return `
    <article class="dino-card diet-${dino.diet} rarity-${rarity} rank-${rank || 0} ${compact ? "compact" : ""} ${maxed ? "maxed" : ""}">
      <div class="dino-window">
        <img class="dino-photo" src="assets/dinos/${dino.id}.jpg" alt="${dino.name}" onerror="this.style.visibility='hidden'" />
        ${fx}
      </div>
      <img class="dino-frame" src="${frameSrc(rarity)}" alt="" />
      ${cardTextOverlay({ name, rank: card ? rank : "—", earn })}
      ${maxed ? `<span class="dino-maxsold">MAX Sold</span>` : ""}
    </article>
  `;
}

function rarityBanner(rarity) {
  if (rarity === "rainbow" || rarity === "diamond") return "FOIL CARD";
  if (rarity === "ruby" || rarity === "sapphire" || rarity === "emerald") return "RARE CARD";
  if (rarity === "gold") return "UNCOMMON";
  return "COMMON";
}

function playPackTheater(cardList, onDone, soldList = []) {
  const existing = document.getElementById("pack-theater");
  if (existing) existing.remove();

  const player = getPlayer();
  let index = 0;
  let phase = "pack"; // pack -> flying -> face -> wait

  const overlay = document.createElement("div");
  overlay.id = "pack-theater";
  overlay.className = "pack-theater";
  overlay.innerHTML = `
    <div class="theater-room">
      <div class="theater-shelf" aria-hidden="true"></div>
      <div class="theater-banner" id="theater-banner"></div>
      <div class="theater-stage">
        <div class="theater-card-slot" id="theater-card-slot"></div>
        <img class="theater-pack" id="theater-pack" src="assets/dino-pack.png" alt="Dino pack" />
      </div>
      <div class="theater-table"></div>
      <div class="theater-hud">
        <span id="theater-count">0 / ${cardList.length}</span>
        <button id="theater-next" class="primary">Rip pack</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const slot = overlay.querySelector("#theater-card-slot");
  const packEl = overlay.querySelector("#theater-pack");
  const banner = overlay.querySelector("#theater-banner");
  const nextBtn = overlay.querySelector("#theater-next");
  const countEl = overlay.querySelector("#theater-count");

  function showFace(card) {
    const dino = DINOSAURS.find(d => d.id === card.id) || card;
    const key = getCardKey(card.id, card.rarity);
    const owned = !!player.cards[key];
    const ownedRank = player.cards[key]?.rank || 0;
    const soldHit = (soldList || []).find(s =>
      s?.card && (s.card.uid === card.uid || (s.card.id === card.id && s.card.rarity === card.rarity))
    );
    const isNew = !owned && !soldHit;
    const isMax = ownedRank >= 4;
    const glow = ["emerald", "sapphire", "ruby", "diamond", "rainbow"].includes(card.rarity)
      ? `glow-${card.rarity}`
      : "";

    let flip = slot.querySelector(".theater-flip");
    if (!flip) {
      slot.innerHTML = `
        <div class="theater-flip">
          <div class="theater-face back"><img src="assets/card-back.png" alt="" /></div>
          <div class="theater-face front"></div>
        </div>
      `;
      flip = slot.querySelector(".theater-flip");
    }
    const front = flip.querySelector(".theater-face.front");
    front.innerHTML = `
      ${isNew ? `<span class="new-burst">NEW</span>` : ""}
      ${soldHit ? `<span class="new-burst">SOLD $${soldHit.value || 0}</span>` : ""}
      ${renderDinoCard(dino, card)}
    `;
    slot.className = "theater-card-slot " + glow;
    flip.classList.remove("flying");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => flip.classList.add("flipped"));
    });
    banner.textContent = soldHit
      ? `SOLD · $${soldHit.value || 0}`
      : isNew ? `${rarityBanner(card.rarity)} · NEW` : rarityBanner(card.rarity);
    banner.className = "theater-banner show " + (soldHit ? "is-max" : isNew ? "is-new" : isMax ? "is-max" : "is-dup");
    countEl.textContent = `${index + 1} / ${cardList.length}`;
    nextBtn.textContent = index < cardList.length - 1 ? "Next card" : "To the sort pile";
    nextBtn.disabled = false;
    phase = "wait";
  }

  function launchCard() {
    if (index >= cardList.length) {
      overlay.remove();
      if (onDone) onDone();
      return;
    }
    const card = cardList[index];
    phase = "flying";
    nextBtn.disabled = true;
    banner.className = "theater-banner";
    banner.textContent = "";
    packEl.classList.add("burst");
    slot.className = "theater-card-slot";
    slot.innerHTML = `
      <div class="theater-flip flying">
        <div class="theater-face back">
          <img src="assets/card-back.png" alt="" />
        </div>
        <div class="theater-face front"></div>
      </div>
    `;
    window.setTimeout(() => {
      packEl.classList.remove("burst");
      const flip = slot.querySelector(".theater-flip");
      if (flip) flip.classList.remove("flying");
      window.setTimeout(() => showFace(card), 280);
    }, 520);
  }

  function ripPack() {
    phase = "ripping";
    packEl.classList.add("rip");
    nextBtn.textContent = "…";
    nextBtn.disabled = true;
    window.setTimeout(() => {
      packEl.classList.add("tucked");
      launchCard();
    }, 380);
  }

  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (phase === "pack") ripPack();
    else if (phase === "wait") {
      index += 1;
      if (index >= cardList.length) {
        overlay.remove();
        if (onDone) onDone();
      } else {
        launchCard();
      }
    }
  });

  overlay.addEventListener("click", () => {
    if (phase === "pack") ripPack();
    else if (phase === "wait") nextBtn.click();
  });
}

// -----------------------------
// Header stats
// -----------------------------
function updateHeader() {
  const p = getPlayer();
  moneyEl.textContent = formatMoney(p.money);
  incomeEl.textContent = formatMoney(p.incomePerSecond) + "/s";
  if (ppEl) ppEl.textContent = (p.achievements?.prestigePoints || 0) + " PP";
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
  pageContent.classList.toggle("is-home", page === "home");
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
    case "shop":
      renderShop();
      break;
    case "tokens":
      renderTokens();
      break;
    default:
      renderHome();
  }
}

function renderDenTable(p) {
  if (!p.started) return "";
  const info = getTableInfo();
  const preview = info.preview;
  const packsHtml = info.packs.length
    ? info.packs.map(pack => `
        <button class="sealed-pack" data-open-pack="1">
          <img class="sealed-pack-art" src="assets/dino-pack.png" alt="" />
          <div class="sealed-pack-name">${pack.name}</div>
        </button>
      `).join("")
    : `<p class="hint">No sealed packs. Buy from the conveyor or claim an expedition.</p>`;

  const sortHtml = info.sortPile.length
    ? info.sortPile.map(card => {
        const dino = DINOSAURS.find(d => d.id === card.id) || card;
        const reason = card.reason === "first"
          ? "First copy"
          : card.reason === "fifth"
            ? "5th · maxes rank"
            : card.reason === "maxed"
              ? "Already maxed"
              : "Duplicate";
        return `
          <div class="sort-item">
            ${renderDinoCard(dino, card, { compact: true })}
            <div class="sort-meta">
              <span class="sort-reason reason-${card.reason}">${reason}</span>
              <button class="primary btn-file-card" data-uid="${card.uid}">File in binder</button>
            </div>
          </div>
        `;
      }).join("")
    : `<p class="hint">Open a pack to fill the sort pile.</p>`;

  return `
    <section class="den-table">
      <div class="den-table-head">
        <div>
          <div class="room-section-label">On the table</div>
          <h3 class="den-table-title">Pack pile &amp; sort pile</h3>
        </div>
        <div class="den-table-counts">
          <span>${info.packCount}/${info.packCap} packs</span>
          <span>${info.sortCount}/${info.sortCap} to sort</span>
        </div>
      </div>

      <div class="pack-pile">
        <div class="pile-row">${packsHtml}</div>
        <button id="btn-open-table-pack" class="primary large" ${info.packCount ? "" : "disabled"}>
          Open pack on the table
        </button>
      </div>

      <div class="sort-pile">
        <div class="sort-pile-head">
          <div class="room-section-label">Sort pile</div>
          <button id="btn-auto-sort" class="primary" ${preview.filed ? "" : "disabled"}>
            Auto sort (${preview.filed})
          </button>
        </div>
        <p class="hint">Auto sort files duplicates. First copies and the 5th stay here. Maxed extras sell for half earnings.</p>
        <div class="sort-grid">${sortHtml}</div>
      </div>
    </section>
  `;
}

function bindDenTable() {
  function beginOpen() {
    const result = openTablePack();
    if (result.error) {
      alert(result.error);
      return;
    }
    playPackTheater(result.cards || [], () => {
      updateHeader();
      renderHome();
    }, result.sold || []);
  }

  const openBtn = document.getElementById("btn-open-table-pack");
  if (openBtn) openBtn.addEventListener("click", beginOpen);
  pageContent.querySelectorAll("[data-open-pack]").forEach(btn => {
    btn.addEventListener("click", beginOpen);
  });

  const autoBtn = document.getElementById("btn-auto-sort");
  if (autoBtn) {
    autoBtn.addEventListener("click", () => {
      autoSortTable();
      updateHeader();
      renderHome();
    });
  }

  pageContent.querySelectorAll(".btn-file-card").forEach(btn => {
    btn.addEventListener("click", () => {
      const result = fileSortCard(btn.dataset.uid);
      if (result.error) {
        alert(result.error);
        return;
      }
      updateHeader();
      renderHome();
    });
  });
}

// ----- HOME -----
function renderHome() {
  const p = getPlayer();
  const pathNode = (p.path?.currentNode ?? 0) + 1;
  const expOpen = !!(p.path?.unlockedFlags?.expeditions);
  const achCount = Object.keys(p.achievements?.unlocked || {}).length;
  const tokenCount = Object.keys(p.tokens?.unlocked || {}).length;
  const offerCount = p.conveyor?.offers?.length || 0;
  const discovered = p.totalDiscovered || 0;
  const speciesTotal = DINOSAURS.length;
  const discoverPct = Math.floor((discovered / speciesTotal) * 100);
  const equippedRaw = p.tokens?.equipped || "explorer";
  const equipped = equippedRaw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const incomeLive = p.started && p.incomePerSecond > 0;

  pageContent.innerHTML = `
    <div class="home-room">
      <section class="room-stage">
        <div class="room-glow"></div>
        <div class="room-hud">
          <div class="room-kicker">Collector's Room</div>
          <h1 class="room-title">The Den</h1>
          <p class="room-hero-sub">${p.started
            ? (incomeLive ? "Lamp's on. Cards are earning." : "Room is open — start a station.")
            : "Dusty table. Unopened packs. The collection starts here."}</p>
          <div class="room-chips">
            <span class="chip ${p.started ? "chip-live" : ""}">${p.started ? "Idle on" : "Idle off"}</span>
            <span class="chip">${discovered}/${speciesTotal} found</span>
            <span class="chip">Node ${pathNode}/20</span>
            ${p.started ? `<span class="chip">${(p.table?.packs || []).length}/${getTableInfo().packCap} packs</span>` : ""}
          </div>
        </div>

        <button class="table-hotspot" data-goto="path">
          <div class="table-hotspot-top">
            <span class="table-tag">Centerpiece</span>
            <span class="table-node">Node ${pathNode}</span>
          </div>
          <div class="table-hotspot-body">
            <div class="table-mark" aria-hidden="true">
              <svg viewBox="0 0 64 40" width="56" height="34">
                <path d="M6 28c8-12 16-18 26-18s18 6 26 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                <circle cx="32" cy="12" r="4.2" fill="currentColor"/>
                <circle cx="14" cy="26" r="2.4" fill="currentColor" opacity=".7"/>
                <circle cx="50" cy="26" r="2.4" fill="currentColor" opacity=".7"/>
              </svg>
            </div>
            <div class="feature-text">
              <div class="room-label">Path Table</div>
              <div class="room-desc">Unrolled map · ${equipped} token ready to slide</div>
            </div>
            <div class="feature-arrow">›</div>
          </div>
          <div class="table-progress" aria-hidden="true">
            <i style="width:${Math.min(100, (pathNode / 20) * 100)}%"></i>
          </div>
        </button>
      </section>

      ${!p.started ? `
        <div class="start-area start-pack">
          <button id="btn-start" class="primary large start-pack-btn">
            <span class="pack-seal">★</span>
            Drop starter packs on the table
          </button>
          <p class="hint">2 sealed packs + Explorer token. Open them on the table.</p>
        </div>
      ` : `
        <div class="income-ribbon">
          <span class="pulse-dot"></span>
          Collection earning ${formatMoney(p.incomePerSecond)}/sec
        </div>
      `}

      ${renderDenTable(p)}

      <div class="room-section-label">Stations along the wall</div>
      <div class="room-grid stations">
        <button class="room-card tone-book" data-goto="collections">
          <div class="card-art book-art" aria-hidden="true"></div>
          <div class="room-label">Dinosaur Book</div>
          <div class="room-desc">${discovered}/${speciesTotal} cards</div>
          <div class="mini-bar"><i style="width:${discoverPct}%"></i></div>
        </button>

        <button class="room-card tone-pack" data-goto="conveyor">
          <div class="card-art pack-art" aria-hidden="true"></div>
          <div class="room-label">Conveyor</div>
          <div class="room-desc">${offerCount} pack${offerCount === 1 ? "" : "s"} waiting</div>
        </button>

        <button class="room-card tone-camp ${expOpen ? "" : "dimmed"}" data-goto="expeditions">
          <div class="card-art camp-art" aria-hidden="true"></div>
          <div class="room-label">Expeditions</div>
          <div class="room-desc">${expOpen ? "Camp open" : "Locked on the Path"}</div>
        </button>

        <button class="room-card tone-event dimmed" data-goto="events">
          <div class="card-art event-art" aria-hidden="true"></div>
          <div class="room-label">Event Books</div>
          <div class="room-desc">Seasonal sets later</div>
        </button>
      </div>

      <div class="room-section-label">Display case</div>
      <div class="room-grid display-case">
        <button class="room-card tone-trophy" data-goto="achievements">
          <div class="room-icon">🏆</div>
          <div class="room-label">Achievements</div>
          <div class="room-desc">${achCount} unlocked</div>
        </button>

        <button class="room-card tone-shop" data-goto="shop">
          <div class="room-icon">✨</div>
          <div class="room-label">Prestige Shop</div>
          <div class="room-desc">${p.achievements?.prestigePoints || 0} PP to spend</div>
        </button>

        <button class="room-card tone-token" data-goto="tokens">
          <div class="room-icon">♟️</div>
          <div class="room-label">Tokens</div>
          <div class="room-desc">${tokenCount} owned · ${equipped}</div>
        </button>
      </div>

      <div class="prestige-area" id="prestige-panel"></div>

      <details class="desk-drawer">
        <summary>Desk drawer</summary>
        <div class="reset-area">
          <button id="btn-reset" class="danger">Reset Progress</button>
          <p class="hint">Full wipe (dev) — includes achievements</p>
        </div>
      </details>
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
      navigate("home");
    });
  }

  bindDenTable();

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

  const panel = document.getElementById("prestige-panel");
  if (panel) {
    const info = getPrestigeInfo();
    const p2 = getPlayer();
    if (!p2.started) {
      panel.innerHTML = "";
      panel.hidden = true;
    } else {
      panel.innerHTML = `
        <h3 class="section-title">Prestige</h3>
        <p class="hint">Resets collection, path & conveyor. Keeps achievements, tokens, shop upgrades & PP.</p>
        <div class="prestige-stats">
          <div>Prestiges: <strong>${info.prestigeCount}</strong></div>
          <div>Current PP: <strong>${info.currentPP}</strong></div>
          <div>From money: <strong>+${info.fromMoney} PP</strong></div>
          <div>Rate: <strong>$${info.rate.toLocaleString()}</strong> / PP</div>
        </div>
        <div class="prestige-actions">
          <button id="btn-open-shop" class="primary">Open Prestige Shop</button>
          <button id="btn-prestige" class="primary">Prestige Now</button>
        </div>
      `;
      const shopBtn = document.getElementById("btn-open-shop");
      if (shopBtn) shopBtn.addEventListener("click", () => navigate("shop"));
      const pb = document.getElementById("btn-prestige");
      if (pb) {
        pb.addEventListener("click", () => {
          if (!confirm("Prestige? Main collection resets. Achievements, tokens, shop upgrades, and Prestige Points are kept.")) return;
          const r = tryPrestige();
          if (r.error) { alert(r.error); return; }
          const kept = r.keptCard ? ` Kept ${r.keptCard.name} (${r.keptCard.rarity} r${r.keptCard.rank}).` : "";
          alert(`Prestiged! +${r.fromMoney} PP from money. Total PP: ${r.prestigePoints}. Prestige #${r.prestigeCount}.${kept}`);
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

  if (openDinoId) {
    const dino = DINOSAURS.find(d => d.id === openDinoId);
    if (!dino) {
      openDinoId = null;
      renderCollections();
      return;
    }

    const ownedCount = RARITIES.filter(r => p.cards[getCardKey(dino.id, r)]).length;
    const slots = RARITIES.map(rarity => {
      const card = p.cards[getCardKey(dino.id, rarity)];
      if (!card) {
        return `<div class="binder-slot empty">${renderDinoCard(dino, null, { unknown: true, compact: true })}<span class="slot-cap">${rarity}</span></div>`;
      }
      return `<div class="binder-slot">${renderDinoCard(dino, card, { compact: true })}</div>`;
    }).join("");

    pageContent.innerHTML = `
      <div class="page">
        <button id="btn-book-back" class="text-btn">← Binder</button>
        <h2 class="page-title">${dino.name}</h2>
        <p class="page-sub">${dietLabel(dino.diet)} · ${dino.environment.replace(/_/g, " ")} · ${ownedCount}/7 prints</p>
        <div class="hero-card">
          ${renderDinoCard(dino, bestOwnedCard(p, dino.id))}
        </div>
        <h3 class="section-title">Prints</h3>
        <div class="binder-grid prints">
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

  const tiles = DINOSAURS.map(dino => {
    const discovered = !!p.discovered[dino.id];
    const owned = bestOwnedCard(p, dino.id);
    const ownedRarities = RARITIES.filter(r => p.cards[getCardKey(dino.id, r)]).length;
    return `
      <button class="binder-tile ${discovered ? "discovered" : "unknown"}" data-dino="${dino.id}">
        ${renderDinoCard(dino, owned, { unknown: !discovered, compact: true })}
        <span class="tile-cap">${discovered ? ownedRarities + "/7 prints" : "Not found"}</span>
      </button>
    `;
  }).join("");

  pageContent.innerHTML = `
    <div class="page">
      <h2 class="page-title">Dinosaur Binder</h2>
      <p class="page-sub">${p.totalDiscovered}/12 dinosaurs · ${Object.keys(p.cards).length} prints owned</p>
      <div class="binder-grid">
        ${tiles}
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
      <p class="hint">Bought packs move to the den table (max 20). Open them there.</p>
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
      <p class="hint">Achievements and PP stay through Prestige. Spend PP in the Prestige Shop. Full Reset still clears them.</p>
      <button id="btn-ach-shop" class="primary">Open Prestige Shop</button>
    </div>
  `;

  const shopLink = document.getElementById("btn-ach-shop");
  if (shopLink) shopLink.addEventListener("click", () => navigate("shop"));
}

// ----- PRESTIGE SHOP -----
function renderShop() {
  const info = getShop();
  const sections = SHOP_CATEGORIES.map(cat => {
    const items = info.items.filter(i => i.category === cat.id);
    if (!items.length) return "";
    const cards = items.map(item => {
      const pips = Array.from({ length: item.maxLevel }, (_, i) =>
        `<i class="${i < item.level ? "on" : ""}"></i>`
      ).join("");
      const costLabel = item.maxed ? "MAX" : `${item.cost} PP`;
      const disabled = item.maxed || !item.canAfford ? "disabled" : "";
      return `
        <article class="shop-card ${item.maxed ? "maxed" : ""} ${item.canAfford && !item.maxed ? "affordable" : ""}">
          <div class="shop-card-top">
            <span class="shop-icon">${item.icon}</span>
            <div>
              <div class="shop-name">${item.name}</div>
              <div class="shop-level">Lv ${item.level}/${item.maxLevel}</div>
            </div>
          </div>
          <p class="shop-desc">${item.desc}</p>
          <div class="shop-pips">${pips}</div>
          <div class="shop-effect">${item.level ? item.effect : "Not purchased"}</div>
          ${item.maxed ? "" : `<div class="shop-next">Next: ${item.nextEffect}</div>`}
          ${item.nextRun ? `<div class="shop-tag">Applies on next start</div>` : ""}
          <button class="primary shop-buy" data-item="${item.id}" ${disabled}>${costLabel}</button>
        </article>
      `;
    }).join("");
    return `
      <section class="shop-section">
        <h3 class="section-title">${cat.label}</h3>
        <div class="shop-grid">${cards}</div>
      </section>
    `;
  }).join("");

  pageContent.innerHTML = `
    <div class="page shop-page">
      <h2 class="page-title">Prestige Shop</h2>
      <p class="page-sub">${info.prestigePoints} PP banked · ${info.prestigeCount} prestige${info.prestigeCount === 1 ? "" : "s"}</p>
      <div class="shop-bank">
        <span>Spendable</span>
        <strong>${info.prestigePoints} PP</strong>
      </div>
      ${sections}
      <p class="hint">Upgrades persist through Prestige. Desk-drawer Reset wipes the shop too.</p>
    </div>
  `;

  pageContent.querySelectorAll(".shop-buy").forEach(btn => {
    btn.addEventListener("click", () => {
      const result = tryBuyShopItem(btn.dataset.item);
      if (result.error) {
        alert(result.error);
        return;
      }
      updateHeader();
      renderShop();
    });
  });
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
