import type { ThemeId } from '../../domain/track/types'
import { COAST } from './coast'
import { MOUNTAIN } from './mountain'
import type { Theme } from './theme'

export const THEMES: Record<ThemeId, Theme> = { mountain: MOUNTAIN, coast: COAST }
