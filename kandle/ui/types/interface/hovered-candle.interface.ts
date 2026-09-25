export interface HoveredCandle {
  time: string | number | { year: number; month: number; day: number };
  open: number;
  high: number;
  low: number;
  close: number;
}
