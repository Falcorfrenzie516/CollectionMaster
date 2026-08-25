import { DINOSAURS } from "../data/dinosaurs.js";

const NORMAL_ODDS = {
  basic: 0.62, gold: 0.22, emerald: 0.09, sapphire: 0.04,
  ruby: 0.018, diamond: 0.008, rainbow: 0.004
};

const STARTER_ODDS = {
  basic: 0.50, gold: 0.30, emerald: 0.12, sapphire: 0.05,
  ruby: 0.02, diamond: 0.007, rainbow: 0.003
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

function getRandomDinosaur() {
  return DINOSAURS[Math.floor(Math.random() * DINOSAURS.length)];
}

export function openPack(isStarter = false) {
  const odds = isStarter ? STARTER_ODDS : NORMAL_ODDS;
  const cards = [];
  for (let i = 0; i < 4; i++) {
    const dino = getRandomDinosaur();
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
