/**
 * Prestige system
 *
 * Manual button — player chooses when to prestige.
 * Resets: money, cards, income, path progress, conveyor, expeditions progress
 * Keeps: achievements, prestige points, tokens, shop purchases, (future: event books)
 *
 * Prestige Points (PP) sources:
 * 1. Achievements (already granted on unlock, 5–10 each)
 * 2. Leftover money conversion at prestige time
 *    PP from money = floor( money / conversionRate )
 *    conversionRate starts at 10_000 and increases with total PP earned
 *    so later prestiges convert money less efficiently
 */

import { DINOSAURS, RARITY_MULTIPLIER, RANK_MULTIPLIER } from "../data/dinosaurs.js";
import { canKeepBest, getIncomeMultiplier, getPathStartIncome } from "./shop.js";

export function initPrestigeState() {
  return {
    prestigeCount: 0,       // how many times player has prestiged
    totalPointsEarned: 0,   // lifetime PP (for scaling conversion)
    // banked points live on player.achievements.prestigePoints
  };
}

/**
 * Conversion: how many $ per 1 PP from leftover money.
 * Increases as the player accumulates more total PP.
 */
export function getMoneyConversionRate(player) {
  const totalPP = (player.achievements?.prestigePoints || 0)
    + (player.prestige?.totalPointsEarned || 0);
  // Base $10,000 per PP, +$2,000 per 10 total PP earned historically
  const rate = 10000 + Math.floor(totalPP / 10) * 2000;
  return Math.max(10000, rate);
}

/**
 * Preview what a prestige would yield right now
 */
export function getPrestigePreview(player) {
  const rate = getMoneyConversionRate(player);
  const fromMoney = Math.floor((player.money || 0) / rate);
  const currentPP = player.achievements?.prestigePoints || 0;
  return {
    rate,
    fromMoney,
    currentPP,
    afterPP: currentPP + fromMoney,
    prestigeCount: player.prestige?.prestigeCount || 0
  };
}

/**
 * Execute prestige.
 * Returns summary of what was kept / gained.
 */
function cardPower(card) {
  const dino = DINOSAURS.find(d => d.id === card.id);
  if (!dino) return 0;
  return dino.baseEarnings
    * (RARITY_MULTIPLIER[card.rarity] || 1)
    * (RANK_MULTIPLIER[card.rank] || 1);
}

export function doPrestige(player, helpers) {
  const preview = getPrestigePreview(player);
  const fromMoney = preview.fromMoney;

  let keepCard = null;
  if (canKeepBest(player)) {
    let best = null;
    let bestPower = -1;
    for (const card of Object.values(player.cards || {})) {
      const power = cardPower(card);
      if (power > bestPower) {
        bestPower = power;
        best = { ...card };
      }
    }
    keepCard = best;
  }

  // Award money conversion PP
  if (!player.achievements) {
    player.achievements = { unlocked: {}, prestigePoints: 0 };
  }
  player.achievements.prestigePoints += fromMoney;

  if (!player.prestige) player.prestige = initPrestigeState();
  player.prestige.prestigeCount += 1;
  player.prestige.totalPointsEarned += fromMoney;

  // Snapshot of what persists
  const kept = {
    achievements: player.achievements,
    tokens: player.tokens,
    prestige: player.prestige,
    shop: player.shop
  };

  // Reset main run state
  player.money = 0;
  player.incomePerSecond = 0;
  player.cards = {};
  player.discovered = {};
  player.totalDiscovered = 0;
  player.packsOpened = 0;
  player.started = false;
  player.path = {
    currentNode: 0,
    lifetimeIncome: 0,
    claimedNodes: [0],
    unlockedFlags: {}
  };
  if (helpers?.initConveyor) player.conveyor = helpers.initConveyor();
  if (helpers?.initExpeditions) player.expeditions = helpers.initExpeditions();
  if (helpers?.initTable) player.table = helpers.initTable();
  else player.table = { packs: [], sortPile: [] };

  // Restore persistent systems
  player.achievements = kept.achievements;
  player.tokens = kept.tokens;
  player.prestige = kept.prestige;
  player.shop = kept.shop;

  const pathStart = getPathStartIncome(player);
  if (pathStart > 0) {
    player.path.lifetimeIncome = pathStart;
  }

  if (keepCard) {
    const key = `${keepCard.id}_${keepCard.rarity}`;
    player.cards[key] = keepCard;
    player.discovered[keepCard.id] = true;
    player.totalDiscovered = 1;
    player.incomePerSecond = Math.floor(cardPower(keepCard) * getIncomeMultiplier(player));
  }

  return {
    ok: true,
    fromMoney,
    prestigeCount: player.prestige.prestigeCount,
    prestigePoints: player.achievements.prestigePoints,
    keptCard: keepCard
  };
}
