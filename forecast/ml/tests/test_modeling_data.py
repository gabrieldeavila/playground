import numpy as np
import pandas as pd
import pytest

from forecast_ml.features import _kandle_ema, build_features
from forecast_ml.labels import build_labels
from forecast_ml.modeling.train import chronological_split


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


def test_features_are_assigned_to_each_ticker_group() -> None:
    first = _candles(list(range(10, 30))).assign(ticker="AAA")
    second = _candles(list(range(20, 40))).assign(ticker="BBB")
    candles = pd.concat([first, second], ignore_index=True)

    features = build_features(candles, ema_periods=(2, 3))

    latest = features.groupby("ticker", sort=True).tail(1).set_index("ticker")
    assert latest["ema_alignment_hold_3"].notna().all()
    assert latest.loc["AAA", "ema_alignment_hold_3"] == 1
    assert latest.loc["BBB", "ema_alignment_hold_3"] == 1


def test_labels_use_future_adjusted_close_and_drop_incomplete_horizon() -> None:
    candles = _candles([100, 110, 105, 100])

    labels = build_labels(candles, target_pct=0.10, horizon_bars=2)

    assert labels["label"].tolist() == [1, 0]
    assert len(labels) == 2


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
