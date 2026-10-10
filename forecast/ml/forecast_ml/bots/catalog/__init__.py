"""The bots and the few parameter values each may try on the training years.

Grids are kept small on purpose: the more variants tried, the more likely the best
one won by luck. Every variant must also stay inside its thesis (e.g. "still well
below its highs"), so tuning cannot turn a bot into a different strategy.

Round 1 (panico, valor_virando, rompimento_base, forca_relativa) was scored on the
test years once and is kept unchanged. Round 2 (caixa_*) was designed afterwards on
train + validation only; see reports/bots.json for both.
"""

from itertools import product

from forecast_ml.bots.catalog.base_breakout import base_breakout
from forecast_ml.bots.catalog.cash_breakout import cash_breakout
from forecast_ml.bots.catalog.cash_discount import cash_discount
from forecast_ml.bots.catalog.cheap_turning import cheap_and_turning
from forecast_ml.bots.catalog.panic import panic
from forecast_ml.bots.catalog.relative_strength import relative_strength
from forecast_ml.bots.rules import Bot

ROUNDS = {
    "panico": 1,
    "valor_virando": 1,
    "rompimento_base": 1,
    "forca_relativa": 1,
    "caixa_descontada": 2,
    "caixa_rompendo": 2,
}


def grids() -> dict[str, list[Bot]]:
    return {
        "panico": [
            panic(d, b, f) for d, b, f in product((-0.3, -0.4, -0.5), (0.2, 0.3), (0, 5, 7))
        ],
        "valor_virando": [
            cheap_and_turning(v, f, d)
            for v, f, d in product((0.7, 0.8, 0.9), (6, 7, 8), (-0.2, -0.35))
        ],
        "rompimento_base": [
            base_breakout(d, r, v, f)
            for d, r, v, f in product((-0.4, -0.5), (0.4, 0.6), (1.5, 2.0), (0, 6))
        ],
        "forca_relativa": [
            relative_strength(d, f) for d, f in product((-0.3, -0.4, -0.5), (0, 6, 7))
        ],
        "caixa_descontada": [
            cash_discount(d, c, p)
            for d, c, p in product((-0.3, -0.4, -0.5), (0.1, 0.15, 0.2), (False, True))
        ],
        "caixa_rompendo": [
            cash_breakout(d, c, v) for d, c, v in product((-0.4, -0.5), (0.1, 0.2), (0, 1.5))
        ],
    }
