"""Train and evaluate the historical opportunity classifier."""

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from forecast_ml.config import MODELS_DIR, RAW_DATA_DIR
from forecast_ml.dataset import load_market_data
from forecast_ml.features import DEFAULT_EMA_PERIODS, build_features
from forecast_ml.labels import build_trade_outcomes


def build_training_table(
    candles: pd.DataFrame,
    target_pct: float = 0.05,
    horizon_bars: int = 10,
    stop_pct: float = 0.03,
    ema_periods: tuple[int, ...] = DEFAULT_EMA_PERIODS,
) -> tuple[pd.DataFrame, list[str]]:
    features = build_features(candles, ema_periods=ema_periods)
    outcomes = build_trade_outcomes(
        candles,
        target_pct=target_pct,
        horizon_bars=horizon_bars,
        stop_pct=stop_pct,
    )
    table = features.merge(outcomes, on=["ticker", "date"], how="inner", validate="one_to_one")
    feature_columns = [column for column in features.columns if column not in {"ticker", "date"}]
    table = table.replace([np.inf, -np.inf], np.nan).dropna(
        subset=feature_columns + ["label", "trade_return_pct", "bars_held"]
    )
    return table.sort_values(["date", "ticker"]).reset_index(drop=True), feature_columns


def chronological_split(
    table: pd.DataFrame,
    horizon_bars: int,
    test_fraction: float = 0.2,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Split on global trading dates and purge the label-overlap window."""
    dates = sorted(pd.to_datetime(table["date"]).drop_duplicates())
    if not 0 < test_fraction < 1:
        raise ValueError("test_fraction precisa estar entre 0 e 1")
    split_index = int(len(dates) * (1 - test_fraction))
    if split_index <= horizon_bars or split_index >= len(dates):
        raise ValueError(
            f"Histórico insuficiente para split temporal: {len(dates)} datas, "
            f"horizonte {horizon_bars} candles."
        )
    test_start = dates[split_index]
    train_candidates = table[pd.to_datetime(table["date"]) < test_start].copy()
    # Purge the final horizon observations per ticker, so their forward label windows
    # cannot overlap the first test observations even when a ticker has missing dates.
    rows_from_end = train_candidates.groupby("ticker", sort=False).cumcount(ascending=False)
    train = train_candidates.loc[rows_from_end >= horizon_bars]
    test = table[pd.to_datetime(table["date"]) >= test_start]
    if train.empty or test.empty:
        raise ValueError(
            "Não há amostras suficientes após o aquecimento das EMAs e o intervalo "
            "de segurança do horizonte. Adicione mais histórico ou ajuste os parâmetros."
        )
    return train, test


def walk_forward_splits(
    table: pd.DataFrame,
    horizon_bars: int,
    n_splits: int = 5,
    min_train_fraction: float = 0.5,
) -> list[tuple[pd.DataFrame, pd.DataFrame]]:
    """Create expanding-window folds with a purged gap before each validation block."""
    if horizon_bars <= 0:
        raise ValueError("horizon_bars precisa ser positivo")
    if n_splits <= 0:
        raise ValueError("n_splits precisa ser positivo")
    if not 0 < min_train_fraction < 1:
        raise ValueError("min_train_fraction precisa estar entre 0 e 1")

    dates = np.array(sorted(pd.to_datetime(table["date"]).drop_duplicates()))
    first_validation_index = int(len(dates) * min_train_fraction)
    validation_dates = dates[first_validation_index:]
    if len(validation_dates) < n_splits:
        raise ValueError(
            f"Histórico insuficiente para {n_splits} folds walk-forward "
            f"após {min_train_fraction:.0%} de treino inicial."
        )

    folds = []
    for date_block in np.array_split(validation_dates, n_splits):
        if len(date_block) == 0:
            continue
        validation_start = pd.Timestamp(date_block[0])
        validation_end = pd.Timestamp(date_block[-1])
        candidates = table[pd.to_datetime(table["date"]) < validation_start].copy()
        rows_from_end = candidates.groupby("ticker", sort=False).cumcount(ascending=False)
        train = candidates.loc[rows_from_end >= horizon_bars]
        validation_dates_mask = pd.to_datetime(table["date"]).between(
            validation_start, validation_end
        )
        validation = table.loc[validation_dates_mask]
        if train.empty or validation.empty:
            continue
        folds.append((train, validation))

    if len(folds) != n_splits:
        raise ValueError(
            f"Não foi possível formar {n_splits} folds walk-forward válidos; "
            f"foram formados {len(folds)}. Reduza n_splits ou min_train_fraction."
        )
    return folds


def _ranking_metrics(
    labels: pd.Series,
    probabilities: np.ndarray,
    dates: pd.Series,
    top_k_values: tuple[int, ...] = (3, 5),
) -> dict[str, float | int | None]:
    """Measure how often the highest-scored candidates succeed per date."""
    ranked = pd.DataFrame(
        {
            "date": pd.to_datetime(dates).to_numpy(),
            "label": labels.to_numpy(),
            "score": probabilities,
        }
    )
    result: dict[str, float | int | None] = {
        "dates_evaluated": int(ranked["date"].nunique()),
        "positive_rate": float(ranked["label"].mean()),
    }
    for top_k in top_k_values:
        selected = (
            ranked.sort_values(["date", "score"], ascending=[True, False])
            .groupby("date", sort=False)
            .head(top_k)
        )
        precision = float(selected["label"].mean()) if not selected.empty else None
        result[f"precision_at_{top_k}"] = precision
        result[f"selected_at_{top_k}"] = len(selected)
        result[f"lift_at_{top_k}"] = (
            precision / result["positive_rate"]
            if precision is not None and result["positive_rate"] > 0
            else None
        )
    return result


def _daily_top_k_returns(
    returns: pd.Series | np.ndarray,
    probabilities: np.ndarray,
    dates: pd.Series | np.ndarray,
    top_k: int,
) -> pd.Series:
    """Return mean selected-trade return per date for paired comparisons."""
    ranked = pd.DataFrame(
        {
            "date": pd.to_datetime(dates).to_numpy(),
            "trade_return_pct": np.asarray(returns, dtype=float),
            "score": probabilities,
        }
    )
    selected = (
        ranked.sort_values(["date", "score"], ascending=[True, False])
        .groupby("date", sort=True)
        .head(top_k)
    )
    return selected.groupby("date", sort=True)["trade_return_pct"].mean()


def _daily_universe_mean_returns(
    returns: pd.Series | np.ndarray,
    dates: pd.Series | np.ndarray,
) -> pd.Series:
    """Return the equal-weight mean outcome of all candidates available per date."""
    outcomes = pd.DataFrame(
        {
            "date": pd.to_datetime(dates).to_numpy(),
            "trade_return_pct": np.asarray(returns, dtype=float),
        }
    )
    return outcomes.groupby("date", sort=True)["trade_return_pct"].mean()


def _selection_return_lift(
    returns: pd.Series | np.ndarray,
    probabilities: np.ndarray,
    dates: pd.Series | np.ndarray,
    horizon_bars: int,
    top_k_values: tuple[int, ...] = (3, 5),
) -> dict[str, dict[str, float | int | list[float]]]:
    """Estimate top-k return lift over the per-date equal-weight candidate baseline."""
    universe_returns = _daily_universe_mean_returns(returns, dates)
    comparisons = {}
    for top_k in top_k_values:
        selected_returns = _daily_top_k_returns(returns, probabilities, dates, top_k)
        paired = pd.concat(
            [selected_returns.rename("selected"), universe_returns.rename("universe")],
            axis=1,
            join="inner",
        ).dropna()
        differences_pct_points = (paired["selected"] - paired["universe"]).to_numpy() * 100
        ci_lower, ci_upper = _moving_block_bootstrap_ci(
            differences_pct_points, block_size=horizon_bars
        )
        comparisons[f"top_{top_k}"] = {
            "dates_compared": len(differences_pct_points),
            "mean_delta_gross_return_pct_points": float(differences_pct_points.mean()),
            "block_size_dates": min(horizon_bars, len(differences_pct_points)),
            "confidence_interval_95_pct_points": [ci_lower, ci_upper],
        }
    return comparisons


def _moving_block_bootstrap_ci(
    values: np.ndarray,
    block_size: int,
    n_bootstrap: int = 2000,
    random_state: int = 42,
) -> tuple[float, float]:
    """Percentile confidence interval for a mean, resampling contiguous date blocks."""
    values = np.asarray(values, dtype=float)
    if values.size == 0:
        raise ValueError("Bootstrap precisa de ao menos uma observação.")
    if block_size <= 0 or n_bootstrap <= 0:
        raise ValueError("block_size e n_bootstrap precisam ser positivos.")

    block_size = min(block_size, values.size)
    blocks_needed = int(np.ceil(values.size / block_size))
    rng = np.random.default_rng(random_state)
    bootstrap_means = np.empty(n_bootstrap, dtype=float)
    for iteration in range(n_bootstrap):
        starts = rng.integers(0, values.size, size=blocks_needed)
        indices = np.concatenate(
            [(start + np.arange(block_size)) % values.size for start in starts]
        )[: values.size]
        bootstrap_means[iteration] = values[indices].mean()

    lower, upper = np.quantile(bootstrap_means, [0.025, 0.975])
    return float(lower), float(upper)


def _trade_return_metrics(
    returns: pd.Series | np.ndarray,
    bars_held: pd.Series | np.ndarray,
    probabilities: np.ndarray,
    dates: pd.Series | np.ndarray,
    top_k_values: tuple[int, ...] = (3, 5),
) -> dict[str, float | int | None]:
    """Report gross per-trade outcomes for daily top-score selections.

    Returns are per opportunity, not a compounded portfolio return; overlapping
    holding periods and transaction costs are intentionally not modeled here.
    """
    ranked = pd.DataFrame(
        {
            "date": pd.to_datetime(dates).to_numpy(),
            "trade_return_pct": np.asarray(returns, dtype=float),
            "bars_held": np.asarray(bars_held, dtype=float),
            "score": probabilities,
        }
    )
    result: dict[str, float | int | None] = {
        "candidate_mean_gross_return_pct": float(ranked["trade_return_pct"].mean() * 100),
    }
    for top_k in top_k_values:
        selected = (
            ranked.sort_values(["date", "score"], ascending=[True, False])
            .groupby("date", sort=False)
            .head(top_k)
        )
        result[f"top_{top_k}_mean_gross_return_pct"] = (
            float(selected["trade_return_pct"].mean() * 100) if not selected.empty else None
        )
        result[f"top_{top_k}_median_gross_return_pct"] = (
            float(selected["trade_return_pct"].median() * 100) if not selected.empty else None
        )
        result[f"top_{top_k}_positive_return_rate"] = (
            float((selected["trade_return_pct"] > 0).mean()) if not selected.empty else None
        )
        result[f"top_{top_k}_mean_bars_held"] = (
            float(selected["bars_held"].mean()) if not selected.empty else None
        )
        result[f"top_{top_k}_selected"] = len(selected)
    return result


def _portfolio_backtest(
    candidates: pd.DataFrame,
    max_positions: int = 3,
    transaction_cost_bps: float = 10.0,
) -> dict[str, float | int]:
    """Simulate a long-only, equal-slot portfolio from out-of-sample signals.

    Signals are generated at the close on ``date`` and enter at ``entry_date``.
    Positions close at their precomputed ``exit_date``. A ticker cannot be reopened
    while its earlier position is active. Returns are compounded on realized equity;
    this reports closed-trade equity, not intraday mark-to-market drawdown.
    """
    required = {"ticker", "date", "entry_date", "exit_date", "score", "trade_return_pct"}
    missing = required - set(candidates.columns)
    if missing:
        raise ValueError(f"Colunas ausentes para backtest de carteira: {sorted(missing)}")
    if max_positions <= 0:
        raise ValueError("max_positions precisa ser positivo")
    if transaction_cost_bps < 0:
        raise ValueError("transaction_cost_bps não pode ser negativo")
    if candidates.empty:
        raise ValueError("Backtest de carteira precisa de candidatos")

    trades = candidates.copy()
    trades["entry_date"] = pd.to_datetime(trades["entry_date"])
    trades["exit_date"] = pd.to_datetime(trades["exit_date"])
    if (trades["exit_date"] < trades["entry_date"]).any():
        raise ValueError("exit_date não pode anteceder entry_date")

    cash = 1.0
    active: dict[str, dict[str, float | pd.Timestamp]] = {}
    selected_returns: list[float] = []
    selected_gross_returns: list[float] = []
    max_concurrent_positions = 0
    capacity_rejections = 0
    active_ticker_skips = 0
    fee_rate = transaction_cost_bps / 10_000
    event_dates = sorted(set(trades["entry_date"]) | set(trades["exit_date"]))

    for event_date in event_dates:
        # Conservatively retain old positions through this day's open. Intrabar/close
        # proceeds are not available to finance entries earlier on the same day.
        equity = cash + sum(float(p["allocated_capital"]) for p in active.values())
        slot_capital = equity / max_positions
        entries = trades.loc[trades["entry_date"] == event_date].sort_values(
            ["score", "ticker"], ascending=[False, True]
        )
        for _, candidate in entries.iterrows():
            ticker = str(candidate["ticker"])
            if ticker in active:
                active_ticker_skips += 1
                continue
            if len(active) >= max_positions:
                capacity_rejections += 1
                continue
            allocation = min(slot_capital, cash)
            if allocation <= 0:
                capacity_rejections += 1
                continue
            cash -= allocation
            active[ticker] = {
                "exit_date": candidate["exit_date"],
                "gross_return": float(candidate["trade_return_pct"]),
                "allocated_capital": allocation,
            }
            max_concurrent_positions = max(max_concurrent_positions, len(active))

        # Includes trades that entered and touched a barrier in this very candle.
        closing_tickers = [
            ticker for ticker, position in active.items() if position["exit_date"] == event_date
        ]
        for ticker in closing_tickers:
            position = active.pop(ticker)
            gross_return = float(position["gross_return"])
            net_return = (1 + gross_return) * (1 - fee_rate) ** 2 - 1
            cash += float(position["allocated_capital"]) * (1 + net_return)
            selected_gross_returns.append(gross_return)
            selected_returns.append(net_return)

    equity = cash
    if active:
        raise ValueError("Backtest terminou com posições sem evento de saída")

    return {
        "max_positions": max_positions,
        "transaction_cost_bps_per_side": float(transaction_cost_bps),
        "signals_selected": len(selected_returns),
        "capacity_rejections": capacity_rejections,
        "active_ticker_skips": active_ticker_skips,
        "max_concurrent_positions": max_concurrent_positions,
        "mean_selected_gross_return_pct": float(np.mean(selected_gross_returns) * 100)
        if selected_gross_returns
        else 0.0,
        "mean_selected_net_return_pct": float(np.mean(selected_returns) * 100)
        if selected_returns
        else 0.0,
        "positive_net_trade_rate": float(np.mean(np.asarray(selected_returns) > 0))
        if selected_returns
        else 0.0,
        "portfolio_total_return_pct": float((equity - 1) * 100),
    }


def _make_candidate_estimators() -> dict[str, object]:
    """Return conservative candidates for a like-for-like temporal benchmark."""
    return {
        "logistic_regression": make_pipeline(
            StandardScaler(),
            LogisticRegression(class_weight="balanced", max_iter=2000, random_state=42),
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=300,
            max_depth=5,
            min_samples_leaf=30,
            class_weight="balanced_subsample",
            n_jobs=-1,
            random_state=42,
        ),
        "hist_gradient_boosting": HistGradientBoostingClassifier(
            learning_rate=0.05,
            max_iter=150,
            max_leaf_nodes=15,
            min_samples_leaf=30,
            l2_regularization=1.0,
            random_state=42,
        ),
    }


def _feature_groups(feature_columns: list[str]) -> dict[str, list[str]]:
    """Partition features into interpretable groups for temporal ablation."""
    groups = {
        "trend": [],
        "momentum": [],
        "risk_price_action": [],
        "volume": [],
        "other": [],
    }
    for column in feature_columns:
        if column.startswith(("close_to_ema_", "ema_")) or column in {
            "ema_bullish_order",
            "ema_slopes_up",
            "ema_alignment_hold_3",
        }:
            groups["trend"].append(column)
        elif column.startswith("close_return_"):
            groups["momentum"].append(column)
        elif column.startswith(("realized_volatility_", "atr_", "drawdown_", "gap_", "candle_")):
            groups["risk_price_action"].append(column)
        elif column.startswith("volume_"):
            groups["volume"].append(column)
        else:
            groups["other"].append(column)
    return {name: columns for name, columns in groups.items() if columns}


def _evaluate_feature_ablation(
    folds: list[tuple[pd.DataFrame, pd.DataFrame]],
    feature_columns: list[str],
    horizon_bars: int = 10,
) -> dict:
    """Compare full, leave-one-group-out and group-only logistic models on identical folds."""
    groups = _feature_groups(feature_columns)
    variants = {"full": feature_columns}
    for group_name, group_columns in groups.items():
        variants[f"without_{group_name}"] = [
            column for column in feature_columns if column not in group_columns
        ]
        variants[f"{group_name}_only"] = group_columns

    predictions = {
        name: {
            "labels": [],
            "probabilities": [],
            "dates": [],
            "returns": [],
            "bars_held": [],
            "portfolio_frames": [],
        }
        for name in variants
    }
    fold_reports = []
    for fold_number, (train, validation) in enumerate(folds, start=1):
        fold_metrics = {"fold": fold_number, "models": {}}
        for name, columns in variants.items():
            if not columns:
                continue
            estimator = make_pipeline(
                StandardScaler(),
                LogisticRegression(class_weight="balanced", max_iter=2000, random_state=42),
            )
            estimator.fit(train[columns], train["label"])
            probabilities = estimator.predict_proba(validation[columns])[:, 1]
            fold_metrics["models"][name] = {
                "pr_auc": float(average_precision_score(validation["label"], probabilities)),
                "roc_auc": float(roc_auc_score(validation["label"], probabilities)),
                **_ranking_metrics(validation["label"], probabilities, validation["date"]),
                **_trade_return_metrics(
                    validation["trade_return_pct"],
                    validation["bars_held"],
                    probabilities,
                    validation["date"],
                ),
            }
            portfolio_fields = {"ticker", "date", "entry_date", "exit_date", "trade_return_pct"}
            if portfolio_fields.issubset(validation.columns):
                portfolio_frame = validation[list(portfolio_fields)].copy()
                portfolio_frame["score"] = probabilities
                predictions[name]["portfolio_frames"].append(portfolio_frame)
                fold_metrics["models"][name]["portfolio_backtest"] = _portfolio_backtest(
                    portfolio_frame
                )
            predictions[name]["labels"].append(validation["label"].to_numpy())
            predictions[name]["probabilities"].append(probabilities)
            predictions[name]["dates"].append(validation["date"].to_numpy())
            predictions[name]["returns"].append(validation["trade_return_pct"].to_numpy())
            predictions[name]["bars_held"].append(validation["bars_held"].to_numpy())
        fold_reports.append(fold_metrics)

    results = {}
    for name, values in predictions.items():
        if not values["labels"]:
            continue
        labels = np.concatenate(values["labels"])
        probabilities = np.concatenate(values["probabilities"])
        dates = np.concatenate(values["dates"])
        returns = np.concatenate(values["returns"])
        bars_held = np.concatenate(values["bars_held"])
        results[name] = {
            "oof_samples": len(labels),
            "positive_rate": float(labels.mean()),
            "oof_pr_auc": float(average_precision_score(labels, probabilities)),
            "oof_roc_auc": float(roc_auc_score(labels, probabilities)),
            **_ranking_metrics(pd.Series(labels), probabilities, pd.Series(dates)),
            **_trade_return_metrics(returns, bars_held, probabilities, dates),
            "return_lift_vs_universe": _selection_return_lift(
                returns, probabilities, dates, horizon_bars=horizon_bars
            ),
        }
        if values["portfolio_frames"]:
            results[name]["portfolio_backtest"] = _portfolio_backtest(
                pd.concat(values["portfolio_frames"], ignore_index=True)
            )

    full = results["full"]
    delta_metrics = (
        "oof_pr_auc",
        "oof_roc_auc",
        "precision_at_3",
        "lift_at_3",
        "precision_at_5",
        "lift_at_5",
    )
    for result in results.values():
        result["delta_vs_full"] = {
            metric: result[metric] - full[metric]
            for metric in delta_metrics
            if result.get(metric) is not None and full.get(metric) is not None
        }
    return {
        "feature_groups": groups,
        "variants": results,
        "folds": fold_reports,
    }


def _evaluate_holdout_feature_variants(
    train: pd.DataFrame,
    test: pd.DataFrame,
    feature_columns: list[str],
    horizon_bars: int = 10,
) -> dict:
    """Compare the full model with the development-selected risk/price-action subset."""
    if train["label"].nunique() < 2 or test["label"].nunique() < 2:
        raise ValueError("Treino e holdout precisam conter ambas as classes.")

    groups = _feature_groups(feature_columns)
    variants = {
        "full": feature_columns,
        "risk_price_action_only": groups.get("risk_price_action", []),
    }
    if not variants["risk_price_action_only"]:
        raise ValueError("Nenhuma feature de risco/preço-ação disponível para comparação.")

    reports = {}
    daily_returns_by_variant = {}
    for name, columns in variants.items():
        estimator = make_pipeline(
            StandardScaler(),
            LogisticRegression(class_weight="balanced", max_iter=2000, random_state=42),
        )
        estimator.fit(train[columns], train["label"])
        probabilities = estimator.predict_proba(test[columns])[:, 1]
        daily_returns_by_variant[name] = {
            top_k: _daily_top_k_returns(
                test["trade_return_pct"], probabilities, test["date"], top_k
            )
            for top_k in (3, 5)
        }
        reports[name] = {
            "feature_columns": columns,
            "pr_auc": float(average_precision_score(test["label"], probabilities)),
            "roc_auc": float(roc_auc_score(test["label"], probabilities)),
            **_ranking_metrics(test["label"], probabilities, test["date"]),
            **_trade_return_metrics(
                test["trade_return_pct"],
                test["bars_held"],
                probabilities,
                test["date"],
            ),
            "return_lift_vs_universe": _selection_return_lift(
                test["trade_return_pct"],
                probabilities,
                test["date"],
                horizon_bars=horizon_bars,
            ),
        }
        portfolio_fields = {"ticker", "date", "entry_date", "exit_date", "trade_return_pct"}
        if portfolio_fields.issubset(test.columns):
            portfolio_frame = test[list(portfolio_fields)].copy()
            portfolio_frame["score"] = probabilities
            reports[name]["portfolio_backtest"] = _portfolio_backtest(portfolio_frame)

    baseline = reports["full"]
    comparison_metrics = (
        "pr_auc",
        "roc_auc",
        "precision_at_3",
        "lift_at_3",
        "precision_at_5",
        "lift_at_5",
        "top_3_mean_gross_return_pct",
        "top_3_median_gross_return_pct",
        "top_3_positive_return_rate",
        "top_5_mean_gross_return_pct",
        "top_5_median_gross_return_pct",
        "top_5_positive_return_rate",
    )
    for report in reports.values():
        report["delta_vs_full"] = {
            metric: report[metric] - baseline[metric]
            for metric in comparison_metrics
            if report.get(metric) is not None and baseline.get(metric) is not None
        }

    paired_return_differences = {}
    for top_k in (3, 5):
        paired_daily_returns = pd.concat(
            [
                daily_returns_by_variant["risk_price_action_only"][top_k].rename("candidate"),
                daily_returns_by_variant["full"][top_k].rename("full"),
            ],
            axis=1,
            join="inner",
        ).dropna()
        differences_pct = (
            paired_daily_returns["candidate"] - paired_daily_returns["full"]
        ).to_numpy() * 100
        ci_lower, ci_upper = _moving_block_bootstrap_ci(differences_pct, block_size=horizon_bars)
        paired_return_differences[f"top_{top_k}"] = {
            "dates_compared": len(differences_pct),
            "mean_delta_gross_return_pct_points": float(differences_pct.mean()),
            "block_size_dates": min(horizon_bars, len(differences_pct)),
            "confidence_interval_95_pct_points": [ci_lower, ci_upper],
        }
    return {
        "selection_source": "walk_forward_development_window",
        "uncertainty_method": "paired moving-block bootstrap by date; block length equals horizon_bars",
        "paired_return_differences_vs_full": paired_return_differences,
        "test_start": str(pd.to_datetime(test["date"]).min().date()),
        "test_end": str(pd.to_datetime(test["date"]).max().date()),
        "variants": reports,
    }


def _evaluate_walk_forward(
    table: pd.DataFrame,
    feature_columns: list[str],
    horizon_bars: int,
    n_splits: int = 5,
) -> dict:
    folds = walk_forward_splits(table, horizon_bars, n_splits=n_splits)
    fold_reports = []
    model_oof: dict[str, dict[str, list[np.ndarray]]] = {
        name: {"labels": [], "probabilities": [], "dates": [], "returns": [], "bars_held": []}
        for name in _make_candidate_estimators()
    }

    for fold_number, (train, validation) in enumerate(folds, start=1):
        if train["label"].nunique() < 2:
            raise ValueError(f"Fold {fold_number}: treino contém apenas uma classe.")
        if validation["label"].nunique() < 2:
            raise ValueError(f"Fold {fold_number}: validação contém apenas uma classe.")

        fold_report = {
            "fold": fold_number,
            "train_samples": len(train),
            "validation_samples": len(validation),
            "train_end": str(pd.to_datetime(train["date"]).max().date()),
            "validation_start": str(pd.to_datetime(validation["date"]).min().date()),
            "validation_end": str(pd.to_datetime(validation["date"]).max().date()),
            "positive_rate": float(validation["label"].mean()),
            "models": {},
        }
        for name, estimator in _make_candidate_estimators().items():
            estimator.fit(train[feature_columns], train["label"])
            probabilities = estimator.predict_proba(validation[feature_columns])[:, 1]
            fold_report["models"][name] = {
                "pr_auc": float(average_precision_score(validation["label"], probabilities)),
                "roc_auc": float(roc_auc_score(validation["label"], probabilities)),
                **_ranking_metrics(validation["label"], probabilities, validation["date"]),
                **_trade_return_metrics(
                    validation["trade_return_pct"],
                    validation["bars_held"],
                    probabilities,
                    validation["date"],
                ),
            }
            model_oof[name]["labels"].append(validation["label"].to_numpy())
            model_oof[name]["probabilities"].append(probabilities)
            model_oof[name]["dates"].append(validation["date"].to_numpy())
            model_oof[name]["returns"].append(validation["trade_return_pct"].to_numpy())
            model_oof[name]["bars_held"].append(validation["bars_held"].to_numpy())
        fold_reports.append(fold_report)

    comparison = {}
    for name, predictions in model_oof.items():
        labels = np.concatenate(predictions["labels"])
        probabilities = np.concatenate(predictions["probabilities"])
        dates = np.concatenate(predictions["dates"])
        returns = np.concatenate(predictions["returns"])
        bars_held = np.concatenate(predictions["bars_held"])
        comparison[name] = {
            "oof_samples": len(labels),
            "oof_positive_rate": float(labels.mean()),
            "oof_pr_auc": float(average_precision_score(labels, probabilities)),
            "oof_roc_auc": float(roc_auc_score(labels, probabilities)),
            **_ranking_metrics(pd.Series(labels), probabilities, pd.Series(dates)),
            **_trade_return_metrics(returns, bars_held, probabilities, dates),
        }

    feature_ablation = _evaluate_feature_ablation(folds, feature_columns)

    # Keep the existing top-level logistic metrics for consumers of the metrics file.
    logistic = comparison["logistic_regression"]
    return {
        "folds": fold_reports,
        "model_comparison": comparison,
        "feature_ablation": feature_ablation,
        "oof_samples": logistic["oof_samples"],
        "oof_positive_rate": logistic["oof_positive_rate"],
        "oof_pr_auc": logistic["oof_pr_auc"],
        "oof_roc_auc": logistic["oof_roc_auc"],
        **{
            key: value
            for key, value in logistic.items()
            if key not in {"oof_samples", "oof_positive_rate", "oof_pr_auc", "oof_roc_auc"}
        },
    }


def train_baseline_model(
    data_dir: Path = RAW_DATA_DIR,
    model_path: Path = MODELS_DIR / "legacy_baseline.joblib",
    target_pct: float = 0.05,
    horizon_bars: int = 10,
    stop_pct: float = 0.03,
    ema_periods: tuple[int, ...] = DEFAULT_EMA_PERIODS,
    test_fraction: float = 0.2,
) -> dict:
    candles = load_market_data(data_dir)
    table, feature_columns = build_training_table(
        candles,
        target_pct=target_pct,
        horizon_bars=horizon_bars,
        stop_pct=stop_pct,
        ema_periods=ema_periods,
    )
    if table.empty:
        raise ValueError(
            "Nenhuma amostra treinável. As EMAs longas precisam de aquecimento e os rótulos "
            "precisam do horizonte futuro completo."
        )

    train, test = chronological_split(table, horizon_bars, test_fraction)
    train_counts = train["label"].value_counts()
    test_counts = test["label"].value_counts()
    if len(train_counts) < 2:
        raise ValueError("Treino contém apenas uma classe; são necessários sucessos e insucessos.")
    if len(test_counts) < 2:
        raise ValueError(
            "Teste temporal contém apenas uma classe; não é possível avaliar o modelo."
        )
    if train_counts.min() < 2:
        raise ValueError(
            "Há menos de 2 exemplos de uma classe no treino; adicione mais histórico."
        )

    evaluation_estimator = make_pipeline(
        StandardScaler(),
        LogisticRegression(class_weight="balanced", max_iter=2000, random_state=42),
    )
    evaluation_estimator.fit(train[feature_columns], train["label"])
    predictions = evaluation_estimator.predict(test[feature_columns])
    probabilities = evaluation_estimator.predict_proba(test[feature_columns])[:, 1]
    # Keep walk-forward model/feature selection inside the development window. The
    # final chronological test period must remain untouched by these comparisons.
    walk_forward_metrics = _evaluate_walk_forward(train, feature_columns, horizon_bars)
    holdout_feature_comparison = _evaluate_holdout_feature_variants(
        train, test, feature_columns, horizon_bars=horizon_bars
    )
    metrics = {
        "train_samples": len(train),
        "test_samples": len(test),
        "train_positive_rate": float(train["label"].mean()),
        "test_positive_rate": float(test["label"].mean()),
        "baseline_pr_auc": float(test["label"].mean()),
        "precision": float(precision_score(test["label"], predictions, zero_division=0)),
        "recall": float(recall_score(test["label"], predictions, zero_division=0)),
        "pr_auc": float(average_precision_score(test["label"], probabilities)),
        "roc_auc": float(roc_auc_score(test["label"], probabilities)),
        "ranking": _ranking_metrics(test["label"], probabilities, test["date"]),
        "walk_forward": walk_forward_metrics,
        "holdout_feature_comparison": holdout_feature_comparison,
        "confusion_matrix_labels_0_1": confusion_matrix(
            test["label"], predictions, labels=[0, 1]
        ).tolist(),
        "train_end": str(pd.to_datetime(train["date"]).max().date()),
        "test_start": str(pd.to_datetime(test["date"]).min().date()),
    }

    # Keep the holdout metrics from the temporal split, then fit the deployable model
    # on all labeled history so newly collected CSV data is included on every retrain.
    deployment_estimator = make_pipeline(
        StandardScaler(),
        LogisticRegression(class_weight="balanced", max_iter=2000, random_state=42),
    )
    deployment_estimator.fit(table[feature_columns], table["label"])

    metadata = {
        "algorithm": "StandardScaler + LogisticRegression",
        "target_pct": target_pct,
        "stop_pct": stop_pct,
        "horizon_bars": horizon_bars,
        "ema_periods": list(ema_periods),
        "slope_lookback": 5,
        "label_definition": (
            "enter at next adjusted open; label success if target is reached before stop "
            "within horizon_bars; when target and stop are touched in one candle, "
            "assume stop first"
        ),
        "feature_columns": feature_columns,
        "metrics": metrics,
    }
    model_path = Path(model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": deployment_estimator, "metadata": metadata}, model_path)
    metrics_path = model_path.with_suffix(".metrics.json")
    metrics_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return {"model_path": str(model_path), "metrics_path": str(metrics_path), **metadata}


def train_model(**kwargs) -> dict:
    """Public training entry point; the old fixed baseline is explicitly opt-in."""
    from forecast_ml.modeling.entry_training import train_entries

    return train_entries(**kwargs)


def main() -> None:

    parser = argparse.ArgumentParser(description="Treina e valida entradas por EMAs do Forecast.")
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    parser.add_argument(
        "--model-path", type=Path, default=MODELS_DIR / "ema_entry_candidate.joblib"
    )
    parser.add_argument("--production-model-path", type=Path)
    parser.add_argument("--calibration-fraction", type=float, default=0.2)
    parser.add_argument("--n-splits", type=int, default=5)
    parser.add_argument("--top-k", type=int, default=3)
    parser.add_argument("--cost-bps", type=float, default=10.0)
    parser.add_argument("--as-of", help="Última sessão fechada, YYYY-MM-DD")
    parser.add_argument("--target-pct", type=float, default=0.05)
    parser.add_argument("--stop-pct", type=float, default=0.03)
    parser.add_argument("--horizon-bars", type=int, default=10)
    parser.add_argument("--ema-periods", type=int, nargs="+", default=list(DEFAULT_EMA_PERIODS))
    parser.add_argument("--test-fraction", type=float, default=0.2)
    args = parser.parse_args()

    result = train_model(
        data_dir=args.data_dir,
        model_path=args.model_path,
        target_pct=args.target_pct,
        horizon_bars=args.horizon_bars,
        stop_pct=args.stop_pct,
        ema_periods=tuple(args.ema_periods),
        test_fraction=args.test_fraction,
        calibration_fraction=args.calibration_fraction,
        n_splits=args.n_splits,
        top_k=args.top_k,
        cost_bps=args.cost_bps,
        as_of=args.as_of,
        production_model_path=args.production_model_path,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
