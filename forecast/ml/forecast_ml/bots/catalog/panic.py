"""Panic bot: a beaten-down stock bought in a week of broad market sell-off."""

from forecast_ml.bots.catalog.common import LIQUID
from forecast_ml.bots.rules import Bot
from forecast_ml.bots.rules import Condition as C


def panic(drawdown: float, breadth: float, fscore: float) -> Bot:
    return Bot(
        name="panico",
        title="Pânico em ação castigada",
        thesis=(
            "Ação já muito abaixo da máxima comprada numa semana em que quase todo o "
            "mercado está abaixo da média de 30 semanas: o medo derruba junto empresas "
            "que não mereciam. O F-score evita as que estão quebrando."
        ),
        conditions=(
            LIQUID,
            C("deepest_drawdown_52", "<=", drawdown),
            C("breadth_30", "<=", breadth),
            *((C("fscore", ">=", fscore),) if fscore else ()),
        ),
    )
