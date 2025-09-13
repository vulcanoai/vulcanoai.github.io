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

def patch_js_build_put_generic(code: str) -> str:
    # Replace the generic merge with a normalized reader for body/data and sha
    new = (
        "// BUILD_PUT_GENERIC — merge meta + sha from both inputs into PUT body\n"
        "const all = $input.all();\n"
        "const meta = all.find(i => i.json && i.json.base && i.json.path);\n"
        "if (!meta) return [];\n"
        "function respOf(it){ const j = it && it.json; if(!j) return {}; if(j.body && typeof j.body==='object') return j.body; if(j.data && typeof j.data==='object') return j.data; return j; }\n"
        "const shaItem = all.find(i => { const r = respOf(i); return r && typeof r.sha === 'string'; });\n"
        "const r = shaItem ? respOf(shaItem) : {};\n"
        "const { base, branch, path, content, message } = meta.json;\n"
        "const body = { message, content, branch };\n"
        "if (typeof r.sha === 'string') body.sha = r.sha;\n"
        "return [{ json: { url: `${base}/${path}`, body } }];\n"
    )
    # Only replace if it looks like the old generic snippet
    if "BUILD_PUT_GENERIC" in code:
        return new
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
        elif name in ('BUILD_PUT_BY_TOPIC','BUILD_PUT_BY_COUNTRY','BUILD_PUT_CATALOG') and 'jsCode' in p:
            p['jsCode'] = patch_js_build_put_generic(p['jsCode'])

    # Ensure Merge nodes for topic/country/catalog to reliably combine meta + GET
    def add_merge_if_missing(name, position):
        if any(n.get('name') == name for n in wf.get('nodes', [])):
            return
        wf['nodes'].append({
            'parameters': { 'mode': 'mergeByPosition', 'options': {} },
            'id': name + '-id',
            'name': name,
            'type': 'n8n-nodes-base.merge',
            'typeVersion': 2,
            'position': position,
        })

    add_merge_if_missing('BY_TOPIC_SHA_MERGE', [-6992, -928])
    add_merge_if_missing('BY_COUNTRY_SHA_MERGE', [-6992, -800])
    add_merge_if_missing('CATALOG_SHA_MERGE', [-6992, -656])

    # Rewire connections: route GET + META into MERGE, then into BUILD_PUT_*
    con = wf.setdefault('connections', {})

    # Topic
    if 'GITHUB_GET_BY_TOPIC_SHA' in con:
        con['GITHUB_GET_BY_TOPIC_SHA']['main'] = [[{'node':'BY_TOPIC_SHA_MERGE','type':'main','index':1}]]
    # Replace BUILD_MASTER_INDEX path to BUILD_PUT_BY_TOPIC -> BY_TOPIC_SHA_MERGE
    bmi = con.get('BUILD_MASTER_INDEX')
    if bmi and 'main' in bmi and bmi['main'] and bmi['main'][0]:
        for entry in bmi['main'][0]:
            if entry.get('node') == 'BUILD_PUT_BY_TOPIC':
                entry['node'] = 'BY_TOPIC_SHA_MERGE'
    # Connect MERGE to builder
    con['BY_TOPIC_SHA_MERGE'] = { 'main': [[{'node':'BUILD_PUT_BY_TOPIC','type':'main','index':0}]] }

    # Country
    if 'GITHUB_GET_BY_COUNTRY_SHA' in con:
        con['GITHUB_GET_BY_COUNTRY_SHA']['main'] = [[{'node':'BY_COUNTRY_SHA_MERGE','type':'main','index':1}]]
    if bmi and 'main' in bmi and bmi['main'] and bmi['main'][0]:
        for entry in bmi['main'][0]:
            if entry.get('node') == 'BUILD_PUT_BY_COUNTRY':
                entry['node'] = 'BY_COUNTRY_SHA_MERGE'
    con['BY_COUNTRY_SHA_MERGE'] = { 'main': [[{'node':'BUILD_PUT_BY_COUNTRY','type':'main','index':0}]] }

    # Catalog
    if 'GITHUB_GET_CATALOG_SHA' in con:
        con['GITHUB_GET_CATALOG_SHA']['main'] = [[{'node':'CATALOG_SHA_MERGE','type':'main','index':1}]]
    bc = con.get('BUILD_CATALOG')
    if bc and 'main' in bc and bc['main'] and bc['main'][0]:
        for entry in bc['main'][0]:
            if entry.get('node') == 'BUILD_PUT_CATALOG':
                entry['node'] = 'CATALOG_SHA_MERGE'
    con['CATALOG_SHA_MERGE'] = { 'main': [[{'node':'BUILD_PUT_CATALOG','type':'main','index':0}]] }

    with open(DST, 'w') as f:
        json.dump(wf, f, indent=2)

    print(f"Wrote {DST}")

if __name__ == '__main__':
    main()
