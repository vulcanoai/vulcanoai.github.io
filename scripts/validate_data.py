#!/usr/bin/env python3
"""
validate_data.py — Sanity checks for the open data layout.

Validates:
- feed-latest.json and feed-YYYY-MM-DD.json (if present)
- data/runs/<ISO>.json files (minimal shape)
- data/entries/YYYY-MM-DD/ (index.json exists; filenames match slug-hash; article JSON has required fields)
- data/index/*.json presence (by-topic/by-country optional; catalog optional but recommended)

Exits non‑zero if critical inconsistencies are found.
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT/"data"

RE_DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")
RE_ENTRY = re.compile(r"^[a-z0-9-]+-[0-9a-f]{8}\.json$")
RE_RUN = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$")

def read_json(p: Path):
    try:
        with p.open('r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise AssertionError(f"Invalid JSON: {p} — {e}")

def assert_feed(p: Path):
    if not p.exists():
        return
    j = read_json(p)
    assert isinstance(j, dict), f"{p}: root must be object"
    assert 'articles' in j and isinstance(j['articles'], list), f"{p}: missing articles[]"

def assert_run(p: Path):
    assert RE_RUN.match(p.name), f"Run filename must be ISO-like: {p.name}"
    j = read_json(p)
    assert 'articles' in j and isinstance(j['articles'], list), f"{p}: missing articles[]"

def assert_entry(p: Path):
    assert RE_ENTRY.match(p.name), f"Entry filename should be slug-hash.json: {p.name}"
    j = read_json(p)
    for k in ['title','url','country','topics','language','published_at']:
        assert k in j, f"{p}: missing field '{k}'"
    assert isinstance(j['topics'], list), f"{p}: topics must be []"

def assert_day(day_dir: Path):
    assert RE_DAY.match(day_dir.name), f"Bad day folder: {day_dir}"
    idx = day_dir/'index.json'
    assert idx.exists(), f"Missing daily index: {idx}"
    j = read_json(idx)
    for k in ['date','count','topics','countries','generated_at']:
        assert k in j, f"{idx}: missing '{k}'"
    for f in day_dir.glob('*.json'):
        if f.name == 'index.json':
            continue
        assert_entry(f)

def main():
    errors = []
    try:
        assert_feed(DATA/'feed-latest.json')
    except AssertionError as e:
        errors.append(str(e))
    # Validate dated feeds (only if present)
    for f in DATA.glob('feed-*.json'):
        if f.name == 'feed-latest.json':
            continue
        try:
            assert_feed(f)
        except AssertionError as e:
            errors.append(str(e))
    # Runs
    runs_dir = DATA/'runs'
    if runs_dir.exists():
        for f in runs_dir.glob('*.json'):
            try:
                assert_run(f)
            except AssertionError as e:
                errors.append(str(e))
    # Entries by day
    entries = DATA/'entries'
    if entries.exists():
        for day in entries.iterdir():
            if not day.is_dir():
                continue
            try:
                assert_day(day)
            except AssertionError as e:
                errors.append(str(e))
    # Index folder exists (optional files)
    (DATA/'index').mkdir(exist_ok=True)
    if errors:
        print("Validation failed:\n- " + "\n- ".join(errors))
        sys.exit(1)
    print("Data layout OK.")

if __name__ == '__main__':
    main()

