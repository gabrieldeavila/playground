import { DIFFICULTIES, type DifficultyId } from '../src/domain/career/difficulty'
import { COURSES } from '../src/domain/track/courses/courses'

export interface SimArgs {
  course: string
  mode: DifficultyId
  level: number // 1..LEVELS.length
  races: number // por modelo de jogador (e por nível, no --matrix)
  cops: boolean // false = tira a polícia, para ver quanto ela pesa
  matrix: boolean // todos os níveis do modo, só passa/preso por modelo
}

// pnpm sim [--course Serra] [--mode outlaw] [--level 2] [--races 200] [--no-cops] [--matrix]
export function parseArgs(argv: string[], levels: number): SimArgs {
  const option = (flag: string) => {
    const i = argv.indexOf(flag)
    return i < 0 ? undefined : argv[i + 1]
  }
  const args: SimArgs = {
    course: option('--course') ?? COURSES[0].name,
    mode: (option('--mode') ?? 'outlaw') as DifficultyId,
    level: Number(option('--level') ?? 1),
    races: Number(option('--races') ?? 100),
    cops: !argv.includes('--no-cops'),
    matrix: argv.includes('--matrix'),
  }
  if (!COURSES.some((c) => c.name === args.course)) throw new Error(`--course: ${COURSES.map((c) => c.name).join(', ')}`)
  if (!DIFFICULTIES.some((d) => d.id === args.mode)) throw new Error(`--mode: ${DIFFICULTIES.map((d) => d.id).join(', ')}`)
  if (!Number.isInteger(args.level) || args.level < 1 || args.level > levels) throw new Error(`--level vai de 1 a ${levels}`)
  if (!Number.isInteger(args.races) || args.races < 1) throw new Error('--races precisa ser um inteiro positivo')
  return args
}
