# forecast-ml

<a target="_blank" href="https://cookiecutter-data-science.drivendata.org/">
    <img src="https://img.shields.io/badge/CCDS-Project%20template-328F97?logo=cookiecutter" />
</a>

Stock market forecasting models. The initial training pipeline learns from all historical candles in `data/raw`; it does not consume buy signals from Kandle.

## Kandle COMPRA score

A model gives each Kandle COMPRA signal a 0–100 score.

1. **Entry** ([kandle_signals.py](forecast_ml/kandle_signals.py)): Kandle's rule with EMA 9/20/50 on daily candles, ported rule for rule. Select the same three EMAs on the Kandle chart to see the same COMPRAs. The trade enters at the next open. Dropping EMA 100 makes the setup fire earlier in a trend. On 2010–2021 signals it made more per ticker than 9/20/50/100 (daily and weekly) at the same profit factor. Entering on a pullback to EMA 9/20, crossing EMA 9 over 20 above EMA 50, or skipping stretched entries did not do better.
2. **Exit** ([trades.py](forecast_ml/trades.py)): the trade ends when EMA 9 closes below EMA 20 for 2 days in a row, or when a close falls 3×ATR below entry. Both exits execute at the next open, with a cost of 0.1% per side. A trade succeeded if its net return is positive.
3. **Features** ([kandle_features.py](forecast_ml/kandle_features.py)): values read from the chart at the signal candle. They are the EMA spreads and slopes, how stretched price is from EMA 9, ATR, volume against its 20-day average, the 20-day return, sideways-market context, and the result of the ticker's previous trades. One feature describes the market: the share of the liquid universe (the US$ 5M floor below) closing above its own EMA 100 that day. COMPRAs made while most stocks are already stretched (above 70%) were the weakest group in 12 of 16 years. This feature lifted test AUC from 0.532 to 0.545 (daily) and from 0.527 to 0.557 (weekly).
4. **Trend start**: a signal counts as a trend start only when it is the first COMPRA after a base. That means the setup was off on at least 50 of the previous 60 candles and EMA 9 is already more than 1% above EMA 20. Repeated COMPRAs in a choppy market are labeled "lateral" (sideways). This rule is fixed, not learned: in the test period trend starts won 36.0% of the time and averaged +1.03%, against 33.1% and +0.47% for all signals.
5. **Model** ([modeling/kandle_model.py](forecast_ml/modeling/kandle_model.py)): a shallow gradient boosting classifier trained on signals before 2022 and tested on signals from 2022 on. The saved model is the same model that was tested. A score of 80 means the model rated the signal higher than 80% of the training signals.
6. **Universe and liquidity** ([universe.py](forecast_ml/universe.py)): `references/universe.csv` holds the current S&P 500, MidCap 400 and SmallCap 600 members from Wikipedia, the other common shares listed on NYSE and Nasdaq, and the hand-picked tickers in `references/watchlist.txt`, each tagged with its index and sector. Exchange listings come from the Nasdaq Trader symbol directory, with market cap and sector from Nasdaq's stock screener. They keep only operating companies' common shares worth at least US$ 500M that traded at least US$ 5M in the screener's last session: no ETFs, ADRs, preferred shares, warrants, units, closed-end funds or SPACs. S&P members keep their S&P label. One model is trained on all of them. Signals whose last 20 candles averaged under US$ 5M traded per session are left out of training and testing, and illiquid tickers are left out of the signals list (search still finds them). Liquidity is measured as close × volume, not price, because Yahoo's split-adjusted history makes past prices look tiny.

```bash
make universe        # references/universe.csv (Wikipedia + NYSE/Nasdaq + watchlist.txt)
make download        # every ticker in the universe (~2,600); --missing-only skips stored ones
make compare-kandle  # S&P 500-only vs pooled vs small/mid-only models, per index
make train-kandle    # prints the test tables; models/kandle_model.joblib
make predict-kandle  # data/processed/kandle_signals.json for the API
```

`make predict-kandle` also writes `data/processed/kandle_trades*.parquet`: every simulated trade since 2010 with its score, entry and exit prices, and the test start date in the file's metadata. The UI's ticker page (`/signals/<TICKER>`) charts it. The API runs `uv run python -m forecast_ml.chart <TICKER> --timeframe daily`, which returns that ticker's adjusted candles, EMA 9/20/50 and trades as JSON. By default the chart marks only test trades (2022 on). Training trades can be switched on and are drawn faded, because the model learned from them and their scores look better than they are.

Russell 2000: iShares blocks scripted downloads, so save the IWM holdings CSV from the fund page in a browser and run `uv run python -m forecast_ml.universe --russell-holdings IWM_holdings.csv`. Russell names already in an S&P index keep the S&P label. `--exchanges` with no names leaves NYSE/Nasdaq out; `--min-market-cap` and `--min-dollar-volume` change the US$ 500M and US$ 5M floors.

Test results on 60,385 daily signals from 2022-01 to 2026-09, which the model never saw. The bands are model scores:

| | Trades | Win rate | Mean return | Median days |
|---|---|---|---|---|
| Trend starts | 15,299 | 36.0% | +1.03% | 23 |
| All signals | 60,385 | 33.1% | +0.47% | 19 |
| Score 0–30 | 14,102 | 28.5% | 0.00% | 13 |
| Score 70–90 | 13,788 | 35.2% | +0.53% | 23 |
| Score 90–100 | 9,048 | 39.6% | +1.69% | 26 |

The same score does not mean the same odds in every index. Score 90–100 signals in testing:

| Index | Win rate | Mean return |
|---|---|---|
| S&P 500 | 41.3% | +2.48% |
| S&P 400 | 40.0% | +1.31% |
| S&P 600 | 39.3% | +1.10% |
| Other NYSE | 37.9% | +0.47% |
| Other Nasdaq | 38.0% | +3.20% |

So next to each score, the UI shows the real test win rate of that score band *within the ticker's index* (when the index had at least 1,000 test trades). It does not show the model's own probability, which is optimistic. `make compare-kandle` found that the pooled model ranks signals as well as or better than an S&P 500-only or a small/mid-only model in each index, on both timeframes. Over 2022–2026, all S&P 600 daily signals together lost money (−0.33% on average), against +0.92% for the S&P 500, a period when small caps lagged. The universe lists only current members, so delisted stocks are missing and backtests are optimistic, more so for small caps.

This is trend following: most trades lose a little, and a few winners last for months.

## Weekly bots: beaten-down stocks with upside

Fixed rules on weekly candles, no machine learning, that look for stocks far below their highs that may be worth more. A signal is judged by its return over the next 52 weeks **minus SPY's** over the same weeks. It enters at the next open and pays 0.1% per side. Each bot is also compared with a **baseline**: every liquid week of a stock 40% or more below its 3-year high, the pool the bots pick from.

- **Point-in-time fundamentals** ([fundamentals/](forecast_ml/fundamentals)): SEC EDGAR company facts. Each fiscal year keeps the value of the first 10-K that reported it and becomes usable the day after that filing. From these: the Piotroski F-score, and book, cash flow and earnings to price. Market cap uses the 10-K share count times the splits since the filing, because Yahoo's close is split-adjusted.
- **Protocol** ([bots/](forecast_ml/bots)): parameters are picked on 2011–2018 from a small grid. A pick needs 60+ signals, 15+ distinct weeks, 8+ distinct quarters and half the years beating SPY. A bot is approved only if it beats the baseline on train **and** on 2019–2021 validation, and beats SPY there. 2022 on is scored afterwards and never picks anything. One signal per ticker per 26 weeks.

```bash
make fundamentals            # EDGAR + splits (~30 min, skips files already saved)
make evaluate-bots REBUILD=1 # reports/bots.json
make scan-bots               # data/processed/bot_signals.json: this week's signals
```

Results (median 52-week return minus SPY; the baseline's train/validation/test is −5.0 / −0.4 / −10.0):

| Bot | Train 2011–18 | Valid. 2019–21 | Test 2022+ | Test vs baseline | Status |
|---|---|---|---|---|---|
| Panic (beaten-down stock in a market sell-off) | no eligible variant | | | | rejected |
| Base breakout (Weinstein stage 1→2) | −1.9 | −13.0 | −5.6 | +4.4 | rejected |
| Relative strength turning | +4.7 | −15.5 | −14.5 | −4.5 | rejected |
| Cheap + F-score + chart turning | +0.1 | −2.9 | −13.6 | −3.6 | rejected |
| Cash-rich breakout | +0.1 | −7.1 | −4.9 | +5.1 | rejected |
| **Cash at a discount** (≥50% below its high, operating cash flow ≥15% of market cap, profitable, not a financial) | **+4.5** | **+37.2** | **−7.2** | **+2.8** | approved |

What the numbers say:

- **Weekly chart patterns alone did not beat SPY.** Waiting for the chart to turn mostly bought after the rebound. Even the cash flow filter got worse when a 26-week breakout was required.
- **Cash at a discount beat its pool in all three periods.** Its picks also won 50%+ more often than the pool and did not lose 30%+ more often. In 2022–2026 it still lost to SPY in the median (43% of picks beat it), a period when the equal-weighted liquid market trailed SPY by 8.7 points. Use it as a weekly short list for fundamental research, not as a buy signal.
- **Validation is inflated by 2020.** 279 of its signals came from the post-crash rebound.

How the test was used:

- The round-1 bots (the first four rows) were scored on test once, before the cash bots existed. The cash bots were designed afterwards from train and validation only.
- Financials were excluded after the first test look, because operating cash flow is not meaningful for banks, insurers and REITs. Before that exclusion the approved variant had a test median of −4.2 (+5.8 vs baseline).

Caveats:

- **Survivorship bias.** The universe lists only companies trading today, so the bankrupt and delisted ones are missing. This flatters every beaten-down strategy and its baseline alike, which is why each bot is compared with the baseline.
- **`data/external/pit` is not usable.** Its "delisted" histories belong to whatever company uses the ticker now.

## Insider buying (Form 4)

Do directors and officers buying their own beaten-down stock add anything? Studied on 2011–2021 only; 2022+ has already been looked at twice and is not read here.

- **Data** ([insiders/](forecast_ml/insiders)): SEC's quarterly Insider Transactions Data Sets (every Form 4 since 2006). Kept: original Form 4s (not 4/A or Form 5), directors and officers (not 10% owners alone), open-market purchases (code P) of US$ 10k+ with a price, filed within 90 days of the trade. A buy is **routine** when the same insider bought in the same month in each of the three previous years (Cohen, Malloy & Pomorski 2012); those are left out of the signal.
- **Point in time**: a trade counts from the day after its filing, never from the trade date. Weekly columns cover the last 90 days: distinct buyers, value bought, CEO/CFO buyers, routine buyers, sellers.
- **Bots** ([insider_buying.py](forecast_ml/bots/catalog/insider_buying.py)) are kept out of `grids()`, so `evaluate-bots` does not score them on test.

```bash
make insiders        # data/external/form4/
make study-insiders  # reports/insiders.json
```

Results, median 52-week return minus SPY among liquid stocks 40%+ below their highs (train / validation):

| Group | Train 2011–18 | Valid. 2019–21 | vs no purchase (train / valid.) |
|---|---|---|---|
| No insider purchase | −5.8 | −1.6 | |
| Any purchase | −0.2 | +6.9 | +5.6 / +8.5 |
| 3+ distinct buyers | +0.7 | +15.9 | +6.5 / +17.5 |
| Purchase, smallest third by traded value | +2.1 | +8.9 | +7.9 / +10.5 |
| Purchase, largest third | −1.1 | +5.0 | +4.7 / +6.6 |
| Placebo: 2+ sellers, no buyer | −4.9 | −3.2 | +0.9 / −1.6 |
| Placebo: purchases moved 1+ year | −4.5 | −0.1 | +1.3 / +1.5 |
| Leak check: dated by trade, not filing | +0.3 | +7.2 | +6.1 / +8.8 |
| Caixa descontada | +4.5 | +37.2 | |
| Caixa descontada + purchase | +5.6 | +51.0 | |

Year by year, purchases beat no purchase in 7 of 8 training years (−0.6 in 2014). In validation they won only in 2020 (+17.4, 697 signals) and lost in 2019 (−5.0) and 2021 (−3.4).

What the numbers say:

- **There is a signal, and the placebos behave.** Purchases beat the same pool without them in train. Sales and shifted purchases show close to no edge, so this is not "small beaten-down stocks" in disguise. The gap is larger in small companies, as the literature reports.
- **Validation does not confirm it.** The pooled validation number is 2020's post-crash rebound. Both round-3 bots pass the train/validation rules (`insider_comprando`: 50%+ off highs, 2+ buyers, US$ 250k+; `caixa_com_insider`: caixa descontada + 2+ buyers), but they inherit that dependence on 2020.
- **The look-ahead leak is small here** (+0.3 to +0.5): Form 4s are filed within two days.
- Routine buys are rare (2.6% of purchases), so the routine placebo has too few signals to judge.

Caveats:

- **Survivorship, measured**: 45% of opportunistic purchases in 2011–2021 were in companies that no longer have a ticker (bankrupt, delisted or acquired; this data cannot tell which). The universe sees none of them.
- **Lag for a live scan**: the quarterly data sets end at the last closed quarter (2026q1 today). A weekly scan would need EDGAR's daily Form 4 feed.

### Holdout 2006–2010

No bot or study had used these years. Candles from 2003 to mid-2012 were downloaded to `data/external/history` (kept apart from `data/raw`). The test was run once, with the variant picked on 2011–2018 unchanged. The pass rules were written in [holdout_verdict.py](forecast_ml/insiders/holdout_verdict.py) before the run: (1) the bot beats the pool, (2) purchases beat no purchase in 3+ of the 5 years, (3) the median yearly gap without 2009, the post-crash rebound, stays above zero.

```bash
make download-history   # ~20 min; tickers listed after mid-2012 fail with HTTP 400, as expected
make holdout-insiders   # reports/insiders_holdout.json
```

| Group (2006-07 to 2010) | Median excess vs SPY | vs no purchase |
|---|---|---|
| Pool (40%+ below highs) | +2.9 | |
| No purchase | +2.6 | |
| Any purchase | +4.0 | +1.4 |
| 2+ / 3+ buyers | +5.5 / +8.4 | +2.9 / +5.8 |
| Purchase, small / large companies | +6.4 / +1.3 | +3.8 / −1.3 |
| Placebo: sellers / shifted purchases | +2.1 / −0.2 | −0.5 / −2.8 |
| **`insider_comprando`** (264 signals, 100 weeks) | **+13.9** (63.6% beat SPY) | |

Gap by year: 2006 +7.9, 2007 +5.8, 2008 0.0, 2009 +5.4, 2010 −3.2. **Verdict: passed** (3/5 years; +2.9 without 2009).

- **The pattern repeats out of sample.** More buyers mean a larger edge, small companies carry it, and the placebos show none.
- **The edge is modest for "any purchase"** (+1.4) and larger for clusters. The bot's +11 points over the pool comes from requiring 2+ buyers, 50%+ off highs and US$ 250k+.
- **It does not protect on the downside.** 20.8% of the bot's picks lost 30%+, against 12.6% for the pool (2008). Buyers saw value; they did not see the bottom.
- The survivorship bias is larger here: a 2006 stock must have survived until today to be in the universe. The pool comparison absorbs part of it. Routine buys can only be detected from 2009, because the flag needs three years of Form 4s.
- `insider_comprando` stays out of `grids()`. Adding it there scores 2022+ as well; a weekly scan would also need EDGAR's daily Form 4 feed.

## EMA entry ranking

Causal features use adjusted prices, EMA 9/20/50/100/200, alignment, slopes, crossovers, reclaims and pullbacks. Signals are observed at the candle close; simulated entry occurs at the next adjusted open. The operational label checks a 5% target against a 3% stop over 10 trading sessions by default. Ambiguous intrabar target/stop hits are stop-first; gaps exit at the open, and unresolved trades exit at the horizon close.

Training compares logistic regression, Random Forest and HistGradientBoosting with EMA-only and full feature sets on purged walk-forward folds. The selected recipe is calibrated on a later purged block and evaluated on a chronological holdout against the universe and a fixed EMA benchmark. Reports include return lift confidence intervals and a capacity-limited portfolio with transaction costs. The final refit is separate from that evaluation; reused historical holdout results are not a new blind test.

Run from this directory after installing dependencies with `uv sync`:

```bash
uv run python -m forecast_ml.dataset
uv run python -m forecast_ml.modeling.train \
  --model-path models/ema_entry_candidate.joblib \
  --production-model-path models/ema_opportunity_model.joblib \
  --target-pct 0.05 --stop-pct 0.03 --horizon-bars 10 --top-k 3 --cost-bps 10
# Production inference requires an approved artifact:
uv run python -m forecast_ml.modeling.predict --threshold 0.5
# Explicit research-only inference for a rejected candidate:
uv run python -m forecast_ml.modeling.predict \
  --model-path models/ema_entry_candidate.joblib --allow-experimental \
  --output-path data/processed/ema_entry_ranking.csv
uv run pytest tests
```

Candles are read from `data/raw`: Parquet files written by `forecast_ml.download` (about 3–4× smaller than CSV) and CSVs written by the API's collector. Set `STOCK_DATA_DIR` to use another directory. `uv run python -m forecast_ml.download --convert-csv` rewrites existing CSVs as Parquet. Each file must contain `ticker,date,open,high,low,close,adjusted_close,volume`; identical ticker/date rows are deduplicated, while conflicting duplicates are rejected. New files are included the next time training runs; the pipeline rebuilds from all available files rather than doing incremental training.

Candidate artifacts, metrics, out-of-fold predictions and holdout predictions are saved under `models/`. Publication to the requested production path only occurs when the promotion gate passes; a rejected run does not overwrite an existing production model. Costs are basis points **per side**. Training requires both label classes and sufficient history after EMA warmup and temporal purging.

Inference defaults to sessions before the current UTC date; `--as-of YYYY-MM-DD` explicitly selects the last closed session. Only tickers present with valid features in the latest available session are ranked. Verify the CSV timestamps and freshness before interpreting any output. `success_score` is the calibrated target-before-stop score, not expected return or a buy recommendation. Experimental models always emit `entry_candidate=False`. `--all-dates` produces retrospective refit inference, not an out-of-sample backtest.

The current candidate (`hist_gradient_boosting:ema_only`) failed the promotion gate: only 2 folds met the stability condition, and holdout return-lift confidence intervals included zero. Its holdout portfolio returned 3.42%, versus 5.44% for the fixed EMA benchmark, with 10 bps costs per side. It remains experimental; these results do not establish an ML advantage.

## Project Organization

```
├── LICENSE            <- Open-source license if one is chosen
├── Makefile           <- Makefile with convenience commands like `make data` or `make train`
├── README.md          <- The top-level README for developers using this project.
├── data
│   ├── external       <- Data from third party sources.
│   ├── interim        <- Intermediate data that has been transformed.
│   ├── processed      <- The final, canonical data sets for modeling.
│   └── raw            <- The original, immutable data dump.
│
├── docs               <- A default mkdocs project; see www.mkdocs.org for details
│
├── models             <- Trained and serialized models, model predictions, or model summaries
│
├── notebooks          <- Jupyter notebooks. Naming convention is a number (for ordering),
│                         the creator's initials, and a short `-` delimited description, e.g.
│                         `1.0-jqp-initial-data-exploration`.
│
├── pyproject.toml     <- Project configuration file with package metadata for 
│                         forecast-ml and configuration for tools like Ruff
│
├── references         <- Data dictionaries, manuals, and all other explanatory materials.
│
├── reports            <- Generated analysis as HTML, PDF, LaTeX, etc.
│   └── figures        <- Generated graphics and figures to be used in reporting
│
├── requirements.txt   <- The requirements file for reproducing the analysis environment, e.g.
│                         generated with `pip freeze > requirements.txt`
│
├── setup.cfg          <- Configuration file for flake8
│
└── forecast_ml   <- Source code for use in this project.
    │
    ├── __init__.py             <- Makes forecast_ml a Python module
    │
    ├── config.py               <- Store useful variables and configuration
    │
    ├── dataset.py              <- Scripts to download or generate data
    │
    ├── features.py             <- Code to create features for modeling
    │
    ├── modeling                
    │   ├── __init__.py 
    │   ├── predict.py          <- Code to run model inference with trained models          
    │   └── train.py            <- Code to train models
    │
    └── plots.py                <- Code to create visualizations
```

--------


