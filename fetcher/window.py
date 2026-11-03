"""Calendar-month query windows in local time."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo


@dataclass(frozen=True)
class MonthWindow:
    label: str  # "YYYY-MM"
    start: datetime
    end: datetime  # exclusive; clamped to "now" while the month is in progress
    partial: bool

    @property
    def seconds(self) -> int:
        return int((self.end - self.start).total_seconds())


def previous_month(now: datetime) -> str:
    return f"{now.year - 1}-12" if now.month == 1 else f"{now.year}-{now.month - 1:02d}"


def month_window(label: str, tz: ZoneInfo, now: datetime | None = None) -> MonthWindow:
    if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", label):
        raise ValueError(f"invalid month {label!r}, expected YYYY-MM")
    year, month = map(int, label.split("-"))
    now = now or datetime.now(tz)
    start = datetime(year, month, 1, tzinfo=tz)
    next_start = datetime(year + month // 12, month % 12 + 1, 1, tzinfo=tz)
    if start > now:
        raise ValueError(f"{label} is in the future")
    end = min(next_start, now)
    return MonthWindow(label, start, end, partial=end < next_start)
