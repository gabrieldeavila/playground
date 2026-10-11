"""Turn one quarter of SEC's Insider Transactions Data Set into one row per trade.

Only original Form 4s are kept: a 4/A restates a filing the market already saw (the
original is what was known at the time) and a Form 5 is a yearly catch-up filed
months late. A joint filing (a fund and its managers) lists several owners for the
same trade; the trade is kept once, under its director or officer.
"""

import pandas as pd

SUBMISSION_COLUMNS = ["ACCESSION_NUMBER", "FILING_DATE", "DOCUMENT_TYPE", "ISSUERCIK"]
OWNER_COLUMNS = ["ACCESSION_NUMBER", "RPTOWNERCIK", "RPTOWNER_RELATIONSHIP", "RPTOWNER_TITLE"]
TRADE_COLUMNS = [
    "ACCESSION_NUMBER",
    "NONDERIV_TRANS_SK",
    "TRANS_DATE",
    "TRANS_CODE",
    "TRANS_SHARES",
    "TRANS_PRICEPERSHARE",
    "TRANS_ACQUIRED_DISP_CD",
    "SHRS_OWND_FOLWNG_TRANS",
]
KEPT_CODES = ("P", "S")  # open-market purchase and sale; grants, exercises, gifts say little
TRADE_ROW = [
    "accession",
    "filed",
    "issuer_cik",
    "owner_cik",
    "is_director",
    "is_officer",
    "title",
    "traded",
    "code",
    "shares",
    "price",
    "shares_after",
]


def _dates(values: pd.Series) -> pd.Series:
    return pd.to_datetime(values, format="%d-%b-%Y", errors="coerce")


def _numbers(values: pd.Series) -> pd.Series:
    return pd.to_numeric(values, errors="coerce")


def insider_owners(owners: pd.DataFrame) -> pd.DataFrame:
    """Directors and officers only, one per filing (the first listed)."""
    relationship = owners["RPTOWNER_RELATIONSHIP"].fillna("")
    insiders = owners.assign(
        is_director=relationship.str.contains("Director"),
        is_officer=relationship.str.contains("Officer"),
    )
    insiders = insiders[insiders["is_director"] | insiders["is_officer"]]
    return insiders.drop_duplicates("ACCESSION_NUMBER", keep="first")


def parse_quarter(
    submissions: pd.DataFrame, owners: pd.DataFrame, trades: pd.DataFrame
) -> pd.DataFrame:
    """Open-market purchases and sales by directors and officers, from original Form 4s."""
    originals = submissions[submissions["DOCUMENT_TYPE"] == "4"]
    kept = trades[trades["TRANS_CODE"].isin(KEPT_CODES)]
    rows = kept.merge(originals, on="ACCESSION_NUMBER").merge(
        insider_owners(owners), on="ACCESSION_NUMBER"
    )
    return pd.DataFrame(
        {
            "accession": rows["ACCESSION_NUMBER"],
            "filed": _dates(rows["FILING_DATE"]),
            "issuer_cik": _numbers(rows["ISSUERCIK"]).astype("Int64"),
            "owner_cik": _numbers(rows["RPTOWNERCIK"]).astype("Int64"),
            "is_director": rows["is_director"],
            "is_officer": rows["is_officer"],
            "title": rows["RPTOWNER_TITLE"].fillna(""),
            "traded": _dates(rows["TRANS_DATE"]),
            "code": rows["TRANS_CODE"],
            "shares": _numbers(rows["TRANS_SHARES"]),
            "price": _numbers(rows["TRANS_PRICEPERSHARE"]),
            "shares_after": _numbers(rows["SHRS_OWND_FOLWNG_TRANS"]),
        },
        columns=TRADE_ROW,
    ).reset_index(drop=True)
