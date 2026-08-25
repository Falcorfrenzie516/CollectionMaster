# Collection Master — Build v1.2.1

Mobile-first hub + core loop.

## What's new in v1.2.1

- Visible **build number** (`v1.2.1`) under the title
- **Reset Progress** button on Home (clears all cards, money, and progress)

## What's in v1.2

- **Home page** (Collector's Room) with tappable areas
- **Persistent top tabs** on every page
- **Mobile-first** layout (fits phones + desktop)
- Same core loop as v1.1 (packs, ranks, income, save)

## Pages

| Tab / Object      | Status                          |
|-------------------|---------------------------------|
| Home              | Working hub + Reset             |
| Path              | Placeholder                     |
| Conveyor          | Basic buy pack ($100)           |
| Expeditions       | Placeholder                     |
| Collections       | Working card list               |
| Events            | Placeholder                     |
| Achievements      | Placeholder                     |
| Tokens            | Placeholder                     |

## How to run

1. Unzip
2. Open `index.html` in a browser (or local static server)
3. Tap **Start Collecting** on the Home page

## File structure

```
collection-master-v1.2/
├── index.html
├── css/style.css
├── js/
│   ├── main.js
│   ├── ui.js
│   ├── data/dinosaurs.js
│   └── systems/
│       ├── packs.js
│       ├── collection.js
│       └── save.js
└── README.md
```

## Console helpers

```js
CM.debugState()
CM.debugGiveMoney(5000)
CM.resetGame()
```

## Next (v1.3 ideas)

- Path nodes + token sliding
- Scaling pack prices / conveyor offers
- Collection Book pages per dinosaur
- Prestige
