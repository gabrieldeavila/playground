"""Base breakout after a decline: Weinstein stage 1 -> 2 on the weekly chart."""

from forecast_ml.bots.catalog.common import LIQUID
from forecast_ml.bots.rules import Bot
from forecast_ml.bots.rules import Condition as C


def base_breakout(drawdown: float, base_range: float, volume: float, fscore: float) -> Bot:
    return Bot(
        name="rompimento_base",
        title="Rompimento de base após queda",
        thesis=(
            "Depois de cair muito, a ação passou meses de lado (base estreita) e agora "
            "fecha a semana acima da base com volume forte: o estágio 1 → 2 de Weinstein."
        ),
        conditions=(
            LIQUID,
            C("deepest_drawdown_52", "<=", drawdown),
            C("breakout_26", "==", True),
            C("base_range_26", "<=", base_range),
            C("volume_ratio_26", ">=", volume),
            C("sma_30_slope_4", ">=", 0.0),
            *((C("fscore", ">=", fscore),) if fscore else ()),
        ),
    )
