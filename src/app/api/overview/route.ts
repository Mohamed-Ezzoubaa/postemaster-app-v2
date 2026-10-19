import { Database } from '@/src/db/index.ts';

/**
 * Next.js App Router: Fleet Overview Metrics
 * Endpoint: GET /api/overview
 */
export async function GET() {
  try {
    const overview = await Database.getOverview();
    return Response.json(overview, { status: 200 });
  } catch (err: any) {
    return Response.json({ error: 'Failed to compute fleet overview', message: err.message }, { status: 500 });
  }
}
