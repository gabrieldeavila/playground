import numpy as np
import pandas as pd
import pytest

from forecast_ml.kandle_features import dollar_volume
from forecast_ml.modeling.kandle_model import split
from forecast_ml.universe import build_universe, russell_members, yahoo_symbol

ISHARES_CSV = """iShares Russell 2000 ETF
Fund Holdings as of,"Oct 03, 2026"
Inception Date,"May 22, 2000"
\xa0
Ticker,Name,Sector,Asset Class,Market Value,Weight (%),Notional Value,Quantity,Price
"SMCI","SUPER MICRO COMPUTER INC","Information Technology","Equity","1","0.5","1","1","1"
"MOG.A","MOOG INC CLASS A","Industrials","Equity","1","0.1","1","1","1"
"XTSLA","BLK CSH FND TREASURY SL AGENCY","Cash and/or Derivatives","Money Market","1","0.2","1","1","1"
"RTYZ6","RUSSELL 2000 EMINI DEC 26","Cash and/or Derivatives","Futures","1","0.0","1","1","1"
"""


def _members(index, tickers):
    return pd.DataFrame({"ticker": tickers, "sector": "S", "index": index})


def test_yahoo_symbol_uses_a_dash_for_share_classes():
    assert yahoo_symbol(" brk.b ") == "BRK-B"
    assert yahoo_symbol("BF/B") == "BF-B"


def test_russell_holdings_keep_only_equities(tmp_path):
    path = tmp_path / "IWM_holdings.csv"
    path.write_text(ISHARES_CSV, encoding="utf-8")
    members = russell_members(path)
    assert members["ticker"].tolist() == ["SMCI", "MOG-A"]
    assert set(members["index"]) == {"r2000"}


def test_universe_labels_each_ticker_with_its_highest_priority_index():
    universe = build_universe(
        [
            _members("sp500", ["AAPL"]),
            _members("sp600", ["SMCI"]),
            _members("r2000", ["SMCI", "ZZZ", "-"]),
            _members("watchlist", ["AAPL", "NVAX"]),
        ]
    )
    assert dict(universe[["ticker", "index"]].values) == {
        "AAPL": "sp500",
        "NVAX": "watchlist",
        "SMCI": "sp600",
        "ZZZ": "r2000",
    }


def test_dollar_volume_is_causal_and_ignores_splits():
    closes = np.linspace(10, 20, 40)
    group = pd.DataFrame({"close": closes, "volume": np.full(40, 1000.0)})
    value = dollar_volume(group)
    assert value.iloc[:19].isna().all()
    assert value.iloc[19] == pytest.approx((closes[:20] * 1000).mean())
    later_changed = group.assign(volume=np.r_[np.full(20, 1000.0), np.full(20, 1e9)])
    assert dollar_volume(later_changed).iloc[19] == value.iloc[19]
    # Split-adjusted history: half the price, twice the shares, same traded value.
    split_adjusted = group.assign(close=closes / 2, volume=2000.0)
    np.testing.assert_allclose(dollar_volume(split_adjusted), value)


def test_split_drops_illiquid_signals_and_restricts_only_training_to_the_universe():
    dates = pd.to_datetime(["2021-03-01", "2021-06-01", "2022-03-01", "2022-04-01"])
    dataset = pd.DataFrame(
        {
            "signal_date": [*dates, dates[0], dates[1]],
            "exit_date": [
                dates[0] + pd.Timedelta(days=20),
                pd.Timestamp("2022-02-01"),  # still open at test start: purged
                dates[2] + pd.Timedelta(days=20),
                pd.NaT,  # open trade: no label
                dates[0] + pd.Timedelta(days=20),
                dates[1] + pd.Timedelta(days=20),
            ],
            "label": [1.0, 0.0, 1.0, np.nan, 0.0, 1.0],
            "index": ["sp500", "sp500", "sp600", "sp500", "sp600", "sp600"],
            "liquid": [True, True, True, True, True, False],
        }
    )
    train_set, test_set = split(dataset, "2022-01-01")
    assert train_set.index.tolist() == [0, 4]
    assert test_set.index.tolist() == [2]
    train_set, test_set = split(dataset, "2022-01-01", universe=("sp500",))
    assert train_set.index.tolist() == [0]
    assert test_set.index.tolist() == [2]
