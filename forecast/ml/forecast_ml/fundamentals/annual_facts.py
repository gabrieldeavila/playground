"""One row per fiscal year from a company's EDGAR facts, dated by the 10-K filing.

A 10-K repeats the previous years as comparatives, sometimes restated. Each fiscal
year keeps the value from the *first* annual report that contained it, filed when it
was first known, so later restatements never leak into the past.
"""

import pandas as pd

# The first tag a company reports wins; companies switched tags over the years
# (e.g. SalesRevenueNet -> RevenueFromContractWithCustomer... after ASC 606).
FLOW_TAGS = {
    "revenue": (
        "Revenues",
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "RevenueFromContractWithCustomerIncludingAssessedTax",
        "SalesRevenueNet",
    ),
    "net_income": ("NetIncomeLoss", "ProfitLoss"),
    "operating_cash_flow": (
        "NetCashProvidedByUsedInOperatingActivities",
        "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations",
    ),
    "gross_profit": ("GrossProfit",),
    "cost_of_revenue": ("CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold"),
}
INSTANT_TAGS = {
    "assets": ("Assets",),
    "current_assets": ("AssetsCurrent",),
    "current_liabilities": ("LiabilitiesCurrent",),
    "long_term_debt": ("LongTermDebtNoncurrent", "LongTermDebt"),
    "equity": (
        "StockholdersEquity",
        "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
    ),
    "shares": ("CommonStockSharesOutstanding",),
}
ANNUAL_FORMS = {"10-K", "10-K405", "10-KT"}
MIN_YEAR_DAYS, MAX_YEAR_DAYS = 350, 380


def _records(facts: dict, tag: str, namespace: str = "us-gaap") -> pd.DataFrame:
    units = facts.get("facts", {}).get(namespace, {}).get(tag, {}).get("units", {})
    rows = units.get("USD") or units.get("shares") or []
    frame = pd.DataFrame(rows)
    if frame.empty or "form" not in frame:
        return pd.DataFrame(columns=["end", "val", "filed"])
    frame = frame[frame["form"].isin(ANNUAL_FORMS)].copy()
    frame["end"] = pd.to_datetime(frame["end"])
    frame["filed"] = pd.to_datetime(frame["filed"])
    if "start" in frame:
        days = (frame["end"] - pd.to_datetime(frame["start"])).dt.days
        frame = frame[days.isna() | days.between(MIN_YEAR_DAYS, MAX_YEAR_DAYS)]
    return frame[["end", "val", "filed"]]


def _first_known(facts: dict, tags: tuple[str, ...], namespace: str = "us-gaap") -> pd.Series:
    """Value per period end from the earliest annual filing, tags in priority order."""
    found = pd.Series(dtype=float, index=pd.DatetimeIndex([]))
    for tag in tags:
        records = _records(facts, tag, namespace).sort_values("filed")
        values = records.drop_duplicates("end", keep="first").set_index("end")["val"]
        found = found.combine_first(values.astype(float))
    return found


def _filing_dates(facts: dict) -> pd.Series:
    """When each fiscal year was first reported: its earliest 10-K among the key tags."""
    frames = [
        _records(facts, tag)
        for tags in (*FLOW_TAGS.values(), *INSTANT_TAGS.values())
        for tag in tags
    ]
    records = pd.concat(
        [f for f in frames if not f.empty] or [pd.DataFrame(columns=["end", "filed"])]
    )
    return records.groupby("end")["filed"].min()


def annual_facts(facts: dict) -> pd.DataFrame:
    """Fiscal years (index: period end) with the values above and ``filed``."""
    columns = {name: _first_known(facts, tags) for name, tags in FLOW_TAGS.items()}
    columns |= {name: _first_known(facts, tags) for name, tags in INSTANT_TAGS.items()}
    table = pd.DataFrame(columns)
    if table.empty:
        return table.assign(filed=pd.Series(dtype="datetime64[ns]"))
    if table["shares"].isna().all():
        dei = _first_known(facts, ("EntityCommonStockSharesOutstanding",), "dei")
        table["shares"] = dei.reindex(
            table.index, method="nearest", tolerance=pd.Timedelta("120D")
        )
    table["gross_profit"] = table["gross_profit"].fillna(
        table["revenue"] - table["cost_of_revenue"]
    )
    table["filed"] = _filing_dates(facts).reindex(table.index)
    # Only fiscal years with an income statement; balance-sheet-only ends are interim.
    return table[table["revenue"].notna() | table["net_income"].notna()].sort_index()
