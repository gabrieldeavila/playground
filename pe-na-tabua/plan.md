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
- [x] Synthesized rock soundtrack (`audio/music/`): original 24-bar loop in E minor at 144 bpm (~40 s), verse with
      palm-muted chug + gallop bass, chorus with open power chords and a square-wave lead. Song is data
      (`song.ts`, 16-char patterns per bar), `notes-at.ts` reads a step (spec), `MusicPlayer` schedules 150 ms
      ahead of the audio clock. Own bus into the limiter (not the race master), so it plays on the menus too:
      0.55 on menus, 0.38 racing; **M** mutes it with everything else. Same pass lowered the engine
      (gain 0.16+0.1·throttle → 0.09+0.06·throttle, a bit less treble). Volumes picked blind — tune by ear.
- [x] Sound screen: **O** on the title. Master / Music / Engine / Effects, 0–10 each (default 7 = the tuned mix,
      gain = (level/7)², so 10 ≈ 2×). Rules in `domain/settings/volumes.ts`, menu state in `game/sound-menu.ts`,
      saved apart from the career in `pe-na-tabua.volumes.v1` (`data/parse-volumes.ts`). In `SoundRig`:
      engine → engine level, everything else → effects level, both → race bus (on/off) → master; music → master.
- [x] Radial speed blur + vignette post-processing (`render/post/`)
- [x] Civilian traffic: sedans and taxis in 4 fixed-speed lanes (2 each way), car crashes,
      2 s remount grace, bots dodge cars, horns from oncoming cars (`domain/traffic/`)
- [x] Weapons: club and chain (`ATTACKS` in `domain/race/attacks.ts`; punch + weapon in hand
      = weapon swing via `attackFor`). Viper/Dutch/Brick start armed, player bare-handed.
      Bare-handed punch steals (`disarm` event), knockOff drops it. Bots keep a wider gap and
      only swing within reach. Held in hand in both views (`render/held-weapon.ts`), HUD label,
      "WHACK!/GOT A CLUB!" messages, chain clang sound.
- [x] Police (`domain/police/`): cops are riders with `role: 'cop'` (left out of standings/finish),
      parked on the shoulder at 30% / 65% of the course (`POLICE` in `roster.ts`). They start chasing
      when the player gets within 70 m, ride 5% faster (`Rider.speedFactor`, reusable for bikes in
      the shop), hold alongside without ever slowing the player, and swing a nightstick (a club, so
      it can be stolen). Busted = a cop within ~4 m while the player is down or nearly stopped for
      0.8 s → `phase: 'busted'`, "BUSTED!" results with the player as DNF. Light bar, HUD warning
      "POLICE ▲ 85 M", blue progress dot, siren panned to the cop.
      Tuning (20 simulated races): passive rider busted 8/20, rider who dodges and fights back 2/20.
- [x] Lane-changing traffic (`domain/traffic/lane-change.ts`): every ~25 s on average a car tries to move to
      the other lane of its direction. Amber blinkers for 1.2 s (`render/car-blinkers.ts`), then a 2.2 s slide while
      its speed blends to the new lane's. It only goes if no car in either lane comes within 14 m during the whole
      maneuver (speed blends linearly, so checking the start and end of the slide is enough), and never starts within
      120 m of another car that is mid-change. Riders aren't checked: a car can pull out in front of you, with warning.
      A spec runs dense traffic for 5 minutes and asserts no two cars ever overlap. Sim: difficulty within noise.
- [x] **City course: Centro** (done ahead of 4, on request). Third course on every level, so a level now needs 3 clears.
  - Course `courses/centro.ts`: ~5.5 km to the finish (Serra's length; at 4 km Outlaw was 3–5× easier) of straight
    avenues, 90° corners (curve 0.025, radius 40 m) and two chicanes.
    `Scenery.urban` turns on: flat ground (`render/terrain-shape.ts` `Ground = 'valley' | 'sea' | 'flat'`), sidewalk
    up to the building fronts, street lamps instead of posts (`track/city-props.ts`), rows of buildings
    (`block`/`tower`/`shop`, `render/building-models.ts`, tinted per instance) set just past `RIDE_LIMIT` so they act
    as the street's walls (no colliders). Theme `city`: dusk smog sky, skyline backdrop (`BackdropStyle.shape`), grey
    curb instead of the red/white rumble (`Theme.rumble`).
  - Corners can't be taken flat out, so the AI brakes: `race/corner-speed.ts` looks 160 m ahead and caps the speed
    so a bot can brake down to each curve's grip speed. Every Serra/Litoral curve is above top speed (spec), so those
    sims are unchanged (checked against the same seeds).
  - Street hazards in `domain/street/`, on `race.street` (empty off the city, own RNG so other courses draw the same):
    - **Pedestrians** wait on the sidewalk and cross only when no car will pass their spot during the whole crossing
      (`safe-to-cross.ts`), and never step out right in front of a bike. Crosswalks every ~220 m on straights plus
      jaywalkers. Hit one: they fly and lie down 3 s, then walk to the nearest sidewalk. Under 90 km/h you only lose
      8 m/s and wobble ("OI! WATCH IT!"); faster, you crash too (15 damage). Cars and pedestrians never touch.
      The player hitting someone alerts any cop within 300 m (`alertCopsNear`).
    - **Roadwork cones**: rows on the centre line or a lane divider; hit = cone flies, −1.5 m/s. Lane-changing cars
      knock them too.
    - **Potholes**: −5 m/s at top speed (scaled), sideways jolt, never a crash.
    - Density = `Challenge.hazards` (0.5 at intensity 0 → 1.4 at 5) → `RaceSetup.hazardScale`.
  - `dodge-obstacles.ts` (was `dodge-cars.ts`): bots and cops dodge cones, pedestrians and potholes like cars. The sim
    player's lapses hide the street too. HUD: "OI! WATCH IT!", "PEDESTRIAN! WIPEOUT!", "CONES!", "POTHOLE!".
    Sounds: cartoon yelp, plastic tok, pothole thud. `pnpm sim` counts pedestrians hit (`peds`).
  - Sim, average player, levels 1–5, 60 races per cell (Serra in brackets): Joyride 92–100% (casual 85→63%),
    Racer 58/68/22/38/15% (72/65/28/16/8), Outlaw 7/22/12/2/2% (5/6/2/3/1). Same shape, within noise except Racer 4
    and Outlaw 2, a bit easier. Bots hit ~0.1 pedestrians per race: they see them. People will hit more; playtest
    whether the crash speed (90 km/h), the pedestrian count and the corner braking feel right.

## To do (in order)

### 3. Phases, levels and difficulty ✓

Terms (in code a phase is a `course`; `phase` is already `RacePhase`):
- **Course**: a road layout plus its look. Serra (mountain, sunset) and Litoral (coast, midday, sea on the left).
- **Level**: 5 tiers; every course of a level must be cleared to unlock the next. Higher level = longer courses.
- **Difficulty / mode**: Joyride, Racer, Outlaw. **Each mode has its own career** (changed from the first idea of
  one career you can only lower: simpler to explain, and the Outlaw badge still means clearing Outlaw).

How it fits together (`domain/career/`):
- `levels.ts`: only `lengthScale` per level. Everything else comes from the mode.
- `challenge.ts`: every knob on one **intensity** scale: 0 = easiest, 1 = the game as tuned before (Outlaw
  level 1), 5 = Outlaw level 5. `CHALLENGE_STEPS` holds a point per integer, `challengeAt` interpolates
  (armed bots and cops rounded), `copLayout(n)` places the cops (2 → 0.3/0.65 as before).
- `difficulty.ts`: per mode, intensity per level, qualify place, and `canBust` / `catchUp`.
  Joyride [0, .08, .16, .24, .32] top 5, cops never arrest, catch-up boost. Racer [.4, .48, .62, .8, 1]
  top 3 (its last level = Outlaw level 1). Outlaw [1..5] top 3.
- `race-setup.ts`: `buildRaceSetup(course, level, difficulty)` → course (stretched, seed per level), riders,
  traffic scale, `RaceRules`. The track depends only on course + level, so modes share it.
- `RaceRules` on `Race` (`domain/race/rules.ts`): cop speed, cop swing rate, bust time, `canBust`, car crash
  damage, `catchUp` (player top speed boost when far behind the leader, `race/catch-up.ts`). Rubber-banding and
  alert range didn't need to vary, so they stay constants.
- `career.ts`: `Careers` = one `Career` per mode; `recordResult(..., difficulty)`; `courseAfter` picks the next
  course (retry if not qualified, next uncleared if qualified, next in list when practicing).

Done:
- [x] **3a. Race setup from config.** `Course` = `start` / `body` / `finish`; `stretchCourse` repeats the body
  (mirrored curves on odd repeats). `createRace(track, riders, seed, { trafficScale, rules })`.
- [x] **3b. Levels.** `Session` modes `title | modes | levels | courses | racing | results`. `RaceCatalog` caches
  setups per mode/level/course and tracks per level/course. Keys per screen in `game/key-actions.ts`. Track
  changes swap the scenery (`game/track-scenery.ts`, old meshes freed via `render/dispose-tree.ts`); `RidersView`
  rebuilds the bikes when the lineup changes.
- [x] **3c. Difficulty modes.** Mode picker after the title (progress per mode), mode name on level select,
  ★ OUTLAW CHAMPION ★ on the title. Save = `{ difficulty, careers }` in `localStorage` key
  `pe-na-tabua.save.v1` (`data/parse-save.ts`: a broken career resets only itself).
- [x] **3d. Themes + Litoral.** Courses have `theme` + `scenery` (tree/rock mix, `seaSide`). `render/theme/`
  holds sky, sun, fog, lights, backdrop shape, terrain palette and sea colour per theme; `WorldView.setTheme`
  swaps them. On the sea side the terrain drops below a water plane (`render/sea.ts`) and no props spawn past
  6 m. Course select screen per level (km, CLEARED / TO CLEAR); results say "1 more course to clear level N".
- Checked: Serra/Outlaw level 1 sim identical to before all of this (same seeds); typecheck, tests, build;
  headless Chromium for every screen, both courses, theme swaps, saves. The results screen itself wasn't
  reached in the browser (a race takes ~100 s headless); `session.spec.ts` and the text specs cover it.

Open: playtest Racer level 3 (second cop arrives; sim average drops 65% → 28%). The sim player is a guess.

### 4. Career extras ← next
- [ ] Prize money by finishing place
- [ ] Bike shop: 3–4 bikes (top speed, acceleration, handling, durability)
- [ ] Nitro on the faster bikes
- [ ] Bike damage separate from rider health; "wrecked" → repair cost
- [ ] Shop screen, standings with money

### 4b. More courses
- [ ] Desert
- [x] City course with buildings — Centro, see Done

### 5. Road hazards (city ones done: pedestrians, cones, potholes — see Done)
- [ ] Jumps: fast crests launch the bike (airborne state, landing)
- [ ] Oil slicks
- [ ] Animals crossing (cows, deer)

### 6. Personality
- [ ] Grudges: bots remember who hit them and come after you
- [ ] Crash animation: rider flies off and runs back to the bike

### 7. Later / maybe
- [ ] Two-player split-screen
- [ ] Tune traffic density / bot car-crash rate after playtesting
  (simulated: bots hit a car 0–3 times per ~100 s race)
- [ ] Police follow-ups: fine money once the career loop exists; cops could give up after being
  knocked off. (More cops on later levels: done in 3.)
- [ ] Weapons follow-ups: weapons lying on the road to pick up, more kinds (pipe, cattle prod),
  weapon kept between races once the career loop exists. Bots almost never steal from each
  other (they rarely punch an armed rider bare-handed) — fine for now.

## Simulating races

`pnpm sim [--course Serra|Litoral|Centro] [--mode joyride|racer|outlaw] [--level N] [--races N] [--no-cops] [--matrix]`
— headless, domain only (no three.js, no DOM), ~100 races in a few seconds per model:

- Node 24 runs the `.ts` files directly; a small `module.registerHooks` resolve hook adds `.ts` to
  the extensionless imports.
- The player is driven by `aiInput` with an `AiProfile` (pace = throttle target, aggression = fights back)
  plus **lapses**: random moments where the player's input is computed with `cars: []` (didn't see the car).
  - casual: pace 0.93, aggression 0, a 1.2 s lapse every ~8 s
  - average: pace 0.97, aggression 0.4, a 1.0 s lapse every ~15 s
  - skilled: pace 1.0, aggression 0.7, a 0.8 s lapse every ~40 s
- Step at 1/120 s (same as `fixed-loop.ts`) until finished, busted, or 400 s; collect `RaceEvent`s.
- Race n uses the same seed as the game's race n (`n * 7919`), so results are reproducible.

Before modes existed (today's tuning = Outlaw level 1, Serra, 200 races): average player qualified 5%,
skilled 23%, perfect bot 27%; about half of all races ended busted, mostly after a nightstick knockout at
the second cop. Without cops: average 55%, skilled 84%. The police are what make it hard.

Tuned result, Serra, qualify % for the **average** player (Litoral is within a few points):

| level | Joyride (top 5) | Racer (top 3) | Outlaw (top 3) |
|---|---|---|---|
| 1 | 100% | 72% | 5% |
| 2 | 95% | 65% | 6% |
| 3 | 100% | 28% | 2% |
| 4 | 97% | 16% | 3% |
| 5 | 98% | 8% | 1% |

Casual on Joyride: 85% → 48% from level 1 to 5. Skilled on Racer: 96% → 31%.
Lesson from tuning: discrete jumps (a second cop, another armed bot) cost far more than the continuous
knobs, because each knockout costs a lot of time. Space them out so a level adds at most one.

## Testing in the browser

There's no project run script yet. What worked:

1. `pnpm dev --port 5199 --strictPort` in the background, poll until `curl` answers.
2. `playwright-core` installed in a scratch dir, launching the cached Chromium at
   `~/Library/Caches/ms-playwright/chromium-1243/.../Google Chrome for Testing`.
3. Press Enter, hold ArrowUp, take screenshots, collect console errors. Headless renders a few fps:
   wait ~1.5 s after each key press before reading the screen. Seed a save with
   `localStorage.setItem('pe-na-tabua.save.v1', ...)` + reload to test later levels.
4. Stop the server with `lsof -ti:5199 -sTCP:LISTEN | xargs kill`.

Headless can't confirm audio by ear — check for console errors only.
