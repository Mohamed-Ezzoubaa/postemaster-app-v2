import { Database } from '@/src/db/index.ts';

/**
 * Next.js App Router: Individual Domain Operations
 * Endpoint: PATCH / DELETE /api/domains/[id]
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);
    const body = await request.json();

    const domain = await Database.getDomain(id);
    if (!domain) {
      return Response.json({ error: 'Domain not found' }, { status: 404 });
    }

    const updated = await Database.updateDomain(id, body);
    return Response.json(updated, { status: 200 });
  } catch (err: any) {
    return Response.json({ error: 'Failed to update domain', message: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);
    const domain = await Database.getDomain(id);

    if (!domain) {
      return Response.json({ error: 'Domain not found' }, { status: 404 });
    }

    await Database.deleteDomain(id);
    await Database.addSyncLog({
      triggeredBy: 'manual',
      status: 'success',
      domainsProcessed: 1,
      details: `Removed domain ${domain.domainName} from Postmaster monitoring.`,
    });

    return Response.json({ success: true, message: `Domain ${domain.domainName} deleted.` }, { status: 200 });
  } catch (err: any) {
    return Response.json({ error: 'Failed to delete domain', message: err.message }, { status: 500 });
  }
}
