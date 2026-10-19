/**
 * Next.js App Router: Logout Route
 * Endpoint: POST /api/auth/logout
 */
export async function POST() {
  const headers = new Headers();
  headers.set('Set-Cookie', 'postmaster_session=; Path=/; HttpOnly; Max-Age=0');

  return Response.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200, headers }
  );
}
