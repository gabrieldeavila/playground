# Pé na Tábua — plan

Running roadmap for the game. Update this file when something lands or the plan changes:
tick the box, add a short note on *how* it was done if a later task depends on it.

Goal: an original browser game in the spirit of 90s road-combat racers (Road Rash
was the reference). Everything stays original — our own names, characters, tracks,
models, textures and sounds, all generated in code. No assets or names from any
commercial game.

## Conventions (keep following these)

- Pure rules in `src/domain/` (no three.js, no DOM), each new rule with a `*.spec.ts`.
- Rendering in `src/render/`, audio in `src/audio/`, wiring in `src/game/` and `src/main.ts`.
- Small files, one thing each; split anything heading past ~200 lines.
- Code comments in Portuguese, like the rest of the codebase.
- Before calling something done: `pnpm typecheck`, `pnpm test`, and play it in the browser
  (headless Chromium + screenshots works; see "Testing in the browser" below).

## Done

- [x] Core racer: one course (Serra), 8 riders, track-space simulation, AI with rubber-banding
- [x] Combat: punch and kick, health, knockouts, crash and remount
- [x] Cockpit (first-person) view with gauges and gear display
- [x] Arcade chase camera, default view; **C** toggles chase/cockpit
- [x] Speed feel: FOV kicks, head inertia, angular shake (`render/camera/speed-feel.ts`)
- [x] Denser roadside: posts every 16 m, near trees, curve guardrails, overhead gantries, textured shoulder
- [x] Guardrails hold riders on the road (scrape + slow, no crash) — `domain/race/rails.ts`
- [x] Synthesized audio: engine (rpm-driven, shift cuts), wind, pass-by whooshes, scrape, impacts; **M** mutes
- [x] Radial speed blur + vignette post-processing (`render/post/`)
- [x] Civilian traffic: sedans and taxis in 4 fixed-speed lanes (2 each way), car crashes,
      2 s remount grace, bots dodge cars, horns from oncoming cars (`domain/traffic/`)
- [x] Weapons: club and chain (`ATTACKS` in `domain/race/attacks.ts`; punch + weapon in hand
      = weapon swing via `attackFor`). Viper/Dutch/Brick start armed, player bare-handed.
      Bare-handed punch steals (`disarm` event), knockOff drops it. Bots keep a wider gap and
      only swing within reach. Held in hand in both views (`render/held-weapon.ts`), HUD label,
      "WHACK!/GOT A CLUB!" messages, chain clang sound.

## To do (in order)

### 2. Police ← next
- [ ] Cop bikes that ride in the pack and hunt the player
- [ ] Caught while down or stopped → "busted": race lost + fine
- [ ] Siren sound, cop model, HUD warning when a cop is close

### 3. Career loop
- [ ] Prize money by finishing place
- [ ] Qualify (top N) to advance a level; each level = longer course
- [ ] Bike shop: 3–4 bikes (top speed, acceleration, handling, durability)
- [ ] Nitro on the faster bikes
- [ ] Bike damage separate from rider health; "wrecked" → repair cost
- [ ] Save progress in `localStorage`
- [ ] Screens: shop, level select / next race, standings with money

### 4. More courses
- [ ] City course with buildings (needs building props)
- [ ] Coastal road
- [ ] Desert
- [ ] Course select / level → course mapping

### 5. Road hazards
- [ ] Jumps: fast crests launch the bike (airborne state, landing)
- [ ] Oil slicks
- [ ] Animals crossing (cows, deer)

### 6. Personality
- [ ] Grudges: bots remember who hit them and come after you
- [ ] Crash animation: rider flies off and runs back to the bike

### 7. Later / maybe
- [ ] Two-player split-screen
- [ ] Synthesized rock soundtrack
- [ ] Tune traffic density / bot car-crash rate after playtesting
  (simulated: bots hit a car 0–3 times per ~100 s race)
- [ ] Weapons follow-ups: weapons lying on the road to pick up, more kinds (pipe, cattle prod),
  weapon kept between races once the career loop exists. Bots almost never steal from each
  other (they rarely punch an armed rider bare-handed) — fine for now.

## Testing in the browser

There's no project run script yet. What worked:

1. `pnpm dev --port 5199 --strictPort` in the background, poll until `curl` answers.
2. `playwright-core` installed in a scratch dir, launching the cached Chromium at
   `~/Library/Caches/ms-playwright/chromium-1243/.../Google Chrome for Testing`.
3. Press Enter, hold ArrowUp, take screenshots, collect console errors.
4. Stop the server with `lsof -ti:5199 -sTCP:LISTEN | xargs kill`.

Headless can't confirm audio by ear — check for console errors only.
