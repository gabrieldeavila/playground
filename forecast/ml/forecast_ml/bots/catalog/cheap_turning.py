"""Cheap, improving and turning: value rank + F-score + weekly chart back above a rising 30-week average."""

from forecast_ml.bots.catalog.common import LIQUID
from forecast_ml.bots.rules import Bot
from forecast_ml.bots.rules import Condition as C


def cheap_and_turning(value: float, fscore: float, drawdown: float) -> Bot:
    return Bot(
        name="valor_virando",
        title="Barata, melhorando e virando",
        thesis=(
            "Barata frente ao mercado (patrimônio, caixa e lucro por preço), com as "
            "contas melhorando (F-score de Piotroski) e o gráfico semanal voltando acima "
            "de uma média de 30 semanas que já sobe: o mercado começa a perceber."
        ),
        conditions=(
            LIQUID,
            C("value_rank", ">=", value),
            C("fscore", ">=", fscore),
            C("fscore_checks", ">=", 7),
            C("drawdown_156", "<=", drawdown),
            C("above_sma_30", "==", True),
            C("sma_30_slope_4", ">=", 0.0),
        ),
    )
