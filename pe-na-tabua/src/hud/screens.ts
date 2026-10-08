import type { Rider } from '../domain/race/types'
import { formatTime, ordinal } from './format-time'

const TITLE = `
  <h1>PÉ NA TÁBUA</h1>
  <p class="tagline">Mountain road. Eight riders. No rules.</p>
  <dl class="controls">
    <dt>↑ / W</dt><dd>Throttle</dd>
    <dt>↓ / S</dt><dd>Brake</dd>
    <dt>← → / A D</dt><dd>Steer</dd>
    <dt>J / Z</dt><dd>Punch (swings your weapon if you have one)</dd>
    <dt>K / X</dt><dd>Kick</dd>
    <dt>C</dt><dd>Chase / cockpit view</dd>
    <dt>M</dt><dd>Mute</dd>
  </dl>
  <p class="cta">Press ENTER to race</p>
`

// Telas de título e resultado por cima do jogo.
export class Screens {
  constructor(private readonly el: HTMLElement) {}

  showTitle(): void {
    this.show(TITLE)
  }

  showResults(order: Rider[], playerId: number): void {
    const rows = order.map((rider, i) => {
      const time = rider.finishTime === null ? 'DNF' : formatTime(rider.finishTime)
      const mine = rider.id === playerId ? ' class="me"' : ''
      return `<tr${mine}><td>${ordinal(i + 1)}</td><td>${rider.name}</td><td>${time}</td></tr>`
    })
    this.show(`
      <h2>RESULTS</h2>
      <table class="results">${rows.join('')}</table>
      <p class="cta">Press ENTER to race again</p>
    `)
  }

  hide(): void {
    this.el.hidden = true
  }

  private show(html: string): void {
    this.el.innerHTML = html
    this.el.hidden = false
  }
}
