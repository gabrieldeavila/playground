"""A bot is a list of conditions on weekly readings; a week matches when all hold.

Conditions on a missing value (a company without fundamentals, a chart too short)
never hold, so a bot never guesses.
"""

from dataclasses import dataclass, field
import operator

import pandas as pd

OPERATORS = {">=": operator.ge, "<=": operator.le, "==": operator.eq, "!=": operator.ne}


@dataclass(frozen=True)
class Condition:
    column: str
    op: str
    value: float | bool | str

    def holds(self, table: pd.DataFrame) -> pd.Series:
        values = table[self.column]
        return OPERATORS[self.op](values, self.value) & values.notna()

    def describe(self) -> str:
        return f"{self.column} {self.op} {self.value}"


@dataclass(frozen=True)
class Bot:
    name: str
    title: str  # shown in the UI, Portuguese
    thesis: str  # why the pattern should work, Portuguese
    conditions: tuple[Condition, ...] = field(default_factory=tuple)

    def matches(self, table: pd.DataFrame) -> pd.Series:
        mask = pd.Series(True, index=table.index)
        for condition in self.conditions:
            mask &= condition.holds(table)
        return mask

    def describe(self) -> list[str]:
        return [condition.describe() for condition in self.conditions]
