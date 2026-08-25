import { DINOSAURS, RARITY_MULTIPLIER, RANK_MULTIPLIER } from "../data/dinosaurs.js";

/**
 * Create a fresh player state
 */
export function createPlayerState() {
  return {
    money: 0,
    incomePerSecond: 0,
    cards: {},          // key: `${id}_${rarity}` → { id, name, rarity, rank, diet, environment }
    discovered: {},     // key: id → true
    totalDiscovered: 0,
    packsOpened: 0,
    started: false
  };
}

/**
 * Unique key for a card instance (same dino + same rarity)
 */
export function getCardKey(id, rarity) {
  return `${id}_${rarity}`;
}

/**
 * Calculate earnings for a single card
 */
export function getCardEarnings(card) {
  const dino = DINOSAURS.find(d => d.id === card.id);
  if (!dino) return 0;

  const rarityMult = RARITY_MULTIPLIER[card.rarity] || 1;
  const rankMult = RANK_MULTIPLIER[card.rank] || 1;

  return Math.floor(dino.baseEarnings * rarityMult * rankMult);
}

/**
 * Recalculate total income from all owned cards
 */
export function recalculateIncome(state) {
  let total = 0;
  for (const card of Object.values(state.cards)) {
    total += getCardEarnings(card);
  }
  state.incomePerSecond = total;
}

/**
 * Add opened cards into the collection
 * Handles: new cards, rank-ups, and max-rank sells
 * @returns {Array} results describing what happened to each card
 */
export function addCardsToCollection(state, newCards) {
  const results = [];

  for (const card of newCards) {
    const key = getCardKey(card.id, card.rarity);
    const existing = state.cards[key];

    if (!existing) {
      // Brand new card
      state.cards[key] = { ...card, rank: 1 };
      if (!state.discovered[card.id]) {
        state.discovered[card.id] = true;
        state.totalDiscovered++;
      }
      results.push({ type: "new", card: state.cards[key] });
    } else if (existing.rank < 5) {
      // Rank up
      existing.rank++;
      results.push({ type: "rankup", card: existing });
    } else {
      // Already Rank 5 → sell for half of its earnings
      const sellValue = Math.floor(getCardEarnings(existing) * 0.5);
      state.money += sellValue;
      results.push({ type: "sold", card: existing, value: sellValue });
    }
  }

  recalculateIncome(state);
  return results;
}

/**
 * Get all cards sorted by earnings (for Collection Book)
 */
export function getCollectionSorted(state) {
  return Object.values(state.cards).sort((a, b) => {
    return getCardEarnings(a) - getCardEarnings(b);
  });
}

/**
 * How many unique dinos have been discovered (out of 12)
 */
export function getDiscoveryPercent(state) {
  return Math.floor((state.totalDiscovered / DINOSAURS.length) * 100);
}
