"""Pass/fail rules for the 2006-2010 holdout, written down before it was run.

1. The bot picked on 2011-2018 (unchanged) beats the beaten-down pool: higher median
   52-week excess return and a higher share of picks beating SPY.
2. Pool weeks with insider purchases beat pool weeks without them in at least
   MIN_GOOD_YEARS of the holdout years.
3. Leaving out the post-crash rebound year (2009, the 2020 of this period), the
   purchase weeks still beat the no-purchase weeks: the median of the yearly gaps
   is above zero.
"""

REBOUND_YEAR = 2009
MIN_GOOD_YEARS = 3


def beats_pool(bot: dict, pool: dict) -> bool:
    return (
        bot.get("signals", 0) > 0
        and bot["median_excess_pct"] > pool["median_excess_pct"]
        and bot["beat_spy_pct"] > pool["beat_spy_pct"]
    )


def good_years(by_year: list[dict]) -> int:
    return sum(row["delta"] > 0 for row in by_year)


def gap_without_rebound(by_year: list[dict]) -> float | None:
    """Median of the yearly with-vs-without gaps, leaving out REBOUND_YEAR."""
    gaps = sorted(row["delta"] for row in by_year if row["year"] != REBOUND_YEAR)
    if not gaps:
        return None
    middle = len(gaps) // 2
    return gaps[middle] if len(gaps) % 2 else (gaps[middle - 1] + gaps[middle]) / 2


def verdict(bot: dict, pool: dict, by_year: list[dict]) -> dict:
    gap = gap_without_rebound(by_year)
    checks = {
        "bot_beats_pool": beats_pool(bot, pool),
        "good_years": good_years(by_year) >= MIN_GOOD_YEARS,
        "gap_without_rebound": gap is not None and gap > 0,
    }
    return {
        "checks": checks,
        "good_years": f"{good_years(by_year)}/{len(by_year)}",
        "gap_without_rebound": gap,
        "passed": all(checks.values()),
    }
