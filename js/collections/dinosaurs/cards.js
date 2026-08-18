export const DINOSAURS=[
["troodon","Troodon","carnivore",1,4,"ancient_forest"],
["pachycephalosaurus","Pachycephalosaurus","herbivore",1,4,"ancient_forest"],
["carnotaurus","Carnotaurus","carnivore",2,8,"ancient_forest"],
["iguanodon","Iguanodon","herbivore",2,8,"fern_plains"],
["allosaurus","Allosaurus","carnivore",3,12,"rocky_highlands"],
["stegosaurus","Stegosaurus","herbivore",3,12,"fern_plains"],
["raptor","Raptor","carnivore",4,16,"rocky_highlands"],
["ankylosaurus","Ankylosaurus","herbivore",4,16,"lush_valley"],
["spinosaurus","Spinosaurus","carnivore",5,20,"prehistoric_wetlands"],
["brachiosaurus","Brachiosaurus","herbivore",5,20,"lush_valley"],
["trex","T. rex","carnivore",6,24,"predator_territory"],
["triceratops","Triceratops","herbivore",6,24,"predator_territory"]
].map(([id,name,diet,valueTier,baseEarningsPerSecond,primaryEnvironment])=>({id,name,diet,valueTier,baseEarningsPerSecond,primaryEnvironment,collection:"dinosaurs"}));