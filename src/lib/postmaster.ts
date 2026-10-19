/**
 * Real Google Postmaster Tools API v1 Client
 * Scope: https://www.googleapis.com/auth/postmaster.readonly
 * Docs: https://developers.google.com/gmail/postmaster
 */

export interface GooglePostmasterDomain {
  name: string; // e.g. "domains/mail.example.com"
  verificationRecord?: string;
  permission?: 'PERMISSION_UNSPECIFIED' | 'OWNER' | 'READER';
  createTime?: string;
}

export interface GoogleTrafficStats {
  name: string; // e.g. "domains/example.com/trafficStats/20261018"
  userReportedSpamRatio?: number;
  domainReputation?: 'REPUTATION_CATEGORY_UNSPECIFIED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'BAD';
  spfSuccessRatio?: number;
  dkimSuccessRatio?: number;
  dmarcSuccessRatio?: number;
  inboundEncryptionRatio?: number;
  outboundEncryptionRatio?: number;
  deliveryErrors?: Array<{ errorType: string; errorRatio: number }>;
}

/**
 * Lists all domains registered and accessible by the authenticated user in Google Postmaster Tools.
 */
export async function fetchGooglePostmasterDomains(accessToken: string): Promise<GooglePostmasterDomain[]> {
  try {
    const res = await fetch('https://gmailpostmastertools.googleapis.com/v1/domains', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.warn('[Google Postmaster API] List domains response:', res.status, errBody);
      return [];
    }

    const data = await res.json();
    return data.domains || [];
  } catch (err) {
    console.error('[Google Postmaster API] Failed to fetch domains:', err);
    return [];
  }
}

/**
 * Fetches historical traffic stats for a specific domain from Google Postmaster Tools API v1.
 */
export async function fetchGoogleDomainTrafficStats(
  domainName: string,
  accessToken: string,
  days: number = 30
): Promise<GoogleTrafficStats[]> {
  try {
    const cleanDomain = domainName.replace(/^domains\//, '');
    
    // Optional date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const params = new URLSearchParams({
      'startDate.year': startDate.getFullYear().toString(),
      'startDate.month': (startDate.getMonth() + 1).toString(),
      'startDate.day': startDate.getDate().toString(),
      'endDate.year': endDate.getFullYear().toString(),
      'endDate.month': (endDate.getMonth() + 1).toString(),
      'endDate.day': endDate.getDate().toString(),
    });

    const url = `https://gmailpostmastertools.googleapis.com/v1/domains/${encodeURIComponent(cleanDomain)}/trafficStats?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.warn(`[Google Postmaster API] trafficStats for ${cleanDomain}:`, res.status, errBody);
      return [];
    }

    const data = await res.json();
    return data.trafficStats || [];
  } catch (err) {
    console.error(`[Google Postmaster API] Failed trafficStats for ${domainName}:`, err);
    return [];
  }
}
