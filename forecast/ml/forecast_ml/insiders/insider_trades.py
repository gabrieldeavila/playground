"""Which Form 4 trades count as an insider betting their own money.

- Purchases: open-market buys (code P) with a real price, worth at least
  MIN_TRADE_USD; tiny buys are often dividend reinvestment or a director's token
  purchase. The trade must also predate its filing by at most MAX_FILING_DELAY:
  trade dates after the filing or years before it are typos, and news that old is
  no longer news.
- Routine: the same insider bought the same stock in the same calendar month in each
  of the three previous years (Cohen, Malloy & Pomorski 2012). Those buys are
  scheduled habits; the return comes from the others, the "opportunistic" ones.
- CEO/CFO: the officers who know the numbers best, read from the free-text title.
- Sales (code S) are kept as a placebo: insiders sell for taxes, houses and
  diversification, so sales should predict little.
"""

import pandas as pd

MIN_TRADE_USD = 10_000
MAX_FILING_DELAY = pd.Timedelta(days=90)
ROUTINE_YEARS = 3
CEO_CFO = (
    r"\bCEO\b|\bCFO\b|CHIEF EXECUTIVE|CHIEF FINANCIAL|PRINCIPAL EXECUTIVE|PRINCIPAL FINANCIAL"
)


def with_value(trades: pd.DataFrame) -> pd.DataFrame:
    return trades.assign(value=trades["shares"] * trades["price"])


def real_trades(trades: pd.DataFrame, code: str) -> pd.DataFrame:
    """Trades of one code with a price, a plausible date and at least MIN_TRADE_USD."""
    valued = with_value(trades)
    delay = valued["filed"] - valued["traded"]
    return valued[
        (valued["code"] == code)
        & (valued["price"] > 0)
        & (valued["value"] >= MIN_TRADE_USD)
        & delay.between(pd.Timedelta(0), MAX_FILING_DELAY)
    ]


def routine_flags(purchases: pd.DataFrame) -> pd.Series:
    """True where the insider bought this stock in this month in each of the prior 3 years."""
    year, month = purchases["traded"].dt.year, purchases["traded"].dt.month
    key = list(zip(purchases["owner_cik"], purchases["issuer_cik"], month))
    seen = set(zip(key, year))
    return pd.Series(
        [
            all((k, y - back) in seen for back in range(1, ROUTINE_YEARS + 1))
            for k, y in zip(key, year)
        ],
        index=purchases.index,
        dtype=bool,
    )


def ceo_cfo_flags(titles: pd.Series) -> pd.Series:
    return titles.fillna("").str.upper().str.contains(CEO_CFO, regex=True).astype(bool)


def insider_purchases(trades: pd.DataFrame) -> pd.DataFrame:
    purchases = real_trades(trades, "P")
    return purchases.assign(
        routine=routine_flags(purchases), ceo_cfo=ceo_cfo_flags(purchases["title"])
    )


def insider_sales(trades: pd.DataFrame) -> pd.DataFrame:
    return real_trades(trades, "S")
