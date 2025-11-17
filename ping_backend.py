"""
Simple script to keep the Render backend awake by pinging it every 14 minutes.

Usage:
    python ping_backend.py
"""

from __future__ import annotations

import os
import sys
import time
from typing import Final

import requests

PING_INTERVAL_SECONDS: Final[int] = 14 * 60
DEFAULT_BACKEND_URL: Final[str] = "https://crm-o52e.onrender.com"


def ping_backend(url: str) -> None:
    """Send a GET request to the backend and log the outcome."""
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        print(f"[OK] {time.strftime('%Y-%m-%d %H:%M:%S')} - {url} responded {response.status_code}")
    except Exception as exc:  # noqa: BLE001 - log any failure
        print(f"[ERR] {time.strftime('%Y-%m-%d %H:%M:%S')} - Failed to reach {url}: {exc}", file=sys.stderr)


def main() -> None:
    backend_url = os.getenv("PING_BACKEND_URL", DEFAULT_BACKEND_URL)
    print(f"Starting Render ping loop -> {backend_url} every {PING_INTERVAL_SECONDS // 60} minutes.")

    while True:
        ping_backend(backend_url)
        time.sleep(PING_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()

