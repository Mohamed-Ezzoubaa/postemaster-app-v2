import jwt from 'jsonwebtoken';
import { Database } from '@/src/db/index.ts';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'postmaster-pulse-secret-key-9281741';

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Next.js App Router: Auth Session Check
 * Endpoint: GET /api/auth/me
 */
export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const token =
    parseCookie(cookieHeader, 'postmaster_session') ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  const hasConfig = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  if (!token) {
    return Response.json({
      authenticated: false,
      user: null,
      oauthConfigured: hasConfig,
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = await Database.getUser(decoded.userId);

    return Response.json({
      authenticated: true,
      user: user || {
        id: decoded.userId,
        email: decoded.email,
        name: 'Deliverability Engineer',
        hasGooglePostmaster: true,
        createdAt: new Date().toISOString(),
      },
      oauthConfigured: hasConfig,
    });
  } catch {
    return Response.json({
      authenticated: false,
      user: null,
      oauthConfigured: hasConfig,
    });
  }
}
