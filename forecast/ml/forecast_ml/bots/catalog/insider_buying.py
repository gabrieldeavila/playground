"""Round 3: insiders buying a beaten-down stock with their own money.

Kept out of ``grids()`` on purpose: evaluate-bots scores 2022+ for every bot there,
and the test years have already been looked at twice. These grids are tuned and
validated by forecast_ml.insiders.study on 2011-2021 only; a bot joins ``grids()``
(spending its single test look) only after passing there.
"""

from itertools import product

from forecast_ml.bots.catalog.common import LIQUID, NOT_FINANCIAL
from forecast_ml.bots.rules import Bot
from forecast_ml.bots.rules import Condition as C


def insider_cluster(drawdown: float, buyers: int, min_value: float) -> Bot:
    return Bot(
        name="insider_comprando",
        title="Diretores comprando a ação castigada",
        thesis=(
            "A ação está muito abaixo da máxima de 3 anos e diretores ou executivos da "
            "própria empresa compraram ações no mercado com dinheiro próprio nos últimos "
            "90 dias (Form 4, sem compras de rotina). Quem conhece o negócio por dentro "
            "acha que o preço caiu demais."
        ),
        conditions=(
            LIQUID,
            C("drawdown_156", "<=", drawdown),
            C("insider_buyers_90d", ">=", buyers),
            C("insider_buy_value_90d", ">=", min_value),
        ),
    )


def cash_with_insiders(drawdown: float, cash_yield: float, buyers: int) -> Bot:
    return Bot(
        name="caixa_com_insider",
        title="Caixa forte, preço castigado e diretores comprando",
        thesis=(
            "As regras do caixa descontado (muito abaixo da máxima, caixa operacional "
            "alto frente ao valor de mercado, lucro) mais compras de diretores ou "
            "executivos nos últimos 90 dias: o negócio gera caixa e quem está dentro "
            "concorda que o preço está barato."
        ),
        conditions=(
            LIQUID,
            NOT_FINANCIAL,
            C("drawdown_156", "<=", drawdown),
            C("cash_flow_to_price", ">=", cash_yield),
            C("earnings_to_price", ">=", 0.0),
            C("insider_buyers_90d", ">=", buyers),
        ),
    )


def insider_grids() -> dict[str, list[Bot]]:
    return {
        "insider_comprando": [
            insider_cluster(d, b, v) for d, b, v in product((-0.4, -0.5), (1, 2, 3), (0, 250_000))
        ],
        "caixa_com_insider": [
            cash_with_insiders(d, c, b) for d, c, b in product((-0.4, -0.5), (0.1, 0.15), (1, 2))
        ],
    }
