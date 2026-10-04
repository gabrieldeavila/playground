"""EMA entry training workflow: selection, calibration, holdout and guarded publication."""

from datetime import datetime, timedelta, timezone
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from forecast_ml.config import MODELS_DIR, RAW_DATA_DIR
from forecast_ml.dataset import load_market_data
from forecast_ml.features import DEFAULT_EMA_PERIODS
from forecast_ml.modeling.calibration import calibrate_estimator
from forecast_ml.modeling.entry_evaluation import evaluate_entries, promotion_gate
from forecast_ml.modeling.train import (
    _make_candidate_estimators,
    build_training_table,
    chronological_split,
    walk_forward_splits,
)

FEATURE_VERSION = 2


def closed_session_cutoff(as_of: str | None = None) -> pd.Timestamp:
    """Without an explicit session, exclude today's potentially unfinished candle."""
    if as_of is None:
        return pd.Timestamp(datetime.now(timezone.utc).date() - timedelta(days=1))
    parsed = pd.Timestamp(as_of)
    if pd.isna(parsed) or parsed.tzinfo is not None or parsed != parsed.normalize():
        raise ValueError("as_of precisa ser uma data de sessão sem horário/fuso (YYYY-MM-DD).")
    return parsed


def purged_split(
    table: pd.DataFrame, horizon_bars: int, fraction: float
) -> tuple[pd.DataFrame, pd.DataFrame]:
    earlier, later = chronological_split(table, horizon_bars, fraction)
    earlier = earlier.loc[pd.to_datetime(earlier["exit_date"]) < later["date"].min()]
    if earlier.empty:
        raise ValueError("Bloco temporal vazio após purga dos outcomes.")
    return earlier, later


def _candidate_columns(columns: list[str]) -> dict[str, list[str]]:
    # EMA-only vs contextual EMA model; do not search thresholds on the holdout.
    trend = [c for c in columns if c.startswith(("ema_", "close_to_ema_"))]
    return {"full": columns, "ema_only": trend}


def select_entry_model(
    development: pd.DataFrame,
    columns: list[str],
    horizon_bars: int,
    n_splits: int,
    top_k: int,
    cost_bps: float,
) -> tuple[str, list[str], dict, pd.DataFrame]:
    folds = walk_forward_splits(development, horizon_bars, n_splits=n_splits)
    reports = {}
    predictions = {}
    for feature_set, selected_columns in _candidate_columns(columns).items():
        for algorithm in _make_candidate_estimators():
            name = f"{algorithm}:{feature_set}"
            fold_reports, oof = [], []
            for index, (train, validation) in enumerate(folds, 1):
                train = train.loc[pd.to_datetime(train["exit_date"]) < validation["date"].min()]
                if train["label"].nunique() != 2:
                    raise ValueError(f"Fold {index}: treino precisa de ambas as classes.")
                estimator = _make_candidate_estimators()[algorithm]
                estimator.fit(train[selected_columns], train["label"])
                scores = estimator.predict_proba(validation[selected_columns])[:, 1]
                report = evaluate_entries(
                    validation, scores, horizon_bars, top_k, cost_bps, bootstrap=False
                )
                fold_reports.append({"fold": index, **report})
                frame = validation.copy()
                frame["score"] = scores
                frame["fold"] = index
                oof.append(frame)
            reports[name] = {
                "algorithm": algorithm,
                "feature_set": feature_set,
                "feature_columns": selected_columns,
                "folds": fold_reports,
                "mean_fold_lift_vs_ema_pct_points": float(
                    np.mean([r["mean_delta_vs_ema_pct_points"] for r in fold_reports])
                ),
                "mean_fold_net_return_pct": float(
                    np.mean([r["mean_net_return_pct"] for r in fold_reports])
                ),
            }
            predictions[name] = pd.concat(oof, ignore_index=True)
    # Fixed objective: equal-weight fold return lift over the fixed EMA baseline.
    winner = max(
        sorted(reports),
        key=lambda name: (
            reports[name]["mean_fold_lift_vs_ema_pct_points"],
            reports[name]["mean_fold_net_return_pct"],
        ),
    )
    return winner, reports[winner]["feature_columns"], reports, predictions[winner]


def train_entries(
    data_dir: Path = RAW_DATA_DIR,
    model_path: Path = MODELS_DIR / "ema_entry_candidate.joblib",
    target_pct: float = 0.05,
    stop_pct: float = 0.03,
    horizon_bars: int = 10,
    ema_periods: tuple[int, ...] = DEFAULT_EMA_PERIODS,
    test_fraction: float = 0.2,
    calibration_fraction: float = 0.2,
    n_splits: int = 5,
    top_k: int = 3,
    cost_bps: float = 10.0,
    as_of: str | None = None,
    production_model_path: Path | None = None,
) -> dict:
    if n_splits < 3:
        raise ValueError("Use ao menos 3 folds para avaliar estabilidade temporal.")
    if top_k <= 0 or not np.isfinite(cost_bps) or not 0 <= cost_bps < 10_000:
        raise ValueError("top_k deve ser positivo e custo deve estar em [0, 10000) bps.")
    model_path = Path(model_path)
    if (
        production_model_path is not None
        and model_path.resolve() == Path(production_model_path).resolve()
    ):
        raise ValueError("Artefato experimental e de produção precisam de caminhos distintos.")
    cutoff = closed_session_cutoff(as_of)
    candles = load_market_data(data_dir)
    candles = candles.loc[candles["date"] <= cutoff]
    table, columns = build_training_table(candles, target_pct, horizon_bars, stop_pct, ema_periods)
    development_calibration, holdout = purged_split(table, horizon_bars, test_fraction)
    development, calibration = purged_split(
        development_calibration, horizon_bars, calibration_fraction
    )
    winner, selected_columns, comparison, oof = select_entry_model(
        development, columns, horizon_bars, n_splits, top_k, cost_bps
    )
    algorithm = comparison[winner]["algorithm"]
    estimator = _make_candidate_estimators()[algorithm]
    estimator.fit(development[selected_columns], development["label"])
    calibrated = calibrate_estimator(
        estimator, calibration[selected_columns], calibration["label"]
    )
    holdout_scores = calibrated.predict_proba(holdout[selected_columns])[:, 1]
    report = evaluate_entries(holdout, holdout_scores, horizon_bars, top_k, cost_bps)
    gate = promotion_gate(
        comparison[winner]["folds"], report, float(calibrated.calibrator.coef_[0, 0])
    )
    # Refit the frozen recipe on all observable history, retaining a later calibration
    # block. Holdout metrics describe the pre-refit evaluation, not this final model.
    refit_train, refit_calibration = purged_split(table, horizon_bars, calibration_fraction)
    final_estimator = _make_candidate_estimators()[algorithm]
    final_estimator.fit(refit_train[selected_columns], refit_train["label"])
    final_model = calibrate_estimator(
        final_estimator, refit_calibration[selected_columns], refit_calibration["label"]
    )
    gate["checks"]["refit_calibration_preserves_ranking"] = bool(
        final_model.calibrator.coef_[0, 0] > 0
    )
    gate["approved"] = bool(all(gate["checks"].values()))
    metadata = {
        "feature_version": FEATURE_VERSION,
        "algorithm": algorithm,
        "selected_candidate": winner,
        "feature_columns": selected_columns,
        "ema_periods": list(ema_periods),
        "slope_lookback": 5,
        "target_pct": target_pct,
        "stop_pct": stop_pct,
        "horizon_bars": horizon_bars,
        "top_k": top_k,
        "transaction_cost_bps_per_side": cost_bps,
        "as_of": str(cutoff.date()),
        "data_end": str(candles["date"].max().date()),
        "tickers": sorted(candles["ticker"].unique().tolist()),
        "probability_calibration": "sigmoid on purged chronological block",
        "label_definition": "next adjusted open; target before stop; ambiguous bar stop-first",
        "selection_objective": "mean fold daily top-k gross return lift vs fixed EMA benchmark",
        "status": "validated" if gate["approved"] else "experimental",
        "promotion_gate": gate,
        "evaluation": {
            "development_end": str(development["date"].max().date()),
            "calibration_start": str(calibration["date"].min().date()),
            "calibration_end": str(calibration["date"].max().date()),
            "holdout_start": str(holdout["date"].min().date()),
            "holdout_end": str(holdout["date"].max().date()),
            "model_comparison": comparison,
            "holdout": report,
            "scope": "pre-refit frozen model; reused historical holdout is not a new blind test",
        },
        "refit": {
            "train_end": str(refit_train["date"].max().date()),
            "calibration_start": str(refit_calibration["date"].min().date()),
            "calibration_end": str(refit_calibration["date"].max().date()),
            "labels_observed_through": str(table["exit_date"].max().date()),
            "calibration_slope": float(final_model.calibrator.coef_[0, 0]),
        },
    }
    artifact = {"model": final_model, "metadata": metadata}
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, model_path)
    metrics_path = model_path.with_suffix(".metrics.json")
    metrics_path.write_text(json.dumps(metadata, indent=2, allow_nan=False), encoding="utf-8")
    exported = ["ticker", "date", "entry_date", "exit_date", "label", "trade_return_pct"]
    oof[exported + ["score", "fold"]].to_csv(model_path.with_suffix(".oof.csv"), index=False)
    holdout_frame = holdout[exported].copy()
    holdout_frame["score"] = holdout_scores
    holdout_frame.to_csv(model_path.with_suffix(".holdout.csv"), index=False)
    published = False
    if gate["approved"] and production_model_path is not None:
        production_model_path = Path(production_model_path)
        production_model_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(artifact, production_model_path)
        production_model_path.with_suffix(".metrics.json").write_text(
            json.dumps(metadata, indent=2, allow_nan=False), encoding="utf-8"
        )
        published = True
    return {
        "model_path": str(model_path),
        "metrics_path": str(metrics_path),
        "published": published,
        **metadata,
    }
