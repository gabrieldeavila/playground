// Corridas sem tela, só o domínio: quanto cada tipo de jogador passa de fase.
// pnpm sim [--course Serra] [--mode outlaw] [--level 2] [--races 200] [--no-cops] [--matrix]
import { difficultyById } from '../src/domain/career/difficulty'
import { LEVELS } from '../src/domain/career/levels'
import { COURSES } from '../src/domain/track/courses/courses'
import { formatHeader, formatMatrix, formatRow } from './format-report'
import { parseArgs } from './parse-args'
import { PLAYER_MODELS } from './player-models'
import { simulate } from './simulate'

const args = parseArgs(process.argv.slice(2), LEVELS.length)
const difficulty = difficultyById(args.mode)
const course = COURSES.find((c) => c.name === args.course)!
const noCops = args.cops ? '' : ', no cops'

if (args.matrix) {
  console.log(`${course.name}, ${difficulty.name}${noCops}: ${args.races} races per cell, top ${difficulty.qualifyPlace} qualifies (qualify / busted)\n`)
  const rows = LEVELS.map((level) => PLAYER_MODELS.map((model) => simulate(course, level, difficulty, model, args.races, args.cops)))
  console.log(formatMatrix(PLAYER_MODELS.map((m) => m.name), rows))
} else {
  const level = LEVELS[args.level - 1]
  console.log(`${course.name}, ${difficulty.name} level ${level.number}${noCops}: ${args.races} races per model, top ${difficulty.qualifyPlace} qualifies\n`)
  console.log(formatHeader())
  for (const model of PLAYER_MODELS) console.log(formatRow(model.name, simulate(course, level, difficulty, model, args.races, args.cops)))
}
