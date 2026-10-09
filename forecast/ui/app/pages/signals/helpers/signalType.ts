import type { SignalType } from "../signalsApi";

/** Snapshots written before pullbacks were told apart only carry trend_start. */
export const signalTypeOf = (signal: {
  trend_start: boolean;
  signal_type?: SignalType;
}): SignalType =>
  signal.signal_type ?? (signal.trend_start ? "trend_start" : "sideways");
