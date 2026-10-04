"""Score each Kandle COMPRA with the chance that its trade ends in profit.

train:   fit on signals before ``--test-start`` (only trades already closed by then),
         test on signals from ``--test-start`` on, and save that same model. The test
         period is never used for fitting, so its numbers are an honest preview.
predict: write data/processed/kandle_signals.json for the API.
"""

import argparse
from datetime import datetime, timezone
from itertools import pairwise
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score

from forecast_ml.config import (
    MODELS_DIR,
    PROCESSED_DATA_DIR,
    RAW_DATA_DIR,
    REPORTS_DIR,
    TICKER_NAMES_PATH,
)
from forecast_ml.dataset import load_market_data
from forecast_ml.kandle_features import FEATURES, add_features
from forecast_ml.trades import simulate_trades

MODEL_PATH = MODELS_DIR / "kandle_model.joblib"
SNAPSHOT_PATH = PROCESSED_DATA_DIR / "kandle_signals.json"
# Score bands reported on the test period; each signal shows its band's real win rate.
SCORE_BANDS = (0, 30, 50, 70, 90, 100)


def build_dataset(candles: pd.DataFrame) -> pd.DataFrame:
    return add_features(simulate_trades(candles), candles)


def make_model() -> HistGradientBoostingClassifier:
    # Shallow and heavily regularized: a few hundred thousand noisy trades at most.
    return HistGradientBoostingClassifier(
        max_depth=3,
        learning_rate=0.05,
        max_iter=200,
        min_samples_leaf=200,
        l2_regularization=1.0,
        random_state=42,
    )


def to_score(model, reference: np.ndarray, features: pd.DataFrame) -> np.ndarray:
    """Nota 0-100: share of training signals the model rated lower than this one."""
    probabilities = model.predict_proba(features)[:, 1]
    return np.searchsorted(reference, probabilities, side="right") / len(reference) * 100


def summary_by_band(trades: pd.DataFrame, scores: np.ndarray) -> list[dict]:
    """Real outcomes of test signals per score band (the last band includes 100)."""
    rows = []
    for low, high in pairwise(SCORE_BANDS):
        inside = (scores >= low) & ((scores < high) | (high == SCORE_BANDS[-1]))
        chosen = trades.loc[inside]
        if chosen.empty:
            continue
        rows.append(
            {
                "score_from": low,
                "score_to": high,
                "trades": len(chosen),
                "win_rate_pct": round(float(chosen["label"].mean() * 100), 1),
                "mean_return_pct": round(float(chosen["return_pct"].mean()), 2),
                "median_days": float(chosen["days"].median()),
            }
        )
    return rows


def summary_by_type(trades: pd.DataFrame) -> list[dict]:
    """Test-period outcomes of trend starts versus every Kandle COMPRA."""
    rows = []
    for kind, chosen in (("trend_start", trades.loc[trades["trend_start"]]), ("all", trades)):
        rows.append(
            {
                "type": kind,
                "trades": len(chosen),
                "win_rate_pct": round(float(chosen["label"].mean() * 100), 1),
                "mean_return_pct": round(float(chosen["return_pct"].mean()), 2),
                "median_days": float(chosen["days"].median()),
            }
        )
    return rows


def band_win_rate(score: float, bands: list[dict]) -> float | None:
    for band in bands:
        if band["score_from"] <= score < band["score_to"] or score == band["score_to"] == 100:
            return band["win_rate_pct"]
    return None


def train(data_dir: Path, test_start: str, model_path: Path) -> dict:
    start = pd.Timestamp(test_start)
    dataset = build_dataset(load_market_data(data_dir))
    closed = dataset.dropna(subset=["label"])
    # Purge: a trade still open at test_start would leak its outcome into training.
    train_set = closed.loc[(closed["signal_date"] < start) & (closed["exit_date"] < start)]
    test_set = closed.loc[closed["signal_date"] >= start]
    model = make_model().fit(train_set[FEATURES], train_set["label"])
    reference = np.sort(model.predict_proba(train_set[FEATURES])[:, 1])
    scores = to_score(model, reference, test_set[FEATURES])
    report = {
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "rules": "COMPRA Kandle EMA 9/20/50/100; entrada no open seguinte; stop 3xATR no "
        "fechamento; saída com EMA 9 < EMA 20 por 2 dias; custo 0,1% por lado",
        "train_signals": f"{train_set['signal_date'].min().date()} a "
        f"{train_set['signal_date'].max().date()} ({len(train_set)} trades)",
        "test_signals": f"{test_set['signal_date'].min().date()} a "
        f"{test_set['signal_date'].max().date()} ({len(test_set)} trades)",
        "test_auc": round(float(roc_auc_score(test_set["label"], scores)), 3),
        "test_by_type": summary_by_type(test_set),
        "test_by_score_band": summary_by_band(test_set, scores),
    }
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {"model": model, "reference": reference, "features": FEATURES, "report": report},
        model_path,
    )
    test_set.assign(score=scores).to_csv(model_path.with_suffix(".test.csv"), index=False)
    (REPORTS_DIR / "kandle_model.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def predict(data_dir: Path, model_path: Path, output_path: Path, history_days: int = 730) -> dict:
    # Load only trusted local artifacts: joblib/pickle is executable, not a wire format.
    artifact = joblib.load(model_path)
    candles = load_market_data(data_dir)
    session = candles["date"].max()
    dataset = build_dataset(candles)
    dataset["score"] = to_score(
        artifact["model"], artifact["reference"], dataset[artifact["features"]]
    )
    bands = artifact["report"]["test_by_score_band"]
    last_dates = candles.groupby("ticker")["date"].max()
    recent = dataset.loc[dataset["signal_date"] >= session - pd.Timedelta(days=history_days)]

    def date(value) -> str | None:
        return None if pd.isna(value) else str(pd.Timestamp(value).date())

    names = (
        json.loads(TICKER_NAMES_PATH.read_text(encoding="utf-8"))
        if TICKER_NAMES_PATH.exists()
        else {}
    )
    tickers = {}
    for ticker, last_date in last_dates.items():
        if last_date != session:
            continue  # stale data: never present an old session as current
        rows = recent.loc[recent["ticker"] == ticker].sort_values("signal_date", ascending=False)
        open_trade = rows.loc[rows["exit_date"].isna()].head(1)
        tickers[ticker] = {
            "name": names.get(ticker),
            "signal_today": bool((rows["signal_date"] == session).any()),
            "position": None
            if open_trade.empty
            else {
                "signal_date": date(open_trade["signal_date"].iloc[0]),
                "days": int(open_trade["days"].iloc[0]),
                "return_pct": round(float(open_trade["return_pct"].iloc[0]), 2),
                "score": round(float(open_trade["score"].iloc[0])),
                "win_rate_pct": band_win_rate(float(open_trade["score"].iloc[0]), bands),
                "trend_start": bool(open_trade["trend_start"].iloc[0]),
                "stop_price": round(float(open_trade["stop_price"].iloc[0]), 2),
            },
            "history": [
                {
                    "signal_date": date(row.signal_date),
                    "exit_date": date(row.exit_date),
                    "days": int(row.days),
                    "return_pct": round(float(row.return_pct), 2),
                    "exit_reason": None if pd.isna(row.exit_reason) else row.exit_reason,
                    "score": round(float(row.score)),
                    "win_rate_pct": band_win_rate(float(row.score), bands),
                    "trend_start": bool(row.trend_start),
                }
                for row in rows.itertuples()
            ],
        }
    snapshot = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "session": str(session.date()),
        "model": artifact["report"],
        "tickers": tickers,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = output_path.with_suffix(".tmp")
    temporary.write_text(json.dumps(snapshot, allow_nan=False), encoding="utf-8")
    temporary.replace(output_path)  # atomic: the API never reads a partial file
    return snapshot


def main() -> None:
    parser = argparse.ArgumentParser(description="Modelo de nota para as COMPRAs do Kandle.")
    parser.add_argument("command", choices=["train", "predict"])
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    parser.add_argument("--model-path", type=Path, default=MODEL_PATH)
    parser.add_argument("--output-path", type=Path, default=SNAPSHOT_PATH)
    parser.add_argument("--test-start", default="2022-01-01")
    args = parser.parse_args()
    if args.command == "train":
        report = train(args.data_dir, args.test_start, args.model_path)
        print(f"Treino: {report['train_signals']}\nTeste: {report['test_signals']}")
        print(f"AUC no teste: {report['test_auc']}")
        print(pd.DataFrame(report["test_by_type"]).to_string(index=False))
        print(pd.DataFrame(report["test_by_score_band"]).to_string(index=False))
    else:
        snapshot = predict(args.data_dir, args.model_path, args.output_path)
        positions = sum(t["position"] is not None for t in snapshot["tickers"].values())
        today = sum(t["signal_today"] for t in snapshot["tickers"].values())
        print(f"Sessão {snapshot['session']}: {today} COMPRAs hoje, {positions} em posição")


if __name__ == "__main__":
    main()
