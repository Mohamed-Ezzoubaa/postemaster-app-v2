import { NextResponse } from 'next/server';

/**
 * Next.js App Router: Google OAuth 2.0 Initiation Route
 * File: src/app/api/auth/google/route.ts
 */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const host = request.headers.get('host') || 'postemaster-app-ezz.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.redirect(
      `${protocol}://${host}/?oauth_error=missing_credentials&msg=${encodeURIComponent(
        'GOOGLE_CLIENT_ID is not configured in Vercel / environment variables. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
      )}`
    );
  }

  const scope = encodeURIComponent(
    'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/postmaster.readonly'
  );

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&access_type=offline&prompt=consent&include_granted_scopes=true`;

  return NextResponse.redirect(authUrl);
}
