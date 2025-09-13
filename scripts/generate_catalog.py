#!/usr/bin/env python3
"""
generate_catalog.py — Rebuilds data/index/catalog.json from folders under data/entries/.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENTRIES = ROOT/'data'/'entries'
OUT = ROOT/'data'/'index'/'catalog.json'

def main():
    days = []
    if ENTRIES.exists():
        for d in sorted([p.name for p in ENTRIES.iterdir() if p.is_dir()]):
            if len(d) == 10 and d[4] == '-' and d[7] == '-':
                days.append(d)
    payload = { 'version':'v1.0', 'generated_at': __import__('datetime').datetime.utcnow().isoformat()+'Z', 'days': days }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    print(f"Wrote {OUT} with {len(days)} days")

if __name__ == '__main__':
    main()

