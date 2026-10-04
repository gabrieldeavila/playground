import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

from forecast_ml.features import build_features
from forecast_ml.modeling.calibration import calibrate_estimator
from forecast_ml.modeling.entry_evaluation import promotion_gate
from forecast_ml.modeling.entry_training import (
    FEATURE_VERSION,
    closed_session_cutoff,
    purged_split,
)
from forecast_ml.modeling.predict import predict_opportunities
from forecast_ml.modeling.train import _portfolio_backtest


def candles(size=100):
    close = 100 + np.arange(size) * 0.1 + np.sin(np.arange(size))
    return pd.DataFrame(
        {
            "ticker": "AAA",
            "date": pd.date_range("2020-01-01", periods=size),
            "open": close,
            "high": close + 2,
            "low": close - 2,
            "close": close,
            "adjusted_close": close,
            "volume": 1000,
        }
    )


def test_features_are_split_adjusted_and_causal():
    reference = candles()
    split = reference.copy()
    split.loc[:39, ["open", "high", "low", "close"]] *= 2
    expected = build_features(reference, ema_periods=(2, 3))
    actual = build_features(split, ema_periods=(2, 3))
    pd.testing.assert_frame_equal(actual, expected)
    prefix = build_features(split.iloc[:80], ema_periods=(2, 3))
    pd.testing.assert_frame_equal(prefix, actual.iloc[:80].reset_index(drop=True))


def test_ema_cross_reclaim_and_pullback():
    frame = candles(20)
    frame.loc[:, ["open", "close", "adjusted_close"]] = 10.0
    frame.loc[:, "high"] = 11.0
    frame.loc[:, "low"] = 9.0
    frame.loc[16:17, ["open", "close", "adjusted_close"]] = 12.0
    frame.loc[16:17, "high"] = 13.0
    frame.loc[18, ["open", "close", "adjusted_close"]] = 8.0
    frame.loc[18, ["high", "low"]] = [13.0, 7.0]
    features = build_features(frame, ema_periods=(2, 3))
    assert features.loc[16, "ema_2_cross_up"] == 1
    assert features.loc[16, "ema_2_reclaim"] == 1
    assert features.loc[17, "ema_2_pullback"] == 1
    assert features.loc[17, "ema_2_cross_up"] == 0
    assert features.loc[18, "ema_2_cross_down"] == 1
    assert features.loc[18, "ema_2_reclaim"] == 0


def test_same_day_trade_can_close_without_unclosed_positions():
    frame = pd.DataFrame(
        {
            "ticker": ["AAA"],
            "date": ["2020-01-01"],
            "entry_date": ["2020-01-02"],
            "exit_date": ["2020-01-02"],
            "score": [0.9],
            "trade_return_pct": [0.05],
        }
    )
    report = _portfolio_backtest(frame, max_positions=1, transaction_cost_bps=0)
    assert report["signals_selected"] == 1
    assert report["portfolio_total_return_pct"] == pytest.approx(5)


def test_intraday_exit_does_not_release_capacity_before_the_open():
    frame = pd.DataFrame(
        {
            "ticker": ["AAA", "AAA", "BBB"],
            "date": ["2020-01-01"] * 3,
            "entry_date": ["2020-01-02", "2020-01-03", "2020-01-03"],
            "exit_date": ["2020-01-03", "2020-01-04", "2020-01-04"],
            "score": [0.9, 0.8, 0.7],
            "trade_return_pct": [0.05, 0.9, 0.9],
        }
    )
    report = _portfolio_backtest(frame, max_positions=1, transaction_cost_bps=0)
    assert report["signals_selected"] == 1
    assert report["active_ticker_skips"] == 1
    assert report["capacity_rejections"] == 1
    assert report["portfolio_total_return_pct"] == pytest.approx(5)


def test_purge_removes_labels_crossing_next_block():
    dates = pd.date_range("2020-01-01", periods=100)
    table = pd.DataFrame(
        {"ticker": "AAA", "date": dates, "exit_date": dates + pd.Timedelta(days=12)}
    )
    train, test = purged_split(table, horizon_bars=2, fraction=0.2)
    assert train["exit_date"].max() < test["date"].min()


def test_calibration_does_not_refit_estimator():
    features = pd.DataFrame({"x": np.linspace(-1, 1, 100)})
    labels = pd.Series(([0] * 50) + ([1] * 50))
    estimator = LogisticRegression().fit(features, labels)
    before = estimator.coef_.copy()
    calibrated = calibrate_estimator(estimator, features, labels)
    np.testing.assert_array_equal(estimator.coef_, before)
    scores = calibrated.predict_proba(features)
    assert np.isfinite(scores).all()
    assert (scores >= 0).all() and (scores <= 1).all()
    assert calibrated.calibrator.coef_[0, 0] > 0


def test_promotion_requires_stability_and_holdout_evidence():
    fold = {
        "mean_delta_vs_ema_pct_points": 0.2,
        "mean_delta_vs_universe_pct_points": 0.2,
        "mean_net_return_pct": 0.2,
    }
    holdout = {
        "top_k": 3,
        "dates": 100,
        "mean_net_return_pct": 0.2,
        "ci95_delta_vs_ema_pct_points": [0.01, 0.4],
        "return_lift_vs_universe": {"top_3": {"confidence_interval_95_pct_points": [0.01, 0.4]}},
        "portfolio_backtest": {"portfolio_total_return_pct": 2},
    }
    gate = promotion_gate([fold] * 5, holdout, np.float64(1))
    assert gate["approved"]
    assert all(type(passed) is bool for passed in gate["checks"].values())
    assert json.loads(json.dumps(gate, allow_nan=False)) == gate
    bad = {**fold, "mean_delta_vs_ema_pct_points": -0.1}
    assert not promotion_gate([fold, fold, fold, bad, bad], holdout, 1)["approved"]
    assert not promotion_gate([fold] * 5, holdout, -1)["approved"]
    holdout["ci95_delta_vs_ema_pct_points"] = [-0.1, 0.4]
    assert not promotion_gate([fold] * 5, holdout, 1)["approved"]


def artifact(tmp_path: Path, frame: pd.DataFrame, approved=False):
    features = build_features(frame, ema_periods=(2, 3))
    columns = ["close_to_ema_2_pct"]
    valid = features.dropna(subset=columns)
    model = LogisticRegression().fit(valid[columns], np.arange(len(valid)) % 2)
    path = tmp_path / "model.joblib"
    joblib.dump(
        {
            "model": model,
            "metadata": {
                "feature_version": FEATURE_VERSION,
                "promotion_gate": {"approved": approved},
                "ema_periods": [2, 3],
                "slope_lookback": 5,
                "feature_columns": columns,
                "top_k": 3,
                "target_pct": 0.05,
                "stop_pct": 0.03,
                "horizon_bars": 10,
            },
        },
        path,
    )
    return path


def test_prediction_rejects_experimental_model_by_default(tmp_path):
    frame = candles()
    path = artifact(tmp_path, frame)
    with pytest.raises(ValueError, match="experimental"):
        predict_opportunities(frame, path)
    result = predict_opportunities(frame, path, allow_experimental=True)
    assert result["model_status"].eq("experimental").all()
    assert not result["entry_candidate"].any()


def test_prediction_uses_common_latest_session_and_deterministic_ranking(tmp_path):
    frame = candles()
    frame = pd.concat([frame, frame.assign(ticker="BBB"), frame.iloc[:-1].assign(ticker="STALE")])
    path = artifact(tmp_path, frame, approved=True)
    result = predict_opportunities(frame, path, as_of="2020-04-09")
    assert result["ticker"].tolist() == ["AAA", "BBB"]
    assert result["rank"].tolist() == [1, 2]
    assert result["date"].nunique() == 1
    assert result["entry_candidate"].all()
    with pytest.raises(ValueError, match="top_k"):
        predict_opportunities(frame, path, top_k=5)


def test_prediction_never_falls_back_to_previous_valid_feature(tmp_path):
    frame = candles()
    path = artifact(tmp_path, frame, approved=True)
    frame.loc[len(frame) - 1, "adjusted_close"] = np.nan
    assert predict_opportunities(frame, path).empty


def test_prediction_rejects_legacy_artifact(tmp_path):
    path = tmp_path / "old.joblib"
    joblib.dump({"model": None, "metadata": {}}, path)
    with pytest.raises(ValueError, match="incompatível"):
        predict_opportunities(candles(), path)


def test_training_exports_oos_and_preserves_production_on_failed_gate(tmp_path, monkeypatch):
    from forecast_ml.modeling import entry_training

    rng = np.random.default_rng(42)
    frame = candles(600)
    close = 100 * np.exp(np.cumsum(rng.normal(0, 0.025, len(frame))))
    frame["open"] = close * np.exp(rng.normal(0, 0.005, len(frame)))
    frame["close"] = frame["adjusted_close"] = close
    frame["high"] = frame[["open", "close"]].max(axis=1) * 1.015
    frame["low"] = frame[["open", "close"]].min(axis=1) * 0.985
    monkeypatch.setattr(entry_training, "load_market_data", lambda _: frame)
    monkeypatch.setattr(
        entry_training,
        "_make_candidate_estimators",
        lambda: {"logistic_regression": LogisticRegression(max_iter=1000)},
    )
    monkeypatch.setattr(
        entry_training,
        "promotion_gate",
        lambda *args: {
            "approved": False,
            "checks": {"forced_rejection": False},
            "stable_folds": 0,
        },
    )
    production = tmp_path / "production.joblib"
    production.write_bytes(b"preserve-existing-model")
    candidate = tmp_path / "candidate.joblib"
    result = entry_training.train_entries(
        model_path=candidate,
        production_model_path=production,
        ema_periods=(2, 3),
        target_pct=0.02,
        stop_pct=0.02,
        horizon_bars=3,
        n_splits=3,
        top_k=1,
        as_of="2022-01-01",
    )
    assert not result["published"]
    assert result["status"] == "experimental"
    assert production.read_bytes() == b"preserve-existing-model"
    assert candidate.exists()
    assert candidate.with_suffix(".metrics.json").exists()
    assert candidate.with_suffix(".oof.csv").exists()
    assert candidate.with_suffix(".holdout.csv").exists()
    evaluated = result["evaluation"]
    assert evaluated["development_end"] < evaluated["calibration_start"]
    assert evaluated["calibration_end"] < evaluated["holdout_start"]
    assert predict_opportunities(frame, candidate, allow_experimental=True).shape[0] == 1


def test_explicit_cutoff_is_session_date():
    assert closed_session_cutoff("2024-01-02") == pd.Timestamp("2024-01-02")
    with pytest.raises(ValueError, match="as_of"):
        closed_session_cutoff("2024-01-02T13:00:00")
