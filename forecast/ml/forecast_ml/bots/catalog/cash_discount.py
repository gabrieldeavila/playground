"""Cash at a discount: still far below its highs, while the business keeps generating
cash worth a large share of its market value.

Found on 2011-2021 (train + validation, before any test look): among stocks 40%+ off
their highs, those with operating cash flow >= 10% of market cap beat the rest by
4-20 points a year and had fewer -30% years. Waiting for the chart to turn first
lowered the result: the rebound was already in the price.
"""

from forecast_ml.bots.catalog.common import LIQUID, NOT_FINANCIAL
from forecast_ml.bots.rules import Bot
from forecast_ml.bots.rules import Condition as C


def cash_discount(drawdown: float, cash_yield: float, profitable: bool) -> Bot:
    return Bot(
        name="caixa_descontada",
        title="Caixa forte, preço castigado",
        thesis=(
            "A ação está muito abaixo da máxima de 3 anos, mas a empresa segue gerando "
            "caixa operacional igual a uma fatia grande do seu valor de mercado (último "
            "10-K). O preço caiu mais do que o negócio: assimetria."
        ),
        conditions=(
            LIQUID,
            NOT_FINANCIAL,
            C("drawdown_156", "<=", drawdown),
            C("cash_flow_to_price", ">=", cash_yield),
            *((C("earnings_to_price", ">=", 0.0),) if profitable else ()),
        ),
    )
