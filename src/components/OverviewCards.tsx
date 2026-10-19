import React from 'react';
import type { OverviewMetrics } from '../types/index.ts';
import {
  Globe,
  Server,
  AlertTriangle,
  ShieldCheck,
  Lock,
  XOctagon,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  metrics: OverviewMetrics;
  onOpenAdvisor: () => void;
  onOpenCronModal: () => void;
}

export const OverviewCards: React.FC<Props> = ({ metrics, onOpenAdvisor, onOpenCronModal }) => {
  const isSpamSafe = metrics.averageSpamRate <= 0.001; // <= 0.1%
  const isSpamCritical = metrics.averageSpamRate > 0.003; // > 0.3%

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Monitored Domains Card */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-md relative group hover:border-indigo-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold">Tracked Domains</span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white font-mono">
            {metrics.totalDomains}
          </span>
          <span className="text-xs text-emerald-400 flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3" />
            {metrics.verifiedDomains} verified
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="text-emerald-400 font-semibold">{metrics.highReputationCount} High</span>
          <span>•</span>
          <span className="text-amber-400 font-semibold">{metrics.mediumReputationCount} Med</span>
          {metrics.lowReputationCount > 0 && (
            <>
              <span>•</span>
              <span className="text-orange-400 font-semibold">{metrics.lowReputationCount} Low</span>
            </>
          )}
        </div>
      </div>

      {/* 2. Monitored Sending IPs Card */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-md relative group hover:border-sky-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold">Sending IPs</span>
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Server className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white font-mono">
            {metrics.totalIPs}
          </span>
          <span className="text-xs text-slate-400">active subnets</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          Reverse DNS & PTR aligned
        </div>
      </div>

      {/* 3. User-Reported Spam Rate Card */}
      <div className={`glass-panel rounded-2xl p-4 border shadow-md relative transition-all ${
        isSpamCritical
          ? 'border-rose-500/40 bg-rose-950/10 glow-rose'
          : !isSpamSafe
          ? 'border-amber-500/40'
          : 'border-slate-800 hover:border-emerald-500/40'
      }`}>
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold">Avg Spam Rate</span>
          <div
            className={`p-1.5 rounded-lg ${
              isSpamCritical
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-2xl font-extrabold font-mono ${
              isSpamCritical
                ? 'text-rose-400'
                : !isSpamSafe
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {(metrics.averageSpamRate * 100).toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono">/ &lt;0.3% max</span>
        </div>
        <div className="mt-2 text-[11px] flex items-center justify-between">
          <span className="text-slate-400">
            {isSpamCritical ? '⚠️ Exceeds 0.3% threshold' : 'Target safe: <0.10%'}
          </span>
        </div>
      </div>

      {/* 4. Authentication Alignment (DMARC / DKIM / SPF) */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-md relative group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold">Auth Alignment</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white font-mono">
            {Math.round(metrics.averageDmarcRate * 100)}%
          </span>
          <span className="text-xs text-emerald-400 font-medium">DMARC</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2 font-mono">
          <span>DKIM: {Math.round(metrics.averageDkimRate * 100)}%</span>
          <span>•</span>
          <span>SPF: {Math.round(metrics.averageSpfRate * 100)}%</span>
        </div>
      </div>

      {/* 5. TLS Encryption Inbound/Outbound */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-md relative group hover:border-purple-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold">TLS Encryption</span>
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Lock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white font-mono">
            {Math.round(metrics.averageTlsRate * 100)}%
          </span>
          <span className="text-xs text-purple-400">in-transit</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          STARTTLS enforced across relays
        </div>
      </div>

      {/* 6. Fleet Diagnostics & Cron Quick Action */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col justify-between group hover:border-indigo-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold">AI Deliverability & Cron</span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 space-y-1.5">
          <button
            onClick={onOpenAdvisor}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Run AI Diagnostics</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenCronModal}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Cron API Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
