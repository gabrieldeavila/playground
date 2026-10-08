# Pé na Tábua

An open-source motorbike combat racer for the browser: eight riders on a mountain
road, punching and kicking their way to the finish line through civilian traffic.

Inspired by the 90s road-combat racing genre. All code and art are original —
every model, texture and sound is generated in code. This project is not
affiliated with or endorsed by any publisher, and contains no assets or code
from any commercial game.

## Play

```sh
pnpm install
pnpm dev
```

| Key | Action |
| --- | --- |
| ↑ / W | Throttle |
| ↓ / S | Brake |
| ← → / A D | Steer |
| J / Z | Punch |
| K / X | Kick |
| C | Switch between chase and cockpit view |
| M | Mute |
| R | Restart race |

## Develop

```sh
pnpm test       # unit tests for the game rules
pnpm typecheck
pnpm build
```

Built with [Three.js](https://threejs.org), TypeScript and Vite.

```
src/
  domain/   pure game rules, no three.js (tested)
    track/  course definition -> segments -> 3D centerline, props
    race/   motion, combat, collisions, AI, standings
    traffic/ civilian cars and taxis: lanes, movement, crashes, horns
  render/   three.js: road, terrain, sky, props, bikes, cameras, speed blur
  audio/    Web Audio: synthesized engine, wind, pass-by whooshes, impacts
  hud/      HTML overlay and screens
  input/    keyboard
  game/     session flow and wiring between domain and render
```

The race runs entirely in *track space* (distance along the road + lateral
offset), like classic pseudo-3D racers. The renderer converts that to world space
with `poseAt`, so gameplay and graphics can evolve independently.

## License

MIT
