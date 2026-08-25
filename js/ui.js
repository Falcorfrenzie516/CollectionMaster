import {
  startCollecting,
  buyPack,
  tickIncome,
  getPlayer,
  resetGame
} from "./main.js";
import { getCardEarnings, getCollectionSorted } from "./systems/collection.js";

const moneyEl = document.getElementById("money");
const incomeEl = document.getElementById("income");
const discoveredEl = document.getElementById("discovered");
const packsEl = document.getElementById("packs");
const logEl = document.getElementById("log");
const cardListEl = document.getElementById("card-list");
const btnStart = document.getElementById("btn-start");
const btnBuy = document.getElementById("btn-buy");
const btnReset = document.getElementById("btn-reset");

function formatMoney(n) {
  return "$" + Math.floor(n).toLocaleString();
}

function log(message, type = "info") {
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  logEl.prepend(entry);
}

function updateUI() {
  const p = getPlayer();

  moneyEl.textContent = formatMoney(p.money);
  incomeEl.textContent = formatMoney(p.incomePerSecond) + " /s";
  discoveredEl.textContent = `${p.totalDiscovered} / 12`;
  packsEl.textContent = p.packsOpened;

  btnStart.disabled = p.started;
  btnBuy.disabled = !p.started || p.money < 100;

  // Collection list
  const cards = getCollectionSorted(p);
  if (cards.length === 0) {
    cardListEl.innerHTML = "<p class='empty'>No cards yet. Start Collecting!</p>";
  } else {
    cardListEl.innerHTML = cards.map(c => {
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
}

btnStart.addEventListener("click", () => {
  const result = startCollecting();
  if (result.error) {
    log(result.error, "error");
    return;
  }

  log("Starter packs opened! (+2 packs)", "success");
  result.results.forEach(r => {
    if (r.type === "new") log(`NEW: ${r.card.name} (${r.card.rarity})`, "new");
    if (r.type === "rankup") log(`RANK UP: ${r.card.name} → Rank ${r.card.rank}`, "rankup");
    if (r.type === "sold") log(`SOLD: ${r.card.name} for $${r.value}`, "sold");
  });
  updateUI();
});

btnBuy.addEventListener("click", () => {
  const result = buyPack(100);
  if (result.error) {
    log(result.error, "error");
    return;
  }

  log("Pack opened!", "success");
  result.results.forEach(r => {
    if (r.type === "new") log(`NEW: ${r.card.name} (${r.card.rarity})`, "new");
    if (r.type === "rankup") log(`RANK UP: ${r.card.name} → Rank ${r.card.rank}`, "rankup");
    if (r.type === "sold") log(`SOLD: ${r.card.name} for $${r.value}`, "sold");
  });
  updateUI();
});

btnReset.addEventListener("click", () => {
  if (confirm("Reset all progress?")) {
    resetGame();
    logEl.innerHTML = "";
    log("Game reset.", "info");
    updateUI();
  }
});

// Income tick every second
setInterval(() => {
  const p = getPlayer();
  if (p.started && p.incomePerSecond > 0) {
    tickIncome();
    updateUI();
  }
}, 1000);

// Initial render
updateUI();
log("Ready. Press Start Collecting to begin.", "info");
