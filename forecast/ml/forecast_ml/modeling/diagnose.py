"""Report whether the available history can support each training configuration."""

import argparse
import json

import pandas as pd

from forecast_ml.config import RAW_DATA_DIR
from forecast_ml.dataset import load_market_data
from forecast_ml.features import DEFAULT_EMA_PERIODS
from forecast_ml.modeling.train import build_training_table, chronological_split


def diagnose_training_data(
    data_dir=RAW_DATA_DIR,
    target_pcts: tuple[float, ...] = (0.05, 0.14, 0.10, 0.02),
    horizon_bars: int = 10,
) -> list[dict]:
    candles = load_market_data(data_dir)
    reports = []
    for target_pct in target_pcts:
        table, _ = build_training_table(
            candles,
            target_pct=target_pct,
            horizon_bars=horizon_bars,
            ema_periods=DEFAULT_EMA_PERIODS,
        )
        counts = table["label"].value_counts().to_dict()
        report = {
            "target_pct": target_pct,
            "horizon_bars": horizon_bars,
            "samples": len(table),
            "positives": int(counts.get(1, 0)),
            "negatives": int(counts.get(0, 0)),
            "training_possible": False,
            "reason": None,
        }
        try:
            train, test = chronological_split(table, horizon_bars)
            train_counts = train["label"].value_counts().to_dict()
            test_counts = test["label"].value_counts().to_dict()
            report.update(
                {
                    "train_samples": len(train),
                    "train_positives": int(train_counts.get(1, 0)),
                    "train_negatives": int(train_counts.get(0, 0)),
                    "test_samples": len(test),
                    "test_positives": int(test_counts.get(1, 0)),
                    "test_negatives": int(test_counts.get(0, 0)),
                }
            )
            if len(train_counts) < 2:
                report["reason"] = "treino não contém as duas classes"
            elif len(test_counts) < 2:
                report["reason"] = "teste temporal não contém as duas classes"
            elif train_counts and min(train_counts.values()) < 2:
                report["reason"] = "treino tem menos de dois exemplos de uma classe"
            else:
                report["training_possible"] = True
        except ValueError as error:
            report["reason"] = str(error)
        reports.append(report)
    return reports


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Diagnostica amostras e classes disponíveis para treinamento."
    )
    parser.add_argument("--data-dir", default=RAW_DATA_DIR)
    parser.add_argument(
        "--target-pcts",
        type=float,
        nargs="+",
        default=[0.05, 0.10, 0.14, 0.02],
        help="Alvos percentuais como frações (ex.: 0.14 para 14%%).",
    )
    parser.add_argument("--horizon-bars", type=int, default=10)
    args = parser.parse_args()
    reports = diagnose_training_data(args.data_dir, tuple(args.target_pcts), args.horizon_bars)
    print(json.dumps(reports, indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
