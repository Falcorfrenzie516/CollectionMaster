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
  getTableInfo,
  openTablePack,
  fileSortCard,
  autoSortTable
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

function dietLabel(diet) {
  return diet === "herbivore" ? "Leaf" : "Fang";
}

function dinoArtMark(dino) {
  return dino.diet === "herbivore" ? "◆" : "▲";
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
  const rank = card?.rank || 1;
  const earn = card ? getCardEarnings(card) : 0;
  const type = dietLabel(dino.diet);
  const env = (dino.environment || "").replace(/_/g, " ");

  if (unknown) {
    return `
      <article class="tcg-card tcg-back ${compact ? "compact" : ""}">
        <div class="tcg-back-seal">CM</div>
        <div class="tcg-back-name">Collection Master</div>
        <div class="tcg-back-sub">Dinosaur Series</div>
      </article>
    `;
  }

  return `
    <article class="tcg-card diet-${dino.diet} rarity-${rarity} ${compact ? "compact" : ""}">
      <header class="tcg-top">
        <span class="tcg-name">${dino.name}</span>
        <span class="tcg-hp"><em>HP</em> ${dino.hp || 50}</span>
      </header>
      <div class="tcg-type">${type}</div>
      <div class="tcg-art">
        <span class="tcg-mark">${dinoArtMark(dino)}</span>
        <span class="tcg-no">No. ${dino.no || "000"}</span>
      </div>
      <div class="tcg-attack">
        <span class="tcg-move">${dino.attack || "Fossil Strike"}</span>
        <span class="tcg-power">${dino.baseEarnings}</span>
      </div>
      <footer class="tcg-foot">
        <span class="tcg-rarity">${rarity}</span>
        <span class="tcg-rank">${card ? `Rank ${rank}/5` : env}</span>
        ${card ? `<span class="tcg-earn">${formatMoney(earn)}/s</span>` : ""}
      </footer>
    </article>
  `;
}

function showPackReveal(cardList, results = [], onDone) {
  const existing = document.getElementById("pack-reveal");
  if (existing) existing.remove();

  const resultByKey = {};
  for (const r of results) {
    if (r.card) resultByKey[getCardKey(r.card.id, r.card.rarity)] = r.type;
  }

  const overlay = document.createElement("div");
  overlay.id = "pack-reveal";
  overlay.className = "pack-reveal";
  overlay.innerHTML = `
    <div class="pack-reveal-panel">
      <div class="pack-reveal-kicker">Pack opened</div>
      <h2>Dinosaur cards</h2>
      <p class="hint">Tap a card to flip it.</p>
      <div class="pack-reveal-grid">
        ${cardList.map((card, i) => {
          const dino = DINOSAURS.find(d => d.id === card.id) || card;
          const tag = resultByKey[getCardKey(card.id, card.rarity)];
          const tagLabel = tag === "new" ? "New" : tag === "rankup" ? "Rank up" : tag === "sold" ? "Sold" : "";
          return `
            <button class="flip-wrap" data-flip="${i}">
              <div class="flip-inner">
                <div class="flip-face flip-back">${renderDinoCard(dino, card, { unknown: true, compact: true })}</div>
                <div class="flip-face flip-front">
                  ${renderDinoCard(dino, card, { compact: true })}
                  ${tagLabel ? `<span class="pull-tag pull-${tag}">${tagLabel}</span>` : ""}
                </div>
              </div>
            </button>
          `;
        }).join("")}
      </div>
      <button id="btn-reveal-done" class="primary large">Add to binder</button>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelectorAll("[data-flip]").forEach(btn => {
    btn.addEventListener("click", () => btn.classList.add("flipped"));
  });

  document.getElementById("btn-reveal-done").addEventListener("click", () => {
    overlay.remove();
    if (onDone) onDone();
  });
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
        <div class="sealed-pack">
          <div class="sealed-pack-face">${pack.isStarter ? "★" : "■"}</div>
          <div class="sealed-pack-name">${pack.name}</div>
        </div>
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
          Open 1 pack onto the sort pile
        </button>
      </div>

      <div class="sort-pile">
        <div class="sort-pile-head">
          <div class="room-section-label">Sort pile</div>
          <button id="btn-auto-sort" class="primary" ${preview.filed ? "" : "disabled"}>
            Auto sort (${preview.filed})
          </button>
        </div>
        <p class="hint">Auto sort files duplicates only. First copies and the 5th print (rank max) stay on the table.</p>
        <div class="sort-grid">${sortHtml}</div>
      </div>
    </section>
  `;
}

function bindDenTable() {
  const openBtn = document.getElementById("btn-open-table-pack");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      const result = openTablePack();
      if (result.error) {
        alert(result.error);
        return;
      }
      updateHeader();
      renderHome();
    });
  }

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
            ${p.started ? `<span class="chip">${(p.table?.packs || []).length}/20 packs</span>` : ""}
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
        <p class="hint">Resets collection, path & shops. Keeps achievements, tokens & PP.</p>
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
          if (!confirm("Prestige? Main collection resets. Achievements, tokens, and Prestige Points are kept.")) return;
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
      navigate("home");
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
      navigate("home");
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
