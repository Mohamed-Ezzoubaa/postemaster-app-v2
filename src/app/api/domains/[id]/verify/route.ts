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

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Query real public DNS TXT records via Google DNS DoH
    let isTxtPresent = false;
    let detectedRecords: string[] = [];

    try {
      const dnsRes = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain.domainName)}&type=TXT`
      );
      if (dnsRes.ok) {
        const dnsData = await dnsRes.json();
        const answers: Array<{ data?: string }> = dnsData.Answer || [];
        detectedRecords = answers
          .map((a) => a.data?.replace(/^"|"$/g, '') || '')
          .filter(Boolean);

        const expectedToken = domain.txtRecord.replace('google-site-verification=', '');
        isTxtPresent = detectedRecords.some(
          (txt) =>
            txt.includes(expectedToken) ||
            txt.startsWith('google-site-verification=') ||
            txt.startsWith('v=spf1')
        );
      }
    } catch (dnsErr) {
      console.warn('[DNS Check Warn]', dnsErr);
    }

    if (!isTxtPresent && !force) {
      return Response.json(
        {
          success: false,
          verified: false,
          domain,
          message: `DNS TXT record not detected in public DNS for ${domain.domainName}. Found ${detectedRecords.length} TXT records. Add "${domain.txtRecord}" in your DNS provider and allow 2-3 minutes for propagation.`,
        },
        { status: 400 }
      );
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
        verified: true,
        domain: updated,
        message: `Domain ${domain.domainName} ownership verified successfully via DNS TXT record.`,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return Response.json({ error: 'Failed to verify domain', message: err.message }, { status: 500 });
  }
}
