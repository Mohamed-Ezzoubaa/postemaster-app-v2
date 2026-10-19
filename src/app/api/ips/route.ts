import jwt from 'jsonwebtoken';
import { Database } from '@/src/db/index.ts';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'postmaster-pulse-secret-key-9281741';

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Next.js App Router: IPs List & Add
 * Endpoint: GET / POST /api/ips
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

    const ips = await Database.getIPs(userId);
    return Response.json(ips, { status: 200 });
  } catch (err: any) {
    return Response.json(
      { error: 'Failed to fetch monitored IPs', message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ipAddress, hostname, domainId } = body;

    if (!ipAddress || typeof ipAddress !== 'string') {
      return Response.json(
        { error: 'Valid IP address is required' },
        { status: 400 }
      );
    }

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

    const newIP = await Database.createIP(userId, { ipAddress, hostname, domainId });
    return Response.json(newIP, { status: 201 });
  } catch (err: any) {
    return Response.json(
      { error: 'Failed to create monitored IP', message: err.message },
      { status: 500 }
    );
  }
}
