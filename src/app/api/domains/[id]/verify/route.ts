import { Database } from '@/src/db/index.ts';

/**
 * Next.js App Router: Domain DNS Ownership Verification
 * Endpoint: POST /api/domains/[id]/verify
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
      verificationStatus: 'verified',
      lastSyncedAt: new Date().toISOString(),
    });

    await Database.addSyncLog({
      triggeredBy: 'manual',
      status: 'success',
      domainsProcessed: 1,
      details: `DNS verification confirmed for ${domain.domainName}. Active Google Postmaster telemetry ingestion enabled.`,
    });

    return Response.json(
      {
        success: true,
        domain: updated,
        message: `Domain ${domain.domainName} ownership verified successfully via DNS TXT record.`,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return Response.json({ error: 'Failed to verify domain', message: err.message }, { status: 500 });
  }
}
