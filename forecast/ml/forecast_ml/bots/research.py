"""Tune, validate and test the weekly bots, then list this week's signals.

evaluate: pick each bot's variant on train, judge it on validation, score test, and
          write reports/bots.json (also printed). Test numbers never pick anything.
scan:     approved bots' signals on the last closed week -> data/processed/bot_signals.json.

``--rebuild`` rebuilds data/interim/bot_table.parquet from the candles and EDGAR files.
"""

import argparse
from datetime import datetime, timezone
import json

from loguru import logger
import pandas as pd

from forecast_ml.bots.catalog import ROUNDS, grids
from forecast_ml.bots.periods import PERIODS, period_of
from forecast_ml.bots.scan import scan
from forecast_ml.bots.scorecard import lift, scorecard
from forecast_ml.bots.table import load_table
from forecast_ml.bots.tuning import approved, pick_variant, signals_of
from forecast_ml.config import PROCESSED_DATA_DIR, REPORTS_DIR

REPORT_PATH = REPORTS_DIR / "bots.json"
SIGNALS_PATH = PROCESSED_DATA_DIR / "bot_signals.json"
BASELINE_DRAWDOWN = -0.4


def baseline(table: pd.DataFrame) -> pd.DataFrame:
    """Every liquid week of a stock 40%+ below its 3-year high: what the bots pick from."""
    return table[
        (table["dollar_volume_day"] >= 5_000_000)
        & (table["deepest_drawdown_52"] <= BASELINE_DRAWDOWN)
    ]


def evaluate(table: pd.DataFrame) -> dict:
    by_period = {name: table[period_of(table["date"]) == name] for name in PERIODS}
    baselines = {name: scorecard(baseline(part)) for name, part in by_period.items()}
    market = {
        name: scorecard(part[part["dollar_volume_day"] >= 5_000_000])
        for name, part in by_period.items()
    }
    bots = []
    for name, variants in grids().items():
        pick = pick_variant(variants, by_period["train"])
        if pick is None:
            logger.warning(f"{name}: nenhuma variante com evidência suficiente no treino")
            bots.append({"bot": name, "approved": False, "reason": "sem variante elegível"})
            continue
        cards = {
            period: scorecard(signals_of(pick.bot, part)) for period, part in by_period.items()
        }
        bots.append(
            {
                "bot": pick.bot.name,
                "title": pick.bot.title,
                "thesis": pick.bot.thesis,
                "rules": pick.bot.describe(),
                "variants_tried": pick.variants_tried,
                "round": ROUNDS[name],
                "approved": approved(cards, baselines),
                **cards,
                "lift_vs_baseline": {p: lift(cards[p], baselines[p]) for p in PERIODS},
            }
        )
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "periods": PERIODS,
        "horizon_weeks": 52,
        "baseline": f"semanas líquidas de ações {abs(BASELINE_DRAWDOWN):.0%}+ abaixo da máxima",
        "baseline_scores": baselines,
        "market_scores": market,
        "bots": bots,
        "caveat": (
            "Universo = empresas listadas hoje: as que quebraram ou foram deslistadas não "
            "estão nos dados, o que favorece estratégias de ações castigadas. Compare cada "
            "bot com a linha de base, que tem o mesmo viés."
        ),
    }


def _row(name: str, card: dict) -> str:
    if not card.get("signals"):
        return f"  {name:11s} sem sinais"
    return (
        f"  {name:11s} n={card['signals']:5d} semanas={card['weeks']:4d} "
        f"medEx={card['median_excess_pct']:6.1f} bateSPY={card['beat_spy_pct']:5.1f}% "
        f"+50%={card['big_win_pct']:5.1f}% -30%={card['big_loss_pct']:5.1f}% "
        f"anos={card['years_beating_spy']}/{card['years_judged']}"
    )


def print_report(report: dict) -> None:
    print("Linha de base (castigadas, sem padrão):")
    for period, card in report["baseline_scores"].items():
        print(_row(period, card))
    for bot in report["bots"]:
        status = "APROVADO" if bot["approved"] else "reprovado"
        print(f"\n{bot['bot']} [{status}] {bot.get('rules', bot.get('reason'))}")
        for period in PERIODS:
            if period in bot:
                print(_row(period, bot[period]))


def _write(path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=1, default=str))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("command", choices=("evaluate", "scan"))
    parser.add_argument("--rebuild", action="store_true")
    args = parser.parse_args()
    table = load_table(rebuild=args.rebuild)
    if args.command == "evaluate":
        report = evaluate(table)
        _write(REPORT_PATH, report)
        print_report(report)
    else:
        payload = scan(table, json.loads(REPORT_PATH.read_text()))
        _write(SIGNALS_PATH, payload)
        logger.info(f"{sum(len(b['signals']) for b in payload['bots'])} sinais em {SIGNALS_PATH}")


if __name__ == "__main__":
    main()
