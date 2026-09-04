export const MAX_TABLE_PACKS = 20;
export const MAX_SORT_PILE = 80;

export function initTableState() {
  return {
    packs: [],
    sortPile: []
  };
}

function uid(prefix) {
  return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

export function ensureTable(state) {
  if (!state.table) state.table = initTableState();
  if (!Array.isArray(state.table.packs)) state.table.packs = [];
  if (!Array.isArray(state.table.sortPile)) state.table.sortPile = [];
  return state.table;
}

export function tableCounts(state) {
  const table = ensureTable(state);
  return {
    packs: table.packs.length,
    packCap: MAX_TABLE_PACKS,
    sort: table.sortPile.length,
    sortCap: MAX_SORT_PILE
  };
}

export function canReceivePack(state) {
  return ensureTable(state).packs.length < MAX_TABLE_PACKS;
}

export function deliverPack(state, spec = {}) {
  const table = ensureTable(state);
  if (table.packs.length >= MAX_TABLE_PACKS) {
    return { error: "Table is full (20 packs)" };
  }
  const pack = {
    uid: uid("pack"),
    name: spec.name || "Standard Pack",
    desc: spec.desc || "4 dinosaur cards",
    filter: spec.filter || null,
    oddsBoost: spec.oddsBoost || null,
    isStarter: !!spec.isStarter
  };
  table.packs.push(pack);
  return { ok: true, pack };
}

export function classifySortCard(state, card) {
  const key = `${card.id}_${card.rarity}`;
  const existing = state.cards?.[key];
  if (!existing) return "first";
  if (existing.rank >= 5) return "maxed";
  if (existing.rank === 4) return "fifth";
  return "dup";
}

export function autoSortPreview(state) {
  const table = ensureTable(state);
  let filed = 0;
  let keptFirst = 0;
  let keptFifth = 0;
  for (const card of table.sortPile) {
    const kind = classifySortCard(state, card);
    if (kind === "dup") filed++;
    else if (kind === "first") keptFirst++;
    else keptFifth++;
  }
  return { filed, keptFirst, keptFifth, total: table.sortPile.length };
}
