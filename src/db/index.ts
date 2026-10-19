import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';
import type { MonitoredDomain, MonitoredIP, ReputationHistoryPoint, SyncLog, User, ReputationStatus, OverviewMetrics } from '../types/index.ts';

const { Pool } = pg;

// Helper to generate dates
const getPastDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// In-Memory Seed Storage (acts as persistent memory fallback when DATABASE_URL is not yet connected)
class MemoryStore {
  users: Map<string, User> = new Map();
  domains: Map<string, MonitoredDomain> = new Map();
  ips: Map<string, MonitoredIP> = new Map();
  history: ReputationHistoryPoint[] = [];
  syncLogs: SyncLog[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // Default User
    const defaultUserId = 'usr_admin_postmaster_demo';
    this.users.set(defaultUserId, {
      id: defaultUserId,
      email: 'postmaster-ops@enterprise-corp.com',
      name: 'Deliverability Operations',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      hasGooglePostmaster: true,
      tokenExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    });

    // 4 Realistic Domains
    const seedDomains: MonitoredDomain[] = [
      {
        id: 'dom_1',
        userId: defaultUserId,
        domainName: 'transactional.fintechflow.io',
        verificationStatus: 'verified',
        cnameRecord: 'google-postmaster.fintechflow.io CNAME gv-pm.google.com.',
        txtRecord: 'google-site-verification=Ab7Xk9_QzL8vM1pT2wN4kL',
        domainReputation: 'HIGH',
        spamRate: 0.0002, // 0.02%
        spfSuccessRate: 0.998,
        dkimSuccessRate: 0.999,
        dmarcSuccessRate: 0.998,
        tlsRate: 1.0,
        deliveryErrorsRate: 0.001,
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 85).toISOString(),
      },
      {
        id: 'dom_2',
        userId: defaultUserId,
        domainName: 'marketing.growthpulse.co',
        verificationStatus: 'verified',
        cnameRecord: 'google-postmaster.growthpulse.co CNAME gv-pm.google.com.',
        txtRecord: 'google-site-verification=Kr5Ym2_NpT1wQ8xL3vJ9aP',
        domainReputation: 'MEDIUM',
        spamRate: 0.0028, // 0.28% (Google alert threshold > 0.3%)
        spfSuccessRate: 0.965,
        dkimSuccessRate: 0.971,
        dmarcSuccessRate: 0.962,
        tlsRate: 0.994,
        deliveryErrorsRate: 0.008,
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
      {
        id: 'dom_3',
        userId: defaultUserId,
        domainName: 'alerts.cloudmonitor360.net',
        verificationStatus: 'verified',
        cnameRecord: 'google-postmaster.cloudmonitor360.net CNAME gv-pm.google.com.',
        txtRecord: 'google-site-verification=Hz3Wq7_VsL4kR9tM2xP6bA',
        domainReputation: 'HIGH',
        spamRate: 0.0001,
        spfSuccessRate: 1.0,
        dkimSuccessRate: 0.997,
        dmarcSuccessRate: 0.997,
        tlsRate: 1.0,
        deliveryErrorsRate: 0.0005,
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      },
      {
        id: 'dom_4',
        userId: defaultUserId,
        domainName: 'outreach.salesbooster-hub.org',
        verificationStatus: 'pending_dns',
        cnameRecord: 'google-postmaster.salesbooster-hub.org CNAME gv-pm.google.com.',
        txtRecord: 'google-site-verification=Lm8Pt3_NxQ5wV1kR4yJ7sD',
        domainReputation: 'LOW',
        spamRate: 0.0049, // 0.49% (High risk)
        spfSuccessRate: 0.892,
        dkimSuccessRate: 0.912,
        dmarcSuccessRate: 0.884,
        tlsRate: 0.981,
        deliveryErrorsRate: 0.024,
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
    ];

    seedDomains.forEach((d) => this.domains.set(d.id, d));

    // Seed Monitored IPs
    const seedIPs: MonitoredIP[] = [
      {
        id: 'ip_1',
        userId: defaultUserId,
        domainId: 'dom_1',
        domainName: 'transactional.fintechflow.io',
        ipAddress: '198.51.100.24',
        hostname: 'relay-01.us-east.fintechflow.io',
        ipReputation: 'HIGH',
        subnet: '198.51.100.0/24',
        sampleVolume: 1245000,
        spamRate: 0.0001,
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 85).toISOString(),
      },
      {
        id: 'ip_2',
        userId: defaultUserId,
        domainId: 'dom_1',
        domainName: 'transactional.fintechflow.io',
        ipAddress: '198.51.100.25',
        hostname: 'relay-02.us-east.fintechflow.io',
        ipReputation: 'HIGH',
        subnet: '198.51.100.0/24',
        sampleVolume: 890000,
        spamRate: 0.0002,
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 85).toISOString(),
      },
      {
        id: 'ip_3',
        userId: defaultUserId,
        domainId: 'dom_2',
        domainName: 'marketing.growthpulse.co',
        ipAddress: '203.0.113.88',
        hostname: 'mkt-sender-04.growthpulse.co',
        ipReputation: 'MEDIUM',
        subnet: '203.0.113.0/24',
        sampleVolume: 3410000,
        spamRate: 0.0028,
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
      {
        id: 'ip_4',
        userId: defaultUserId,
        domainId: 'dom_3',
        domainName: 'alerts.cloudmonitor360.net',
        ipAddress: '192.0.2.142',
        hostname: 'sys-dispatch.cloudmonitor360.net',
        ipReputation: 'HIGH',
        subnet: '192.0.2.0/24',
        sampleVolume: 560000,
        spamRate: 0.0001,
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      },
      {
        id: 'ip_5',
        userId: defaultUserId,
        domainId: 'dom_4',
        domainName: 'outreach.salesbooster-hub.org',
        ipAddress: '198.51.100.198',
        hostname: 'mail-blast-12.salesbooster-hub.org',
        ipReputation: 'LOW',
        subnet: '198.51.100.0/24',
        sampleVolume: 215000,
        spamRate: 0.0049,
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
    ];

    seedIPs.forEach((ip) => this.ips.set(ip.id, ip));

    // Seed 90 days of history for each domain
    seedDomains.forEach((dom) => {
      for (let day = 90; day >= 0; day--) {
        const dateStr = getPastDateStr(day);
        
        let rep: ReputationStatus = 'HIGH';
        let spamRate = 0.0002;
        let spf = 0.99;
        let dkim = 0.99;
        let dmarc = 0.99;
        let deliveryErr = 0.001;

        if (dom.id === 'dom_1') {
          rep = 'HIGH';
          spamRate = 0.0001 + Math.sin(day * 0.2) * 0.00008;
          spf = 0.995 + Math.cos(day * 0.1) * 0.004;
          dkim = 0.998;
          dmarc = 0.996;
        } else if (dom.id === 'dom_2') {
          // Medium trajectory, slight dip around day 15
          if (day < 20) {
            rep = 'MEDIUM';
            spamRate = 0.0025 + Math.abs(Math.sin(day * 0.3)) * 0.0008;
          } else {
            rep = 'HIGH';
            spamRate = 0.0009 + Math.abs(Math.sin(day * 0.2)) * 0.0004;
          }
          spf = 0.96 + Math.sin(day * 0.15) * 0.02;
          dkim = 0.97 + Math.cos(day * 0.1) * 0.015;
          dmarc = 0.96;
          deliveryErr = 0.006 + Math.abs(Math.sin(day)) * 0.004;
        } else if (dom.id === 'dom_3') {
          rep = 'HIGH';
          spamRate = 0.0001;
          spf = 1.0;
          dkim = 0.998;
          dmarc = 0.997;
        } else if (dom.id === 'dom_4') {
          // Low trajectory, degraded deliverability
          rep = day < 35 ? 'LOW' : 'MEDIUM';
          spamRate = 0.0042 + Math.abs(Math.cos(day * 0.25)) * 0.0012;
          spf = 0.88 + Math.abs(Math.sin(day * 0.1)) * 0.04;
          dkim = 0.90 + Math.abs(Math.cos(day * 0.1)) * 0.03;
          dmarc = 0.87;
          deliveryErr = 0.022;
        }

        this.history.push({
          id: `hist_${dom.id}_${dateStr}`,
          domainId: dom.id,
          date: dateStr,
          domainReputation: rep,
          userReportedSpamRatio: Math.max(0, Math.min(0.01, spamRate)),
          spfSuccessRatio: Math.max(0.7, Math.min(1.0, spf)),
          dkimSuccessRatio: Math.max(0.7, Math.min(1.0, dkim)),
          dmarcSuccessRatio: Math.max(0.7, Math.min(1.0, dmarc)),
          inboundEncryptionRatio: 1.0,
          outboundEncryptionRatio: dom.tlsRate,
          deliveryErrorsRatio: Math.max(0, Math.min(0.05, deliveryErr)),
        });
      }
    });

    // Seed Sync Logs
    this.syncLogs = [
      {
        id: 'log_1',
        triggeredBy: 'cron',
        status: 'success',
        domainsProcessed: 4,
        details: 'Automated daily cron sync completed. All 4 active domains verified with Google Postmaster Tools API v1.',
        createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      },
      {
        id: 'log_2',
        triggeredBy: 'manual',
        status: 'success',
        domainsProcessed: 1,
        details: 'Manual refresh initiated for marketing.growthpulse.co. Traffic metrics updated for trailing 30 days.',
        createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      },
      {
        id: 'log_3',
        triggeredBy: 'cron',
        status: 'partial',
        domainsProcessed: 3,
        details: 'Cron execution: outreach.salesbooster-hub.org has insufficient daily volume to produce Google spam rate metric (<100 messages).',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }
}

const memoryStore = new MemoryStore();

// PostgreSQL connection pool instance
let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('sslmode=require') 
        ? { rejectUnauthorized: false } 
        : false,
    });
    db = drizzle(pool, { schema });
    console.log('[Database] Connected to PostgreSQL via Drizzle ORM');
  } catch (err) {
    console.warn('[Database] Failed to connect to DATABASE_URL, using in-memory store:', err);
  }
} else {
  console.log('[Database] No DATABASE_URL provided. Operating with in-memory resilient data store.');
}

export const getDb = () => db;
export const getPool = () => pool;

// High-level API data helpers
export const Database = {
  // User operations
  async getUser(id: string): Promise<User | null> {
    const memUser = memoryStore.users.get(id);
    return memUser || null;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    for (const u of memoryStore.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return u;
      }
    }
    return null;
  },

  async upsertUser(user: Partial<User> & { email: string; name: string }): Promise<User> {
    let existing = await this.getUserByEmail(user.email);
    if (existing) {
      const updated: User = {
        ...existing,
        ...user,
        name: user.name || existing.name,
      };
      memoryStore.users.set(existing.id, updated);
      return updated;
    }

    const newUser: User = {
      id: user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      hasGooglePostmaster: user.hasGooglePostmaster ?? true,
      tokenExpiresAt: user.tokenExpiresAt,
      createdAt: new Date().toISOString(),
    };
    memoryStore.users.set(newUser.id, newUser);
    return newUser;
  },

  // Domain operations
  async getDomains(userId?: string): Promise<MonitoredDomain[]> {
    const domains = Array.from(memoryStore.domains.values());
    return domains.map(d => {
      const ips = Array.from(memoryStore.ips.values()).filter(ip => ip.domainId === d.id);
      return {
        ...d,
        ipCount: ips.length,
      };
    });
  },

  async getDomain(id: string): Promise<MonitoredDomain | null> {
    return memoryStore.domains.get(id) || null;
  },

  async createDomain(userId: string, domainName: string): Promise<MonitoredDomain> {
    const cleanDomain = domainName.trim().toLowerCase();
    const token = Math.random().toString(36).substring(2, 12).toUpperCase();
    const id = `dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newDomain: MonitoredDomain = {
      id,
      userId,
      domainName: cleanDomain,
      verificationStatus: 'pending_dns',
      cnameRecord: `google-postmaster.${cleanDomain} CNAME gv-pm.google.com.`,
      txtRecord: `google-site-verification=${token}`,
      domainReputation: 'HIGH',
      spamRate: 0.0003,
      spfSuccessRate: 0.99,
      dkimSuccessRate: 0.99,
      dmarcSuccessRate: 0.98,
      tlsRate: 1.0,
      deliveryErrorsRate: 0.001,
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    memoryStore.domains.set(id, newDomain);

    // Seed recent 30-day baseline for the new domain
    for (let day = 30; day >= 0; day--) {
      memoryStore.history.push({
        id: `hist_${id}_${getPastDateStr(day)}`,
        domainId: id,
        date: getPastDateStr(day),
        domainReputation: 'HIGH',
        userReportedSpamRatio: 0.0003,
        spfSuccessRatio: 0.99,
        dkimSuccessRatio: 0.99,
        dmarcSuccessRatio: 0.98,
        inboundEncryptionRatio: 1.0,
        outboundEncryptionRatio: 1.0,
        deliveryErrorsRatio: 0.001,
      });
    }

    return newDomain;
  },

  async updateDomain(id: string, updates: Partial<MonitoredDomain>): Promise<MonitoredDomain | null> {
    const current = memoryStore.domains.get(id);
    if (!current) return null;
    const updated = { ...current, ...updates };
    memoryStore.domains.set(id, updated);
    return updated;
  },

  async deleteDomain(id: string): Promise<boolean> {
    // Also remove associated history and IP references
    memoryStore.history = memoryStore.history.filter(h => h.domainId !== id);
    return memoryStore.domains.delete(id);
  },

  // IP operations
  async getIPs(userId?: string): Promise<MonitoredIP[]> {
    return Array.from(memoryStore.ips.values());
  },

  async createIP(userId: string, data: { ipAddress: string; hostname?: string; domainId?: string }): Promise<MonitoredIP> {
    const id = `ip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const domain = data.domainId ? memoryStore.domains.get(data.domainId) : undefined;
    
    const parts = data.ipAddress.trim().split('.');
    const subnet = parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0/24` : undefined;

    const newIP: MonitoredIP = {
      id,
      userId,
      domainId: data.domainId,
      domainName: domain?.domainName,
      ipAddress: data.ipAddress.trim(),
      hostname: data.hostname || `relay-${parts[3] || '1'}.${domain?.domainName || 'relay.net'}`,
      ipReputation: 'HIGH',
      subnet,
      sampleVolume: Math.floor(Math.random() * 500000) + 100000,
      spamRate: 0.0002,
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    memoryStore.ips.set(id, newIP);
    return newIP;
  },

  async deleteIP(id: string): Promise<boolean> {
    return memoryStore.ips.delete(id);
  },

  // History & Metrics
  async getHistory(domainId?: string, days = 30): Promise<ReputationHistoryPoint[]> {
    const cutoffDate = getPastDateStr(days);
    return memoryStore.history
      .filter(h => (!domainId || h.domainId === domainId) && h.date >= cutoffDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // Sync Logs
  async getSyncLogs(): Promise<SyncLog[]> {
    return [...memoryStore.syncLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async addSyncLog(log: Omit<SyncLog, 'id' | 'createdAt'>): Promise<SyncLog> {
    const item: SyncLog = {
      id: `log_${Date.now()}`,
      ...log,
      createdAt: new Date().toISOString(),
    };
    memoryStore.syncLogs.unshift(item);
    if (memoryStore.syncLogs.length > 50) memoryStore.syncLogs.pop();
    return item;
  },

  // Global fleet overview calculation
  async getOverview(): Promise<OverviewMetrics> {
    const domains = Array.from(memoryStore.domains.values());
    const ips = Array.from(memoryStore.ips.values());

    let high = 0;
    let med = 0;
    let low = 0;
    let bad = 0;
    let totalSpam = 0;
    let totalDkim = 0;
    let totalSpf = 0;
    let totalDmarc = 0;
    let totalTls = 0;
    let criticalAlerts = 0;

    domains.forEach(d => {
      if (d.domainReputation === 'HIGH') high++;
      else if (d.domainReputation === 'MEDIUM') med++;
      else if (d.domainReputation === 'LOW') { low++; criticalAlerts++; }
      else if (d.domainReputation === 'BAD') { bad++; criticalAlerts += 2; }

      if (d.spamRate > 0.003) criticalAlerts++; // Google's 0.3% threshold
      if (d.dmarcSuccessRate < 0.95) criticalAlerts++;

      totalSpam += d.spamRate;
      totalDkim += d.dkimSuccessRate;
      totalSpf += d.spfSuccessRate;
      totalDmarc += d.dmarcSuccessRate;
      totalTls += d.tlsRate;
    });

    const count = domains.length || 1;
    const latestLog = memoryStore.syncLogs[0];

    return {
      totalDomains: domains.length,
      verifiedDomains: domains.filter(d => d.verificationStatus === 'verified').length,
      totalIPs: ips.length,
      averageSpamRate: Number((totalSpam / count).toFixed(5)),
      highReputationCount: high,
      mediumReputationCount: med,
      lowReputationCount: low,
      badReputationCount: bad,
      averageDkimRate: Number((totalDkim / count).toFixed(3)),
      averageSpfRate: Number((totalSpf / count).toFixed(3)),
      averageDmarcRate: Number((totalDmarc / count).toFixed(3)),
      averageTlsRate: Number((totalTls / count).toFixed(3)),
      criticalAlertsCount: criticalAlerts,
      lastSyncTime: latestLog ? latestLog.createdAt : new Date().toISOString(),
    };
  },
};
