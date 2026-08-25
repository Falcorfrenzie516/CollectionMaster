# Collection Master — Version 1.1

Core loop prototype.

## What works

- Start Collecting → 2 starter packs
- Open packs (4 cards each)
- Rarity odds (Basic → Rainbow)
- Rank system (1–5)
- Rank 5 duplicates sell for 50% of earnings
- Live income from owned cards
- Whole-number money
- Save / Load (localStorage)
- Simple dark UI

## How to run

1. Open `index.html` in a modern browser  
   (or use any local static server)

2. Click **Start Collecting**

3. Watch income tick every second

4. Buy more packs when you have $100

## File structure

```
collection-master-v1.1/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js              # Game actions + debug helpers
│   ├── ui.js                # Simple UI wiring
│   ├── data/
│   │   └── dinosaurs.js     # 12 dinos + multipliers
│   └── systems/
│       ├── packs.js         # Pack opening logic
│       ├── collection.js    # Ownership, rank-up, earnings
│       └── save.js          # localStorage save/load
└── README.md
```

## Console helpers

Open browser console and use:

```js
CM.debugState()        // print current state
CM.debugGiveMoney(500) // give money for testing
CM.resetGame()         // wipe save
```

## Next steps (v1.2+)

- Conveyor pack shop (live offers)
- Path system (20 nodes, income unlock)
- Prestige
- Collection Book pages
- Card visuals / rarity frames
