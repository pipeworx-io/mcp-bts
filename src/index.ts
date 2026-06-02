interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * U.S. Bureau of Transportation Statistics (BTS) — data.bts.gov open-data portal (Socrata platform).
 *
 * Keyless: Socrata serves moderate traffic without an app token, so no API key is required.
 * BTS publishes federal transportation data: aviation (passenger counts, on-time performance,
 * air fares, airline financials), freight movement, transit ridership, border crossings,
 * highway/transportation safety, and the Monthly Transportation Statistics time series.
 *
 * Workflow:
 *   1. search_datasets(q)         -> find datasets + their Socrata 4x4 ids (e.g. "crem-w557")
 *   2. dataset_columns(datasetId) -> learn field names/types to $select/$where on
 *   3. query_dataset(datasetId)   -> pull rows with SoQL ($select/$where/$order/$group/$q)
 */


const CATALOG = 'https://api.us.socrata.com/api/catalog/v1';
const PORTAL = 'https://data.bts.gov';
const UA = 'pipeworx-mcp-bts/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_datasets',
    description:
      'Search datasets published on the U.S. Bureau of Transportation Statistics open-data portal ' +
      '(data.bts.gov). Returns each dataset\'s Socrata 4x4 id (e.g. "crem-w557"), name, and description. ' +
      'Use the id with dataset_columns and query_dataset. BTS covers aviation (passenger counts, on-time ' +
      'performance, air fares, airline financials), freight movement, transit ridership, border crossings, ' +
      'and transportation safety. Example queries: "aviation", "border crossing", "transit", "freight".',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Full-text search query, e.g. "aviation" or "border crossing".' },
        limit: { type: 'number', description: 'Max datasets to return (default 20).' },
        offset: { type: 'number', description: 'Pagination offset (default 0).' },
      },
      required: ['q'],
    },
  },
  {
    name: 'dataset_columns',
    description:
      'List the columns of a data.bts.gov dataset: field name (used in SoQL $select/$where), human label, ' +
      'and data type (number, text, calendar_date, etc.). Call this before query_dataset so you know which ' +
      'fields exist. datasetId is the Socrata 4x4 code from search_datasets.',
    inputSchema: {
      type: 'object',
      properties: {
        datasetId: { type: 'string', description: 'Socrata 4x4 id, e.g. "crem-w557".' },
      },
      required: ['datasetId'],
    },
  },
  {
    name: 'query_dataset',
    description:
      'Query rows from a data.bts.gov dataset using SoQL. datasetId is the Socrata 4x4 code from ' +
      'search_datasets. SoQL clauses: $select (columns / aggregates like "count(*)" or "avg(air_fare)"), ' +
      '$where (SQL-like filter, e.g. "date > \'2024-01-01\' AND state=\'TX\'"), $order ("date desc"), ' +
      '$group, $q (full-text across the row). Use dataset_columns first to learn field names. Returns an ' +
      'array of row objects keyed by field name. Default $limit is 50 (Socrata max per page is 50000).',
    inputSchema: {
      type: 'object',
      properties: {
        datasetId: { type: 'string', description: 'Socrata 4x4 id, e.g. "crem-w557".' },
        $select: { type: 'string', description: 'Columns or aggregates, e.g. "date, safety_general_aviation".' },
        $where: { type: 'string', description: 'SQL-like filter, e.g. "date > \'2024-01-01\'".' },
        $order: { type: 'string', description: 'Sort, e.g. "date desc".' },
        $group: { type: 'string', description: 'Group-by field(s) for aggregation.' },
        $q: { type: 'string', description: 'Full-text search across the whole row.' },
        $limit: { type: 'number', description: 'Rows to return (default 50).' },
        $offset: { type: 'number', description: 'Pagination offset (default 0).' },
      },
      required: ['datasetId'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_datasets': {
      const q = reqStr(args, 'q', '"aviation"');
      const params = new URLSearchParams({ domains: 'data.bts.gov', q });
      params.set('limit', String(numOr(args.limit, 20)));
      params.set('offset', String(numOr(args.offset, 0)));
      return getJson(`${CATALOG}?${params.toString()}`);
    }
    case 'dataset_columns': {
      const id = reqStr(args, 'datasetId', '"crem-w557"');
      return getJson(`${PORTAL}/api/views/${encodeURIComponent(id)}.json`);
    }
    case 'query_dataset': {
      const id = reqStr(args, 'datasetId', '"crem-w557"');
      const params = new URLSearchParams();
      for (const clause of ['$select', '$where', '$order', '$group', '$q']) {
        const v = args[clause];
        if (typeof v === 'string' && v.trim()) params.set(clause, v);
      }
      params.set('$limit', String(numOr(args.$limit, 50)));
      params.set('$offset', String(numOr(args.$offset, 0)));
      return getJson(`${PORTAL}/resource/${encodeURIComponent(id)}.json?${params.toString()}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`BTS: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

function numOr(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
