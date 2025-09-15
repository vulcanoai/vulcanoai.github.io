#!/usr/bin/env python3
"""
Backfill feeds from data/runs/*.json into:
- data/feed-latest.json (merged, newest-first, cap 200)
- data/feed-YYYY-MM-DD.json (today, merged, cap 500)

Usage:
  python3 scripts/backfill_feeds_from_runs.py
"""
import json, glob, os, sys, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNS = ROOT / 'data' / 'runs'
OUT_LATEST = ROOT / 'data' / 'feed-latest.json'

def load_runs():
    items = []
    for fp in sorted(glob.glob(str(RUNS / '*.json'))):
        try:
            with open(fp,'r') as f:
                j = json.load(f)
                arr = j.get('articles') or []
                if isinstance(arr, list):
                    items.extend(arr)
        except Exception:
            pass
    return items

def date_str(dt):
    return dt.strftime('%Y-%m-%d')

def parse_iso(s):
    try:
        return datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
    except Exception:
        return None

def normalize(a):
    return {
        'id': a.get('id') or a.get('url') or a.get('title') or '',
        'title': a.get('title') or a.get('titulo') or '',
        'summary': a.get('summary') or a.get('resumen') or '',
        'url': a.get('url') or a.get('link') or '',
        'source': a.get('source') or a.get('fuente') or '',
        'source_url': a.get('source_url') or a.get('fuente_url') or '',
        'country': a.get('country') or a.get('pais') or 'Regional',
        'topics': a.get('topics') or a.get('temas') or [],
        'language': a.get('language') or a.get('idioma') or 'es',
        'published_at': a.get('published_at') or a.get('fecha') or datetime.datetime.utcnow().isoformat()+'Z',
        'relevance': a.get('relevance') or a.get('relevancia') or 0,
        'sentiment': a.get('sentiment') or a.get('sentimiento') or 'neutral',
        'author': a.get('author') or a.get('autor') or '',
        'curator': a.get('curator') or a.get('curador') or 'Codex 1',
    }

def dedupe_sort(items, cap=None):
    seen = set()
    out = []
    for it in items:
        u = it.get('url')
        if not u or u in seen:
            continue
        seen.add(u)
        out.append(it)
    out.sort(key=lambda x: (
        parse_iso(x.get('published_at') or '') or datetime.datetime.min.replace(tzinfo=datetime.timezone.utc),
        x.get('relevance') or 0,
    ), reverse=True)
    if cap:
        out = out[:cap]
    return out

def write_json(path: Path, payload: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

def main():
    all_articles = [normalize(a) for a in load_runs()]

    # Build latest (cap 200)
    latest = dedupe_sort(all_articles, cap=200)
    write_json(OUT_LATEST, { 'version':'v1.0', 'articles': latest })

    # Build today snapshot (cap 500)
    today = date_str(datetime.datetime.utcnow())
    todays = [a for a in all_articles if date_str(parse_iso(a['published_at']) or datetime.datetime.utcnow()) == today]
    todays = dedupe_sort(todays, cap=500)
    OUT_DAY = ROOT / 'data' / f'feed-{today}.json'
    write_json(OUT_DAY, { 'version':'v1.0', 'articles': todays })

    print(f"Backfill complete: latest={len(latest)} items, today={len(todays)} items")

if __name__ == '__main__':
    main()
