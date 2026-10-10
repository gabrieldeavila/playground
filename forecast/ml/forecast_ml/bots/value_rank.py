"""How cheap a stock is next to the rest of the market that same week (0 = priciest,
1 = cheapest), averaging the percentiles of book, cash flow and earnings to price.

Ranking within the week keeps the measure comparable across a decade where the whole
market got more expensive. Only liquid stocks with fundamentals take part.
"""

import pandas as pd

from forecast_ml.bots.market_breadth import MIN_DOLLAR_VOLUME_DAY

VALUE_COLUMNS = ("book_to_market", "cash_flow_to_price", "earnings_to_price")
MIN_VALUE_INPUTS = 2


def add_value_rank(table: pd.DataFrame) -> pd.DataFrame:
    liquid = table["dollar_volume_day"] >= MIN_DOLLAR_VOLUME_DAY
    week = table["date"].dt.to_period("W-FRI")
    ranks = pd.DataFrame(
        {
            column: table[column].where(liquid).groupby(week).rank(pct=True)
            for column in VALUE_COLUMNS
        }
    )
    enough = ranks.notna().sum(axis=1) >= MIN_VALUE_INPUTS
    return table.assign(value_rank=ranks.mean(axis=1).where(enough))
