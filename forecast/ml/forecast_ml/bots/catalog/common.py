"""Conditions every bot shares."""

from forecast_ml.bots.rules import Condition

# Average traded value per session below which weekly fills are unrealistic.
LIQUID = Condition("dollar_volume_day", ">=", 5_000_000)

# Banks, insurers and REITs: their operating cash flow includes deposits, premiums and
# loan flows, so "cash flow / price" says nothing about the business. Value studies
# leave financials out for the same reason.
NOT_FINANCIAL = Condition("sector", "!=", "Financials")
