# Google Docs → GitHub Capsule Sync (n8n)

This workflow keeps the website's `data/capsules.json` in sync with a Google Doc that you update manually. Every time the document changes (polled on a schedule), n8n exports the text, parses capsules, merges them with the existing dataset in your GitHub repo, and commits the update. The site already reads from `data/capsules.json`, so new capsules appear as chat prompts automatically.

> **Reminder:** `data/capsules.json` is ignored locally (`.gitignore`). The canonical copy lives in GitHub and is maintained by this workflow.

## Google Doc format

Write your capsules in plain text, separating each capsule with a line that contains only three dashes (`---`). Use the following structure inside each block:

```
# Capsule: IA para ganar más tiempo libre
Summary: Cómo equipos en LATAM están usando automatización para dedicar más tiempo a actividades offline.
Body:
- En Ciudad de México, la fintech TiempoCero liberó 14 horas semanales...
- El equipo reporta que los viernes ahora se dedican a sesiones al aire libre...
Tags: Productividad, México
Sources:
- TiempoCero comparte resultados | https://example.org/tiempocero-ia
Created_At: 2025-09-14T20:10:00Z
---
# Capsule: Ciudades caminables impulsadas por IA
Summary: Modelos abiertos ayudan a planear barrios con más espacios peatonales en Sudamérica.
Body:
- Santiago integra sensores comunitarios y modelos de visión...
- Organizaciones barriales en Medellín usan asistentes locales...
Tags: Ciudades, Chile, Colombia
Sources:
- Plan piloto Santiago | https://example.org/scl-walkable
- Laboratorio cívico Medellín | https://example.org/medellin-lab
Created_At: 2025-09-12T18:45:00Z
```

Fields are case-insensitive. Body lines can be plain paragraphs or list items starting with `- ` or `* `. Sources accept either `Title | URL` or `Title — URL`; the fallback is just a URL.

## Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `CAPSULE_DOC_ID` | Google Doc ID (copy from doc URL). | — (required) |
| `GH_CAPSULE_OWNER` | GitHub owner/org. | `vulcanoai` |
| `GH_CAPSULE_REPO` | Repository name. | `vulcanoai.github.io` |
| `GH_CAPSULE_BRANCH` | Branch to commit into. | `main` |
| `GH_CAPSULE_PATH` | Path to capsules file. | `data/capsules.json` |
| `GH_CAPSULE_MESSAGE` | Commit message. | `chore(capsules): sync from Google Doc` |

You’ll also need:
- A Google OAuth credential with Drive & Docs scopes (the same one used elsewhere works fine).
- A GitHub API credential with `repo` scope.

## Workflow JSON

Import this JSON into n8n (or copy/paste into the "Code" modal when creating a new workflow). Update credential IDs after import.

```json
{
  "name": "CAPSULES — Google Doc Sync",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "value": 15
            }
          ]
        }
      },
      "id": "schedule-capsules",
      "name": "SCHEDULE",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [
        -1800,
        0
      ]
    },
    {
      "parameters": {
        "documentId": "={{$env.CAPSULE_DOC_ID}}",
        "operation": "export",
        "binaryProperty": "document",
        "options": {
          "exportType": "plainText"
        }
      },
      "id": "export-google-doc",
      "name": "EXPORT_DOC",
      "type": "n8n-nodes-base.googleDocs",
      "typeVersion": 1,
      "position": [
        -1560,
        0
      ],
      "credentials": {
        "googleDocsOAuth2Api": {
          "id": "YOUR_GOOGLE_DOCS_CREDENTIAL_ID",
          "name": "Google Docs OAuth"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "const buffer = await this.helpers.getBinaryDataBuffer(0, 'document');\nconst text = buffer.toString('utf8');\nconst sections = text.split(/^-{3,}\s*$/gm).map(section => section.trim()).filter(Boolean);\n\nfunction slugify(value){\n  return String(value || '')\n    .toLowerCase()\n    .normalize('NFD')\n    .replace(/[^a-z0-9\s-]/g, ' ')\n    .replace(/\s+/g, '-')\n    .replace(/-+/g, '-')\n    .replace(/^-|-$/g, '')\n    .slice(0, 80) || `capsule-${Date.now()}`;\n}\n\nfunction parseSources(lines, startIndex){\n  const out = [];\n  let i = startIndex;\n  for (; i < lines.length; i++) {\n    const raw = lines[i].trim();\n    if (!raw) continue;\n    if (/^(tags?|body|summary|created|updated|id|title|#)/i.test(raw)) break;\n    const cleaned = raw.replace(/^[-*]\s*/, '').trim();\n    if (!cleaned) continue;\n    let title = cleaned;\n    let url = '';\n    const split = cleaned.split(/\s*[|—-]\s*/);\n    if (split.length >= 2 && /^https?:\/\//i.test(split[split.length - 1])) {\n      url = split.pop().trim();\n      title = split.join(' | ').trim();\n    } else {\n      const match = cleaned.match(/https?:\/\/\S+/);\n      if (match) {\n        url = match[0];\n        title = cleaned.replace(url, '').trim();\n      }\n    }\n    out.push({ title: title || url || 'Fuente', url });\n  }\n  return { sources: out, index: i };\n}\n\nfunction parseBody(lines, startIndex){\n  const body = [];\n  let i = startIndex;\n  for (; i < lines.length; i++) {\n    const raw = lines[i].trim();\n    if (!raw) continue;\n    if (/^(tags?|sources?|summary|created|updated|id|title|#)/i.test(raw)) break;\n    const cleaned = raw.replace(/^[-*]\s*/, '').trim();\n    if (cleaned) body.push(cleaned);\n  }\n  return { body, index: i };\n}\n\nconst capsules = [];\nconst now = new Date().toISOString();\n\nsections.forEach(section => {\n  const lines = section.split(/\r?\n/).map(line => line.trim()).filter(Boolean);\n  if (!lines.length) return;\n  const capsule = { body: [], tags: [], sources: [], created_at: now, updated_at: now };\n  for (let i = 0; i < lines.length; i++) {\n    const line = lines[i];\n    if (/^#\s*capsule[:\-]?/i.test(line)) {\n      capsule.title = line.replace(/^#\s*capsule[:\-]?/i, '').trim();\n      continue;\n    }\n    if (/^title[:\-]?/i.test(line)) {\n      capsule.title = line.replace(/^title[:\-]?/i, '').trim();\n      continue;\n    }\n    if (/^id[:\-]?/i.test(line)) {\n      capsule.id = line.replace(/^id[:\-]?/i, '').trim();\n      continue;\n    }\n    if (/^summary[:\-]?/i.test(line)) {\n      capsule.summary = line.replace(/^summary[:\-]?/i, '').trim();\n      continue;\n    }\n    if (/^body[:\-]?/i.test(line)) {\n      const { body, index } = parseBody(lines, i + 1);\n      capsule.body = body;\n      i = index - 1;\n      continue;\n    }\n    if (/^tags?[:\-]?/i.test(line)) {\n      capsule.tags = line.replace(/^tags?[:\-]?/i, '')\n        .split(/[,;]+/)\n        .map(tag => tag.trim())\n        .filter(Boolean);\n      continue;\n    }\n    if (/^sources?[:\-]?/i.test(line)) {\n      const { sources, index } = parseSources(lines, i + 1);\n      capsule.sources = sources;\n      i = index - 1;\n      continue;\n    }\n    if (/^created[_\s-]?at[:\-]?/i.test(line)) {\n      capsule.created_at = line.replace(/^created[_\s-]?at[:\-]?/i, '').trim();\n      continue;\n    }\n    if (/^updated[_\s-]?at[:\-]?/i.test(line)) {\n      capsule.updated_at = line.replace(/^updated[_\s-]?at[:\-]?/i, '').trim();\n      continue;\n    }\n  }\n  if (!capsule.title) return;\n  capsule.id = capsule.id || slugify(capsule.title);\n  capsule.summary = capsule.summary || capsule.body[0] || '';\n  if (!capsule.body.length && capsule.summary) {
    capsule.body = [capsule.summary];
  }
  capsules.push(capsule);
});

return [{ json: { capsules } }];"
      },
      "id": "parse-capsules",
      "name": "PARSE_CAPSULES",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -1340,
        0
      ]
    },
    {
      "parameters": {
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "githubApi",
        "allowUnauthorizedCerts": false,
        "options": {
          "response": "json"
        },
        "url": "={{`https://api.github.com/repos/${$env.GH_CAPSULE_OWNER || 'vulcanoai'}/${$env.GH_CAPSULE_REPO || 'vulcanoai.github.io'}/contents/${$env.GH_CAPSULE_PATH || 'data/capsules.json'}?ref=${$env.GH_CAPSULE_BRANCH || 'main'}`}}",
        "method": "GET"
      },
      "id": "github-get-capsules",
      "name": "FETCH_EXISTING",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [
        -1100,
        0
      ],
      "credentials": {
        "githubApi": {
          "id": "YOUR_GITHUB_CREDENTIAL_ID",
          "name": "GitHub API"
        }
      },
      "alwaysOutputData": true,
      "continueOnFail": true
    },
    {
      "parameters": {
        "jsCode": "const incoming = $items('PARSE_CAPSULES', 0, 0)?.json?.capsules || [];\nconst githubItem = $items('FETCH_EXISTING', 0, 0)?.json || {};\nconst payload = { version: 'v1.0', generated_at: new Date().toISOString(), capsules: [] };\nlet existingCapsules = [];\nlet sha = null;\nif (githubItem.body && typeof githubItem.body === 'object' && githubItem.body.content) {\n  const decoded = Buffer.from(githubItem.body.content, 'base64').toString('utf8');\n  try {\n    const parsed = JSON.parse(decoded);\n    if (Array.isArray(parsed?.capsules)) existingCapsules = parsed.capsules;\n    payload.version = parsed.version || payload.version;\n  } catch (err) {\n    console.warn('MERGE_CAPSULES: no se pudo parsear el archivo existente', err.message);\n  }\n  if (githubItem.body.sha) sha = githubItem.body.sha;\n} else if (githubItem.statusCode === 404) {\n  existingCapsules = [];\n} else if (githubItem.content && githubItem.encoding === 'base64') {\n  const decoded = Buffer.from(githubItem.content, 'base64').toString('utf8');\n  try {\n    const parsed = JSON.parse(decoded);\n    if (Array.isArray(parsed?.capsules)) existingCapsules = parsed.capsules;\n    payload.version = parsed.version || payload.version;\n  } catch (err) {\n    console.warn('MERGE_CAPSULES: contenido inesperado', err.message);\n  }\n  sha = githubItem.sha || null;\n}\n\nfunction indexCapsules(list) {\n  const map = new Map();\n  list.forEach(item => {\n    const id = item.id || item.slug || '';\n    if (!id) return;\n    map.set(id, { ...item });\n  });\n  return map;\n}\n\nfunction normaliseCapsule(capsule) {\n  const now = new Date().toISOString();\n  const clone = { ...capsule };\n  clone.id = clone.id || clone.slug;\n  if (!clone.id && clone.title) {\n    clone.id = clone.title.toLowerCase().normalize('NFD').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);\n  }\n  clone.body = Array.isArray(clone.body) ? clone.body.filter(Boolean) : [String(clone.body || '').trim()].filter(Boolean);\n  clone.tags = Array.isArray(clone.tags) ? clone.tags.filter(Boolean) : [];\n  clone.sources = Array.isArray(clone.sources) ? clone.sources.filter(Boolean) : [];\n  clone.summary = clone.summary || clone.body[0] || '';\n  clone.created_at = clone.created_at || clone.createdAt || now;\n  clone.updated_at = now;\n  return clone;\n}\n\nconst existingMap = indexCapsules(existingCapsules.map(normaliseCapsule));\nconst added = [];\nconst updated = [];\n\nincoming.map(normaliseCapsule).forEach(capsule => {\n  const current = existingMap.get(capsule.id);\n  if (!current) {\n    existingMap.set(capsule.id, capsule);\n    added.push(capsule.id);\n  } else {\n    const merged = { ...current, ...capsule };\n    merged.created_at = current.created_at || capsule.created_at;\n    merged.updated_at = capsule.updated_at;\n    const before = JSON.stringify(current);\n    const after = JSON.stringify(merged);\n    if (before !== after) updated.push(capsule.id);\n    existingMap.set(capsule.id, merged);\n  }\n});\n\nconst mergedList = Array.from(existingMap.values()).sort((a, b) => {\n  const aDate = Date.parse(a.created_at || a.updated_at || 0);\n  const bDate = Date.parse(b.created_at || b.updated_at || 0);\n  return bDate - aDate;\n});\n\npayload.capsules = mergedList;\nconst previousString = JSON.stringify(existingCapsules);\nconst nextString = JSON.stringify(mergedList);\nconst skip = previousString === nextString;\n\nreturn [{ json: { payload, sha, skip, summary: { added, updated, total: mergedList.length } } }];"
      },
      "id": "merge-capsules",
      "name": "MERGE_CAPSULES",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -860,
        0
      ]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json[\"skip\"]}}",
              "operation": "isEqual",
              "value2": true
            }
          ]
        }
      },
      "id": "if-changes",
      "name": "CHANGED?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [
        -620,
        0
      ]
    },
    {
      "parameters": {
        "jsCode": "if ($json.skip) {\n  return [{ json: { skip: true } }];\n}\nconst payload = $json.payload;\nconst sha = $json.sha || null;\nconst owner = $env.GH_CAPSULE_OWNER || 'vulcanoai';\nconst repo = $env.GH_CAPSULE_REPO || 'vulcanoai.github.io';\nconst branch = $env.GH_CAPSULE_BRANCH || 'main';\nconst path = $env.GH_CAPSULE_PATH || 'data/capsules.json';\nconst message = $env.GH_CAPSULE_MESSAGE || 'chore(capsules): sync from Google Doc';\nconst content = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');\nconst body = { message, content, branch };\nif (sha) body.sha = sha;\nreturn [{ json: { url: `https://api.github.com/repos/${owner}/${repo}/contents/${path}`, body, summary: $json.summary } }];"
      },
      "id": "build-put",
      "name": "BUILD_PUT",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -380,
        -140
      ]
    },
    {
      "parameters": {
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "githubApi",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{$json.body}}",
        "url": "={{$json.url}}",
        "method": "PUT"
      },
      "id": "github-put-capsules",
      "name": "PUSH_TO_GITHUB",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [
        -140,
        -140
      ],
      "credentials": {
        "githubApi": {
          "id": "YOUR_GITHUB_CREDENTIAL_ID",
          "name": "GitHub API"
        }
      }
    }
  ],
  "connections": {
    "SCHEDULE": {
      "main": [
        [
          {
            "node": "EXPORT_DOC",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "EXPORT_DOC": {
      "main": [
        [
          {
            "node": "PARSE_CAPSULES",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "PARSE_CAPSULES": {
      "main": [
        [
          {
            "node": "FETCH_EXISTING",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "FETCH_EXISTING": {
      "main": [
        [
          {
            "node": "MERGE_CAPSULES",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "MERGE_CAPSULES": {
      "main": [
        [
          {
            "node": "CHANGED?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "CHANGED?": {
      "main": [
        [
          {
            "node": "BUILD_PUT",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "BUILD_PUT": {
      "main": [
        [
          {
            "node": "PUSH_TO_GITHUB",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  }
}
```

## Usage notes

1. Import the workflow, fix the credential IDs (`YOUR_GOOGLE_DOCS_CREDENTIAL_ID`, `YOUR_GITHUB_CREDENTIAL_ID`), and set the required environment variable `CAPSULE_DOC_ID` in n8n.
2. Adjust the schedule trigger interval to match how frequently you want to poll the document.
3. Keep only one placeholder capsule in the Google Doc if you want a dummy prompt; subsequent runs append real capsules without touching the dummy entry.
4. After the workflow commits to GitHub, GitHub Pages (or your deploy pipeline) republishes automatically, so reloading the site will display the new capsule title as a suggested prompt.

Tip: run the workflow once manually after import to seed the dataset.
