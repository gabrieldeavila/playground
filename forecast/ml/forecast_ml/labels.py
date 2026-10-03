"""Forward outcome labels for supervised training (never used as features)."""

import numpy as np
import pandas as pd


def build_labels(
    candles: pd.DataFrame,
    target_pct: float = 0.05,
    horizon_bars: int = 10,
) -> pd.DataFrame:
    """Label each date by whether adjusted close reaches a target in future bars.

    The entry reference is the current candle's adjusted close; the next ``horizon_bars``
    candles are examined, excluding the current candle. Rows without the full future
    horizon are omitted rather than mislabeled as failures.
    """
    if target_pct <= 0:
        raise ValueError("target_pct precisa ser positivo")
    if horizon_bars <= 0:
        raise ValueError("horizon_bars precisa ser positivo")
    required = {"ticker", "date", "adjusted_close"}
    missing = required - set(candles.columns)
    if missing:
        raise ValueError(f"Colunas ausentes para rótulos: {sorted(missing)}")

    labels = []
    for ticker, group in candles.sort_values(["ticker", "date"]).groupby("ticker", sort=False):
        adjusted = group["adjusted_close"].astype(float).reset_index(drop=True)
        future_max = pd.concat(
            [adjusted.shift(-offset).rename(str(offset)) for offset in range(1, horizon_bars + 1)],
            axis=1,
        ).max(axis=1, skipna=True)
        has_full_horizon = adjusted.shift(-horizon_bars).notna()
        target_price = adjusted * (1 + target_pct)
        reached_target = (future_max >= target_price) | np.isclose(
            future_max, target_price, rtol=1e-12, atol=0
        )
        label = reached_target.astype("int8")
        labels.append(
            pd.DataFrame(
                {
                    "ticker": group["ticker"].to_numpy(),
                    "date": group["date"].to_numpy(),
                    "label": label.where(has_full_horizon).to_numpy(),
                }
            ).dropna(subset=["label"])
        )
    if not labels:
        return pd.DataFrame(columns=["ticker", "date", "label"])
    result = pd.concat(labels, ignore_index=True)
    result["label"] = result["label"].astype("int8")
    return result.sort_values(["ticker", "date"]).reset_index(drop=True)
