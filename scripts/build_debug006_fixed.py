#!/usr/bin/env python3
"""
Builds n8n/workflows/DEBUG006-fixed.json from DEBUG006.json with robustness fixes:
- Normalize GitHub GET response shape (body/data wrapping) when reading sha/content
- Add empty-merge guards to avoid overwriting feeds with []
- Ensure GET nodes ignoreResponseCode + alwaysOutputData + continueOnFail

Usage:
  python3 scripts/build_debug006_fixed.py
"""
import json, os, sys, re

SRC = 'n8n/workflows/DEBUG006.json'
DST = 'n8n/workflows/DEBUG006-fixed.json'

def normalize_get_resp_snippet(prefix_comment):
    return (
        f"{prefix_comment}\n"
        "const resp = ($json && typeof $json === 'object')\n"
        "  ? ($json.body && typeof $json.body === 'object' ? $json.body\n"
        "     : ($json.data && typeof $json.data === 'object' ? $json.data : $json))\n"
        "  : {};\n"
        "const sha = typeof resp.sha === 'string' ? resp.sha : undefined;\n"
        "const existingContentB64 = typeof resp.content === 'string' ? resp.content : undefined;\n"
    )

def patch_js_build_put_latest(code: str) -> str:
    code = re.sub(r"// From immediate upstream \(GITHUB_GET_LATEST_SHA\)[\s\S]*?existingContentB64\s*=.*?;",
                  normalize_get_resp_snippet('// From immediate upstream (GITHUB_GET_LATEST_SHA)'),
                  code, count=1)
    # Add guard: if no old and no new, skip
    guard = (
        "\nif (!Array.isArray(oldItems) || oldItems.length===0) { /* ok */ }\n"
        "if (!Array.isArray(newItems) || newItems.length===0) { /* ok */ }\n"
        "if ((oldItems?.length||0)===0 && (newItems?.length||0)===0) { return []; }\n"
    )
    # Insert guard right after computing oldItems
    code = code.replace("const oldItems = existingContentB64 ? decodeContent(existingContentB64) : [];\n",
                        "const oldItems = existingContentB64 ? decodeContent(existingContentB64) : [];\n" + guard)
    return code

def patch_js_build_put_snapshot(code: str) -> str:
    code = re.sub(r"// From immediate upstream \(GITHUB_GET_SNAPSHOT_SHA\)[\s\S]*?existingContentB64\s*=.*?;",
                  normalize_get_resp_snippet('// From immediate upstream (GITHUB_GET_SNAPSHOT_SHA)'),
                  code, count=1)
    guard = (
        "\nif (!Array.isArray(oldItems) || oldItems.length===0) { /* ok */ }\n"
        "if (!Array.isArray(newItems) || newItems.length===0) { /* ok */ }\n"
        "if ((oldItems?.length||0)===0 && (newItems?.length||0)===0) { return []; }\n"
    )
    code = code.replace("const oldItems = existingContentB64 ? decodeContent(existingContentB64) : [];\n",
                        "const oldItems = existingContentB64 ? decodeContent(existingContentB64) : [];\n" + guard)
    return code

def patch_js_build_put_entry(code: str) -> str:
    # Replace sha line with normalized retrieval
    code = re.sub(r"const sha\s*=\s*\(typeof \$json\.sha === 'string'\) \? \$json\.sha : undefined;",
                  "const r = ($json && typeof $json === 'object') ? ($json.body && typeof $json.body === 'object' ? $json.body : ($json.data && typeof $json.data === 'object' ? $json.data : $json)) : {};\\nconst sha = (typeof r.sha === 'string') ? r.sha : undefined;",
                  code, count=1)
    return code

def ensure_get_options(node):
    p = node.get('parameters', {})
    opts = p.setdefault('options', {})
    opts['ignoreResponseCode'] = True
    node['alwaysOutputData'] = True
    node['continueOnFail'] = True

def main():
    with open(SRC, 'r') as f:
        wf = json.load(f)

    # Patch code nodes by name
    for node in wf.get('nodes', []):
        name = node.get('name')
        p = node.get('parameters', {})
        if name == 'BUILD_PUT_LATEST' and 'jsCode' in p:
            p['jsCode'] = patch_js_build_put_latest(p['jsCode'])
        elif name == 'BUILD_PUT_SNAPSHOT' and 'jsCode' in p:
            p['jsCode'] = patch_js_build_put_snapshot(p['jsCode'])
        elif name == 'BUILD_PUT_ENTRY' and 'jsCode' in p:
            p['jsCode'] = patch_js_build_put_entry(p['jsCode'])
        elif name in (
            'GITHUB_GET_LATEST_SHA','GITHUB_GET_SNAPSHOT_SHA','GITHUB_GET_ENTRY_SHA',
            'GITHUB_GET_DAILY_INDEX_SHA','GITHUB_GET_BY_TOPIC_SHA','GITHUB_GET_BY_COUNTRY_SHA',
            'GITHUB_GET_CATALOG_SHA'
        ):
            ensure_get_options(node)

    with open(DST, 'w') as f:
        json.dump(wf, f, indent=2)

    print(f"Wrote {DST}")

if __name__ == '__main__':
    main()

