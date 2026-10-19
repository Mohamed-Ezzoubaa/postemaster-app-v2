import { Database } from '@/src/db/index.ts';

/**
 * Next.js App Router: Sync Logs
 * Endpoint: GET /api/logs
 */
export async function GET() {
  try {
    const logs = await Database.getSyncLogs();
    return Response.json(logs, { status: 200 });
  } catch (err: any) {
    return Response.json({ error: 'Failed to fetch sync logs', message: err.message }, { status: 500 });
  }
}
