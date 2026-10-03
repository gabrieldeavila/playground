"""Run the trained model against the most recent market candles."""

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from forecast_ml.config import MODELS_DIR, PROCESSED_DATA_DIR, RAW_DATA_DIR
from forecast_ml.dataset import load_market_data
from forecast_ml.features import build_features


def predict_opportunities(
    candles: pd.DataFrame,
    model_path: Path = MODELS_DIR / "ema_opportunity_model.joblib",
    threshold: float = 0.5,
    latest_only: bool = True,
) -> pd.DataFrame:
    if not 0 <= threshold <= 1:
        raise ValueError("threshold precisa estar entre 0 e 1")
    artifact = joblib.load(model_path)
    model = artifact["model"]
    metadata = artifact["metadata"]
    features = build_features(candles, ema_periods=tuple(metadata["ema_periods"]))
    feature_columns = metadata["feature_columns"]
    missing = set(feature_columns) - set(features.columns)
    if missing:
        raise ValueError(f"Features incompatíveis com o modelo: {sorted(missing)}")

    eligible = features.replace([np.inf, -np.inf], np.nan).dropna(subset=feature_columns).copy()
    if eligible.empty:
        return pd.DataFrame(
            columns=["ticker", "date", "success_score", "likely_success"]
        )
    eligible["success_score"] = model.predict_proba(eligible[feature_columns])[:, 1]
    eligible["likely_success"] = eligible["success_score"] >= threshold
    if latest_only:
        eligible = eligible.sort_values(["ticker", "date"]).groupby("ticker", as_index=False).tail(1)
    return eligible[["ticker", "date", "success_score", "likely_success"]].sort_values(
        ["ticker", "date"]
    ).reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Pontua oportunidades nos candles recentes.")
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    parser.add_argument("--model-path", type=Path, default=MODELS_DIR / "ema_opportunity_model.joblib")
    parser.add_argument(
        "--output-path", type=Path, default=PROCESSED_DATA_DIR / "opportunities.csv"
    )
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--all-dates", action="store_true")
    args = parser.parse_args()

    candles = load_market_data(args.data_dir)
    predictions = predict_opportunities(
        candles,
        model_path=args.model_path,
        threshold=args.threshold,
        latest_only=not args.all_dates,
    )
    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    predictions.to_csv(args.output_path, index=False)
    print(f"{len(predictions)} previsões salvas em {args.output_path}")
    if not predictions.empty:
        print(predictions.to_string(index=False))


if __name__ == "__main__":
    main()
