"""Groups of beaten-down weeks that isolate what insider buying adds, plus placebos.

Every group is a subset of the same pool (liquid stocks 40%+ below their highs), so a
difference between groups comes from the insider data, not from being beaten down.
Placebos should NOT beat the pool; if they do, the "signal" is something else
(timing, a data artifact, small caps in general).
"""

import numpy as np
import pandas as pd

SHUFFLE_MIN_WEEKS = 52


def shuffled(values: pd.Series, tickers: pd.Series, seed: int = 0) -> pd.Series:
    """Each ticker's series rotated by a random 1+ year offset: same stocks, same amount
    of insider activity, wrong weeks. A real signal must disappear here."""
    rng = np.random.default_rng(seed)
    result = values.copy()
    for index in values.groupby(tickers, sort=False).groups.values():
        n = len(index)
        if n <= 2 * SHUFFLE_MIN_WEEKS:
            result.loc[index] = np.nan
            continue
        shift = int(rng.integers(SHUFFLE_MIN_WEEKS, n - SHUFFLE_MIN_WEEKS))
        result.loc[index] = np.roll(values.loc[index].to_numpy(), shift)
    return result


def size_buckets(dollar_volume: pd.Series) -> pd.Series:
    """'pequena' / 'media' / 'grande' by terciles of traded value within the pool."""
    low, high = dollar_volume.quantile([1 / 3, 2 / 3])
    return pd.Series(
        np.select([dollar_volume <= low, dollar_volume >= high], ["pequena", "grande"], "media"),
        index=dollar_volume.index,
    )


def signal_groups(pool: pd.DataFrame, cash_bot_mask: pd.Series) -> dict[str, pd.Series]:
    """Masks over ``pool`` for each group whose signals get the 26-week cooldown.

    ``pool`` needs ``insider_buyers_shuffled``, made by ``shuffled`` on the full table
    (rotating only the pool's weeks would keep most purchases in place)."""
    buyers = pool["insider_buyers_90d"]
    bought = buyers >= 1
    size = size_buckets(pool["dollar_volume_day"])
    return {
        "com_compra": bought,
        "compradores_2+": buyers >= 2,
        "compradores_3+": buyers >= 3,
        "ceo_ou_cfo": pool["insider_ceo_cfo_90d"] >= 1,
        "com_compra_pequenas": bought & (size == "pequena"),
        "com_compra_grandes": bought & (size == "grande"),
        "placebo_so_rotina": (pool["insider_routine_buyers_90d"] >= 1) & (buyers == 0),
        "placebo_vendas": (pool["insider_sellers_90d"] >= 2) & (buyers == 0),
        "placebo_embaralhado": pool["insider_buyers_shuffled"] >= 1,
        "vazamento_data_do_trade": pool["insider_buyers_traded_90d"] >= 1,
        "caixa_descontada": cash_bot_mask,
        "caixa_descontada_com_compra": cash_bot_mask & bought,
    }


def no_purchase(pool: pd.DataFrame) -> pd.Series:
    """Every pool week with insider data and no purchase: the direct counterfactual."""
    return (pool["insider_buyers_90d"] == 0) & (pool["insider_routine_buyers_90d"] == 0)
