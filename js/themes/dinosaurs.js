export const dinosaurPathTheme = {
  id: "dinosaurs",
  title: "DINOSAURS PATH",
  description: "One continuous route through six dynamically generated prehistoric environments.",
  nodeCount: 54,
  nodesPerRegion: 9,
  trail: {
    base: "#8a6540",
    highlight: "#c5a06d",
    edge: "#21150d"
  },
  regions: [
    {
      id: "ancient-forest",
      backgroundArt: "assets/images/themes/dinosaurs/ancient-forest.jpg",
      name: "ANCIENT FOREST",
      environment: "forest",
      density: "heavy",
      water: "creek",
      lighting: "dappled",
      palette: ["#0e1b12","#1e3b24","#345d37","#7fa069"],
      props: ["trees","ferns","fallenLogs","rocks"],
      landmark: "FERN GATE",
      atmosphere: { particles:"fireflies", fog:.42, wind:"gentle", waterMotion:"slow", lightRays:true, parallax:true }
    },
    {
      id: "fern-plains",
      backgroundArt: "assets/images/themes/dinosaurs/fern-plains.jpg",
      name: "FERN PLAINS",
      environment: "plains",
      density: "medium",
      water: "stream",
      lighting: "open",
      palette: ["#1d2a15","#40562b","#71804a","#9b9d61"],
      props: ["ferns","grasses","rocks","water"],
      landmark: "OLD CROSSING",
      atmosphere: { particles:"pollen", fog:.16, wind:"breeze", waterMotion:"slow", lightRays:true, parallax:true }
    },
    {
      id: "rocky-highlands",
      backgroundArt: "assets/images/themes/dinosaurs/rocky-highlands.jpg",
      name: "ROCKY HIGHLANDS",
      environment: "rock",
      density: "low",
      water: "falls",
      lighting: "cool",
      palette: ["#1b1e1b","#333a35","#5a5e56","#83857b"],
      props: ["cliffs","boulders","bridge","mist"],
      landmark: "HIGH RIDGE",
      atmosphere: { particles:"dust", fog:.34, wind:"gusty", waterMotion:"falls", lightRays:false, parallax:true }
    },
    {
      id: "prehistoric-wetlands",
      backgroundArt: "assets/images/themes/dinosaurs/prehistoric-wetlands.jpg",
      name: "PREHISTORIC WETLANDS",
      environment: "wetland",
      density: "medium",
      water: "heavy",
      lighting: "misty",
      palette: ["#071a19","#153836","#2c6662","#5f8373"],
      props: ["water","reeds","mud","fallenLogs","mist"],
      landmark: "MARSH CAMP",
      atmosphere: { particles:"mist", fog:.72, wind:"gentle", waterMotion:"ripples", lightRays:false, parallax:true }
    },
    {
      id: "lush-valley",
      backgroundArt: "assets/images/themes/dinosaurs/lush-valley.jpg",
      name: "LUSH VALLEY",
      environment: "valley",
      density: "heavy",
      water: "river",
      lighting: "warm",
      palette: ["#102016","#27452b","#4d7447","#8aa06c"],
      props: ["trees","ferns","water","rocks"],
      landmark: "VALLEY OVERLOOK",
      atmosphere: { particles:"pollen", fog:.23, wind:"breeze", waterMotion:"river", lightRays:true, parallax:true }
    },
    {
      id: "predator-territory",
      backgroundArt: "assets/images/themes/dinosaurs/predator-territory.jpg",
      name: "PREDATOR TERRITORY",
      environment: "badlands",
      density: "sparse",
      water: "none",
      lighting: "dramatic",
      palette: ["#17130f","#30241b","#57402b","#8b5e38"],
      props: ["boulders","bones","deadTrees","ash"],
      landmark: "FINAL HUNT",
      atmosphere: { particles:"embers", fog:.12, wind:"gusty", waterMotion:"none", lightRays:false, parallax:true }
    }
  ],
  rewards: {
    3: "pack", 6: "cash", 9: "milestone",
    12: "pack", 15: "special", 18: "milestone",
    21: "cash", 24: "expedition", 27: "milestone",
    30: "pack", 33: "cash", 36: "milestone",
    39: "special", 42: "pack", 45: "milestone",
    48: "cash", 51: "special", 54: "milestone"
  }
};