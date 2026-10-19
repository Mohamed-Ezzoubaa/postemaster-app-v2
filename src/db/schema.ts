import { pgTable, text, timestamp, doublePrecision, integer } from 'drizzle-orm/pg-core';

/**
 * Drizzle ORM Schema for Email IP & Domain Reputation Management
 * Neon / PostgreSQL compatible
 */

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  googleAccessToken: text('google_access_token'),
  googleRefreshToken: text('google_refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const monitoredDomains = pgTable('monitored_domains', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  domainName: text('domain_name').notNull(),
  verificationStatus: text('verification_status').notNull().default('unverified'), // verified, pending_dns, unverified
  cnameRecord: text('cname_record'),
  txtRecord: text('txt_record'),
  domainReputation: text('domain_reputation').notNull().default('UNKNOWN'), // HIGH, MEDIUM, LOW, BAD, UNKNOWN
  spamRate: doublePrecision('spam_rate').notNull().default(0.0),
  spfSuccessRate: doublePrecision('spf_success_rate').notNull().default(1.0),
  dkimSuccessRate: doublePrecision('dkim_success_rate').notNull().default(1.0),
  dmarcSuccessRate: doublePrecision('dmarc_success_rate').notNull().default(1.0),
  tlsRate: doublePrecision('tls_rate').notNull().default(1.0),
  deliveryErrorsRate: doublePrecision('delivery_errors_rate').notNull().default(0.0),
  lastSyncedAt: timestamp('last_synced_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const monitoredIPs = pgTable('monitored_ips', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  domainId: text('domain_id').references(() => monitoredDomains.id),
  ipAddress: text('ip_address').notNull(),
  hostname: text('hostname').notNull(),
  ipReputation: text('ip_reputation').notNull().default('UNKNOWN'), // HIGH, MEDIUM, LOW, BAD, UNKNOWN
  subnet: text('subnet'),
  sampleVolume: integer('sample_volume').notNull().default(0),
  spamRate: doublePrecision('spam_rate').notNull().default(0.0),
  lastSyncedAt: timestamp('last_synced_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reputationHistory = pgTable('reputation_history', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').references(() => monitoredDomains.id).notNull(),
  ipId: text('ip_id').references(() => monitoredIPs.id),
  date: text('date').notNull(), // Format YYYY-MM-DD
  domainReputation: text('domain_reputation').notNull(),
  ipReputation: text('ip_reputation'),
  userReportedSpamRatio: doublePrecision('user_reported_spam_ratio').notNull().default(0.0),
  spfSuccessRatio: doublePrecision('spf_success_ratio').notNull().default(1.0),
  dkimSuccessRatio: doublePrecision('dkim_success_ratio').notNull().default(1.0),
  dmarcSuccessRatio: doublePrecision('dmarc_success_ratio').notNull().default(1.0),
  inboundEncryptionRatio: doublePrecision('inbound_encryption_ratio').notNull().default(1.0),
  outboundEncryptionRatio: doublePrecision('outbound_encryption_ratio').notNull().default(1.0),
  deliveryErrorsRatio: doublePrecision('delivery_errors_ratio').notNull().default(0.0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const syncLogs = pgTable('sync_logs', {
  id: text('id').primaryKey(),
  triggeredBy: text('triggered_by').notNull(), // cron, manual, oauth_callback
  status: text('status').notNull(), // success, partial, failed
  domainsProcessed: integer('domains_processed').notNull().default(0),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type MonitoredDomainRow = typeof monitoredDomains.$inferSelect;
export type MonitoredIPRow = typeof monitoredIPs.$inferSelect;
export type ReputationHistoryRow = typeof reputationHistory.$inferSelect;
export type SyncLogRow = typeof syncLogs.$inferSelect;
