"""Temporal probability calibration of an already fitted, frozen estimator."""

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression


def _log_odds(probabilities: np.ndarray) -> np.ndarray:
    clipped = np.clip(probabilities, 1e-6, 1 - 1e-6)
    return np.log(clipped / (1 - clipped)).reshape(-1, 1)


@dataclass
class CalibratedOpportunityModel:
    estimator: Any
    calibrator: LogisticRegression

    def predict_proba(self, features: pd.DataFrame) -> np.ndarray:
        scores = self.estimator.predict_proba(features)[:, 1]
        return self.calibrator.predict_proba(_log_odds(scores))


def calibrate_estimator(
    estimator: Any, features: pd.DataFrame, labels: pd.Series
) -> CalibratedOpportunityModel:
    """Fit sigmoid only on a later, purged calibration block; never refit the base."""
    if labels.nunique() != 2:
        raise ValueError("Calibração temporal precisa de ambas as classes.")
    calibrator = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
    calibrator.fit(_log_odds(estimator.predict_proba(features)[:, 1]), labels)
    return CalibratedOpportunityModel(estimator, calibrator)
