/**
 * Path system — 20 nodes unlocked by lifetime income earned.
 * Player claims one node at a time by sliding the token.
 */

// Target lifetime income to unlock each node (node 1 is free / start)
// Tuned so early nodes are quick, later ones stretch toward multi-hour play
export const NODE_TARGETS = [
  0,          // 1  Start
  25,         // 2  Cash drop
  100,        // 3  Guaranteed missing basic
  300,        // 4  Cash
  700,        // 5  Cash
  1500,       // 6  Guaranteed missing basic/gold
  3500,       // 7  Expeditions unlock
  7000,       // 8  Larger cash
  15000,      // 9  Cash
  30000,      // 10 Guaranteed missing
  60000,      // 11 Cash
  100000,     // 12 Cash
  175000,     // 13 Guaranteed missing
  300000,     // 14 Cash
  500000,     // 15 Cash
  800000,     // 16 Guaranteed missing
  1200000,    // 17 Cash
  1800000,    // 18 Cash
  2800000,    // 19 Large cash
  4500000     // 20 Finale
];

export const NODE_REWARDS = [
  { type: "start", label: "START", cash: 0 },
  { type: "cash", label: "Cash Drop", cash: 25 },
  { type: "missing", label: "Missing Basic", cash: 0, rarity: "basic" },
  { type: "cash", label: "Cash Drop", cash: 75 },
  { type: "cash", label: "Cash Drop", cash: 150 },
  { type: "missing", label: "Missing Basic/Gold", cash: 50, rarity: "gold" },
  { type: "unlock", label: "Expeditions Unlock", cash: 200, flag: "expeditions" },
  { type: "cash", label: "Larger Cash Drop", cash: 400 },
  { type: "cash", label: "Cash Drop", cash: 600 },
  { type: "missing", label: "Missing Card", cash: 100, rarity: "emerald" },
  { type: "cash", label: "Cash Drop", cash: 1000 },
  { type: "cash", label: "Cash Drop", cash: 1500 },
  { type: "missing", label: "Missing Card", cash: 200, rarity: "sapphire" },
  { type: "cash", label: "Cash Drop", cash: 2500 },
  { type: "cash", label: "Cash Drop", cash: 4000 },
  { type: "missing", label: "Missing Card", cash: 500, rarity: "ruby" },
  { type: "cash", label: "Cash Drop", cash: 7000 },
  { type: "cash", label: "Cash Drop", cash: 12000 },
  { type: "cash", label: "Large Cash Drop", cash: 25000 },
  { type: "finale", label: "Path Complete", cash: 50000 }
];

export function initPathState() {
  return {
    currentNode: 0,          // index 0 = node 1 (start), claimed
    lifetimeIncome: 0,       // total money ever earned from cards
    claimedNodes: [0],       // node indices that have been claimed
    unlockedFlags: {}        // e.g. { expeditions: true }
  };
}

/**
 * How many nodes are unlocked (available to claim) based on lifetime income
 */
export function getUnlockedNodeCount(path) {
  let count = 0;
  for (let i = 0; i < NODE_TARGETS.length; i++) {
    if (path.lifetimeIncome >= NODE_TARGETS[i]) count = i + 1;
    else break;
  }
  return count;
}

/**
 * Next node the player can claim (must be sequential)
 */
export function getNextClaimableNode(path) {
  const next = path.currentNode + 1;
  if (next >= NODE_TARGETS.length) return null; // finished
  const unlocked = getUnlockedNodeCount(path);
  if (next < unlocked) return next;
  return null;
}

/**
 * Claim the next node — returns reward result
 */
export function claimNextNode(path, player, helpers) {
  const next = getNextClaimableNode(path);
  if (next === null) {
    return { error: "No node available to claim" };
  }

  const reward = NODE_REWARDS[next];
  const result = {
    node: next + 1,
    reward,
    cashGained: 0,
    card: null,
    flag: null
  };

  // Cash
  if (reward.cash > 0) {
    player.money += reward.cash;
    result.cashGained = reward.cash;
  }

  // Unlock flag
  if (reward.flag) {
    path.unlockedFlags[reward.flag] = true;
    result.flag = reward.flag;
  }

  // Guaranteed missing card
  if (reward.type === "missing" && helpers && helpers.giveMissingCard) {
    const card = helpers.giveMissingCard(player, reward.rarity || "basic");
    if (card) result.card = card;
  }

  path.currentNode = next;
  path.claimedNodes.push(next);

  return result;
}

/**
 * Add income to lifetime tracker (call from tickIncome)
 */
export function trackLifetimeIncome(path, amount) {
  path.lifetimeIncome += amount;
}
