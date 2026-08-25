import { openPack } from "./systems/packs.js";
import {
  createPlayerState,
  addCardsToCollection,
  getCollectionSorted,
  getDiscoveryPercent
} from "./systems/collection.js";
import { saveGame, loadGame, clearSave } from "./systems/save.js";

let player = loadGame() || createPlayerState();

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

export function tickIncome() {
  player.money += player.incomePerSecond;
  player.money = Math.floor(player.money);
  return player;
}

export function getPlayer() {
  return player;
}

export function setPage(page) {
  player.currentPage = page;
  saveGame(player);
}

export function resetGame() {
  clearSave();
  player = createPlayerState();
  return player;
}

export function debugGiveMoney(amount = 1000) {
  player.money += amount;
  saveGame(player);
  return player;
}

export function debugState() {
  console.log("=== Collection Master v1.2 ===");
  console.log("Money:", player.money);
  console.log("Income/s:", player.incomePerSecond);
  console.log("Discovered:", player.totalDiscovered, "/ 12");
  console.log("Page:", player.currentPage);
  return player;
}

if (typeof window !== "undefined") {
  window.CM = {
    startCollecting,
    buyPack,
    tickIncome,
    getPlayer,
    setPage,
    resetGame,
    debugGiveMoney,
    debugState,
    getCollectionSorted,
    getDiscoveryPercent
  };
}
