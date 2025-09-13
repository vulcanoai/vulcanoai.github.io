#!/usr/bin/env python3
"""
Builds n8n/workflows/DEBUG007-fixed.json from DEBUG007.json, ensuring:
- GET -> PUT robustness (sha/content normalization for wrapped responses)
- Feed builders guard against empty overwrites
- GET nodes configured with ignoreResponseCode + alwaysOutputData + continueOnFail
- Merge nodes exist and wiring is correct for by-topic/by-country/catalog

Usage:
  python3 scripts/build_debug007_fixed.py
"""
import json

SRC = 'n8n/workflows/DEBUG007.json'
DST = 'n8n/workflows/DEBUG007-fixed.json'

def ensure_get_options(node):
    p = node.setdefault('parameters', {})
    opts = p.setdefault('options', {})
    opts['ignoreResponseCode'] = True
    node['alwaysOutputData'] = True
    node['continueOnFail'] = True

def patch_build_put_latest(code: str) -> str:
    # Normalize sha/content and add empty guards if missing
    if 'From immediate upstream (GITHUB_GET_LATEST_SHA)' in code and 'existingContentB64' in code and 'resp =' not in code:
        code = code.replace(
            '// From immediate upstream (GITHUB_GET_LATEST_SHA)',
            (
                '// From immediate upstream (GITHUB_GET_LATEST_SHA)\n'
                "const resp = ($json && typeof $json === 'object')\n"
                "  ? ($json.body && typeof $json.body === 'object' ? $json.body\n"
                "     : ($json.data && typeof $json.data === 'object' ? $json.data : $json))\n"
                "  : {};\n"
                "const sha = typeof resp.sha === 'string' ? resp.sha : undefined;\n"
                "const existingContentB64 = typeof resp.content === 'string' ? resp.content : undefined;\n"
            )
        )
    if 'return [];' not in code and 'oldItems' in code and 'newItems' in code:
        code = code.replace(
            'const oldItems = existingContentB64 ? decodeContent(existingContentB64) : [];\n',
            'const oldItems = existingContentB64 ? decodeContent(existingContentB64) : [];\n'
            'if ((oldItems?.length||0)===0 && (newItems?.length||0)===0) { return []; }\n'
        )
    return code

def patch_build_put_snapshot(code: str) -> str:
    if 'From immediate upstream (GITHUB_GET_SNAPSHOT_SHA)' in code and 'existingContentB64' in code and 'resp =' not in code:
        code = code.replace(
            '// From immediate upstream (GITHUB_GET_SNAPSHOT_SHA)',
            (
                '// From immediate upstream (GITHUB_GET_SNAPSHOT_SHA)\n'
                "const resp = ($json && typeof $json === 'object')\n"
                "  ? ($json.body && typeof $json.body === 'object' ? $json.body\n"
                "     : ($json.data && typeof $json.data === 'object' ? $json.data : $json))\n"
                "  : {};\n"
                "const sha = typeof resp.sha === 'string' ? resp.sha : undefined;\n"
                "const existingContentB64 = typeof resp.content === 'string' ? resp.content : undefined;\n"
            )
        )
    if 'return [];' not in code and 'oldItems' in code and 'newItems' in code:
        code = code.replace(
            'const oldItems = existingContentB64 ? decodeContent(existingContentB64) : [];\n',
            'const oldItems = existingContentB64 ? decodeContent(existingContentB64) : [];\n'
            'if ((oldItems?.length||0)===0 && (newItems?.length||0)===0) { return []; }\n'
        )
    return code

def patch_build_put_entry(code: str) -> str:
    if '(typeof r.sha' not in code:
        code = code.replace(
            "const sha = (typeof $json.sha === 'string') ? $json.sha : undefined;",
            ("const r = ($json && typeof $json === 'object') ? ($json.body && typeof $json.body === 'object' ? $json.body : ($json.data && typeof $json.data === 'object' ? $json.data : $json)) : {};\n"
             "const sha = (typeof r.sha === 'string') ? r.sha : undefined;")
        )
    return code

def patch_build_put_generic(code: str) -> str:
    # Standardized generic merge used by topic/country/catalog
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
    return new

def ensure_merge_node(wf, name, position):
    if not any(n.get('name') == name for n in wf.get('nodes', [])):
        wf['nodes'].append({
            'parameters': {'mode':'mergeByPosition','options':{}},
            'id': name+'-id',
            'name': name,
            'type': 'n8n-nodes-base.merge',
            'typeVersion': 2,
            'position': position,
        })

def main():
    wf = json.load(open(SRC))

    # Patch nodes
    for node in wf.get('nodes', []):
        name = node.get('name')
        p = node.get('parameters', {})
        if name in (
            'GITHUB_GET_LATEST_SHA','GITHUB_GET_SNAPSHOT_SHA','GITHUB_GET_ENTRY_SHA',
            'GITHUB_GET_DAILY_INDEX_SHA','GITHUB_GET_BY_TOPIC_SHA','GITHUB_GET_BY_COUNTRY_SHA',
            'GITHUB_GET_CATALOG_SHA'
        ):
            ensure_get_options(node)
        if name == 'BUILD_PUT_LATEST' and 'jsCode' in p:
            p['jsCode'] = patch_build_put_latest(p['jsCode'])
        if name == 'BUILD_PUT_SNAPSHOT' and 'jsCode' in p:
            p['jsCode'] = patch_build_put_snapshot(p['jsCode'])
        if name == 'BUILD_PUT_ENTRY' and 'jsCode' in p:
            p['jsCode'] = patch_build_put_entry(p['jsCode'])
        if name in ('BUILD_PUT_BY_TOPIC','BUILD_PUT_BY_COUNTRY','BUILD_PUT_CATALOG') and 'jsCode' in p:
            p['jsCode'] = patch_build_put_generic(p['jsCode'])

    # Ensure merge nodes exist
    ensure_merge_node(wf,'BY_TOPIC_SHA_MERGE',[-6992,-928])
    ensure_merge_node(wf,'BY_COUNTRY_SHA_MERGE',[-6992,-800])
    ensure_merge_node(wf,'CATALOG_SHA_MERGE',[-6992,-656])

    # Wire connections through merges
    con = wf.setdefault('connections', {})
    # Topic
    if 'GITHUB_GET_BY_TOPIC_SHA' in con:
        con['GITHUB_GET_BY_TOPIC_SHA']['main'] = [[{'node':'BY_TOPIC_SHA_MERGE','type':'main','index':1}]]
    bmi = con.get('BUILD_MASTER_INDEX')
    if bmi and bmi.get('main') and bmi['main'][0]:
        for entry in bmi['main'][0]:
            if entry.get('node') == 'BUILD_PUT_BY_TOPIC':
                entry['node'] = 'BY_TOPIC_SHA_MERGE'
    con['BY_TOPIC_SHA_MERGE'] = {'main': [[{'node':'BUILD_PUT_BY_TOPIC','type':'main','index':0}]]}
    # Country
    if 'GITHUB_GET_BY_COUNTRY_SHA' in con:
        con['GITHUB_GET_BY_COUNTRY_SHA']['main'] = [[{'node':'BY_COUNTRY_SHA_MERGE','type':'main','index':1}]]
    if bmi and bmi.get('main') and bmi['main'][0]:
        for entry in bmi['main'][0]:
            if entry.get('node') == 'BUILD_PUT_BY_COUNTRY':
                entry['node'] = 'BY_COUNTRY_SHA_MERGE'
    con['BY_COUNTRY_SHA_MERGE'] = {'main': [[{'node':'BUILD_PUT_BY_COUNTRY','type':'main','index':0}]]}
    # Catalog
    if 'GITHUB_GET_CATALOG_SHA' in con:
        con['GITHUB_GET_CATALOG_SHA']['main'] = [[{'node':'CATALOG_SHA_MERGE','type':'main','index':1}]]
    bc = con.get('BUILD_CATALOG')
    if bc and bc.get('main') and bc['main'][0]:
        for entry in bc['main'][0]:
            if entry.get('node') == 'BUILD_PUT_CATALOG':
                entry['node'] = 'CATALOG_SHA_MERGE'
    con['CATALOG_SHA_MERGE'] = {'main': [[{'node':'BUILD_PUT_CATALOG','type':'main','index':0}]]}

    json.dump(wf, open(DST,'w'), indent=2)
    print(f"Wrote {DST}")

if __name__ == '__main__':
    main()

