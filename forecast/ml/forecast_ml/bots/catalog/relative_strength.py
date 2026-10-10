"""Relative strength turning: still far below its highs but already beating the S&P 500."""

from forecast_ml.bots.catalog.common import LIQUID
from forecast_ml.bots.rules import Bot
from forecast_ml.bots.rules import Condition as C


def relative_strength(drawdown: float, fscore: float) -> Bot:
    return Bot(
        name="forca_relativa",
        title="Força relativa voltando",
        thesis=(
            "Ainda muito abaixo da máxima, mas já ganhando do S&P 500: a força relativa "
            "bate a máxima de 26 semanas antes de o preço chamar atenção."
        ),
        conditions=(
            LIQUID,
            C("drawdown_156", "<=", drawdown),
            C("rs_high_26", "==", True),
            C("above_sma_30", "==", True),
            *((C("fscore", ">=", fscore),) if fscore else ()),
        ),
    )
