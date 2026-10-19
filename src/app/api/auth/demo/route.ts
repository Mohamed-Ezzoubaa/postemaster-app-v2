import jwt from 'jsonwebtoken';
import { Database } from '@/src/db/index.ts';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'postmaster-pulse-secret-key-9281741';

/**
 * Next.js App Router: Demo Login
 * Endpoint: POST /api/auth/demo
 */
export async function POST() {
  const demoUser = await Database.getUser('usr_admin_postmaster_demo');
  if (!demoUser) {
    return Response.json({ error: 'Demo user not found' }, { status: 500 });
  }

  const sessionToken = jwt.sign(
    { userId: demoUser.id, email: demoUser.email, name: demoUser.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const headers = new Headers();
  headers.set(
    'Set-Cookie',
    `postmaster_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`
  );

  return Response.json(
    {
      success: true,
      user: demoUser,
      message: 'Authenticated in enterprise demo mode with sample domains and Google Postmaster metrics.',
    },
    { status: 200, headers }
  );
}
