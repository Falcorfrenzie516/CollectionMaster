import { openPack } from "./systems/packs.js";
import {
  createPlayerState,
  addCardsToCollection,
  getCollectionSorted,
  getDiscoveryPercent,
  getCardKey,
  recalculateIncome
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
  initTableState,
  ensureTable,
  deliverPack,
  canReceivePack,
  classifySortCard,
  autoSortPreview,
  MAX_TABLE_PACKS,
  MAX_SORT_PILE,
  packCap
} from "./systems/table.js";
import {
  initPrestigeState,
  getPrestigePreview,
  doPrestige
} from "./systems/prestige.js";
import {
  initShopState,
  buyShopItem,
  getShopInfo,
  getStartCash,
  getExtraStarterPacks,
  getPathStartIncome,
  getPackLuck,
  getPackDiscount
} from "./systems/shop.js";

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
if (!player.table) {
  player.table = initTableState();
}
if (!player.shop) {
  player.shop = initShopState();
}
recalculateIncome(player);
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

  ensureTable(player);
  const p1 = deliverPack(player, {
    name: "Starter Pack",
    desc: "4 cards · kinder odds",
    isStarter: true
  });
  const p2 = deliverPack(player, {
    name: "Starter Pack",
    desc: "4 cards · kinder odds",
    isStarter: true
  });
  if (p1.error || p2.error) return { error: p1.error || p2.error };

  player.started = true;
  if (!player.tokens) player.tokens = initTokensState();
  player.tokens.unlocked.explorer = true;
  player.tokens.equipped = "explorer";

  const extraPacks = getExtraStarterPacks(player);
  for (let i = 0; i < extraPacks; i++) {
    deliverPack(player, {
      name: "Starter Pack",
      desc: "4 cards · kinder odds",
      isStarter: true
    });
  }

  const seed = getStartCash(player);
  if (seed > 0) player.money += seed;

  const pathStart = getPathStartIncome(player);
  if (!player.path) {
    player.path = {
      currentNode: 0,
      lifetimeIncome: 0,
      claimedNodes: [0],
      unlockedFlags: {}
    };
  }
  if ((player.path.lifetimeIncome || 0) < pathStart) {
    player.path.lifetimeIncome = pathStart;
  }

  syncTokens(player);
  saveGame(player);

  return {
    delivered: [p1.pack, p2.pack],
    player
  };
}

export function buyPack(cost = 100) {
  if (player.money < cost) {
    return { error: "Not enough money", needed: cost, have: player.money };
  }
  if (!canReceivePack(player)) {
    return { error: `Table is full (${packCap(player)} packs)` };
  }
  player.money -= cost;
  const delivered = deliverPack(player, {
    name: "Standard Pack",
    desc: "4 cards · normal odds"
  });
  saveGame(player);
  return { delivered: delivered.pack, player };
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

  if (!canReceivePack(player)) {
    return { error: `Table is full (${packCap(player)} packs). Open some in the den first.` };
  }
  player.money -= offer.price;
  const delivered = deliverPack(player, {
    name: offer.name,
    desc: offer.desc,
    filter: offer.filter,
    oddsBoost: offer.oddsBoost
  });
  removeOffer(player.conveyor, uid);
  saveGame(player);
  return { delivered: delivered.pack, offer, player };
}

export function tickConveyor() {
  if (!player.conveyor) player.conveyor = initConveyorState();
  const changed = refillConveyor(player.conveyor, player.packsOpened, getPackDiscount(player));
  if (changed) saveGame(player);
  return player.conveyor;
}

export function getConveyor() {
  if (!player.conveyor) player.conveyor = initConveyorState();
  return player.conveyor;
}

export function getTableInfo() {
  const table = ensureTable(player);
  const flushed = flushMaxedSortPile(player);
  if (flushed.length) saveGame(player);
  return {
    packs: table.packs,
    sortPile: table.sortPile.map(card => ({
      ...card,
      reason: classifySortCard(player, card)
    })),
    packCount: table.packs.length,
    packCap: packCap(player),
    sortCount: table.sortPile.length,
    sortCap: MAX_SORT_PILE,
    preview: autoSortPreview(player)
  };
}

function flushMaxedSortPile(state) {
  const table = ensureTable(state);
  const keep = [];
  const sold = [];
  for (const card of table.sortPile) {
    if (classifySortCard(state, card) === "maxed") {
      const results = addCardsToCollection(state, [card]);
      sold.push(results[0]);
    } else {
      keep.push(card);
    }
  }
  table.sortPile = keep;
  return sold;
}

export function openTablePack() {
  const table = ensureTable(player);
  if (!table.packs.length) return { error: "No packs on the table" };
  if (table.sortPile.length + 4 > MAX_SORT_PILE) {
    return { error: "Sort pile is full. File some cards first." };
  }
  const sealed = table.packs.shift();
  const cards = openPack({
    isStarter: sealed.isStarter,
    filter: sealed.filter,
    oddsBoost: sealed.oddsBoost,
    luck: getPackLuck(player)
  }).map(card => ({
    ...card,
    uid: "card_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8)
  }));
  const sold = [];
  const kept = [];
  for (const card of cards) {
    if (classifySortCard(player, card) === "maxed") {
      sold.push(addCardsToCollection(player, [card])[0]);
    } else {
      kept.push(card);
    }
  }
  table.sortPile.push(...kept);
  sold.push(...flushMaxedSortPile(player));
  player.packsOpened++;
  syncAchievements(player);
  saveGame(player);
  return { opened: sealed, cards, kept, sold, player };
}

export function fileSortCard(uid) {
  const table = ensureTable(player);
  const idx = table.sortPile.findIndex(c => c.uid === uid);
  if (idx === -1) return { error: "Card not in the sort pile" };
  const [card] = table.sortPile.splice(idx, 1);
  const results = addCardsToCollection(player, [card]);
  const extraSold = flushMaxedSortPile(player);
  syncAchievements(player);
  saveGame(player);
  return { results, extraSold, card, player };
}

export function autoSortTable() {
  const table = ensureTable(player);
  const keep = [];
  const filed = [];
  const sold = [];
  for (const card of table.sortPile) {
    const kind = classifySortCard(player, card);
    if (kind === "dup" || kind === "maxed") {
      const results = addCardsToCollection(player, [card]);
      if (results[0]?.type === "sold") sold.push({ card, results: results[0] });
      else filed.push({ card, results: results[0] });
    } else {
      keep.push(card);
    }
  }
  table.sortPile = keep;
  syncAchievements(player);
  saveGame(player);
  return {
    filed: filed.length,
    sold: sold.length,
    kept: keep.length,
    preview: autoSortPreview(player),
    player
  };
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

  if (!canReceivePack(player)) {
    return { error: `Table is full (${packCap(player)} packs). Open some in the den first.` };
  }
  delete player.expeditions.completed[expId];
  const delivered = deliverPack(player, {
    name: def.name + " Pack",
    desc: def.desc,
    filter: def.reward.filter,
    oddsBoost: def.reward.oddsBoost
  });
  saveGame(player);
  return { delivered: delivered.pack, player };
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

export function getShop() {
  if (!player.shop) player.shop = initShopState();
  return getShopInfo(player);
}

export function tryBuyShopItem(itemId) {
  if (!player.shop) player.shop = initShopState();
  const result = buyShopItem(player, itemId);
  if (!result.error) {
    if (itemId === "incomeMult") recalculateIncome(player);
    saveGame(player);
  }
  return result;
}

export function tryPrestige() {
  if (!player.started) {
    return { error: "Start collecting before prestiging" };
  }
  const result = doPrestige(player, {
    initConveyor: initConveyorState,
    initExpeditions: initExpeditionsState,
    initTable: initTableState
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
  player.table = initTableState();
  player.shop = initShopState();
  player.prestige = initPrestigeState();
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
    getTableInfo,
    openTablePack,
    fileSortCard,
    autoSortTable,
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
    getShop,
    tryBuyShopItem,
    getPlayer,
    setPage,
    resetGame,
    debugGiveMoney,
    debugState,
    getCollectionSorted,
    getDiscoveryPercent
  };
}
