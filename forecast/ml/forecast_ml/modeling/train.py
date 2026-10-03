"""Train and evaluate the historical opportunity classifier."""

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
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
from forecast_ml.labels import build_labels


def build_training_table(
    candles: pd.DataFrame,
    target_pct: float = 0.05,
    horizon_bars: int = 10,
    ema_periods: tuple[int, ...] = DEFAULT_EMA_PERIODS,
) -> tuple[pd.DataFrame, list[str]]:
    features = build_features(candles, ema_periods=ema_periods)
    labels = build_labels(candles, target_pct=target_pct, horizon_bars=horizon_bars)
    table = features.merge(labels, on=["ticker", "date"], how="inner", validate="one_to_one")
    feature_columns = [column for column in features.columns if column not in {"ticker", "date"}]
    table = table.replace([np.inf, -np.inf], np.nan).dropna(subset=feature_columns + ["label"])
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


def train_model(
    data_dir: Path = RAW_DATA_DIR,
    model_path: Path = MODELS_DIR / "ema_opportunity_model.joblib",
    target_pct: float = 0.14,
    horizon_bars: int = 10,
    ema_periods: tuple[int, ...] = DEFAULT_EMA_PERIODS,
    test_fraction: float = 0.2,
) -> dict:
    candles = load_market_data(data_dir)
    table, feature_columns = build_training_table(
        candles,
        target_pct=target_pct,
        horizon_bars=horizon_bars,
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
        raise ValueError("Teste temporal contém apenas uma classe; não é possível avaliar o modelo.")
    if train_counts.min() < 2:
        raise ValueError("Há menos de 2 exemplos de uma classe no treino; adicione mais histórico.")

    evaluation_estimator = make_pipeline(
        StandardScaler(),
        LogisticRegression(class_weight="balanced", max_iter=2000, random_state=42),
    )
    evaluation_estimator.fit(train[feature_columns], train["label"])
    predictions = evaluation_estimator.predict(test[feature_columns])
    probabilities = evaluation_estimator.predict_proba(test[feature_columns])[:, 1]
    metrics = {
        "train_samples": int(len(train)),
        "test_samples": int(len(test)),
        "train_positive_rate": float(train["label"].mean()),
        "test_positive_rate": float(test["label"].mean()),
        "baseline_pr_auc": float(test["label"].mean()),
        "precision": float(precision_score(test["label"], predictions, zero_division=0)),
        "recall": float(recall_score(test["label"], predictions, zero_division=0)),
        "pr_auc": float(average_precision_score(test["label"], probabilities)),
        "roc_auc": float(roc_auc_score(test["label"], probabilities)),
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
        "horizon_bars": horizon_bars,
        "ema_periods": list(ema_periods),
        "slope_lookback": 5,
        "label_definition": "adjusted_close reaches target in any of next horizon_bars candles",
        "feature_columns": feature_columns,
        "metrics": metrics,
    }
    model_path = Path(model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": deployment_estimator, "metadata": metadata}, model_path)
    metrics_path = model_path.with_suffix(".metrics.json")
    metrics_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return {"model_path": str(model_path), "metrics_path": str(metrics_path), **metadata}


def main() -> None:
    parser = argparse.ArgumentParser(description="Treina o baseline de oportunidades do Forecast.")
    parser.add_argument("--data-dir", type=Path, default=RAW_DATA_DIR)
    parser.add_argument("--model-path", type=Path, default=MODELS_DIR / "ema_opportunity_model.joblib")
    parser.add_argument("--target-pct", type=float, default=0.05)
    parser.add_argument("--horizon-bars", type=int, default=10)
    parser.add_argument("--ema-periods", type=int, nargs="+", default=list(DEFAULT_EMA_PERIODS))
    parser.add_argument("--test-fraction", type=float, default=0.2)
    args = parser.parse_args()

    result = train_model(
        data_dir=args.data_dir,
        model_path=args.model_path,
        target_pct=args.target_pct,
        horizon_bars=args.horizon_bars,
        ema_periods=tuple(args.ema_periods),
        test_fraction=args.test_fraction,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
