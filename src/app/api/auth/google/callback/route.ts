import jwt from 'jsonwebtoken';
import { Database } from '@/src/db/index.ts';

/**
 * Next.js App Router: Google OAuth 2.0 Callback Route
 * File: src/app/api/auth/google/callback/route.ts
 */
export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const code = urlObj.searchParams.get('code');
  const error = urlObj.searchParams.get('error');

  const host = request.headers.get('host') || 'postemaster-app-ezz.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const appUrl = `${protocol}://${host}`;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const jwtSecret = process.env.NEXTAUTH_SECRET || 'postmaster-pulse-secret-key-9281741';

  if (error) {
    console.error('[Google OAuth Callback Error]', error);
    return Response.redirect(`${appUrl}/?auth_status=error&error=${encodeURIComponent(error)}`, 302);
  }

  if (!code || !clientId || !clientSecret) {
    return Response.redirect(
      `${appUrl}/?auth_status=error&error=${encodeURIComponent('Missing OAuth code or credentials in environment.')}`,
      302
    );
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // 1. Exchange authorization code with Google token endpoint
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[Token Exchange Failed]', tokenData);
      return Response.redirect(
        `${appUrl}/?auth_status=error&error=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`,
        302
      );
    }

    // 2. Fetch user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    // 3. Persist user & tokens in PostgreSQL via Drizzle ORM
    const user = await Database.upsertUser({
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      avatarUrl: profile.picture,
      hasGooglePostmaster: true,
      tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
    });

    // 4. Sync real Google Postmaster Tools domains if present
    let domainsCount = 0;
    try {
      const synced = await Database.syncUserWithGooglePostmaster(user.id, tokenData.access_token);
      domainsCount = synced.length;
    } catch (syncErr) {
      console.warn('[Postmaster initial sync warn]', syncErr);
    }

    // 5. Issue secure session JWT
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 6. Add audit log
    await Database.addSyncLog({
      triggeredBy: 'oauth_callback',
      status: 'success',
      domainsProcessed: domainsCount,
      details: `Google Postmaster Tools OAuth connected for ${user.email}. Synchronized ${domainsCount} real domains.`,
    });

    const headers = new Headers();
    headers.set('Location', `${appUrl}/?auth_status=success&domains_count=${domainsCount}`);
    headers.set(
      'Set-Cookie',
      `postmaster_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (err: any) {
    console.error('[OAuth Callback Exception]', err);
    return Response.redirect(
      `${appUrl}/?auth_status=error&error=${encodeURIComponent(err.message || 'unknown_auth_error')}`,
      302
    );
  }
}
