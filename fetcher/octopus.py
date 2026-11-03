"""Octopus Energy Japan Kraken GraphQL API client."""

from __future__ import annotations

import json
import ssl
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import timezone

from .config import FetchError, Settings
from .window import MonthWindow

ENDPOINT = "https://api.oejp-kraken.energy/v1/graphql/"


@dataclass(frozen=True)
class OctopusUsage:
    imported_kwh: float
    calculated_bill_jpy: int
    intervals_count: int
    cost_estimate_jpy: float | None = None


def _ssl_context() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    try:
        import certifi
        ctx.load_verify_locations(cafile=certifi.where())
    except ImportError:
        pass
    return ctx


def _execute(query: str, variables: dict | None = None, token: str | None = None) -> dict:
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "SolarDeprecationFetcher/2.0",
    }
    if token:
        headers["Authorization"] = f"JWT {token}"

    data = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    req = urllib.request.Request(ENDPOINT, headers=headers, data=data)

    try:
        with urllib.request.urlopen(req, context=_ssl_context(), timeout=20) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise FetchError(f"Octopus API HTTP {e.code}: {body}") from e
    except OSError as e:
        raise FetchError(f"Octopus API network error: {e}") from e

    if "errors" in result:
        msgs = "; ".join(e.get("message", "unknown error") for e in result["errors"])
        raise FetchError(f"Octopus GraphQL error: {msgs}")

    return result.get("data", {})


def authenticate(auth: dict) -> str:
    """Obtain a JWT token via APIKey or email/password."""
    if "APIKey" in auth:
        mutation = """
        mutation ObtainToken($apiKey: String!) {
          obtainKrakenToken(input: { APIKey: $apiKey }) {
            token
          }
        }
        """
        variables = {"apiKey": auth["APIKey"]}
    else:
        mutation = """
        mutation ObtainToken($input: ObtainJSONWebTokenInput!) {
          obtainKrakenToken(input: $input) {
            token
          }
        }
        """
        variables = {"input": auth}

    data = _execute(mutation, variables)
    token = data.get("obtainKrakenToken", {}).get("token")
    if not token:
        raise FetchError("Octopus authentication failed: no token returned")
    return token


CONSUMPTION_QUERY = """
query GetConsumption($accountNumber: String!, $from: DateTime, $to: DateTime) {
  account(accountNumber: $accountNumber) {
    properties {
      electricitySupplyPoints {
        halfHourlyReadings(fromDatetime: $from, toDatetime: $to) {
          startAt
          endAt
          value
          costEstimate
        }
      }
    }
  }
}
"""


def fetch_usage(settings: Settings, window: MonthWindow) -> OctopusUsage:
    token = authenticate(settings.octopus_auth)
    variables = {
        "accountNumber": settings.octopus_account,
        "from": window.start.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "to": window.end.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    data = _execute(CONSUMPTION_QUERY, variables, token=token)
    account = data.get("account")
    if not account:
        raise FetchError(f"Octopus account {settings.octopus_account} not found")

    readings = []
    for prop in account.get("properties", []):
        for esp in prop.get("electricitySupplyPoints", []):
            readings.extend(esp.get("halfHourlyReadings", []))

    total_kwh = sum(float(r.get("value") or 0.0) for r in readings)
    estimates = [float(r["costEstimate"]) for r in readings if r.get("costEstimate") is not None]
    cost_estimate_sum = sum(estimates) if estimates else None

    # Simple Octopus tariff: flat rate per kWh + surcharge, ¥0 base fee
    calculated_bill = int(round(total_kwh * settings.octopus_day_rate))

    return OctopusUsage(
        imported_kwh=round(total_kwh, 1),
        calculated_bill_jpy=calculated_bill,
        intervals_count=len(readings),
        cost_estimate_jpy=cost_estimate_sum,
    )
