"""Rank closed-session entries with explicit experimental/production status."""

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from forecast_ml.config import MODELS_DIR, PROCESSED_DATA_DIR, RAW_DATA_DIR
from forecast_ml.dataset import load_market_data
from forecast_ml.features import build_features
from forecast_ml.modeling.entry_training import FEATURE_VERSION, closed_session_cutoff

OUTPUT_COLUMNS = [
    "ticker",
    "date",
    "rank",
    "success_score",
    "likely_success",
    "ema_setup",
    "entry_candidate",
    "model_status",
    "signal_close",
    "target_pct",
    "stop_pct",
    "horizon_bars",
]


def predict_opportunities(
    candles: pd.DataFrame,
    model_path: Path = MODELS_DIR / "ema_opportunity_model.joblib",
    threshold: float = 0.5,
    latest_only: bool = True,
    allow_experimental: bool = False,
    as_of: str | None = None,
    top_k: int | None = None,
) -> pd.DataFrame:
    if not np.isfinite(threshold) or not 0 <= threshold <= 1:
        raise ValueError("threshold precisa estar entre 0 e 1")
    # Load only trusted local artifacts: joblib/pickle is executable, not a wire format.
    artifact = joblib.load(model_path)
    model, metadata = artifact["model"], artifact["metadata"]
    if metadata.get("feature_version") != FEATURE_VERSION:
        raise ValueError("Artefato antigo/incompatível. Retreine com o pipeline de entradas EMA.")
    approved = metadata.get("promotion_gate", {}).get("approved", False)
    if not approved and not allow_experimental:
        raise ValueError(
            "Modelo experimental reprovado no gate; use --allow-experimental para análise."
        )
    configured_top_k = int(metadata["top_k"])
    top_k = configured_top_k if top_k is None else top_k
    if top_k <= 0:
        raise ValueError("top_k precisa ser positivo")
    if approved and top_k != configured_top_k:
        raise ValueError("top_k diferente do avaliado exige novo treino/validação.")
    candles = candles.loc[pd.to_datetime(candles["date"]) <= closed_session_cutoff(as_of)].copy()
    if candles.empty:
        return pd.DataFrame(columns=OUTPUT_COLUMNS)
    features = build_features(
        candles,
        ema_periods=tuple(metadata["ema_periods"]),
        slope_lookback=metadata["slope_lookback"],
    )
    feature_columns = metadata["feature_columns"]
    missing = set(feature_columns) - set(features.columns)
    if missing:
        raise ValueError(f"Features incompatíveis com o modelo: {sorted(missing)}")
    if latest_only:
        # Never silently fall back to an older valid row or mix stale ticker sessions.
        features = features.loc[features["date"] == candles["date"].max()]
    eligible = features.replace([np.inf, -np.inf], np.nan).dropna(subset=feature_columns).copy()
    if eligible.empty:
        return pd.DataFrame(columns=OUTPUT_COLUMNS)
    eligible["success_score"] = model.predict_proba(eligible[feature_columns])[:, 1]
    eligible["likely_success"] = eligible["success_score"] >= threshold
    eligible = eligible.sort_values(
        ["date", "success_score", "ticker"], ascending=[True, False, True]
    )
    eligible["rank"] = eligible.groupby("date").cumcount() + 1
    signals = [
        c for c in features if c.startswith("ema_") and c.endswith(("_reclaim", "_pullback"))
    ]
    eligible["ema_setup"] = eligible[signals].gt(0).any(axis=1)
    eligible["model_status"] = "validated" if approved else "experimental"
    eligible["entry_candidate"] = bool(approved) & (eligible["rank"] <= top_k)
    close = candles[["ticker", "date", "close"]].rename(columns={"close": "signal_close"})
    eligible = eligible.merge(close, on=["ticker", "date"], validate="one_to_one")
    for field in ("target_pct", "stop_pct", "horizon_bars"):
        eligible[field] = metadata[field]
    return eligible[OUTPUT_COLUMNS].reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ranking de entradas nos últimos candles fechados."
    )
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    parser.add_argument(
        "--model-path", type=Path, default=MODELS_DIR / "ema_opportunity_model.joblib"
    )
    parser.add_argument(
        "--output-path", type=Path, default=PROCESSED_DATA_DIR / "opportunities.csv"
    )
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--top-k", type=int)
    parser.add_argument("--as-of")
    parser.add_argument("--allow-experimental", action="store_true")
    parser.add_argument("--all-dates", action="store_true")
    args = parser.parse_args()
    candles = load_market_data(args.data_dir)
    predictions = predict_opportunities(
        candles,
        model_path=args.model_path,
        threshold=args.threshold,
        latest_only=not args.all_dates,
        allow_experimental=args.allow_experimental,
        as_of=args.as_of,
        top_k=args.top_k,
    )
    if args.all_dates:
        print("AVISO: inferência retrospectiva do refit; não é backtest fora da amostra.")
    else:
        available = candles.loc[candles["date"] <= closed_session_cutoff(args.as_of)]
        excluded = sorted(set(available["ticker"]) - set(predictions["ticker"]))
        if excluded:
            print(f"Tickers omitidos por sessão defasada/features indisponíveis: {excluded}")
        if not available.empty:
            print(
                f"Sessão dos dados: {available['date'].max().date()}; confira a atualização dos CSVs."
            )
    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    predictions.to_csv(args.output_path, index=False)
    print(f"{len(predictions)} previsões salvas em {args.output_path}")
    if not predictions.empty:
        print(predictions.to_string(index=False))


if __name__ == "__main__":
    main()
