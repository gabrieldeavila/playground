# forecast-ml

<a target="_blank" href="https://cookiecutter-data-science.drivendata.org/">
    <img src="https://img.shields.io/badge/CCDS-Project%20template-328F97?logo=cookiecutter" />
</a>

Stock market forecasting models. The initial training pipeline learns from all historical candles in `data/raw`; it does not consume buy signals from Kandle.

## Historical opportunity model

The baseline creates causal features inspired by Kandle's EMA strategy (EMA 9/20/50/100/200, EMA alignment, five-candle slopes and price/volume changes). It labels each candle as successful when `adjusted_close` reaches the configured target at any point in the following candles. Defaults are a 5% target and 10 candles. In the current daily CSVs, one candle corresponds to one trading session.

Run from this directory after installing dependencies with `uv sync`:

```bash
uv run python -m forecast_ml.dataset
uv run python -m forecast_ml.modeling.diagnose --target-pcts 0.05 0.10 0.14 0.02 --horizon-bars 10
uv run python -m forecast_ml.modeling.train --target-pct 0.05 --horizon-bars 10
uv run python -m forecast_ml.modeling.predict --threshold 0.5
uv run pytest
# or use the Makefile shortcuts
make train TARGET_PCT=0.05 HORIZON_BARS=10
make predict THRESHOLD=0.5
```

CSV input defaults to `data/raw`. Set `STOCK_DATA_DIR` to use another directory. Each CSV must contain `ticker,date,open,high,low,close,adjusted_close,volume`; identical ticker/date rows are deduplicated, while conflicting duplicates are rejected. New files are included the next time training runs; the pipeline rebuilds from all available CSVs rather than doing incremental training.

Training uses a chronological 80/20 split by date and removes a gap equal to the label horizon between train and test. The model and metadata are saved under `models/`. Training intentionally fails if either partition lacks both label classes; with only one year of data and a 200-candle EMA warmup, there may not yet be enough examples to produce a meaningful model. Kandle remains an independent downstream validation strategy.

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


