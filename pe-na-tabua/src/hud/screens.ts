import type { Verdict } from '../domain/career/career'
import type { Rider } from '../domain/race/types'
import type { CourseRow } from './course-rows'
import { coursesHtml } from './courses-html'
import type { LevelRow } from './level-rows'
import { levelsHtml } from './levels-html'
import type { ModeRow } from './mode-rows'
import { modesHtml } from './modes-html'
import { resultsHtml } from './results-html'

const title = (outlawChampion: boolean) => `
  <h1>PÉ NA TÁBUA</h1>${outlawChampion ? '\n  <p class="badge-outlaw">★ OUTLAW CHAMPION ★</p>' : ''}
  <p class="tagline">Mountain roads, coastal highways. Eight riders. No rules.</p>
  <dl class="controls">
    <dt>↑ / W</dt><dd>Throttle</dd>
    <dt>↓ / S</dt><dd>Brake</dd>
    <dt>← → / A D</dt><dd>Steer</dd>
    <dt>J / Z</dt><dd>Punch (swings your weapon if you have one)</dd>
    <dt>K / X</dt><dd>Kick</dd>
    <dt>C</dt><dd>Chase / cockpit view</dd>
    <dt>M</dt><dd>Mute</dd>
    <dt>R / Esc</dt><dd>Restart / quit race</dd>
  </dl>
  <p class="cta">Press ENTER to race</p>
`

// Telas de título, níveis e resultado por cima do jogo.
export class Screens {
  constructor(private readonly el: HTMLElement) {}

  // Quem zerou o Outlaw ganha a estrela no título.
  showTitle(outlawChampion: boolean): void {
    this.show(title(outlawChampion))
  }

  showModes(rows: ModeRow[], selected: string): void {
    this.show(modesHtml(rows, selected))
  }

  showLevels(rows: LevelRow[], selected: number, mode: string, champion: boolean): void {
    this.show(levelsHtml(rows, selected, mode, champion))
  }

  showCourses(rows: CourseRow[], selected: string, mode: string, level: number): void {
    this.show(coursesHtml(rows, selected, mode, level))
  }

  showResults(order: Rider[], playerId: number, busted: boolean, verdict: Verdict): void {
    this.show(resultsHtml(order, playerId, busted, verdict))
  }

  hide(): void {
    this.el.hidden = true
  }

  private show(html: string): void {
    this.el.innerHTML = html
    this.el.hidden = false
  }
}
