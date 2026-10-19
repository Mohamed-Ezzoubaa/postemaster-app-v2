import jwt from 'jsonwebtoken';
import { Database } from '@/src/db/index.ts';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'postmaster-pulse-secret-key-9281741';

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Next.js App Router: Domains List & Add
 * Endpoint: GET / POST /api/domains
 */
export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token =
      parseCookie(cookieHeader, 'postmaster_session') ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    let userId: string | undefined;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        if (decoded?.userId) userId = decoded.userId;
      } catch {}
    }

    const domains = await Database.getDomains(userId);
    return Response.json(domains, { status: 200 });
  } catch (err: any) {
    return Response.json(
      { error: 'Failed to fetch monitored domains', message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domainName } = body;

    if (!domainName || typeof domainName !== 'string' || !domainName.includes('.')) {
      return Response.json(
        { error: 'Valid domain name is required (e.g., mail.company.com)' },
        { status: 400 }
      );
    }

    // Identify user from session or fallback to default
    const cookieHeader = request.headers.get('cookie');
    const token =
      parseCookie(cookieHeader, 'postmaster_session') ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    let userId = 'usr_admin_postmaster_demo';
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        if (decoded?.userId) userId = decoded.userId;
      } catch {}
    }

    const newDomain = await Database.createDomain(userId, domainName);

    await Database.addSyncLog({
      triggeredBy: 'manual',
      status: 'success',
      domainsProcessed: 1,
      details: `Added new domain ${newDomain.domainName} to Postmaster tracking. DNS verification tokens generated.`,
    });

    return Response.json(newDomain, { status: 201 });
  } catch (err: any) {
    return Response.json(
      { error: 'Failed to create monitored domain', message: err.message },
      { status: 500 }
    );
  }
}
