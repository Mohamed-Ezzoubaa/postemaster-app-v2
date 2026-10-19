import { Database } from '@/src/db/index.ts';

/**
 * Next.js App Router: AI Deliverability Diagnostics
 * Endpoint: POST /api/ai/diagnose
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domainId } = body;

    const domain = await Database.getDomain(domainId);
    if (!domain) {
      return Response.json({ error: 'Domain not found' }, { status: 404 });
    }

    const recommendations: string[] = [];
    let severity: 'critical' | 'warning' | 'optimal' = 'optimal';

    if (domain.spamRate > 0.003) {
      severity = 'critical';
      recommendations.push(
        `Spam rate of ${(domain.spamRate * 100).toFixed(2)}% violates Google's strict 0.3% threshold. High likelihood of landing in Gmail spam folder or message rejections.`
      );
      recommendations.push(
        'Audit list acquisition sources immediately and enforce double opt-in to prune unengaged recipients.'
      );
      recommendations.push(
        'Ensure one-click List-Unsubscribe headers (RFC 8058) are present and functional in all bulk mailings.'
      );
    } else if (domain.spamRate > 0.001) {
      severity = 'warning';
      recommendations.push(
        `Spam rate is ${(domain.spamRate * 100).toFixed(2)}%. Approaching Google warning boundary (0.1% - 0.3%). Reduce sending frequency to inactive subscribers.`
      );
    }

    if (domain.dmarcSuccessRate < 0.95) {
      if (severity !== 'critical') severity = 'warning';
      recommendations.push(
        `DMARC alignment is only ${(domain.dmarcSuccessRate * 100).toFixed(1)}%. Ensure 'From:' domain matches DKIM 'd=' and SPF 'envelope-from' domains.`
      );
    }

    if (domain.spfSuccessRate < 0.98) {
      recommendations.push(
        `SPF pass rate is ${(domain.spfSuccessRate * 100).toFixed(1)}%. Check for DNS lookup limits (exceeding 10 mechanism lookups) and ensure sending IPs are authorized.`
      );
    }

    if (domain.dkimSuccessRate < 0.98) {
      recommendations.push(
        `DKIM pass rate is ${(domain.dkimSuccessRate * 100).toFixed(1)}%. Verify 2048-bit RSA keys and ensure mail gateways do not modify email body whitespace in transit.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'All Postmaster health indicators are in the optimal green zone! Continue monitoring trailing 30-day volume consistency.'
      );
    }

    return Response.json(
      {
        domain: domain.domainName,
        reputation: domain.domainReputation,
        severity,
        recommendations,
        summary: `${domain.domainName} is operating with ${domain.domainReputation} reputation. Deliverability score is ${Math.round(
          (1 - domain.spamRate * 20) *
            (domain.dkimSuccessRate * 0.4 + domain.spfSuccessRate * 0.3 + domain.dmarcSuccessRate * 0.3) *
            100
        )}/100.`,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return Response.json(
      { error: 'Diagnostics analysis failed', message: err.message },
      { status: 500 }
    );
  }
}
