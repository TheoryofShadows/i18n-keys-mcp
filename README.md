# @mcpx-digital/i18n-keys

**MCP server for locale key comparison.**

Compare JSON/YAML locale files for missing or extra keys across languages, find empty translations, and list flattened keys. Supports nested objects via dot-path keys.

> **Local files only.** No translation APIs; no network calls.

## Install

```bash
npx -y @mcpx-digital/i18n-keys
```

## Cursor `mcp.json` example

```json
{
  "mcpServers": {
    "i18n-keys": {
      "command": "npx",
      "args": ["-y", "@mcpx-digital/i18n-keys"]
    }
  }
}
```

Local clone:

```json
{
  "mcpServers": {
    "i18n-keys": {
      "command": "node",
      "args": ["/absolute/path/to/i18n-keys-mcp/index.js"]
    }
  }
}
```

## Tools

| Tool | What it does |
|------|----------------|
| `compare_locales` | Missing/extra keys vs a base locale |
| `find_empty_translations` | Empty / null / whitespace values |
| `list_keys` | Flattened key list for one file |

## Example prompts

- “Compare `en.json`, `es.json`, and `fr.yaml` — what’s missing in Spanish?”
- “Find empty translations in `locales/*.json`”
- “List all keys in `en.json`”

## Development

```bash
git clone https://github.com/TheoryofShadows/i18n-keys-mcp.git
cd i18n-keys-mcp
npm install
npm test
```

## License

MIT
