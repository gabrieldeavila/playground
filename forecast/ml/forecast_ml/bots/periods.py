"""Chronological split: tune on train, choose on validation, look at test once."""

import pandas as pd

TRAIN = ("2011-01-01", "2018-12-31")
VALIDATION = ("2019-01-01", "2021-12-31")
TEST = ("2022-01-01", "2100-01-01")
PERIODS = {"train": TRAIN, "validation": VALIDATION, "test": TEST}


def period_of(dates: pd.Series) -> pd.Series:
    """'train', 'validation', 'test' or NaN (warm-up before 2011) for each date."""
    labels = pd.Series(pd.NA, index=dates.index, dtype="object")
    for name, (start, end) in PERIODS.items():
        labels[(dates >= start) & (dates <= end)] = name
    return labels
