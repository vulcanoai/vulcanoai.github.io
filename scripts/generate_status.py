#!/usr/bin/env python3
"""
Generates a lightweight freshness status at data/index/status.json

Fields:
- last_run_iso: newest file in data/runs/
- last_feed_update: mtime of data/feed-latest.json (ISO)
- feed_count: number of articles in feed-latest.json
- ok: True if last_run within 12h

Usage:
  python3 scripts/generate_status.py
"""
import json, os, glob, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNS = ROOT / 'data' / 'runs'
FEED = ROOT / 'data' / 'feed-latest.json'
OUT  = ROOT / 'data' / 'index' / 'status.json'

def newest_run_iso():
    files = glob.glob(str(RUNS / '*.json'))
    if not files:
        return None
    latest = max(files, key=lambda p: os.path.getmtime(p))
    # best effort: read timestamp field or infer from name
    try:
        with open(latest,'r') as f:
            j = json.load(f)
            return j.get('timestamp')
    except Exception:
        return None

def iso_from_mtime(path: Path):
    if not path.exists():
        return None
    ts = datetime.datetime.fromtimestamp(path.stat().st_mtime, tz=datetime.timezone.utc)
    return ts.isoformat()

def feed_count():
    if not FEED.exists():
        return 0
    try:
        with open(FEED,'r') as f:
            j = json.load(f)
            arr = j.get('articles') or []
            return len(arr) if isinstance(arr, list) else 0
    except Exception:
        return 0

def main():
    last_run = newest_run_iso()
    last_feed = iso_from_mtime(FEED)
    cnt = feed_count()
    now = datetime.datetime.now(datetime.timezone.utc)
    ok = False
    if last_run:
        try:
            dt = datetime.datetime.fromisoformat(last_run.replace('Z','+00:00'))
            ok = (now - dt) <= datetime.timedelta(hours=12)
        except Exception:
            ok = False
    payload = {
        'version': 'v1.0',
        'generated_at': now.isoformat(),
        'last_run_iso': last_run,
        'last_feed_update': last_feed,
        'feed_count': cnt,
        'ok': bool(ok),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, 'w') as f:
        json.dump(payload, f, indent=2)
    print(f"Wrote {OUT}")

if __name__ == '__main__':
    main()

