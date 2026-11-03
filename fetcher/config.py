"""Settings: non-secret values from web/data/config.json, secrets from .env / the environment."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "web" / "data" / "config.json"
HISTORY_PATH = ROOT / "web" / "data" / "history.csv"


class FetchError(RuntimeError):
    """Any failure that should abort the run with a one-line message."""


@dataclass(frozen=True)
class Settings:
    tz: ZoneInfo
    octopus_start_month: str
    octopus_day_rate: float  # fixed energy rate + renewable surcharge, ¥/kWh
    vm_host: str
    octopus_account: str
    octopus_auth: dict  # ObtainJSONWebTokenInput: {"APIKey": ...} or {"email": ..., "password": ...}


def load_dotenv(path: Path) -> None:
    """Minimal KEY=VALUE parser; never overrides variables already set in the environment."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("'\""))


def load() -> Settings:
    load_dotenv(ROOT / ".env")
    cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))["fetcher"]
    env = os.environ

    if env.get("OCTOPUS_API_KEY"):
        auth = {"APIKey": env["OCTOPUS_API_KEY"]}
    elif env.get("OCTOPUS_EMAIL") and env.get("OCTOPUS_PASSWORD"):
        auth = {"email": env["OCTOPUS_EMAIL"], "password": env["OCTOPUS_PASSWORD"]}
    else:
        auth = {}

    missing = [k for k in ("VM_HOST", "OCTOPUS_ACCOUNT_NUMBER") if not env.get(k)]
    if not auth:
        missing.append("OCTOPUS_API_KEY or OCTOPUS_EMAIL+OCTOPUS_PASSWORD")
    if missing:
        raise FetchError(f"missing settings in .env: {', '.join(missing)}")

    return Settings(
        tz=ZoneInfo(cfg["timezone"]),
        octopus_start_month=cfg["octopusStartMonth"],
        octopus_day_rate=round(cfg["octopusFixedRateJpy"] + cfg["renewableSurchargeJpy"], 2),
        vm_host=env["VM_HOST"].rstrip("/"),
        octopus_account=env["OCTOPUS_ACCOUNT_NUMBER"],
        octopus_auth=auth,
    )
