# forecast-ml

<a target="_blank" href="https://cookiecutter-data-science.drivendata.org/">
    <img src="https://img.shields.io/badge/CCDS-Project%20template-328F97?logo=cookiecutter" />
</a>

Stock market forecasting models. The initial training pipeline learns from all historical candles in `data/raw`; it does not consume buy signals from Kandle.

## Kandle COMPRA score

A model gives each Kandle COMPRA signal a 0–100 score.

1. **Entry** ([kandle_signals.py](forecast_ml/kandle_signals.py)): Kandle's rule with EMA 9/20/50/100 on daily candles, ported rule for rule. The trade enters at the next open.
2. **Exit** ([trades.py](forecast_ml/trades.py)): the trade ends when EMA 9 closes below EMA 20 for 2 days in a row, or when a close falls 3×ATR below entry. Both exits execute at the next open, with a cost of 0.1% per side. A trade succeeded if its net return is positive.
3. **Features** ([kandle_features.py](forecast_ml/kandle_features.py)): 11 values read from the chart at the signal candle. They are the EMA spreads and slopes, how stretched price is from EMA 9, ATR, volume against its 20-day average, the 20-day return, and the result of the ticker's previous trade.
4. **Trend start**: a signal counts as a trend start only when it is the first COMPRA after a base. That means the setup was off on at least 50 of the previous 60 candles and EMA 9 is already more than 1% above EMA 20. Repeated COMPRAs in a choppy market are labeled "lateral" (sideways). This rule is fixed, not learned: in the test period trend starts won 35.7% of the time and averaged +1.46%, against 33.5% and +1.00% for all signals.
5. **Model** ([modeling/kandle_model.py](forecast_ml/modeling/kandle_model.py)): a shallow gradient boosting classifier trained on signals before 2022 and tested on signals from 2022 on. The saved model is the same model that was tested. A score of 80 means the model rated the signal higher than 80% of the training signals.

```bash
make download        # tickers in references/universe.txt (S&P 500 + yours)
make train-kandle    # prints the test table; models/kandle_model.joblib
make predict-kandle  # data/processed/kandle_signals.json for the API
```

Test results on 12,704 signals from 2022-01 to 2026-09, which the model never saw. The bands are model scores:

| | Trades | Win rate | Mean return | Median days |
|---|---|---|---|---|
| Trend starts | 2,748 | 35.7% | +1.46% | 24 |
| All signals | 12,704 | 33.5% | +1.00% | 20 |
| Score 0–30 | 3,244 | 29.4% | +0.65% | 13 |
| Score 70–90 | 2,996 | 35.8% | +1.32% | 24 |
| Score 90–100 | 1,658 | 39.4% | +2.58% | 27 |

This is trend following: most trades lose a little, and a few winners last for months. Trend starts average +14.5% on winners and −5.8% on losers. Next to each score, the UI shows the real win rate of that score band in testing. It does not show the model's own probability, which is optimistic. `references/universe.txt` lists today's S&P 500 members, so delisted stocks are missing and backtests are somewhat optimistic.

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

CSV input defaults to `data/raw`. Set `STOCK_DATA_DIR` to use another directory. Each CSV must contain `ticker,date,open,high,low,close,adjusted_close,volume`; identical ticker/date rows are deduplicated, while conflicting duplicates are rejected. New files are included the next time training runs; the pipeline rebuilds from all available CSVs rather than doing incremental training.

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


