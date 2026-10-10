"""Pick each bot's parameters on the training years only, then judge the pick on the
validation years. The test years are scored afterwards and never feed a choice.

A variant can only be picked with enough independent evidence: signals, distinct
weeks, distinct quarters (a bot that only fires in 2-3 crashes is a bet on those
crashes) and half the judged years beating SPY. A bot is approved when its pick beats
the beaten-down baseline on train and validation and beats SPY on validation;
otherwise it is reported but not scanned.
"""

from dataclasses import dataclass

import pandas as pd

from forecast_ml.bots.cooldown import first_signals
from forecast_ml.bots.rules import Bot
from forecast_ml.bots.scorecard import scorecard

MIN_TRAIN_SIGNALS = 60
MIN_TRAIN_WEEKS = 15
MIN_TRAIN_QUARTERS = 8


@dataclass
class Pick:
    bot: Bot
    train: dict
    variants_tried: int


def signals_of(bot: Bot, table: pd.DataFrame) -> pd.DataFrame:
    return first_signals(table[bot.matches(table)])


def _eligible(card: dict) -> bool:
    return (
        card.get("signals", 0) >= MIN_TRAIN_SIGNALS
        and card["weeks"] >= MIN_TRAIN_WEEKS
        and card["quarters"] >= MIN_TRAIN_QUARTERS
        and card["years_beating_spy"] * 2 >= card["years_judged"]
    )


def pick_variant(variants: list[Bot], train: pd.DataFrame) -> Pick | None:
    """Variant with the best median excess return among the eligible ones on train."""
    cards = [(bot, scorecard(signals_of(bot, train))) for bot in variants]
    eligible = [(bot, card) for bot, card in cards if _eligible(card)]
    if not eligible:
        return None
    bot, card = max(
        eligible, key=lambda pair: (pair[1]["median_excess_pct"], pair[1]["beat_spy_pct"])
    )
    return Pick(bot=bot, train=card, variants_tried=len(variants))


def _beats(card: dict, baseline: dict) -> bool:
    return (
        card.get("signals", 0) > 0
        and card["median_excess_pct"] > baseline["median_excess_pct"]
        and card["beat_spy_pct"] > baseline["beat_spy_pct"]
    )


def approved(cards: dict, baselines: dict) -> bool:
    """Beats the baseline on train and validation, and SPY itself on validation."""
    return (
        _beats(cards["train"], baselines["train"])
        and _beats(cards["validation"], baselines["validation"])
        and cards["validation"]["median_excess_pct"] > 0
    )
