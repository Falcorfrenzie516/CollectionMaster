import { DINOSAURS, RARITY_MULTIPLIER, RANK_MULTIPLIER } from "../data/dinosaurs.js";
import { initPathState } from "./path.js";
import { initConveyorState } from "./conveyor.js";

export function createPlayerState() {
  return {
    money: 0,
    incomePerSecond: 0,
    cards: {},
    discovered: {},
    totalDiscovered: 0,
    packsOpened: 0,
    started: false,
    currentPage: "home",
    path: initPathState(),
    conveyor: initConveyorState()
  };
}

export function getCardKey(id, rarity) {
  return `${id}_${rarity}`;
}

export function getCardEarnings(card) {
  const dino = DINOSAURS.find(d => d.id === card.id);
  if (!dino) return 0;
  const rarityMult = RARITY_MULTIPLIER[card.rarity] || 1;
  const rankMult = RANK_MULTIPLIER[card.rank] || 1;
  return Math.floor(dino.baseEarnings * rarityMult * rankMult);
}

export function recalculateIncome(state) {
  let total = 0;
  for (const card of Object.values(state.cards)) {
    total += getCardEarnings(card);
  }
  state.incomePerSecond = total;
}

export function addCardsToCollection(state, newCards) {
  const results = [];
  for (const card of newCards) {
    const key = getCardKey(card.id, card.rarity);
    const existing = state.cards[key];

    if (!existing) {
      state.cards[key] = { ...card, rank: 1 };
      if (!state.discovered[card.id]) {
        state.discovered[card.id] = true;
        state.totalDiscovered++;
      }
      results.push({ type: "new", card: state.cards[key] });
    } else if (existing.rank < 5) {
      existing.rank++;
      results.push({ type: "rankup", card: existing });
    } else {
      const sellValue = Math.floor(getCardEarnings(existing) * 0.5);
      state.money += sellValue;
      results.push({ type: "sold", card: existing, value: sellValue });
    }
  }
  recalculateIncome(state);
  return results;
}

export function getCollectionSorted(state) {
  return Object.values(state.cards).sort((a, b) => getCardEarnings(a) - getCardEarnings(b));
}

export function getDiscoveryPercent(state) {
  return Math.floor((state.totalDiscovered / DINOSAURS.length) * 100);
}
