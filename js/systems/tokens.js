/**
 * Tokens — monopoly-style Path pieces.
 * - Starter: Explorer (backpack)
 * - Set tokens: unlock when you own all 7 rarities of a dinosaur
 * - Color variants: unlock when all 7 rarities are Rank 5
 * - Switch equipped token anytime among unlocked ones
 * - Persist through prestige (handled later)
 */

import { DINOSAURS, RARITIES } from "../data/dinosaurs.js";

function getCardKey(id, rarity) {
  return `${id}_${rarity}`;
}

export const STARTER_TOKEN = {
  id: "explorer",
  name: "The Explorer",
  desc: "Little explorer with a backpack",
  icon: "🎒",
  type: "starter"
};

export function getSetTokenDef(dino) {
  return {
    id: `set_${dino.id}`,
    name: `${dino.name} Token`,
    desc: `Complete all rarities of ${dino.name}`,
    icon: "♟️",
    type: "set",
    dinoId: dino.id
  };
}

export function initTokensState() {
  return {
    unlocked: { explorer: true },  // starter always owned after start
    colors: {},                    // tokenId -> { basic: true, gold: true, ... }
    equipped: "explorer",
    equippedColor: "basic"
  };
}

/**
 * Check set completion and unlock tokens / colors
 */
export function syncTokens(player) {
  if (!player.tokens) player.tokens = initTokensState();
  let changed = false;

  // Ensure explorer after starting
  if (player.started && !player.tokens.unlocked.explorer) {
    player.tokens.unlocked.explorer = true;
    changed = true;
  }

  for (const dino of DINOSAURS) {
    const tokenId = `set_${dino.id}`;
    let ownedRarities = 0;
    let maxedRarities = 0;

    for (const rarity of RARITIES) {
      const card = player.cards[getCardKey(dino.id, rarity)];
      if (card) {
        ownedRarities++;
        if (card.rank >= 5) maxedRarities++;
      }
    }

    // Unlock set token when all 7 rarities owned
    if (ownedRarities >= 7 && !player.tokens.unlocked[tokenId]) {
      player.tokens.unlocked[tokenId] = true;
      if (!player.tokens.colors[tokenId]) player.tokens.colors[tokenId] = {};
      player.tokens.colors[tokenId].basic = true;
      changed = true;
    }

    // Unlock rarity colors when that rarity is Rank 5 (and token unlocked)
    if (player.tokens.unlocked[tokenId]) {
      if (!player.tokens.colors[tokenId]) player.tokens.colors[tokenId] = { basic: true };
      for (const rarity of RARITIES) {
        const card = player.cards[getCardKey(dino.id, rarity)];
        if (card && card.rank >= 5 && !player.tokens.colors[tokenId][rarity]) {
          player.tokens.colors[tokenId][rarity] = true;
          changed = true;
        }
      }
    }
  }

  // Explorer always has basic color
  if (!player.tokens.colors.explorer) {
    player.tokens.colors.explorer = { basic: true };
  }

  return changed;
}

export function getAllTokenDefs() {
  return [
    STARTER_TOKEN,
    ...DINOSAURS.map(getSetTokenDef)
  ];
}

export function equipToken(player, tokenId, color = "basic") {
  if (!player.tokens) player.tokens = initTokensState();
  if (!player.tokens.unlocked[tokenId]) {
    return { error: "Token not unlocked" };
  }
  const colors = player.tokens.colors[tokenId] || { basic: true };
  if (!colors[color]) {
    return { error: "Color not unlocked" };
  }
  player.tokens.equipped = tokenId;
  player.tokens.equippedColor = color;
  return { ok: true };
}

export function getEquippedToken(player) {
  if (!player.tokens) return { ...STARTER_TOKEN, color: "basic" };
  const id = player.tokens.equipped || "explorer";
  const color = player.tokens.equippedColor || "basic";
  const def = getAllTokenDefs().find(t => t.id === id) || STARTER_TOKEN;
  return { ...def, color };
}
