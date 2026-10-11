"""Does insider buying add anything to beaten-down stocks? Train + validation only.

Writes reports/insiders.json and prints it:
- by_year: the with/without-purchase gap year by year;
- groups: beaten-down weeks with/without purchases, clusters, CEO/CFO, by size, the
  placebos and the trade-date leak check, each against the pool and against the
  same pool without purchases;
- bots: round-3 variants picked on 2011-2018 and judged on 2019-2021;
- survivorship: share of purchases in companies that no longer trade.

2022+ is never read here. Run after `make insiders` and `make evaluate-bots REBUILD=1`.
"""

from datetime import datetime, timezone
import json

import pandas as pd

from forecast_ml.bots.catalog.cash_discount import cash_discount
from forecast_ml.bots.catalog.insider_buying import insider_grids
from forecast_ml.bots.cooldown import first_signals
from forecast_ml.bots.periods import TRAIN, VALIDATION, period_of
from forecast_ml.bots.research import baseline
from forecast_ml.bots.scorecard import lift, scorecard
from forecast_ml.bots.table import load_table
from forecast_ml.bots.tuning import approved, pick_variant, signals_of
from forecast_ml.config import REPORTS_DIR
from forecast_ml.insiders.contrasts import no_purchase, shuffled, signal_groups
from forecast_ml.insiders.form4_download import read_ciks, read_trades
from forecast_ml.insiders.insider_table import add_insider_columns
from forecast_ml.insiders.insider_trades import insider_purchases

REPORT_PATH = REPORTS_DIR / "insiders.json"
STUDY_PERIODS = {"train": TRAIN, "validation": VALIDATION}
# The approved caixa_descontada variant (reports/bots.json).
CASH_BOT = cash_discount(-0.5, 0.15, True)


def _with_insiders(table: pd.DataFrame) -> pd.DataFrame:
    if "insider_buyers_90d" not in table or table["insider_buyers_90d"].isna().all():
        table = add_insider_columns(table)
    return table.assign(
        insider_buyers_shuffled=shuffled(table["insider_buyers_90d"], table["ticker"])
    )


def group_cards(part: pd.DataFrame) -> dict:
    pool = baseline(part)
    pool_card = scorecard(pool)
    without = scorecard(pool[no_purchase(pool)])
    groups = {
        "linha_de_base": pool_card,
        "sem_compra": without | {"lift_vs_base": lift(without, pool_card)},
    }
    cash_mask = CASH_BOT.matches(pool)
    for name, mask in signal_groups(pool, cash_mask).items():
        card = scorecard(first_signals(pool[mask.fillna(False)]))
        groups[name] = card | {
            "lift_vs_base": lift(card, pool_card),
            "lift_vs_sem_compra": lift(card, without),
        }
    return groups


def yearly_lift(pool: pd.DataFrame) -> list[dict]:
    """Median 52-week excess by year, with vs without purchases: a pooled median can be
    one crash year in disguise (2020 alone carries 2019-2021)."""
    bought = first_signals(pool[pool["insider_buyers_90d"] >= 1])
    without = pool[no_purchase(pool)]

    def medians(part: pd.DataFrame) -> pd.Series:
        return part.groupby(part["date"].dt.year)["excess_52"].median() * 100

    years = pd.DataFrame(
        {
            "com_compra": medians(bought),
            "sem_compra": medians(without),
            "signals": bought.groupby(bought["date"].dt.year).size(),
        }
    ).dropna()
    years["delta"] = years["com_compra"] - years["sem_compra"]
    return years.round(1).reset_index(names="year").to_dict(orient="records")


def _bot_results(by_period: dict[str, pd.DataFrame]) -> list[dict]:
    baselines = {name: scorecard(baseline(part)) for name, part in by_period.items()}
    results = []
    for name, variants in insider_grids().items():
        pick = pick_variant(variants, by_period["train"])
        if pick is None:
            results.append({"bot": name, "approved": False, "reason": "sem variante elegível"})
            continue
        cards = {p: scorecard(signals_of(pick.bot, part)) for p, part in by_period.items()}
        results.append(
            {
                "bot": name,
                "rules": pick.bot.describe(),
                "variants_tried": pick.variants_tried,
                "approved_without_test": approved(cards, baselines),
                **cards,
                "lift_vs_baseline": {p: lift(cards[p], baselines[p]) for p in by_period},
            }
        )
    return results


def survivorship() -> dict:
    """Opportunistic purchases filed 2011-2021, and how many are in companies without a
    ticker today (bankrupt, delisted, acquired): data our universe cannot see."""
    purchases = insider_purchases(read_trades())
    purchases = purchases[
        ~purchases["routine"] & purchases["filed"].between(TRAIN[0], VALIDATION[1])
    ]
    trading = set(read_ciks().values())
    gone = ~purchases["issuer_cik"].isin(trading)
    return {
        "purchases": len(purchases),
        "companies": int(purchases["issuer_cik"].nunique()),
        "purchases_in_companies_gone_pct": round(float(gone.mean()) * 100, 1),
        "companies_gone_pct": round(
            float(purchases.loc[gone, "issuer_cik"].nunique() / purchases["issuer_cik"].nunique())
            * 100,
            1,
        ),
    }


def study(table: pd.DataFrame) -> dict:
    table = _with_insiders(table)
    periods = period_of(table["date"])
    by_period = {name: table[periods == name] for name in STUDY_PERIODS}
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "periods": STUDY_PERIODS,
        "coverage_pct": round(float(table["insider_buyers_90d"].notna().mean()) * 100, 1),
        "groups": {name: group_cards(part) for name, part in by_period.items()},
        "by_year": yearly_lift(baseline(pd.concat(by_period.values()))),
        "bots": _bot_results(by_period),
        "survivorship": survivorship(),
    }


def _line(name: str, card: dict) -> str:
    if not card.get("signals"):
        return f"  {name:28s} sem sinais"
    vs = card.get("lift_vs_sem_compra", card.get("lift_vs_base", {}))
    return (
        f"  {name:28s} n={card['signals']:6d} sem={card['weeks']:4d} "
        f"medEx={card['median_excess_pct']:6.1f} bateSPY={card['beat_spy_pct']:5.1f}% "
        f"-30%={card['big_loss_pct']:5.1f}% anos={card['years_beating_spy']}/"
        f"{card['years_judged']}  Δmed={vs.get('median_excess_pct')}"
    )


def print_report(report: dict, periods=tuple(STUDY_PERIODS)) -> None:
    print(f"Cobertura (semanas com CIK): {report['coverage_pct']}%")
    for period, groups in report["groups"].items():
        print(f"\n{period} (Δmed = contra 'sem_compra'; nas duas primeiras, contra a base)")
        for name, card in groups.items():
            print(_line(name, card))
    for bot in report["bots"]:
        status = "passa" if bot.get("approved_without_test") else "reprovado"
        print(f"\n{bot['bot']} [{status}] {bot.get('rules', bot.get('reason'))}")
        for period in periods:
            if period in bot:
                print(_line(period, bot[period]))
    print("\nPor ano (mediana excesso 52s): com compra / sem compra / Δ / sinais")
    for row in report["by_year"]:
        print(
            f"  {row['year']}  {row['com_compra']:6.1f} {row['sem_compra']:6.1f} "
            f"{row['delta']:6.1f}  {int(row['signals'])}"
        )
    print(f"\nSobrevivência: {report['survivorship']}")


def main() -> None:
    report = study(load_table())
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=1, default=str))
    print_report(report)


if __name__ == "__main__":
    main()
