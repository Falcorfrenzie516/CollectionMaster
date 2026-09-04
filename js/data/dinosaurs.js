export const DINOSAURS = [
  { id: "troodon", name: "Troodon", diet: "carnivore", baseEarnings: 1, environment: "ancient_forest", no: "001", attack: "Night Hunt", hp: 40 },
  { id: "pachycephalosaurus", name: "Pachycephalosaurus", diet: "herbivore", baseEarnings: 2, environment: "ancient_forest", no: "002", attack: "Dome Bash", hp: 50 },
  { id: "carnotaurus", name: "Carnotaurus", diet: "carnivore", baseEarnings: 3, environment: "ancient_forest", no: "003", attack: "Horn Charge", hp: 60 },
  { id: "iguanodon", name: "Iguanodon", diet: "herbivore", baseEarnings: 4, environment: "fern_plains", no: "004", attack: "Thumb Spike", hp: 70 },
  { id: "allosaurus", name: "Allosaurus", diet: "carnivore", baseEarnings: 6, environment: "rocky_highlands", no: "005", attack: "Ambush Bite", hp: 80 },
  { id: "stegosaurus", name: "Stegosaurus", diet: "herbivore", baseEarnings: 8, environment: "fern_plains", no: "006", attack: "Plate Guard", hp: 90 },
  { id: "raptor", name: "Raptor", diet: "carnivore", baseEarnings: 10, environment: "rocky_highlands", no: "007", attack: "Pack Strike", hp: 100 },
  { id: "ankylosaurus", name: "Ankylosaurus", diet: "herbivore", baseEarnings: 13, environment: "lush_valley", no: "008", attack: "Tail Club", hp: 110 },
  { id: "spinosaurus", name: "Spinosaurus", diet: "carnivore", baseEarnings: 17, environment: "prehistoric_wetlands", no: "009", attack: "River Snap", hp: 120 },
  { id: "brachiosaurus", name: "Brachiosaurus", diet: "herbivore", baseEarnings: 22, environment: "lush_valley", no: "010", attack: "High Browse", hp: 130 },
  { id: "triceratops", name: "Triceratops", diet: "herbivore", baseEarnings: 28, environment: "predator_territory", no: "011", attack: "Triple Horn", hp: 140 },
  { id: "trex", name: "T. rex", diet: "carnivore", baseEarnings: 35, environment: "predator_territory", no: "012", attack: "Bone Crush", hp: 160 }
];

export const RARITY_MULTIPLIER = {
  basic: 1.0,
  gold: 2.0,
  emerald: 3.5,
  sapphire: 5.5,
  ruby: 8.5,
  diamond: 13,
  rainbow: 22
};

export const RANK_MULTIPLIER = {
  1: 1.00,
  2: 1.25,
  3: 1.55,
  4: 1.90,
  5: 2.30
};

export const RARITIES = [
  "basic", "gold", "emerald", "sapphire", "ruby", "diamond", "rainbow"
];
