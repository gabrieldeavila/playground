"""Score the insider bot on 2006-2010, years no bot or study has looked at.

Candles come from data/external/history (2003 to mid-2012, downloaded apart from
data/raw so the other models keep their files); 2003-2006 is warm-up for the 3-year
drawdown. The bot is the variant reports/insiders.json picked on 2011-2018, and the
rules it must pass are fixed in holdout_verdict.py. Fundamentals start ~2010, so the
cash bots cannot be judged here.

Run once: `make holdout-insiders` -> reports/insiders_holdout.json.
"""

from datetime import datetime, timezone
import json

import pandas as pd

from forecast_ml.bots.catalog.insider_buying import insider_grids
from forecast_ml.bots.research import baseline
from forecast_ml.bots.scorecard import lift, scorecard
from forecast_ml.bots.table import build_table
from forecast_ml.bots.tuning import signals_of
from forecast_ml.config import EXTERNAL_DATA_DIR, INTERIM_DATA_DIR, REPORTS_DIR
from forecast_ml.insiders.contrasts import shuffled
from forecast_ml.insiders.holdout_verdict import verdict
from forecast_ml.insiders.study import REPORT_PATH as STUDY_PATH
from forecast_ml.insiders.study import group_cards, print_report, yearly_lift

HISTORY_DIR = EXTERNAL_DATA_DIR / "history"
HISTORY_MARKET_DIR = EXTERNAL_DATA_DIR / "history_market"
TABLE_PATH = INTERIM_DATA_DIR / "bot_table_history.parquet"
REPORT_PATH = REPORTS_DIR / "insiders_holdout.json"
HOLDOUT = ("2006-07-01", "2010-12-31")
BOT_NAME = "insider_comprando"


def history_table() -> pd.DataFrame:
    if TABLE_PATH.exists():
        return pd.read_parquet(TABLE_PATH)
    table = build_table(HISTORY_DIR, HISTORY_MARKET_DIR)
    TABLE_PATH.parent.mkdir(parents=True, exist_ok=True)
    table.to_parquet(TABLE_PATH, index=False)
    return table


def picked_bot():
    """The exact variant the 2011-2018 study picked."""
    entry = next(b for b in json.loads(STUDY_PATH.read_text())["bots"] if b["bot"] == BOT_NAME)
    return next(bot for bot in insider_grids()[BOT_NAME] if bot.describe() == entry["rules"])


def holdout(table: pd.DataFrame) -> dict:
    table = table.assign(
        insider_buyers_shuffled=shuffled(table["insider_buyers_90d"], table["ticker"])
    )
    part = table[table["date"].between(*HOLDOUT)]
    pool = baseline(part)
    pool_card = scorecard(pool)
    bot = picked_bot()
    bot_card = scorecard(signals_of(bot, part))
    by_year = yearly_lift(pool)
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "period": HOLDOUT,
        "coverage_pct": round(float(part["insider_buyers_90d"].notna().mean()) * 100, 1),
        "bot": {
            "bot": BOT_NAME,
            "rules": bot.describe(),
            "holdout": bot_card,
            "lift_vs_baseline": lift(bot_card, pool_card),
        },
        "groups": {"holdout": group_cards(part)},
        "by_year": by_year,
        "verdict": verdict(bot_card, pool_card, by_year),
        "caveat": (
            "Universo = empresas listadas hoje: em 2006-2010 isso exige sobreviver 15+ anos, "
            "viés maior que em 2011+. Rotina só é detectável a partir de 2009 (precisa de 3 "
            "anos de Form 4)."
        ),
    }


def main() -> None:
    report = holdout(history_table())
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=1, default=str))
    bot = report["bot"]
    print_report(
        {
            "coverage_pct": report["coverage_pct"],
            "groups": report["groups"],
            "bots": [{**bot, "approved_without_test": report["verdict"]["passed"]}],
            "by_year": report["by_year"],
            "survivorship": report["caveat"],
        },
        periods=("holdout",),
    )
    print(f"\nVeredito: {report['verdict']}")


if __name__ == "__main__":
    main()
