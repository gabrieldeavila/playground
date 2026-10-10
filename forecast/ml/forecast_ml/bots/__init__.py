"""Weekly-chart bots that look for beaten-down stocks turning around.

Each bot is a fixed rule on weekly candles (no machine learning). Rules are tuned on
2011-2018, chosen on 2019-2021 and tested once on 2022 on (see periods.py). A signal is
judged by what the stock did over the next 52 weeks against SPY, and every bot is
compared with a baseline of equally beaten-down stocks that showed no pattern.
"""
