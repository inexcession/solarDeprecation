#!/usr/bin/env python3
"""Thin wrapper for running the fetcher CLI."""

import sys
from fetcher.__main__ import main

if __name__ == "__main__":
    sys.exit(main())
