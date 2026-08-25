import { DINOSAURS } from "../data/dinosaurs.js";

const NORMAL_ODDS = {
  basic: 0.62, gold: 0.22, emerald: 0.09, sapphire: 0.04,
  ruby: 0.018, diamond: 0.008, rainbow: 0.004
};

const STARTER_ODDS = {
  basic: 0.50, gold: 0.30, emerald: 0.12, sapphire: 0.05,
  ruby: 0.02, diamond: 0.007, rainbow: 0.003
};

const GOLD_ODDS = {
  basic: 0.40, gold: 0.35, emerald: 0.14, sapphire: 0.06,
  ruby: 0.03, diamond: 0.015, rainbow: 0.005
};

const PREMIUM_ODDS = {
  basic: 0.25, gold: 0.30, emerald: 0.20, sapphire: 0.12,
  ruby: 0.07, diamond: 0.04, rainbow: 0.02
};

function weightedRandom(odds) {
  const roll = Math.random();
  let cumulative = 0;
  for (const [rarity, chance] of Object.entries(odds)) {
    cumulative += chance;
    if (roll < cumulative) return rarity;
  }
  return "basic";
}

function getPool(filter) {
  if (!filter) return DINOSAURS;
  return DINOSAURS.filter(d => {
    if (filter.diet && d.diet !== filter.diet) return false;
    if (filter.environment && d.environment !== filter.environment) return false;
    return true;
  });
}

function pickDino(pool) {
  if (!pool.length) pool = DINOSAURS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * @param {object} options
 * @param {boolean} options.isStarter
 * @param {object|null} options.filter - { diet } or { environment }
 * @param {string|null} options.oddsBoost - "gold" | "premium"
 */
export function openPack(options = {}) {
  const isStarter = options === true || options.isStarter === true;
  const filter = options.filter || null;
  const oddsBoost = options.oddsBoost || null;

  let odds = NORMAL_ODDS;
  if (isStarter) odds = STARTER_ODDS;
  else if (oddsBoost === "gold") odds = GOLD_ODDS;
  else if (oddsBoost === "premium") odds = PREMIUM_ODDS;

  const pool = getPool(filter);
  const cards = [];
  for (let i = 0; i < 4; i++) {
    const dino = pickDino(pool);
    cards.push({
      id: dino.id,
      name: dino.name,
      rarity: weightedRandom(odds),
      rank: 1,
      diet: dino.diet,
      environment: dino.environment
    });
  }
  return cards;
}
