import jwt from 'jsonwebtoken';
import { Database } from '@/src/db/index.ts';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'postmaster-pulse-secret-key-9281741';

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Next.js App Router: Fleet Overview Metrics
 * Endpoint: GET /api/overview
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

    const overview = await Database.getOverview(userId);
    return Response.json(overview, { status: 200 });
  } catch (err: any) {
    return Response.json({ error: 'Failed to compute fleet overview', message: err.message }, { status: 500 });
  }
}
