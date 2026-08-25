import { openPack } from "./systems/packs.js";
import {
  createPlayerState,
  addCardsToCollection,
  getCardEarnings,
  getCollectionSorted,
  getDiscoveryPercent
} from "./systems/collection.js";
import { saveGame, loadGame, clearSave } from "./systems/save.js";

// -----------------------------
// Player State
// -----------------------------
let player = loadGame() || createPlayerState();

// -----------------------------
// Core Actions
// -----------------------------

/**
 * Start Collecting — gives 2 starter packs
 */
export function startCollecting() {
  if (player.started) return { error: "Already started" };

  const pack1 = openPack(true);
  const pack2 = openPack(true);

  const results1 = addCardsToCollection(player, pack1);
  const results2 = addCardsToCollection(player, pack2);

  player.started = true;
  player.packsOpened += 2;

  saveGame(player);

  return {
    packs: [pack1, pack2],
    results: [...results1, ...results2],
    player
  };
}

/**
 * Buy and open a normal pack
 */
export function buyPack(cost = 100) {
  if (player.money < cost) {
    return { error: "Not enough money", needed: cost, have: player.money };
  }

  player.money -= cost;
  const cards = openPack(false);
  const results = addCardsToCollection(player, cards);
  player.packsOpened++;

  saveGame(player);

  return { cards, results, player };
}

/**
 * Manual income tick (call every second from UI)
 */
export function tickIncome() {
  player.money += player.incomePerSecond;
  // Keep money as whole number
  player.money = Math.floor(player.money);
  return player;
}

/**
 * Get current player snapshot for UI
 */
export function getPlayer() {
  return player;
}

/**
 * Reset everything (for testing)
 */
export function resetGame() {
  clearSave();
  player = createPlayerState();
  return player;
}

// -----------------------------
// Debug helpers (optional)
// -----------------------------
export function debugGiveMoney(amount = 1000) {
  player.money += amount;
  saveGame(player);
  return player;
}

export function debugState() {
  console.log("=== Collection Master v1.1 ===");
  console.log("Money:", player.money);
  console.log("Income/s:", player.incomePerSecond);
  console.log("Discovered:", player.totalDiscovered, "/", 12, `(${getDiscoveryPercent(player)}%)`);
  console.log("Cards owned:", Object.keys(player.cards).length);
  console.log("Packs opened:", player.packsOpened);
  console.log("Collection:", getCollectionSorted(player));
  return player;
}

// Expose for browser console testing
if (typeof window !== "undefined") {
  window.CM = {
    startCollecting,
    buyPack,
    tickIncome,
    getPlayer,
    resetGame,
    debugGiveMoney,
    debugState
  };
}
