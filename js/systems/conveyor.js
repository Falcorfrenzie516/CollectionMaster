/**
 * Conveyor — constantly running pack shop.
 * Offers refill over time. Player buys packs with money (no cash from conveyor).
 */

export const PACK_TYPES = {
  standard: {
    id: "standard",
    name: "Standard Pack",
    desc: "4 cards · normal odds",
    basePrice: 100,
    themed: false
  },
  herbivore: {
    id: "herbivore",
    name: "Herbivore Pack",
    desc: "4 cards · herbivores only",
    basePrice: 250,
    themed: true,
    filter: { diet: "herbivore" }
  },
  carnivore: {
    id: "carnivore",
    name: "Carnivore Pack",
    desc: "4 cards · carnivores only",
    basePrice: 250,
    themed: true,
    filter: { diet: "carnivore" }
  },
  forest: {
    id: "forest",
    name: "Ancient Forest Pack",
    desc: "4 cards · forest dinos",
    basePrice: 400,
    themed: true,
    filter: { environment: "ancient_forest" }
  },
  gold: {
    id: "gold",
    name: "Gold Pack",
    desc: "4 cards · better gold+ odds",
    basePrice: 600,
    themed: false,
    oddsBoost: "gold"
  },
  premium: {
    id: "premium",
    name: "Premium Pack",
    desc: "4 cards · strong sapphire+ chance",
    basePrice: 2000,
    themed: false,
    oddsBoost: "premium"
  }
};

// How often a new offer can appear (ms)
export const REFILL_MS = 8000;

// Max offers on the belt at once
export const MAX_OFFERS = 4;

/**
 * Price scales with packs opened so $100 doesn't stay free forever.
 * price = base * (1 + packsOpened * 0.08), floored, min base
 */
export function getPackPrice(packType, packsOpened, discount = 0) {
  const base = packType.basePrice;
  const scale = 1 + Math.floor(packsOpened / 5) * 0.15;
  const cut = Math.max(0, Math.min(0.5, discount || 0));
  return Math.max(1, Math.floor(base * scale * (1 - cut)));
}

/**
 * Weighted pick of which pack type to offer
 */
function pickPackType(packsOpened) {
  // Early game: mostly standard. Later: more variety.
  const weights = [
    { id: "standard", w: packsOpened < 10 ? 50 : 30 },
    { id: "herbivore", w: 15 },
    { id: "carnivore", w: 15 },
    { id: "forest", w: packsOpened < 8 ? 5 : 12 },
    { id: "gold", w: packsOpened < 12 ? 8 : 15 },
    { id: "premium", w: packsOpened < 20 ? 2 : 8 }
  ];

  const total = weights.reduce((s, x) => s + x.w, 0);
  let roll = Math.random() * total;
  for (const item of weights) {
    roll -= item.w;
    if (roll <= 0) return PACK_TYPES[item.id];
  }
  return PACK_TYPES.standard;
}

export function createOffer(packsOpened, discount = 0) {
  const type = pickPackType(packsOpened);
  return {
    uid: Date.now() + Math.random().toString(36).slice(2, 7),
    packId: type.id,
    name: type.name,
    desc: type.desc,
    price: getPackPrice(type, packsOpened, discount),
    filter: type.filter || null,
    oddsBoost: type.oddsBoost || null
  };
}

export function initConveyorState() {
  return {
    offers: [],
    lastRefillAt: Date.now()
  };
}

/**
 * Ensure conveyor has up to MAX_OFFERS. Call periodically.
 */
export function refillConveyor(conveyor, packsOpened, discount = 0) {
  const now = Date.now();

  if (conveyor.offers.length === 0) {
    while (conveyor.offers.length < MAX_OFFERS) {
      conveyor.offers.push(createOffer(packsOpened, discount));
    }
    conveyor.lastRefillAt = now;
    return true;
  }

  if (conveyor.offers.length >= MAX_OFFERS) return false;
  if (now - conveyor.lastRefillAt < REFILL_MS) return false;

  conveyor.offers.push(createOffer(packsOpened, discount));
  conveyor.lastRefillAt = now;
  return true;
}

/**
 * Remove an offer after purchase
 */
export function removeOffer(conveyor, uid) {
  conveyor.offers = conveyor.offers.filter(o => o.uid !== uid);
}
