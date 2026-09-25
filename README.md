# mcp-bts

U.S. Bureau of Transportation Statistics (BTS) — data.bts.gov open-data portal (Socrata platform).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1683+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_datasets` | Search datasets published on the U.S. Bureau of Transportation Statistics open-data portal (data.bts.gov). Returns each dataset's Socrata 4x4 id (e.g. "crem-w557"), name, and description. Use the id with dataset_columns and query_dataset. BTS covers aviation (passenger counts, on-time performance, air fares, airline financials), freight movement, transit ridership, border crossings, and transportation safety. Example queries: "aviation", "border crossing", "transit", "freight". |
| `dataset_columns` | List the columns of a data.bts.gov dataset: field name (used in SoQL $select/$where), human label, and data type (number, text, calendar_date, etc.). Call this before query_dataset so you know which fields exist. datasetId is the Socrata 4x4 code from search_datasets. |
| `query_dataset` | Query rows from a data.bts.gov dataset using SoQL. datasetId is the Socrata 4x4 code from search_datasets. SoQL clauses: $select (columns / aggregates like "count(*)" or "avg(air_fare)"), $where (SQL-like filter, e.g. "date > '2024-01-01' AND state='TX'"), $order ("date desc"), $group, $q (full-text across the row). Use dataset_columns first to learn field names. Returns an array of row objects keyed by field name. Default $limit is 50 (Socrata max per page is 50000). |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "bts": {
      "url": "https://gateway.pipeworx.io/bts/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/bts/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1683+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/bts_search_datasets \
  -H 'Content-Type: application/json' \
  -d '{"q":"aviation"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/bts_search_datasets`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "bts": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-bts"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-bts
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Bts data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
