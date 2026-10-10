"""Cash-rich breakout: the weekly-chart version of cash_discount. A stock that fell hard,
still generates a lot of cash, and closes the week above its 26-week range."""

from forecast_ml.bots.catalog.common import LIQUID, NOT_FINANCIAL
from forecast_ml.bots.rules import Bot
from forecast_ml.bots.rules import Condition as C


def cash_breakout(drawdown: float, cash_yield: float, volume: float) -> Bot:
    return Bot(
        name="caixa_rompendo",
        title="Caixa forte rompendo a base",
        thesis=(
            "Caiu muito no último ano, gera caixa forte frente ao valor de mercado e "
            "fecha a semana acima de todo o intervalo das 26 semanas anteriores: o "
            "gráfico semanal confirma que a venda acabou."
        ),
        conditions=(
            LIQUID,
            NOT_FINANCIAL,
            C("deepest_drawdown_52", "<=", drawdown),
            C("cash_flow_to_price", ">=", cash_yield),
            C("breakout_26", "==", True),
            *((C("volume_ratio_26", ">=", volume),) if volume else ()),
        ),
    )
