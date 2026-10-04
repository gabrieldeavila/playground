#################################################################################
# GLOBALS                                                                       #
#################################################################################

PROJECT_NAME = forecast-ml
PYTHON_VERSION = 3.12
PYTHON_INTERPRETER = uv run python
TARGET_PCT ?= 0.05
STOP_PCT ?= 0.03
HORIZON_BARS ?= 10
THRESHOLD ?= 0.5

#################################################################################
# COMMANDS                                                                      #
#################################################################################


## Install Python dependencies
.PHONY: requirements
requirements:
	uv sync
	



## Delete all compiled Python files
.PHONY: clean
clean:
	find . -type f -name "*.py[co]" -delete
	find . -type d -name "__pycache__" -delete


## Lint using ruff (use `make format` to do formatting)
.PHONY: lint
lint:
	ruff format --check
	ruff check

## Format source code with ruff
.PHONY: format
format:
	ruff check --fix
	ruff format



## Run tests
.PHONY: test
test: requirements
	uv run pytest tests

## Diagnose whether historical data supports the configured target and horizon
.PHONY: diagnose
diagnose: requirements
	uv run python -m forecast_ml.modeling.diagnose --target-pcts 0.05 0.14 0.10 0.02 --stop-pct $(STOP_PCT) --horizon-bars $(HORIZON_BARS)

## Train the historical opportunity model
.PHONY: train
train: requirements
	uv run python -m forecast_ml.modeling.train --target-pct $(TARGET_PCT) --stop-pct $(STOP_PCT) --horizon-bars $(HORIZON_BARS)

## Build references/universe.csv (S&P 500/400/600 from Wikipedia + watchlist.txt)
.PHONY: universe
universe: requirements
	uv run python -m forecast_ml.universe

## Download daily candles for the tickers in references/universe.csv
.PHONY: download
download: requirements
	uv run python -m forecast_ml.download

## Train the Kandle COMPRA score model (train before 2022, test from 2022); TIMEFRAME=weekly too
TIMEFRAME ?= daily
.PHONY: train-kandle
train-kandle: requirements
	uv run python -m forecast_ml.modeling.kandle_model train --timeframe $(TIMEFRAME)

## Compare S&P 500-only, pooled and small/mid-only Kandle models per index
.PHONY: compare-kandle
compare-kandle: requirements
	uv run python -m forecast_ml.modeling.kandle_model compare --timeframe $(TIMEFRAME)

## Write data/processed/kandle_signals*.json, served by the API
.PHONY: predict-kandle
predict-kandle: requirements
	uv run python -m forecast_ml.modeling.kandle_model predict --timeframe $(TIMEFRAME)

## Score the latest candle for each ticker using the trained model
.PHONY: predict
predict: requirements
	uv run python -m forecast_ml.modeling.predict --threshold $(THRESHOLD)


## Set up Python interpreter environment
.PHONY: create_environment
create_environment:
	uv venv --python $(PYTHON_VERSION)
	@echo ">>> New uv virtual environment created. Activate with:"
	@echo ">>> Windows: .\\\\.venv\\\\Scripts\\\\activate"
	@echo ">>> Unix/macOS: source ./.venv/bin/activate"
	



#################################################################################
# PROJECT RULES                                                                 #
#################################################################################


## Make dataset
.PHONY: data
data: requirements
	uv run python -m forecast_ml.dataset


#################################################################################
# Self Documenting Commands                                                     #
#################################################################################

.DEFAULT_GOAL := help

define PRINT_HELP_PYSCRIPT
import re, sys; \
lines = '\n'.join([line for line in sys.stdin]); \
matches = re.findall(r'\n## (.*)\n[\s\S]+?\n([a-zA-Z_-]+):', lines); \
print('Available rules:\n'); \
print('\n'.join(['{:25}{}'.format(*reversed(match)) for match in matches]))
endef
export PRINT_HELP_PYSCRIPT

help:
	@$(PYTHON_INTERPRETER) -c "${PRINT_HELP_PYSCRIPT}" < $(MAKEFILE_LIST)
