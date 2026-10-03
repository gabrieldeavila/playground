import os
from pathlib import Path

from dotenv import load_dotenv

PROJ_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJ_ROOT / ".env")

# STOCK_DATA_DIR can point to the directory where the NestJS collector writes CSVs.
RAW_DATA_DIR = Path(os.getenv("STOCK_DATA_DIR", PROJ_ROOT / "data" / "raw")).expanduser()
if not RAW_DATA_DIR.is_absolute():
    RAW_DATA_DIR = (PROJ_ROOT / RAW_DATA_DIR).resolve()

DATA_DIR = PROJ_ROOT / "data"
INTERIM_DATA_DIR = DATA_DIR / "interim"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
EXTERNAL_DATA_DIR = DATA_DIR / "external"
MODELS_DIR = PROJ_ROOT / "models"
REPORTS_DIR = PROJ_ROOT / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"
