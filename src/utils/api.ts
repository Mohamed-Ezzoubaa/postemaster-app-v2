/**
 * Safe fetch wrapper that handles JSON parsing, non-200 responses,
 * and HTML 404/500 error pages gracefully without throwing syntax errors.
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    let data: any = null;
    let error: string | undefined;

    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (jsonErr: any) {
        error = 'Invalid JSON response from server';
      }
    } else {
      const text = await res.text();
      if (!res.ok) {
        // Handle HTML 404/500 pages like "The page could not be found"
        error = text.length > 200 ? `Server returned HTTP ${res.status}` : text || `HTTP ${res.status}`;
      } else {
        data = text as any;
      }
    }

    if (!res.ok && !error) {
      error = (data && (data.error || data.message)) || `Request failed with status ${res.status}`;
    }

    return {
      ok: res.ok,
      status: res.status,
      data,
      error,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err.message || 'Network request failed',
    };
  }
}
