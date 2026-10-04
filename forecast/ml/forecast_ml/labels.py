"""Forward trade outcomes for supervised training and evaluation."""

import numpy as np
import pandas as pd

ATR_PERIOD = 14
OUTCOME_COLUMNS = [
    "ticker",
    "date",
    "entry_date",
    "exit_date",
    "label",
    "trade_return_pct",
    "exit_reason",
    "bars_held",
    "target_return_pct",
    "stop_return_pct",
]


def adjusted_ohlc(group: pd.DataFrame) -> pd.DataFrame:
    """Return split/dividend-adjusted OHLC for one ticker, preserving its index."""
    close = group["close"].astype(float)
    adjustment = group["adjusted_close"].astype(float) / close
    return pd.DataFrame(
        {
            "open": group["open"].astype(float) * adjustment,
            "high": group["high"].astype(float) * adjustment,
            "low": group["low"].astype(float) * adjustment,
            "close": group["adjusted_close"].astype(float),
        },
        index=group.index,
    )


def average_true_range_pct(prices: pd.DataFrame, period: int = ATR_PERIOD) -> pd.Series:
    """Causal ATR as a fraction of the close, using adjusted prices of one ticker."""
    previous_close = prices["close"].shift(1)
    true_range = pd.concat(
        [
            prices["high"] - prices["low"],
            (prices["high"] - previous_close).abs(),
            (prices["low"] - previous_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    return true_range.rolling(period, min_periods=period).mean() / prices["close"]


def _simulate_ticker(
    prices: pd.DataFrame,
    target_returns: np.ndarray,
    stop_returns: np.ndarray,
    horizon_bars: int,
) -> dict[str, np.ndarray]:
    """Vectorized barrier simulation for every signal row of one ticker."""
    open_, high, low = (prices[c].to_numpy(dtype=float) for c in ("open", "high", "low"))
    close = prices["close"].to_numpy(dtype=float)
    rows = len(prices) - horizon_bars
    entry = open_[1 : rows + 1]
    target_price = entry * (1 + target_returns[:rows])
    stop_price = entry * (1 - stop_returns[:rows])

    exit_offset = np.full(rows, horizon_bars)
    exit_price = close[horizon_bars : horizon_bars + rows].copy()
    reason = np.full(rows, "horizon", dtype=object)
    label = np.zeros(rows, dtype="int8")
    resolved = np.zeros(rows, dtype=bool)

    for offset in range(1, horizon_bars + 1):
        candle = slice(offset, offset + rows)
        candle_open, candle_high, candle_low = open_[candle], high[candle], low[candle]
        stop_gap = candle_open <= stop_price
        target_gap = ~stop_gap & (candle_open >= target_price)
        inside = ~stop_gap & ~target_gap
        hit_target = inside & (candle_high >= target_price)
        hit_stop = inside & (candle_low <= stop_price)
        events = {
            "stop_gap": (stop_gap, candle_open, 0),
            "target_gap": (target_gap, candle_open, 1),
            "stop_ambiguous_bar": (hit_target & hit_stop, stop_price, 0),
            "stop": (hit_stop & ~hit_target, stop_price, 0),
            "target": (hit_target & ~hit_stop, target_price, 1),
        }
        for name, (mask, price, success) in events.items():
            mask = mask & ~resolved
            exit_price[mask] = price[mask]
            exit_offset[mask] = offset
            reason[mask] = name
            label[mask] = success
            resolved |= mask

    return {
        "entry_price": entry,
        "exit_price": exit_price,
        "exit_offset": exit_offset,
        "reason": reason,
        "label": label,
    }


def build_trade_outcomes(
    candles: pd.DataFrame,
    target_pct: float = 0.05,
    horizon_bars: int = 10,
    stop_pct: float = 0.03,
    target_atr: float | None = None,
    stop_atr: float | None = None,
) -> pd.DataFrame:
    """Simulate next-open entries and return label plus gross realized return.

    Signals are assumed to be generated after the current candle closes and entered
    at the next candle's adjusted open. A gap through a barrier exits at the open;
    if target and stop are touched within the same candle, the stop executes first.
    Trades with no barrier touch exit at the adjusted close of the horizon candle.
    The final ``horizon_bars`` rows per ticker are omitted because their outcomes
    are not observable yet.

    When ``target_atr`` and ``stop_atr`` are given, barriers are multiples of the
    signal candle's ATR (as a fraction of its close) instead of fixed percentages,
    so volatile and quiet tickers face comparable difficulty. Rows without enough
    history for the ATR are omitted.
    """
    atr_mode = target_atr is not None or stop_atr is not None
    if atr_mode:
        if target_atr is None or stop_atr is None or target_atr <= 0 or stop_atr <= 0:
            raise ValueError("target_atr e stop_atr precisam ser ambos positivos")
    else:
        if target_pct <= 0:
            raise ValueError("target_pct precisa ser positivo")
        if not 0 < stop_pct < 1:
            raise ValueError("stop_pct precisa estar entre 0 e 1")
    if horizon_bars <= 0:
        raise ValueError("horizon_bars precisa ser positivo")
    required = {"ticker", "date", "open", "high", "low", "close", "adjusted_close"}
    missing = required - set(candles.columns)
    if missing:
        raise ValueError(f"Colunas ausentes para rótulos: {sorted(missing)}")

    frames = []
    for _, group in candles.sort_values(["ticker", "date"]).groupby("ticker", sort=False):
        group = group.reset_index(drop=True)
        rows = len(group) - horizon_bars
        if rows <= 0:
            continue
        prices = adjusted_ohlc(group)
        if atr_mode:
            atr_pct = average_true_range_pct(prices).to_numpy()
            target_returns = target_atr * atr_pct
            # A stop at or beyond -100% is meaningless; cap it for extreme volatility.
            stop_returns = np.minimum(stop_atr * atr_pct, 0.95)
        else:
            target_returns = np.full(len(group), target_pct)
            stop_returns = np.full(len(group), stop_pct)
        result = _simulate_ticker(prices, target_returns, stop_returns, horizon_bars)
        index = np.arange(rows)
        exit_index = index + result["exit_offset"]
        frame = pd.DataFrame(
            {
                "ticker": group["ticker"].iloc[:rows].to_numpy(),
                "date": group["date"].iloc[:rows].to_numpy(),
                "entry_date": group["date"].iloc[1 : rows + 1].to_numpy(),
                "exit_date": group["date"].to_numpy()[exit_index],
                "label": result["label"],
                "trade_return_pct": result["exit_price"] / result["entry_price"] - 1,
                "exit_reason": result["reason"],
                "bars_held": result["exit_offset"],
                "target_return_pct": target_returns[:rows],
                "stop_return_pct": stop_returns[:rows],
            }
        )
        frames.append(frame.loc[np.isfinite(target_returns[:rows])])

    if not frames:
        return pd.DataFrame(columns=OUTCOME_COLUMNS)
    result = pd.concat(frames, ignore_index=True)[OUTCOME_COLUMNS]
    result["label"] = result["label"].astype("int8")
    result["bars_held"] = result["bars_held"].astype("int16")
    return result.sort_values(["ticker", "date"]).reset_index(drop=True)


def build_labels(
    candles: pd.DataFrame,
    target_pct: float = 0.05,
    horizon_bars: int = 10,
    stop_pct: float = 0.03,
) -> pd.DataFrame:
    """Return binary labels for target-before-stop classification."""
    outcomes = build_trade_outcomes(
        candles,
        target_pct=target_pct,
        horizon_bars=horizon_bars,
        stop_pct=stop_pct,
    )
    return outcomes[["ticker", "date", "label"]]
