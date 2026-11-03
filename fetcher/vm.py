"""Solar generation and grid export from VictoriaMetrics (integrated power → kWh)."""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from dataclasses import dataclass

from .config import FetchError
from .window import MonthWindow

WATT_SECONDS_PER_KWH = 3_600_000

# MetricsQL templates; {range} is the window length in seconds.
EPCUBE_W = 'echonet_solar_instantaneous_generation_watts{{device="epcube_solar"}}[{range}s]'
CANADIAN_W = 'homeassistant_sensor_power_w{{entity="sensor.inverter_canadian_energy_meter_0_power"}}[{range}s]'
EXPORT_W = 'clamp_min(-panasonic_power_watts{{entity="main"}}, 0)[{range}s]'  # negative main-breaker power = export

# The CT clamp monitors 1 leg of a 200V single-phase 3-wire (単相3線) circuit,
# so measured wattage on this leg is multiplied by 2 for total inverter output.
CANADIAN_METER_SCALE = 2


@dataclass(frozen=True)
class SolarReadings:
    epcube_kwh: float
    canadian_kwh: float
    exported_kwh: float

    @property
    def generated_kwh(self) -> float:
        return self.epcube_kwh + self.canadian_kwh


def _integrate_kwh(host: str, series: str, window: MonthWindow) -> float:
    query = f"integrate({series.format(range=window.seconds)}) / {WATT_SECONDS_PER_KWH}"
    params = urllib.parse.urlencode({"query": query, "time": int(window.end.timestamp())})
    try:
        with urllib.request.urlopen(f"{host}/api/v1/query?{params}", timeout=10) as resp:
            results = json.load(resp)["data"]["result"]
    except (OSError, ValueError, KeyError) as e:
        raise FetchError(f"VictoriaMetrics query failed ({query}): {e}") from e
    if not results:
        raise FetchError(f"VictoriaMetrics returned no series for: {query}")
    return sum(float(r["value"][1]) for r in results)


def fetch_solar(host: str, window: MonthWindow) -> SolarReadings:
    return SolarReadings(
        epcube_kwh=_integrate_kwh(host, EPCUBE_W, window),
        canadian_kwh=_integrate_kwh(host, CANADIAN_W, window) * CANADIAN_METER_SCALE,
        exported_kwh=_integrate_kwh(host, EXPORT_W, window),
    )
