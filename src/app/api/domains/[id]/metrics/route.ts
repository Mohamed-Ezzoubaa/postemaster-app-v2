import { Database } from '@/src/db/index.ts';

/**
 * Next.js App Router: Domain Trajectory Historical Metrics
 * Endpoint: GET /api/domains/[id]/metrics?days=30
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);
    const urlObj = new URL(request.url);
    const days = parseInt(urlObj.searchParams.get('days') || '30', 10);

    const domain = await Database.getDomain(id);
    if (!domain) {
      return Response.json({ error: 'Domain not found' }, { status: 404 });
    }

    const history = await Database.getHistory(id, days);
    return Response.json(
      {
        domain,
        days,
        history,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return Response.json({ error: 'Failed to fetch domain metrics', message: err.message }, { status: 500 });
  }
}
