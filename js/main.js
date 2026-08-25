import { openPack } from "./systems/packs.js";
import {
  createPlayerState,
  addCardsToCollection,
  getCollectionSorted,
  getDiscoveryPercent,
  getCardKey
} from "./systems/collection.js";
import { DINOSAURS } from "./data/dinosaurs.js";
import { saveGame, loadGame, clearSave } from "./systems/save.js";
import {
  getNextClaimableNode,
  claimNextNode,
  trackLifetimeIncome,
  getUnlockedNodeCount,
  NODE_TARGETS,
  NODE_REWARDS
} from "./systems/path.js";
import {
  initConveyorState,
  refillConveyor,
  removeOffer
} from "./systems/conveyor.js";

let player = loadGame() || createPlayerState();

// Migrate old saves
if (!player.path) {
  player.path = {
    currentNode: 0,
    lifetimeIncome: 0,
    claimedNodes: [0],
    unlockedFlags: {}
  };
}
if (!player.conveyor) {
  player.conveyor = initConveyorState();
}
if (player.path.lifetimeIncome === 0 && (player.incomePerSecond > 0 || player.money > 0)) {
  player.path.lifetimeIncome = Math.max(player.money, player.incomePerSecond * 60);
}
saveGame(player);

/**
 * Give a card the player is missing at a given rarity preference.
 * Falls back to any missing rarity, then a random basic.
 */
function giveMissingCard(state, preferredRarity = "basic") {
  const ownedKeys = new Set(Object.keys(state.cards));
  const missing = [];

  for (const dino of DINOSAURS) {
    for (const rarity of ["basic", "gold", "emerald", "sapphire", "ruby", "diamond", "rainbow"]) {
      const key = getCardKey(dino.id, rarity);
      if (!ownedKeys.has(key)) {
        missing.push({ dino, rarity });
      }
    }
  }

  if (missing.length === 0) return null;

  // Prefer requested rarity if any exist
  let pool = missing.filter(m => m.rarity === preferredRarity);
  if (pool.length === 0) pool = missing.filter(m => m.rarity === "basic");
  if (pool.length === 0) pool = missing;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  const card = {
    id: pick.dino.id,
    name: pick.dino.name,
    rarity: pick.rarity,
    rank: 1,
    diet: pick.dino.diet,
    environment: pick.dino.environment
  };

  addCardsToCollection(state, [card]);
  return card;
}

export function startCollecting() {
  if (player.started) return { error: "Already started" };

  const pack1 = openPack({ isStarter: true });
  const pack2 = openPack({ isStarter: true });
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
  const cards = openPack({});
  const results = addCardsToCollection(player, cards);
  player.packsOpened++;
  saveGame(player);
  return { cards, results, player };
}

/**
 * Buy a specific conveyor offer by uid
 */
export function buyConveyorOffer(uid) {
  if (!player.conveyor) player.conveyor = initConveyorState();
  const offer = player.conveyor.offers.find(o => o.uid === uid);
  if (!offer) return { error: "Offer not found" };
  if (player.money < offer.price) {
    return { error: "Not enough money", needed: offer.price, have: player.money };
  }

  player.money -= offer.price;
  const cards = openPack({
    filter: offer.filter,
    oddsBoost: offer.oddsBoost
  });
  const results = addCardsToCollection(player, cards);
  player.packsOpened++;
  removeOffer(player.conveyor, uid);
  saveGame(player);
  return { cards, results, offer, player };
}

export function tickConveyor() {
  if (!player.conveyor) player.conveyor = initConveyorState();
  const changed = refillConveyor(player.conveyor, player.packsOpened);
  if (changed) saveGame(player);
  return player.conveyor;
}

export function getConveyor() {
  if (!player.conveyor) player.conveyor = initConveyorState();
  return player.conveyor;
}

export function tickIncome() {
  const gained = player.incomePerSecond;
  player.money += gained;
  player.money = Math.floor(player.money);
  if (gained > 0 && player.path) {
    trackLifetimeIncome(player.path, gained);
  }
  return player;
}

export function claimPathNode() {
  const result = claimNextNode(player.path, player, { giveMissingCard });
  if (!result.error) {
    saveGame(player);
  }
  return result;
}

export function getPathInfo() {
  const path = player.path;
  return {
    currentNode: path.currentNode,
    lifetimeIncome: path.lifetimeIncome,
    unlockedCount: getUnlockedNodeCount(path),
    nextClaimable: getNextClaimableNode(path),
    claimedNodes: path.claimedNodes,
    unlockedFlags: path.unlockedFlags,
    targets: NODE_TARGETS,
    rewards: NODE_REWARDS
  };
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
  if (player.path) trackLifetimeIncome(player.path, amount);
  saveGame(player);
  return player;
}

export function debugState() {
  console.log("=== Collection Master v1.4 ===");
  console.log("Money:", player.money);
  console.log("Income/s:", player.incomePerSecond);
  console.log("Discovered:", player.totalDiscovered, "/ 12");
  console.log("Path node:", player.path?.currentNode + 1);
  console.log("Conveyor offers:", player.conveyor?.offers?.length);
  return player;
}

if (typeof window !== "undefined") {
  window.CM = {
    startCollecting,
    buyPack,
    buyConveyorOffer,
    tickConveyor,
    getConveyor,
    tickIncome,
    claimPathNode,
    getPathInfo,
    getPlayer,
    setPage,
    resetGame,
    debugGiveMoney,
    debugState,
    getCollectionSorted,
    getDiscoveryPercent
  };
}
