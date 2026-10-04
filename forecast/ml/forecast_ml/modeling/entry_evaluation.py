"""Out-of-sample entry evaluation; all returns below are per opportunity."""

import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score

from forecast_ml.modeling.train import (
    _daily_top_k_returns,
    _moving_block_bootstrap_ci,
    _portfolio_backtest,
    _selection_return_lift,
    _trade_return_metrics,
)


def ema_baseline_score(features: pd.DataFrame) -> np.ndarray:
    """Fixed EMA benchmark, not fitted or tuned on future outcomes."""
    periods = (9, 20, 50)
    setup = np.zeros(len(features))
    distance = np.zeros(len(features))
    for period in periods:
        for signal in ("reclaim", "pullback"):
            name = f"ema_{period}_{signal}"
            if name in features:
                setup += features[name].fillna(0).to_numpy()
        name = f"ema_{period}_distance_atr"
        if name in features:
            distance += np.abs(features[name].fillna(0).to_numpy())
    return (
        4 * setup
        + features["ema_bullish_order"].to_numpy()
        + features["ema_slopes_up"].to_numpy()
        + features["ema_alignment_hold_3"].to_numpy()
        - 0.1 * distance
    )


def evaluate_entries(
    table: pd.DataFrame,
    scores: np.ndarray,
    horizon_bars: int,
    top_k: int = 3,
    cost_bps: float = 10.0,
    bootstrap: bool = True,
) -> dict:
    if top_k <= 0 or cost_bps < 0 or not np.isfinite(cost_bps):
        raise ValueError("top_k deve ser positivo e custo finito não negativo.")
    scored = table.copy()
    scored["score"] = scores
    selected = (
        scored.sort_values(["date", "score", "ticker"], ascending=[True, False, True])
        .groupby("date", sort=True)
        .head(top_k)
    )
    fee = cost_bps / 10_000
    net = (1 + selected["trade_return_pct"]) * (1 - fee) ** 2 - 1
    daily_model = _daily_top_k_returns(table["trade_return_pct"], scores, table["date"], top_k)
    daily_ema = _daily_top_k_returns(
        table["trade_return_pct"], ema_baseline_score(table), table["date"], top_k
    )
    daily_universe = table.groupby("date")["trade_return_pct"].mean()
    delta_ema = (daily_model - daily_ema).dropna().to_numpy() * 100
    delta_universe = (daily_model - daily_universe).dropna().to_numpy() * 100
    report = {
        "samples": len(table),
        "dates": int(table["date"].nunique()),
        "positive_rate": float(table["label"].mean()),
        "pr_auc": float(average_precision_score(table["label"], scores)),
        "roc_auc": float(roc_auc_score(table["label"], scores))
        if table["label"].nunique() == 2
        else None,
        "brier_score": float(brier_score_loss(table["label"], scores)),
        "baseline_brier_score": float(np.mean((table["label"] - table["label"].mean()) ** 2)),
        "top_k": top_k,
        "mean_net_return_pct": float(net.mean() * 100),
        "mean_delta_vs_ema_pct_points": float(delta_ema.mean()),
        "mean_delta_vs_universe_pct_points": float(delta_universe.mean()),
        **_trade_return_metrics(
            table["trade_return_pct"], table["bars_held"], scores, table["date"], (top_k,)
        ),
    }
    if bootstrap:
        report["ci95_delta_vs_ema_pct_points"] = list(
            _moving_block_bootstrap_ci(delta_ema, horizon_bars)
        )
        report["return_lift_vs_universe"] = _selection_return_lift(
            table["trade_return_pct"], scores, table["date"], horizon_bars, (top_k,)
        )
        report["portfolio_backtest"] = _portfolio_backtest(
            scored, max_positions=top_k, transaction_cost_bps=cost_bps
        )
        baseline_frame = table.copy()
        baseline_frame["score"] = ema_baseline_score(table)
        report["ema_portfolio_backtest"] = _portfolio_backtest(
            baseline_frame, max_positions=top_k, transaction_cost_bps=cost_bps
        )
    return report


def promotion_gate(folds: list[dict], holdout: dict, calibration_slope: float) -> dict:
    """Predefined conservative gate, not an optimizer of the observed holdout."""
    stable = sum(
        fold["mean_delta_vs_ema_pct_points"] > 0
        and fold["mean_delta_vs_universe_pct_points"] > 0
        and fold["mean_net_return_pct"] > 0
        for fold in folds
    )
    top_k = holdout["top_k"]
    checks = {
        "at_least_3_folds": len(folds) >= 3,
        "positive_lift_and_net_return_in_80pct_folds": stable >= np.ceil(0.8 * len(folds)),
        "calibration_preserves_ranking": calibration_slope > 0,
        "holdout_at_least_60_dates": holdout["dates"] >= 60,
        "holdout_net_return_positive": holdout["mean_net_return_pct"] > 0,
        "holdout_ci95_lift_vs_ema_positive": holdout["ci95_delta_vs_ema_pct_points"][0] > 0,
        "holdout_ci95_lift_vs_universe_positive": holdout["return_lift_vs_universe"][
            f"top_{top_k}"
        ]["confidence_interval_95_pct_points"][0]
        > 0,
        "holdout_portfolio_net_positive": holdout["portfolio_backtest"][
            "portfolio_total_return_pct"
        ]
        > 0,
    }
    # NumPy comparisons can return np.bool_; metadata must use JSON-native values.
    checks = {name: bool(passed) for name, passed in checks.items()}
    return {"approved": all(checks.values()), "checks": checks, "stable_folds": int(stable)}
