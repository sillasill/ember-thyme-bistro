# Ember & Thyme — Bistro Rush

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/sillasill/ember-thyme-bistro/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/sillasill/ember-thyme-bistro/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A one-chef race against the dinner rush: chop it, grill it, plate it, and serve it before the order walks out. A complete cooking game that runs in a desktop browser from static files, with no network request.

## The game

You are the only chef in Ember & Thyme, a tiny bistro with a big dinner rush. Orders land on the board with a patience timer. Take ingredients from the pantry, chop tomatoes, lettuce and onions on the board, grill patties on the grill (grab them before they burn), build each dish on the plate at the assembly counter, and serve it at the pass. Serve fast for tips, chain clean serves for a combo multiplier, and bank 150 coins before the 3-minute shift ends.

Five original recipes: Ember Classic, Cheesy Melt, Garden Bowl, Sunrise Bun and Double Trouble.

## Controls

- **WASD / arrow keys** — move the chef
- **E** — use a station (hold E to chop)
- **Mouse** — click a station to walk there and use it; click the floor to walk
- **M** — mute

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no dependencies, no network: the game is plain static files under `game/`.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `game/index.html` — the game page
- `game/src/` — the game's own source, one job per file: `config.js` (recipes and tuning), `kitchen.js` (floor plan), `orders.js` (the order board), `chef.js` (movement), `world.js` (rules), `render.js` (drawing), `input.js` (keyboard and mouse), `audio.js` (synthesized sound), `shots.js` (screenshot scenes)
- `screenshots/` — real renders of the game's own code
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=bfyeqrq3&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
