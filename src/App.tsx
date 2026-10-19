import React, { useState, useEffect } from 'react';
import type {
  MonitoredDomain,
  MonitoredIP,
  ReputationHistoryPoint,
  OverviewMetrics,
  SyncLog,
  User,
} from './types/index.ts';

import { Navbar } from './components/Navbar.tsx';
import { OverviewCards } from './components/OverviewCards.tsx';
import { ReputationTrajectoryChart } from './components/ReputationTrajectoryChart.tsx';
import { DomainManagement } from './components/DomainManagement.tsx';
import { IPManagement } from './components/IPManagement.tsx';
import { CronSimulatorModal } from './components/CronSimulatorModal.tsx';
import { AIDiagnosticsModal } from './components/AIDiagnosticsModal.tsx';
import { GoogleOAuthModal } from './components/GoogleOAuthModal.tsx';
import { SyncLogsDrawer } from './components/SyncLogsDrawer.tsx';

import {
  Globe,
  Server,
  Activity,
  History,
  Sparkles,
  Key,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { safeFetch } from './utils/api.ts';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [domains, setDomains] = useState<MonitoredDomain[]>([]);
  const [ips, setIps] = useState<MonitoredIP[]>([]);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [history, setHistory] = useState<ReputationHistoryPoint[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [days, setDays] = useState<number>(30);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'overview' | 'domains' | 'ips' | 'logs'>('overview');

  // Modals & Drawers
  const [isCronModalOpen, setIsCronModalOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
  const [isLogsDrawerOpen, setIsLogsDrawerOpen] = useState(false);

  // Loading states & Toast
  const [isLoadingFleet, setIsLoadingFleet] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Load: Auth, Overview, Domains, IPs, Logs
  const loadInitialData = async () => {
    setIsLoadingFleet(true);
    try {
      // Check auth session
      const authRes = await safeFetch<{ authenticated: boolean; user: User | null; oauthConfigured: boolean }>('/api/auth/me');
      if (authRes.ok && authRes.data) {
        setUser(authRes.data.user);
        setOauthConfigured(Boolean(authRes.data.oauthConfigured));
      }

      // Fetch overview metrics
      const overviewRes = await safeFetch<OverviewMetrics>('/api/overview');
      if (overviewRes.ok && overviewRes.data) {
        setOverview(overviewRes.data);
      }

      // Fetch domains
      const domainsRes = await safeFetch<MonitoredDomain[]>('/api/domains');
      if (domainsRes.ok && Array.isArray(domainsRes.data)) {
        setDomains(domainsRes.data);
        if (domainsRes.data.length > 0 && !selectedDomainId) {
          setSelectedDomainId(domainsRes.data[0].id);
        }
      }

      // Fetch IPs
      const ipsRes = await safeFetch<MonitoredIP[]>('/api/ips');
      if (ipsRes.ok && Array.isArray(ipsRes.data)) {
        setIps(ipsRes.data);
      }

      // Fetch sync logs
      const logsRes = await safeFetch<SyncLog[]>('/api/logs');
      if (logsRes.ok && Array.isArray(logsRes.data)) {
        setSyncLogs(logsRes.data);
      }
    } catch (err) {
      console.error('[Failed to load initial telemetry]', err);
    } finally {
      setIsLoadingFleet(false);
    }
  };

  // 2. Load Trajectory History when selected domain or days change
  const loadHistory = async (domainId: string, timeframeDays: number) => {
    if (!domainId) return;
    setIsHistoryLoading(true);
    try {
      const res = await safeFetch<{ domain: MonitoredDomain; days: number; history: ReputationHistoryPoint[] }>(
        `/api/domains/${domainId}/metrics?days=${timeframeDays}`
      );
      if (res.ok && res.data?.history) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error('[Failed to fetch history]', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Check URL parameters for OAuth status callbacks
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_status') === 'success') {
      showToast('Google Postmaster Tools OAuth connected successfully!', 'success');
      window.history.replaceState({}, '', '/');
    } else if (params.get('oauth_error')) {
      showToast(params.get('msg') || 'OAuth configuration required. Switched to demo mode.', 'info');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    if (selectedDomainId) {
      loadHistory(selectedDomainId, days);
    }
  }, [selectedDomainId, days]);

  // Auth Actions
  const handleLogout = async () => {
    try {
      await safeFetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      showToast('Signed out of session.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginDemo = async () => {
    try {
      const res = await safeFetch<{ success: boolean; user: User; message: string }>('/api/auth/demo', { method: 'POST' });
      if (res.ok && res.data?.user) {
        setUser(res.data.user);
        showToast('Authenticated in Postmaster Enterprise Demo Mode!', 'success');
        await loadInitialData();
      } else {
        showToast(res.error || 'Failed to switch to demo mode', 'error');
      }
    } catch (err) {
      showToast('Failed to switch to demo mode', 'error');
    }
  };

  // Domain Actions
  const handleAddDomain = async (domainName: string) => {
    try {
      const res = await safeFetch<MonitoredDomain>('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainName }),
      });
      if (!res.ok || !res.data) {
        throw new Error(res.error || 'Failed to add domain');
      }
      const newDomain = res.data;
      setDomains((prev) => [newDomain, ...prev]);
      setSelectedDomainId(newDomain.id);
      showToast(`Domain ${domainName} added. DNS verification tokens generated.`, 'success');
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      const res = await safeFetch(`/api/domains/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDomains((prev) => prev.filter((d) => d.id !== id));
        if (selectedDomainId === id) {
          const remaining = domains.filter((d) => d.id !== id);
          if (remaining.length > 0) setSelectedDomainId(remaining[0].id);
        }
        showToast('Domain removed from monitoring.', 'info');
        await loadInitialData();
      } else {
        showToast(res.error || 'Failed to delete domain', 'error');
      }
    } catch (err) {
      showToast('Failed to delete domain', 'error');
    }
  };

  const handleSyncDomain = async (id: string) => {
    try {
      const res = await safeFetch<{ success: boolean; domain: MonitoredDomain }>(`/api/domains/${id}/sync`, { method: 'POST' });
      if (res.ok) {
        showToast('Google Postmaster telemetry synced.', 'success');
        await loadInitialData();
        if (selectedDomainId === id) {
          await loadHistory(id, days);
        }
      } else {
        showToast(res.error || 'Sync failed', 'error');
      }
    } catch (err) {
      showToast('Sync failed', 'error');
    }
  };

  const handleVerifyDomain = async (id: string) => {
    try {
      const res = await safeFetch<{ success: boolean; domain: MonitoredDomain; message?: string }>(`/api/domains/${id}/verify`, { method: 'POST' });
      if (res.ok && res.data) {
        showToast(res.data.message || 'Domain verified!', 'success');
        await loadInitialData();
      } else {
        showToast(res.error || 'Verification failed', 'error');
      }
    } catch (err) {
      showToast('Verification failed', 'error');
    }
  };

  // IP Actions
  const handleAddIP = async (data: { ipAddress: string; hostname?: string; domainId?: string }) => {
    try {
      const res = await safeFetch<MonitoredIP>('/api/ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok || !res.data) {
        throw new Error(res.error || 'Failed to add IP');
      }
      const newIP = res.data;
      setIps((prev) => [newIP, ...prev]);
      showToast(`Sending IP ${data.ipAddress} added to monitoring.`, 'success');
      await loadInitialData();
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleDeleteIP = async (id: string) => {
    try {
      const res = await safeFetch(`/api/ips/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIps((prev) => prev.filter((ip) => ip.id !== id));
        showToast('IP removed from monitoring.', 'info');
        await loadInitialData();
      } else {
        showToast(res.error || 'Failed to delete IP', 'error');
      }
    } catch (err) {
      showToast('Failed to delete IP', 'error');
    }
  };

  // Fleet Sync All
  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await safeFetch<{ domainsProcessed: number; success: boolean }>('/api/cron/sync-reputation', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer cron-sync-secret-auth-key-12345',
        },
      });
      if (res.ok && res.data) {
        showToast(`Fleet sync complete: ${res.data.domainsProcessed} domains updated with Postmaster API.`, 'success');
        await loadInitialData();
        if (selectedDomainId) {
          await loadHistory(selectedDomainId, days);
        }
      } else {
        throw new Error(res.error || 'Sync failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger Cron simulator
  const handleTriggerCron = async (secret: string) => {
    const res = await safeFetch('/api/cron/sync-reputation', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Cron invocation rejected');
    }
    await loadInitialData();
    if (selectedDomainId) {
      await loadHistory(selectedDomainId, days);
    }
    return res.data;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onLoginDemo={handleLoginDemo}
        onSyncAll={handleSyncAll}
        isSyncing={isSyncing}
        onOpenCronModal={() => setIsCronModalOpen(true)}
        onOpenAdvisor={() => setIsAdvisorOpen(true)}
        oauthConfigured={oauthConfigured}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        {/* Google OAuth Banner if demo mode or unauthenticated */}
        {(!user || !oauthConfigured) && (
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Live Google Postmaster Tools API Ready
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold">
                    v1 REST Scope Supported
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Postmaster Pulse connects directly to your Google Postmaster account with the{' '}
                  <code className="text-indigo-300 font-mono text-[11px]">https://www.googleapis.com/auth/postmaster.readonly</code>{' '}
                  OAuth scope. You are currently exploring preloaded enterprise deliverability data in full-fidelity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsOAuthModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                OAuth Setup Guide
              </button>

              <a
                href="/api/auth/google"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Connect Google Account</span>
              </a>
            </div>
          </div>
        )}

        {/* Loading State or Fleet Content */}
        {isLoadingFleet ? (
          <div className="glass-panel rounded-2xl p-16 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-300">
              Initializing Google Postmaster Telemetry & Fleet State...
            </p>
          </div>
        ) : (
          <>
            {/* 1. Fleet Overview KPI Cards */}
            {overview && (
              <OverviewCards
                metrics={overview}
                onOpenAdvisor={() => setIsAdvisorOpen(true)}
                onOpenCronModal={() => setIsCronModalOpen(true)}
              />
            )}

            {/* 2. Historical Trends & Trajectory Visualizer */}
            <ReputationTrajectoryChart
              domains={domains}
              selectedDomainId={selectedDomainId}
              onSelectDomain={(id) => setSelectedDomainId(id)}
              history={history}
              days={days}
              onSelectDays={(d) => setDays(d)}
              isLoading={isHistoryLoading}
            />
          </>
        )}

        {/* Navigation Tabs for Domain vs IP Management */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Sending Domains ({domains.length})</span>
            </button>

            <button
              onClick={() => setCurrentTab('ips')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'ips'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Sending IPs ({ips.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLogsDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Audit Logs</span>
            </button>
          </div>
        </div>

        {/* Content based on Active Tab */}
        {currentTab === 'overview' && (
          <DomainManagement
            domains={domains}
            onAddDomain={handleAddDomain}
            onDeleteDomain={handleDeleteDomain}
            onSyncDomain={handleSyncDomain}
            onVerifyDomain={handleVerifyDomain}
            onSelectDomainForChart={(id) => setSelectedDomainId(id)}
            selectedDomainId={selectedDomainId}
          />
        )}

        {currentTab === 'ips' && (
          <IPManagement
            ips={ips}
            domains={domains}
            onAddIP={handleAddIP}
            onDeleteIP={handleDeleteIP}
          />
        )}

        {/* Footer info & architecture badge */}
        <footer className="pt-8 pb-4 text-center text-xs text-slate-500 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Postmaster Pulse Engine &bull; PostgreSQL &bull; Drizzle ORM</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsOAuthModalOpen(true)}
              className="hover:text-slate-400 underline cursor-pointer"
            >
              OAuth Configuration
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsCronModalOpen(true)}
              className="hover:text-slate-400 underline cursor-pointer"
            >
              Cron Scheduling
            </button>
            <span>&bull;</span>
            <a
              href="https://support.google.com/mail/answer/9981691"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-400 inline-flex items-center gap-1"
            >
              Google Postmaster Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </footer>
      </main>

      {/* Modals & Drawers */}
      <CronSimulatorModal
        isOpen={isCronModalOpen}
        onClose={() => setIsCronModalOpen(false)}
        onTriggerCron={handleTriggerCron}
      />

      <AIDiagnosticsModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        domains={domains}
        selectedDomainId={selectedDomainId}
      />

      <GoogleOAuthModal
        isOpen={isOAuthModalOpen}
        onClose={() => setIsOAuthModalOpen(false)}
        oauthConfigured={oauthConfigured}
      />

      <SyncLogsDrawer
        isOpen={isLogsDrawerOpen}
        onClose={() => setIsLogsDrawerOpen(false)}
        logs={syncLogs}
      />
    </div>
  );
}
