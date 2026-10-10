# Pé na Tábua

An open-source motorbike combat racer for the browser: eight riders on mountain
roads, coastal highways and city streets, punching and kicking their way to the finish
line through civilian traffic — with the police waiting on the shoulder. Get knocked
down next to a cop and you're busted. Downtown, watch out for pedestrians, roadwork
cones and potholes, and brake for the corners.

Pick a mode — **Joyride** (relaxed, cops never arrest you), **Racer** or **Outlaw**
(hard to finish) — and work through five levels. Finish in the top places on every course
of a level to unlock the next one, with longer courses, faster rivals and more police.
Each mode keeps its own progress, saved in the browser.

Inspired by the 90s road-combat racing genre. All code and art are original —
every model, texture and sound is generated in code. This project is not
affiliated with or endorsed by any publisher, and contains no assets or code
from any commercial game.

## Play

**Play it online: https://playground-mu-puce.vercel.app**

Or run it locally:

```sh
pnpm install
pnpm dev
```

| Key | Action |
| --- | --- |
| ↑ / W | Throttle |
| ↓ / S | Brake |
| ← → / A D | Steer |
| J / Z | Punch — or swing your club/chain. Punch an armed rider bare-handed to steal it |
| K / X | Kick |
| C | Switch between chase and cockpit view |
| M | Mute |
| R | Restart race |
| Esc | Quit race / back in menus |
| ↑ ↓ + Enter | Choose mode, level and course |

## Develop

```sh
pnpm test       # unit tests for the game rules
pnpm typecheck
pnpm build
pnpm sim        # headless races: how often simulated players qualify
```

`pnpm sim` runs the game rules without graphics, with the bot brain driving the player
plus random lapses. Options: `--course Serra|Litoral|Centro`, `--mode joyride|racer|outlaw`,
`--level 1-5`, `--races N`, `--no-cops`, and `--matrix` (every level at once). Use it
to check difficulty changes before playtesting.

Built with [Three.js](https://threejs.org), TypeScript and Vite.

```
src/
  domain/   pure game rules, no three.js (tested)
    track/  course definition -> segments -> 3D centerline, props
    race/   motion, combat, collisions, AI, standings
    traffic/ civilian cars and taxis: lanes, movement, crashes, horns
    police/ cops: patrol, chase, busting the player
    street/ city hazards: pedestrians, roadwork cones, potholes
    career/ levels, difficulty modes, race setup, progress
  data/     saving progress in localStorage
  render/   three.js: road, terrain, sky, sea, props, bikes, cameras, speed blur
    theme/  per-course look: sky, fog, light, terrain colors, sea, skyline
  audio/    Web Audio: synthesized engine, wind, pass-by whooshes, impacts
  hud/      HTML overlay and screens
  input/    keyboard
  game/     session flow and wiring between domain and render
sim/        headless race simulation (pnpm sim)
```

The race runs entirely in *track space* (distance along the road + lateral
offset), like classic pseudo-3D racers. The renderer converts that to world space
with `poseAt`, so gameplay and graphics can evolve independently.

## License

MIT
