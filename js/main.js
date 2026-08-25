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
import {
  initExpeditionsState,
  unlockExpedition,
  startExpedition,
  tickExpeditions,
  getExpeditionStatus,
  getTimeRemaining,
  isExpeditionsUnlocked,
  EXPEDITION_DEFS
} from "./systems/expeditions.js";
import {
  initTokensState,
  syncTokens,
  equipToken,
  getEquippedToken,
  getAllTokenDefs
} from "./systems/tokens.js";
import {
  initAchievementsState,
  syncAchievements,
  getAchievementProgress,
  ACHIEVEMENTS
} from "./systems/achievements.js";
import {
  initPrestigeState,
  getPrestigePreview,
  doPrestige
} from "./systems/prestige.js";

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
if (!player.expeditions) {
  player.expeditions = initExpeditionsState();
}
if (!player.tokens) {
  player.tokens = initTokensState();
}
if (!player.achievements) {
  player.achievements = initAchievementsState();
}
if (!player.prestige) {
  player.prestige = initPrestigeState();
}
syncTokens(player);
syncAchievements(player);
// One-time migration for very old saves that never tracked lifetime income
if (
  player.path.lifetimeIncome === 0 &&
  player.path.currentNode === 0 &&
  (player.path.claimedNodes || []).length <= 1 &&
  player.packsOpened > 2 &&
  player.incomePerSecond > 0
) {
  player.path.lifetimeIncome = Math.max(player.money, player.incomePerSecond * 30);
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
  if (!player.tokens) player.tokens = initTokensState();
  player.tokens.unlocked.explorer = true;
  player.tokens.equipped = "explorer";
  syncTokens(player);
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
  syncTokens(player);
  syncAchievements(player);
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

export function tryUnlockExpedition(expId) {
  const result = unlockExpedition(player, expId);
  if (!result.error) saveGame(player);
  return result;
}

export function tryStartExpedition(expId) {
  const result = startExpedition(player, expId);
  if (!result.error) saveGame(player);
  return result;
}

export function claimExpedition(expId) {
  if (!player.expeditions?.completed?.[expId]) {
    return { error: "Nothing to claim" };
  }
  const def = EXPEDITION_DEFS.find(e => e.id === expId);
  if (!def) return { error: "Unknown expedition" };

  delete player.expeditions.completed[expId];
  const cards = openPack({
    filter: def.reward.filter,
    oddsBoost: def.reward.oddsBoost
  });
  const results = addCardsToCollection(player, cards);
  player.packsOpened++;
  saveGame(player);
  return { cards, results, player };
}

export function tickAllExpeditions() {
  if (!player.expeditions) player.expeditions = initExpeditionsState();
  const changed = tickExpeditions(player);
  if (changed) saveGame(player);
  return changed;
}

export function getExpeditionsInfo() {
  return {
    unlockedSystem: isExpeditionsUnlocked(player),
    defs: EXPEDITION_DEFS,
    statuses: Object.fromEntries(
      EXPEDITION_DEFS.map(d => [d.id, getExpeditionStatus(player, d.id)])
    ),
    remaining: Object.fromEntries(
      EXPEDITION_DEFS.map(d => [d.id, getTimeRemaining(player, d.id)])
    )
  };
}


export function tryEquipToken(tokenId, color = "basic") {
  const result = equipToken(player, tokenId, color);
  if (!result.error) saveGame(player);
  return result;
}

export function getTokensInfo() {
  syncTokens(player);
  return {
    defs: getAllTokenDefs(),
    unlocked: player.tokens.unlocked,
    colors: player.tokens.colors,
    equipped: player.tokens.equipped,
    equippedColor: player.tokens.equippedColor,
    current: getEquippedToken(player)
  };
}


export function getAchievementsInfo() {
  syncAchievements(player);
  return getAchievementProgress(player);
}


export function getPrestigeInfo() {
  return getPrestigePreview(player);
}

export function tryPrestige() {
  if (!player.started) {
    return { error: "Start collecting before prestiging" };
  }
  const result = doPrestige(player, {
    initConveyor: initConveyorState,
    initExpeditions: initExpeditionsState
  });
  saveGame(player);
  return result;
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
  // Guarantee clean path / systems
  player.path = {
    currentNode: 0,
    lifetimeIncome: 0,
    claimedNodes: [0],
    unlockedFlags: {}
  };
  player.conveyor = initConveyorState();
  player.expeditions = initExpeditionsState();
  player.tokens = initTokensState();
  player.achievements = initAchievementsState();
  saveGame(player);
  return player;
}

export function debugGiveMoney(amount = 1000) {
  player.money += amount;
  if (player.path) trackLifetimeIncome(player.path, amount);
  saveGame(player);
  return player;
}

export function debugState() {
  console.log("=== Collection Master v1.6 ===");
  console.log("Money:", player.money);
  console.log("Income/s:", player.incomePerSecond);
  console.log("Discovered:", player.totalDiscovered, "/ 12");
  console.log("Path node:", player.path?.currentNode + 1);
  console.log("Expeditions unlocked:", isExpeditionsUnlocked(player));
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
    getPlayer,
    setPage,
    resetGame,
    debugGiveMoney,
    debugState,
    getCollectionSorted,
    getDiscoveryPercent
  };
}
