/**
 * Prestige Shop — spend Prestige Points on permanent upgrades.
 * Purchases persist through prestige. Full Reset still wipes them.
 */

export const SHOP_ITEMS = [
  {
    id: "startCash",
    name: "Seed Money",
    desc: "Begin each new run with extra cash on the desk.",
    icon: "💵",
    category: "start",
    maxLevel: 8,
    baseCost: 5,
    costScale: 5,
    nextRun: true
  },
  {
    id: "starterPacks",
    name: "Starter Haul",
    desc: "Drop extra starter packs on the table when you begin.",
    icon: "📦",
    category: "start",
    maxLevel: 3,
    baseCost: 12,
    costScale: 10,
    nextRun: true
  },
  {
    id: "pathBoost",
    name: "Trail Blazer",
    desc: "Start the Path with lifetime income already banked.",
    icon: "🗺️",
    category: "start",
    maxLevel: 5,
    baseCost: 8,
    costScale: 7,
    nextRun: true
  },
  {
    id: "incomeMult",
    name: "Income Relic",
    desc: "Permanent boost to every card's earnings.",
    icon: "📈",
    category: "power",
    maxLevel: 10,
    baseCost: 8,
    costScale: 6,
    nextRun: false
  },
  {
    id: "expeditionSpeed",
    name: "Swift Camps",
    desc: "Expeditions wrap up faster.",
    icon: "⏱️",
    category: "power",
    maxLevel: 4,
    baseCost: 10,
    costScale: 8,
    nextRun: false
  },
  {
    id: "tableSpace",
    name: "Bigger Table",
    desc: "Hold more sealed packs in the den.",
    icon: "🪑",
    category: "power",
    maxLevel: 4,
    baseCost: 6,
    costScale: 6,
    nextRun: false
  },
  {
    id: "packLuck",
    name: "Lucky Packs",
    desc: "Tilt pack odds toward rarer prints.",
    icon: "🍀",
    category: "packs",
    maxLevel: 5,
    baseCost: 10,
    costScale: 8,
    nextRun: false
  },
  {
    id: "packDiscount",
    name: "Belt Discount",
    desc: "Conveyor packs cost less money.",
    icon: "🏷️",
    category: "packs",
    maxLevel: 5,
    baseCost: 6,
    costScale: 5,
    nextRun: false
  },
  {
    id: "keepBest",
    name: "Favorite Fossil",
    desc: "Keep your highest-earning card when you prestige.",
    icon: "💎",
    category: "prestige",
    maxLevel: 1,
    baseCost: 35,
    costScale: 0,
    nextRun: false
  }
];

export const SHOP_CATEGORIES = [
  { id: "start", label: "Next run" },
  { id: "power", label: "Permanent" },
  { id: "packs", label: "Packs" },
  { id: "prestige", label: "Prestige" }
];

const START_CASH = [0, 100, 250, 500, 1000, 2000, 4000, 7500, 12500];
const PATH_START = [0, 100, 350, 800, 1800, 4000];

export function initShopState() {
  return { levels: {} };
}

export function getShopLevel(player, id) {
  return player?.shop?.levels?.[id] || 0;
}

export function getItemCost(item, level) {
  if (level >= item.maxLevel) return null;
  return item.baseCost + level * item.costScale;
}

export function getStartCash(playerOrLevel) {
  const lvl = typeof playerOrLevel === "number"
    ? playerOrLevel
    : getShopLevel(playerOrLevel, "startCash");
  return START_CASH[lvl] || 0;
}

export function getExtraStarterPacks(player) {
  return getShopLevel(player, "starterPacks");
}

export function getPathStartIncome(playerOrLevel) {
  const lvl = typeof playerOrLevel === "number"
    ? playerOrLevel
    : getShopLevel(playerOrLevel, "pathBoost");
  return PATH_START[lvl] || 0;
}

export function getIncomeMultiplier(player) {
  return 1 + getShopLevel(player, "incomeMult") * 0.1;
}

export function getPackLuck(player) {
  return getShopLevel(player, "packLuck");
}

export function getPackDiscount(player) {
  return getShopLevel(player, "packDiscount") * 0.08;
}

export function getExpeditionTimeMult(player) {
  return Math.max(0.4, 1 - getShopLevel(player, "expeditionSpeed") * 0.12);
}

export function getTablePackCap(player) {
  return 20 + getShopLevel(player, "tableSpace") * 5;
}

export function canKeepBest(player) {
  return getShopLevel(player, "keepBest") >= 1;
}

export function describeEffect(item, level) {
  if (level <= 0) return "Not purchased";
  switch (item.id) {
    case "startCash":
      return `+$${getStartCash(level).toLocaleString()} on start`;
    case "starterPacks":
      return `+${level} starter pack${level === 1 ? "" : "s"}`;
    case "pathBoost":
      return `+$${getPathStartIncome(level).toLocaleString()} path income`;
    case "incomeMult":
      return `+${level * 10}% income`;
    case "expeditionSpeed":
      return `-${level * 12}% hunt time`;
    case "tableSpace":
      return `${20 + level * 5} pack slots`;
    case "packLuck":
      return `+${level * 3}% rarity tilt`;
    case "packDiscount":
      return `-${level * 8}% pack prices`;
    case "keepBest":
      return "Keep best card on prestige";
    default:
      return `Level ${level}`;
  }
}

export function buyShopItem(player, itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return { error: "Unknown shop item" };
  if (!player.shop) player.shop = initShopState();
  if (!player.shop.levels) player.shop.levels = {};
  if (!player.achievements) {
    player.achievements = { unlocked: {}, prestigePoints: 0 };
  }

  const level = player.shop.levels[itemId] || 0;
  if (level >= item.maxLevel) return { error: "Already maxed" };

  const cost = getItemCost(item, level);
  const pp = player.achievements.prestigePoints || 0;
  if (pp < cost) {
    return { error: "Not enough Prestige Points", needed: cost, have: pp };
  }

  player.achievements.prestigePoints -= cost;
  player.shop.levels[itemId] = level + 1;

  return {
    ok: true,
    itemId,
    level: level + 1,
    cost,
    prestigePoints: player.achievements.prestigePoints
  };
}

export function getShopInfo(player) {
  if (!player.shop) player.shop = initShopState();
  const pp = player.achievements?.prestigePoints || 0;
  return {
    prestigePoints: pp,
    prestigeCount: player.prestige?.prestigeCount || 0,
    levels: { ...player.shop.levels },
    items: SHOP_ITEMS.map(item => {
      const level = player.shop.levels[item.id] || 0;
      const cost = getItemCost(item, level);
      return {
        ...item,
        level,
        cost,
        maxed: level >= item.maxLevel,
        canAfford: cost != null && pp >= cost,
        effect: describeEffect(item, level),
        nextEffect: level < item.maxLevel ? describeEffect(item, level + 1) : describeEffect(item, level)
      };
    })
  };
}
