/**
 * Expeditions — timer-based hunts.
 * Free to run once unlocked. No cooldowns.
 * First expedition unlocks via Path; others cost money.
 */

export const EXPEDITION_DEFS = [
  {
    id: "easy",
    name: "Easy Hunt",
    desc: "Quick basic-focused pack",
    durationSec: 60,          // 1 min for prototype feel (was 5 min concept)
    unlockCost: 0,            // free when Path unlocks expeditions
    reward: { packCount: 1, oddsBoost: null, filter: null }
  },
  {
    id: "standard",
    name: "Standard Hunt",
    desc: "Longer run, better odds",
    durationSec: 180,         // 3 min
    unlockCost: 5000,
    reward: { packCount: 1, oddsBoost: "gold", filter: null }
  },
  {
    id: "hard",
    name: "Hard Hunt",
    desc: "Long expedition, strong rewards",
    durationSec: 300,         // 5 min
    unlockCost: 25000,
    reward: { packCount: 1, oddsBoost: "premium", filter: null }
  },
  {
    id: "themed",
    name: "Themed Hunt",
    desc: "Carnivore-focused haul",
    durationSec: 240,
    unlockCost: 15000,
    reward: { packCount: 1, oddsBoost: "gold", filter: { diet: "carnivore" } }
  }
];

export function initExpeditionsState() {
  return {
    unlocked: {},   // id -> true
    active: {},     // id -> { startedAt, endsAt }
    completed: {}   // id -> true (ready to claim)
  };
}

export function isExpeditionsUnlocked(player) {
  return !!(player.path && player.path.unlockedFlags && player.path.unlockedFlags.expeditions);
}

export function unlockExpedition(player, expId) {
  const def = EXPEDITION_DEFS.find(e => e.id === expId);
  if (!def) return { error: "Unknown expedition" };
  if (!player.expeditions) player.expeditions = initExpeditionsState();

  if (player.expeditions.unlocked[expId]) {
    return { error: "Already unlocked" };
  }

  // First free one requires Path flag
  if (def.unlockCost === 0) {
    if (!isExpeditionsUnlocked(player)) {
      return { error: "Unlock Expeditions on the Path first" };
    }
  } else {
    if (!isExpeditionsUnlocked(player)) {
      return { error: "Unlock Expeditions on the Path first" };
    }
    if (player.money < def.unlockCost) {
      return { error: "Not enough money", needed: def.unlockCost };
    }
    player.money -= def.unlockCost;
  }

  player.expeditions.unlocked[expId] = true;
  return { ok: true };
}

export function startExpedition(player, expId) {
  const def = EXPEDITION_DEFS.find(e => e.id === expId);
  if (!def) return { error: "Unknown expedition" };
  if (!player.expeditions) player.expeditions = initExpeditionsState();

  if (!player.expeditions.unlocked[expId]) {
    return { error: "Not unlocked" };
  }
  if (player.expeditions.active[expId]) {
    return { error: "Already running" };
  }

  const now = Date.now();
  const timeMult = typeof player.shop === "object"
    ? Math.max(0.4, 1 - ((player.shop.levels?.expeditionSpeed || 0) * 0.12))
    : 1;
  player.expeditions.active[expId] = {
    startedAt: now,
    endsAt: now + Math.max(8, Math.floor(def.durationSec * timeMult)) * 1000
  };
  delete player.expeditions.completed[expId];
  return { ok: true, endsAt: player.expeditions.active[expId].endsAt };
}

/**
 * Tick timers — mark finished expeditions as completed
 */
export function tickExpeditions(player) {
  if (!player.expeditions) return false;
  const now = Date.now();
  let changed = false;

  for (const [id, run] of Object.entries(player.expeditions.active)) {
    if (now >= run.endsAt) {
      delete player.expeditions.active[id];
      player.expeditions.completed[id] = true;
      changed = true;
    }
  }
  return changed;
}

export function getExpeditionStatus(player, expId) {
  if (!player.expeditions) return "locked";
  if (player.expeditions.completed[expId]) return "ready";
  if (player.expeditions.active[expId]) return "running";
  if (player.expeditions.unlocked[expId]) return "idle";
  return "locked";
}

export function getTimeRemaining(player, expId) {
  const run = player.expeditions?.active?.[expId];
  if (!run) return 0;
  return Math.max(0, Math.ceil((run.endsAt - Date.now()) / 1000));
}
