/**
 * MAIN Path map — shared by every collection.
 *
 * Node spots were measured from the approved 770×1001 schematic
 * and MUST stay identical on every collection map. Only the
 * background (and optional trail tint) changes per collection.
 *
 * Coordinates are percentages of the map box (x: 0–100 left→right,
 * y: 0–100 top→bottom). Aspect ratio matches the schematic.
 */

export const MAP_ASPECT = 770 / 1001; // width / height
export const MAP_NODE_COUNT = 20;

/** Canonical node centers. Index 0 = Node 1 (start). */
export const NODE_POSITIONS = [
  { x: 10.52, y: 6.54 },
  { x: 31.30, y: 9.64 },
  { x: 52.47, y: 6.04 },
  { x: 75.84, y: 10.54 },
  { x: 93.38, y: 21.43 },
  { x: 68.44, y: 26.52 },
  { x: 45.58, y: 21.33 },
  { x: 19.74, y: 26.12 },
  { x: 8.44,  y: 36.41 },
  { x: 25.84, y: 39.41 },
  { x: 42.40, y: 34.17 },
  { x: 56.10, y: 39.21 },
  { x: 74.94, y: 38.91 },
  { x: 90.13, y: 51.20 },
  { x: 74.42, y: 59.74 },
  { x: 49.74, y: 56.00 },
  { x: 19.35, y: 61.09 },
  { x: 7.27,  y: 78.67 },
  { x: 44.16, y: 89.56 },
  { x: 90.00, y: 87.56 }
];

/**
 * Dashed trail through the 20 nodes. ViewBox is 0 0 100 100 so
 * commands use the same percent space as NODE_POSITIONS.
 * Curves follow the loops on the approved schematic.
 */
export const PATH_TRAIL_D = [
  "M 10.52 6.54",
  "C 18.2 5.8, 24.8 9.8, 31.30 9.64",
  "C 38.6 9.4, 44.2 4.2, 52.47 6.04",
  "C 63.5 7.8, 69.8 8.2, 75.84 10.54",
  "C 86.4 13.6, 95.2 14.8, 93.38 21.43",
  "C 91.2 28.2, 80.6 28.8, 68.44 26.52",
  "C 58.4 24.8, 52.6 19.6, 45.58 21.33",
  "C 34.8 23.6, 27.4 20.6, 19.74 26.12",
  "C 10.4 32.6, 2.4 32.8, 8.44 36.41",
  "C 14.8 39.6, 19.6 41.2, 25.84 39.41",
  "C 32.4 37.6, 35.8 31.4, 42.40 34.17",
  "C 48.2 36.6, 51.2 41.0, 56.10 39.21",
  "C 63.8 37.2, 69.4 35.6, 74.94 38.91",
  "C 83.8 43.4, 92.6 44.6, 90.13 51.20",
  "C 87.8 57.2, 82.2 61.8, 74.42 59.74",
  "C 65.2 57.4, 58.6 53.6, 49.74 56.00",
  "C 37.2 59.0, 28.4 57.6, 19.35 61.09",
  "C 8.2 66.4, 1.6 70.8, 7.27 78.67",
  "C 16.8 87.6, 30.4 91.8, 44.16 89.56",
  "C 62.0 87.2, 76.4 85.4, 90.00 87.56"
].join(" ");

export const MAP_THEMES = {
  dinosaurs: {
    id: "dinosaurs",
    name: "Prehistoric Trail",
    background: "assets/maps/dinosaurs.jpg",
    rev: 2,
    trail: "#1f9d4a",
    trailGone: "rgba(232, 220, 180, 0.35)",
    nodeRing: "#1f9d4a"
  }
};

export const DEFAULT_COLLECTION_ID = "dinosaurs";

export function getMapTheme(collectionId = DEFAULT_COLLECTION_ID) {
  return MAP_THEMES[collectionId] || MAP_THEMES[DEFAULT_COLLECTION_ID];
}

/** Single source for the painted board. rev busts a cached older landscape. */
export function mapAssetSrc(theme = getMapTheme()) {
  return `${theme.background}?v=${theme.rev || 1}`;
}

export function nodeStyle(index) {
  const n = NODE_POSITIONS[index];
  return `left:${n.x}%;top:${n.y}%`;
}
