import { Database } from '@/src/db/index.ts';

/**
 * Next.js App Router: Delete IP
 * Endpoint: DELETE /api/ips/[id]
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);
    await Database.deleteIP(id);
    return Response.json(
      { success: true, message: 'IP address removed from monitoring' },
      { status: 200 }
    );
  } catch (err: any) {
    return Response.json({ error: 'Failed to delete IP', message: err.message }, { status: 500 });
  }
}
