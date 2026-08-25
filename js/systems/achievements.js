/**
 * Achievements — permanent progress.
 * Stay through prestige. Each grants Prestige Points (for later shop).
 */

export const ACHIEVEMENTS = [
  {
    id: "first_pack",
    name: "Welcome to Jurassic Park",
    desc: "Open your first packs",
    points: 5,
    check: (p) => p.packsOpened >= 2
  },
  {
    id: "packs_10",
    name: "Pack Rat",
    desc: "Open 10 packs",
    points: 5,
    check: (p) => p.packsOpened >= 10
  },
  {
    id: "packs_50",
    name: "Card Shark",
    desc: "Open 50 packs",
    points: 10,
    check: (p) => p.packsOpened >= 50
  },
  {
    id: "discover_1",
    name: "First Find",
    desc: "Discover your first dinosaur",
    points: 5,
    check: (p) => p.totalDiscovered >= 1
  },
  {
    id: "discover_6",
    name: "Halfway There",
    desc: "Discover 6 dinosaur species",
    points: 5,
    check: (p) => p.totalDiscovered >= 6
  },
  {
    id: "discover_12",
    name: "Full Roster",
    desc: "Discover all 12 dinosaurs",
    points: 10,
    check: (p) => p.totalDiscovered >= 12
  },
  {
    id: "income_100",
    name: "Steady Income",
    desc: "Reach $100 /s income",
    points: 5,
    check: (p) => p.incomePerSecond >= 100
  },
  {
    id: "income_1000",
    name: "Must Go Faster",
    desc: "Reach $1,000 /s income",
    points: 10,
    check: (p) => p.incomePerSecond >= 1000
  },
  {
    id: "path_5",
    name: "On the Trail",
    desc: "Reach Path node 5",
    points: 5,
    check: (p) => (p.path?.currentNode ?? 0) >= 4
  },
  {
    id: "path_10",
    name: "Deep Trail",
    desc: "Reach Path node 10",
    points: 5,
    check: (p) => (p.path?.currentNode ?? 0) >= 9
  },
  {
    id: "path_20",
    name: "Path Complete",
    desc: "Finish the Path (node 20)",
    points: 10,
    check: (p) => (p.path?.currentNode ?? 0) >= 19
  },
  {
    id: "expeditions_unlock",
    name: "Camp Founder",
    desc: "Unlock Expeditions on the Path",
    points: 5,
    check: (p) => !!(p.path?.unlockedFlags?.expeditions)
  },
  {
    id: "first_gold",
    name: "Shiny",
    desc: "Own any Gold rarity card",
    points: 5,
    check: (p) => Object.values(p.cards || {}).some(c => c.rarity === "gold")
  },
  {
    id: "first_diamond",
    name: "Diamond in the Rough",
    desc: "Own any Diamond rarity card",
    points: 10,
    check: (p) => Object.values(p.cards || {}).some(c => c.rarity === "diamond")
  },
  {
    id: "rank5",
    name: "Maxed Out",
    desc: "Get any card to Rank 5",
    points: 5,
    check: (p) => Object.values(p.cards || {}).some(c => c.rank >= 5)
  },
  {
    id: "set_token",
    name: "Token Collector",
    desc: "Unlock any set token",
    points: 10,
    check: (p) => Object.keys(p.tokens?.unlocked || {}).some(id => id.startsWith("set_"))
  }
];

export function initAchievementsState() {
  return {
    unlocked: {},      // id -> true
    // Prestige points from achievements (persist through prestige later)
    prestigePoints: 0
  };
}

/**
 * Evaluate all achievements; unlock new ones and award points.
 * Returns list of newly unlocked achievement defs.
 */
export function syncAchievements(player) {
  if (!player.achievements) player.achievements = initAchievementsState();
  const newly = [];

  for (const ach of ACHIEVEMENTS) {
    if (player.achievements.unlocked[ach.id]) continue;
    try {
      if (ach.check(player)) {
        player.achievements.unlocked[ach.id] = true;
        player.achievements.prestigePoints += ach.points;
        newly.push(ach);
      }
    } catch (e) {
      // ignore bad checks
    }
  }
  return newly;
}

export function getAchievementProgress(player) {
  if (!player.achievements) player.achievements = initAchievementsState();
  const unlockedCount = Object.keys(player.achievements.unlocked).length;
  return {
    unlockedCount,
    total: ACHIEVEMENTS.length,
    prestigePoints: player.achievements.prestigePoints,
    list: ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: !!player.achievements.unlocked[a.id]
    }))
  };
}
