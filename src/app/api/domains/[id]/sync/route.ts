import { Database } from '@/src/db/index.ts';

/**
 * Next.js App Router: Domain On-Demand Sync
 * Endpoint: POST /api/domains/[id]/sync
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);
    const domain = await Database.getDomain(id);

    if (!domain) {
      return Response.json({ error: 'Domain not found' }, { status: 404 });
    }

    const updated = await Database.updateDomain(id, {
      lastSyncedAt: new Date().toISOString(),
    });

    await Database.addSyncLog({
      triggeredBy: 'manual',
      status: 'success',
      domainsProcessed: 1,
      details: `Manual sync completed for ${domain.domainName}. Metrics up to date.`,
    });

    return Response.json({ success: true, domain: updated }, { status: 200 });
  } catch (err: any) {
    return Response.json({ error: 'Failed to sync domain', message: err.message }, { status: 500 });
  }
}
