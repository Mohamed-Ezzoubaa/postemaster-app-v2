export type ReputationStatus = 'HIGH' | 'MEDIUM' | 'LOW' | 'BAD' | 'UNKNOWN';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  hasGooglePostmaster: boolean;
  tokenExpiresAt?: string;
  createdAt: string;
}

export interface MonitoredDomain {
  id: string;
  userId: string;
  domainName: string;
  verificationStatus: 'verified' | 'pending_dns' | 'unverified';
  cnameRecord: string;
  txtRecord: string;
  domainReputation: ReputationStatus;
  spamRate: number; // e.g., 0.001 = 0.1%
  spfSuccessRate: number; // 0.0 - 1.0
  dkimSuccessRate: number; // 0.0 - 1.0
  dmarcSuccessRate: number; // 0.0 - 1.0
  tlsRate: number; // 0.0 - 1.0
  deliveryErrorsRate: number; // 0.0 - 1.0
  lastSyncedAt: string;
  createdAt: string;
  ipCount?: number;
}

export interface MonitoredIP {
  id: string;
  userId: string;
  domainId?: string;
  domainName?: string;
  ipAddress: string;
  hostname: string;
  ipReputation: ReputationStatus;
  subnet?: string;
  sampleVolume: number;
  spamRate: number;
  lastSyncedAt: string;
  createdAt: string;
}

export interface ReputationHistoryPoint {
  id: string;
  domainId: string;
  ipId?: string;
  date: string; // YYYY-MM-DD
  domainReputation: ReputationStatus;
  ipReputation?: ReputationStatus;
  userReportedSpamRatio: number;
  spfSuccessRatio: number;
  dkimSuccessRatio: number;
  dmarcSuccessRatio: number;
  inboundEncryptionRatio: number;
  outboundEncryptionRatio: number;
  deliveryErrorsRatio: number;
}

export interface SyncLog {
  id: string;
  triggeredBy: 'cron' | 'manual' | 'oauth_callback';
  status: 'success' | 'partial' | 'failed';
  domainsProcessed: number;
  details: string;
  createdAt: string;
}

export interface OverviewMetrics {
  totalDomains: number;
  verifiedDomains: number;
  totalIPs: number;
  averageSpamRate: number;
  highReputationCount: number;
  mediumReputationCount: number;
  lowReputationCount: number;
  badReputationCount: number;
  averageDkimRate: number;
  averageSpfRate: number;
  averageDmarcRate: number;
  averageTlsRate: number;
  criticalAlertsCount: number;
  lastSyncTime?: string;
}
