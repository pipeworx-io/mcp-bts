# mcp-bts

U.S. Bureau of Transportation Statistics (BTS) — data.bts.gov open-data portal (Socrata platform).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Bts data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
