import numpy as np
import pandas as pd
import pytest

from forecast_ml.features import _kandle_ema, build_features
from forecast_ml.labels import build_labels, build_trade_outcomes
from forecast_ml.modeling.train import (
    _evaluate_feature_ablation,
    _evaluate_holdout_feature_variants,
    _feature_groups,
    _moving_block_bootstrap_ci,
    _ranking_metrics,
    chronological_split,
    walk_forward_splits,
)


def _candles(closes: list[float]) -> pd.DataFrame:
    dates = pd.date_range("2024-01-01", periods=len(closes), freq="D")
    return pd.DataFrame(
        {
            "ticker": "TEST",
            "date": dates,
            "open": closes,
            "high": closes,
            "low": closes,
            "close": closes,
            "adjusted_close": closes,
            "volume": [1000] * len(closes),
        }
    )


def test_kandle_ema_uses_sma_seed() -> None:
    ema = _kandle_ema(pd.Series([1.0, 2.0, 3.0, 4.0]), period=3)

    assert np.isnan(ema.iloc[0])
    assert np.isnan(ema.iloc[1])
    assert ema.iloc[2] == pytest.approx(2.0)
    assert ema.iloc[3] == pytest.approx(3.0)


def test_features_at_previous_dates_do_not_depend_on_future_candles() -> None:
    base = _candles([10, 11, 10, 12, 13, 14, 15, 16])
    extended = pd.concat([base, _candles([100, 200]).assign(date=pd.date_range("2024-01-09", periods=2))])

    base_features = build_features(base, ema_periods=(2, 3))
    extended_features = build_features(extended, ema_periods=(2, 3))
    feature_columns = [column for column in base_features if column not in {"ticker", "date"}]

    pd.testing.assert_frame_equal(
        base_features[feature_columns], extended_features.iloc[: len(base)][feature_columns]
    )


def test_features_include_causal_risk_and_price_action_signals() -> None:
    candles = _candles([100 + index for index in range(80)])
    candles["high"] = candles["close"] + 1
    candles["low"] = candles["close"] - 1
    candles["open"] = candles["close"] - 0.5

    features = build_features(candles, ema_periods=(2, 3))

    expected_columns = {
        "atr_14_pct",
        "realized_volatility_10",
        "realized_volatility_20",
        "drawdown_20",
        "gap_open_pct",
        "candle_body_pct",
        "close_return_20",
        "close_return_60",
    }
    assert expected_columns.issubset(features.columns)
    assert features.loc[13, "atr_14_pct"] == pytest.approx(2 / candles.loc[13, "close"])
    assert features.loc[18, "realized_volatility_10"] > 0
    assert features.loc[19, "drawdown_20"] == pytest.approx(0)
    assert features.loc[0, "atr_14_pct"] != features.loc[0, "atr_14_pct"]


def test_features_are_assigned_to_each_ticker_group() -> None:
    first = _candles(list(range(10, 30))).assign(ticker="AAA")
    second = _candles(list(range(20, 40))).assign(ticker="BBB")
    candles = pd.concat([first, second], ignore_index=True)

    features = build_features(candles, ema_periods=(2, 3))

    latest = features.groupby("ticker", sort=True).tail(1).set_index("ticker")
    assert latest["ema_alignment_hold_3"].notna().all()
    assert latest.loc["AAA", "ema_alignment_hold_3"] == 1
    assert latest.loc["BBB", "ema_alignment_hold_3"] == 1


def test_labels_enter_at_next_open_and_drop_incomplete_horizon() -> None:
    candles = _candles([100, 100, 112, 100])

    labels = build_labels(candles, target_pct=0.10, stop_pct=0.03, horizon_bars=2)

    assert labels["label"].tolist() == [1, 0]
    assert len(labels) == 2


def test_labels_assume_stop_first_when_both_barriers_hit_in_same_candle() -> None:
    candles = _candles([100, 100, 100, 100])
    candles.loc[1, ["high", "low"]] = [111, 90]
    candles.loc[2, ["high", "low"]] = [111, 99]

    labels = build_labels(candles, target_pct=0.10, stop_pct=0.05, horizon_bars=2)

    assert labels["label"].tolist() == [0, 1]


def test_labels_remain_failed_if_stop_is_hit_before_later_target() -> None:
    candles = _candles([100, 100, 100, 100])
    candles.loc[1, ["high", "low"]] = [100, 90]
    candles.loc[2, ["high", "low"]] = [111, 99]

    labels = build_labels(candles, target_pct=0.10, stop_pct=0.05, horizon_bars=2)

    assert labels["label"].iloc[0] == 0


def test_trade_outcomes_mark_to_market_at_horizon_when_no_barrier_is_hit() -> None:
    candles = _candles([100, 100, 101, 102])

    outcomes = build_trade_outcomes(
        candles, target_pct=0.10, stop_pct=0.05, horizon_bars=2
    )

    assert outcomes.loc[0, "label"] == 0
    assert outcomes.loc[0, "exit_reason"] == "horizon"
    assert outcomes.loc[0, "trade_return_pct"] == pytest.approx(0.01)
    assert outcomes.loc[0, "bars_held"] == 2


def test_trade_outcomes_execute_gap_stop_at_open_not_barrier() -> None:
    candles = _candles([100, 100, 90, 90])
    # Enter at 100 on the next candle's open; the following candle gaps through
    # the 95 stop, so the exit must be at its 90 open, not at the stop barrier.
    candles.loc[1, ["high", "low"]] = [101, 99]

    outcomes = build_trade_outcomes(
        candles, target_pct=0.10, stop_pct=0.05, horizon_bars=2
    )

    assert outcomes.loc[0, "label"] == 0
    assert outcomes.loc[0, "exit_reason"] == "stop_gap"
    assert outcomes.loc[0, "trade_return_pct"] == pytest.approx(-0.10)
    assert outcomes.loc[0, "bars_held"] == 2


def test_walk_forward_splits_are_chronological_and_purge_horizon() -> None:
    table = pd.DataFrame(
        {
            "date": pd.date_range("2024-01-01", periods=40, freq="D"),
            "ticker": "TEST",
            "label": [0, 1] * 20,
        }
    )

    folds = walk_forward_splits(
        table, horizon_bars=2, n_splits=3, min_train_fraction=0.4
    )

    assert len(folds) == 3
    for train, validation in folds:
        assert train["date"].max() < validation["date"].min()
        assert (table["date"] < validation["date"].min()).sum() - len(train) >= 2


def test_feature_groups_partition_features_for_ablation() -> None:
    columns = [
        "close_to_ema_9_pct",
        "ema_9_slope_5",
        "ema_spread_ratio",
        "ema_bullish_order",
        "close_return_5",
        "realized_volatility_20",
        "atr_14_pct",
        "volume_to_mean_20",
        "unclassified_feature",
    ]

    groups = _feature_groups(columns)

    assert set(column for group in groups.values() for column in group) == set(columns)
    assert groups["trend"] == columns[:4]
    assert groups["momentum"] == ["close_return_5"]
    assert groups["risk_price_action"] == ["realized_volatility_20", "atr_14_pct"]
    assert groups["volume"] == ["volume_to_mean_20"]
    assert groups["other"] == ["unclassified_feature"]


def test_feature_ablation_compares_variants_on_same_temporal_fold() -> None:
    train_labels = np.array([0, 1] * 15)
    validation_labels = np.array([0, 1] * 6)
    train = pd.DataFrame(
        {
            "date": pd.date_range("2024-01-01", periods=len(train_labels)),
            "label": train_labels,
            "close_return_5": train_labels.astype(float),
            "volume_to_mean_20": np.tile([0.2, -0.2], 15),
            "trade_return_pct": np.where(train_labels == 1, 0.05, -0.03),
            "bars_held": np.ones(len(train_labels), dtype=int),
        }
    )
    validation = pd.DataFrame(
        {
            "date": pd.date_range("2024-02-01", periods=len(validation_labels)),
            "label": validation_labels,
            "close_return_5": validation_labels.astype(float),
            "volume_to_mean_20": np.tile([-0.2, 0.2], 6),
            "trade_return_pct": np.where(validation_labels == 1, 0.05, -0.03),
            "bars_held": np.ones(len(validation_labels), dtype=int),
        }
    )

    report = _evaluate_feature_ablation(
        [(train, validation)], ["close_return_5", "volume_to_mean_20"]
    )

    assert report["variants"]["full"]["oof_samples"] == len(validation)
    assert report["variants"]["full"]["delta_vs_full"]["oof_pr_auc"] == 0
    assert "without_momentum" in report["variants"]
    assert "volume_only" in report["variants"]
    assert report["variants"]["full"]["top_3_mean_gross_return_pct"] is not None
    assert report["folds"][0]["models"]["full"]["top_3_mean_gross_return_pct"] is not None
    assert len(report["folds"]) == 1


def test_holdout_feature_comparison_reports_full_and_risk_only_candidates() -> None:
    train_labels = np.array([0, 1] * 20)
    test_labels = np.array([0, 1] * 10)
    train = pd.DataFrame(
        {
            "date": pd.date_range("2024-01-01", periods=len(train_labels)),
            "label": train_labels,
            "close_return_5": np.linspace(-0.1, 0.1, len(train_labels)),
            "atr_14_pct": np.tile([0.01, 0.03], 20),
            "trade_return_pct": np.where(train_labels == 1, 0.05, -0.03),
            "bars_held": np.ones(len(train_labels), dtype=int),
        }
    )
    test = pd.DataFrame(
        {
            "date": pd.date_range("2024-03-01", periods=len(test_labels)),
            "label": test_labels,
            "close_return_5": np.linspace(-0.1, 0.1, len(test_labels)),
            "atr_14_pct": np.tile([0.01, 0.03], 10),
            "trade_return_pct": np.where(test_labels == 1, 0.05, -0.03),
            "bars_held": np.ones(len(test_labels), dtype=int),
        }
    )

    report = _evaluate_holdout_feature_variants(
        train, test, ["close_return_5", "atr_14_pct"]
    )

    assert report["selection_source"] == "walk_forward_development_window"
    assert report["test_start"] == "2024-03-01"
    assert set(report["variants"]) == {"full", "risk_price_action_only"}
    assert report["variants"]["risk_price_action_only"]["feature_columns"] == [
        "atr_14_pct"
    ]
    assert report["variants"]["full"]["delta_vs_full"]["pr_auc"] == 0
    assert report["variants"]["full"]["top_3_mean_gross_return_pct"] is not None
    assert report["variants"]["risk_price_action_only"]["delta_vs_full"][
        "top_3_mean_gross_return_pct"
    ] is not None
    top_3_uncertainty = report["paired_return_differences_vs_full"]["top_3"]
    assert top_3_uncertainty["dates_compared"] == 20
    assert len(top_3_uncertainty["confidence_interval_95_pct_points"]) == 2


def test_moving_block_bootstrap_ci_is_deterministic_and_handles_constant_values() -> None:
    values = np.full(25, 0.25)

    first = _moving_block_bootstrap_ci(values, block_size=5, n_bootstrap=100)
    second = _moving_block_bootstrap_ci(values, block_size=5, n_bootstrap=100)

    assert first == second == pytest.approx((0.25, 0.25))


def test_ranking_metrics_measure_top_k_per_date() -> None:
    labels = pd.Series([0, 1, 1, 0, 1, 0])
    probabilities = np.array([0.7, 0.9, 0.8, 0.6, 0.5, 0.4])
    dates = pd.Series(pd.to_datetime(["2024-01-01"] * 3 + ["2024-01-02"] * 3))

    metrics = _ranking_metrics(labels, probabilities, dates, top_k_values=(1,))

    assert metrics["dates_evaluated"] == 2
    assert metrics["precision_at_1"] == 0.5
    assert metrics["selected_at_1"] == 2
    assert metrics["lift_at_1"] == pytest.approx(1.0)


def test_chronological_split_leaves_horizon_gap() -> None:
    table = pd.DataFrame(
        {
            "date": pd.date_range("2024-01-01", periods=20, freq="D"),
            "ticker": "TEST",
            "label": [0, 1] * 10,
        }
    )

    train, test = chronological_split(table, horizon_bars=3, test_fraction=0.25)

    assert train["date"].max() < pd.Timestamp("2024-01-13")
    assert test["date"].min() == pd.Timestamp("2024-01-16")
    assert train["date"].max() + pd.Timedelta(days=3) < test["date"].min()


def test_chronological_split_purges_per_ticker_with_missing_dates() -> None:
    dates = pd.date_range("2024-01-01", periods=24, freq="D")
    table = pd.concat(
        [
            pd.DataFrame({"date": dates, "ticker": "A", "label": [0, 1] * 12}),
            pd.DataFrame(
                {
                    "date": dates.delete([4, 8, 12]),
                    "ticker": "B",
                    "label": [0, 1] * 10 + [0],
                }
            ),
        ],
        ignore_index=True,
    )

    train, test = chronological_split(table, horizon_bars=3, test_fraction=0.25)

    for ticker in table["ticker"].unique():
        ticker_train = train.loc[train["ticker"] == ticker, "date"]
        ticker_test = test.loc[test["ticker"] == ticker, "date"]
        assert len(ticker_train) >= 3
        assert len(ticker_test) > 0
        assert ticker_train.max() < ticker_test.min()
        assert (table.loc[table["ticker"] == ticker, "date"] < ticker_test.min()).sum() - len(
            ticker_train
        ) >= 3
