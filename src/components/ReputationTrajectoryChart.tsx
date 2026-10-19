import React, { useState } from 'react';
import type { MonitoredDomain, ReputationHistoryPoint } from '../types/index.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { TrendingUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

interface Props {
  domains: MonitoredDomain[];
  selectedDomainId: string;
  onSelectDomain: (id: string) => void;
  history: ReputationHistoryPoint[];
  days: number;
  onSelectDays: (days: number) => void;
  isLoading?: boolean;
}

export const ReputationTrajectoryChart: React.FC<Props> = ({
  domains,
  selectedDomainId,
  onSelectDomain,
  history,
  days,
  onSelectDays,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'reputation' | 'spam_rate' | 'auth'>('spam_rate');
  const [hoveredPoint, setHoveredPoint] = useState<ReputationHistoryPoint | null>(null);

  const selectedDomain = domains.find((d) => d.id === selectedDomainId) || domains[0];

  // SVG dimensions
  const width = 850;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const pointsCount = history.length;

  // Coordinate mappers
  const getX = (index: number) => {
    if (pointsCount <= 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (pointsCount - 1)) * graphWidth;
  };

  // Convert status to numeric level (0: BAD, 1: LOW, 2: MEDIUM, 3: HIGH)
  const repToLevel = (status: string): number => {
    switch (status) {
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      case 'BAD': return 0;
      default: return 2;
    }
  };

  const getReputationY = (status: string) => {
    const level = repToLevel(status);
    return padding.top + graphHeight - (level / 3) * graphHeight;
  };

  // Spam rate: scaled up to 0.6% (0.006) max so 0.3% is near the middle
  const maxSpamScale = 0.006;
  const getSpamY = (rate: number) => {
    const clamped = Math.min(rate, maxSpamScale);
    return padding.top + graphHeight - (clamped / maxSpamScale) * graphHeight;
  };

  // Auth rate: scaled 80% to 100%
  const minAuthScale = 0.8;
  const getAuthY = (rate: number) => {
    const norm = Math.max(0, Math.min(1, (rate - minAuthScale) / (1 - minAuthScale)));
    return padding.top + graphHeight - norm * graphHeight;
  };

  // Generate SVG path strings
  const spamPath = history.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getSpamY(pt.userReportedSpamRatio);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const spamAreaPath = history.length > 0
    ? `${spamPath} L ${getX(history.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${padding.top + graphHeight} Z`
    : '';

  const dkimPath = history.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getAuthY(pt.dkimSuccessRatio);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const spfPath = history.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getAuthY(pt.spfSuccessRatio);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const dmarcPath = history.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getAuthY(pt.dmarcSuccessRatio);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Google 0.3% violation threshold Y
  const googleLimitY = getSpamY(0.003);
  const googleSafeY = getSpamY(0.001);

  // Compute summary stats for current view
  const currentSpam = selectedDomain?.spamRate ?? 0;
  const peakSpam = history.length > 0 ? Math.max(...history.map((h) => h.userReportedSpamRatio)) : 0;
  const avgDkim = history.length > 0
    ? (history.reduce((a, b) => a + b.dkimSuccessRatio, 0) / history.length) * 100
    : 100;
  const highDays = history.filter((h) => h.domainReputation === 'HIGH').length;

  if (domains.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-slate-800 shadow-xl text-center flex flex-col items-center justify-center gap-3">
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white">No Domain Trajectory History</h3>
        <p className="text-xs text-slate-400 max-w-md">
          Add your sending domain in the table below to start recording daily Google Postmaster reputation, DKIM alignment, and spam rate curves.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title, Domain selector and timeframe toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Reputation & Deliverability Trajectory
              </h2>
              <p className="text-xs text-slate-400">
                Official Google Postmaster Tools metrics tracked across time
              </p>
            </div>
          </div>
        </div>

        {/* Domain selection & timeframe buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDomainId}
            onChange={(e) => onSelectDomain(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            {domains.map((dom) => (
              <option key={dom.id} value={dom.id}>
                {dom.domainName} ({dom.domainReputation})
              </option>
            ))}
          </select>

          {/* Timeframe selector: 7d, 30d, 90d */}
          <div className="inline-flex rounded-xl bg-slate-900/90 border border-slate-800 p-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => onSelectDays(d)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  days === d
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('spam_rate')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'spam_rate'
                ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Spam Rate vs Google 0.3% Threshold
          </button>
          <button
            onClick={() => setActiveTab('reputation')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'reputation'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Domain Reputation Tier
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'auth'
                ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            DKIM / SPF / DMARC Rates
          </button>
        </div>

        {/* Summary Badges */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">Current Status:</span>
            {selectedDomain && <StatusBadge status={selectedDomain.domainReputation} size="sm" />}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">Peak Spam:</span>
            <span className={`font-mono font-semibold ${peakSpam > 0.003 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {(peakSpam * 100).toFixed(2)}%
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">High Tier Consistency:</span>
            <span className="font-mono text-indigo-400 font-semibold">
              {Math.round((highDays / (history.length || 1)) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative mt-2 w-full overflow-x-auto">
        {isLoading ? (
          <div className="h-60 flex items-center justify-center text-slate-500 gap-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading Postmaster telemetry history...</span>
          </div>
        ) : (
          <div className="min-w-[650px]">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-64 overflow-visible select-none"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="spamGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines & Labels */}
              {activeTab === 'spam_rate' && (
                <>
                  {/* Google Violation Limit Line (0.3%) */}
                  <line
                    x1={padding.left}
                    y1={googleLimitY}
                    x2={width - padding.right}
                    y2={googleLimitY}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                  <text
                    x={width - padding.right}
                    y={googleLimitY - 6}
                    textAnchor="end"
                    fill="#f43f5e"
                    fontSize="10"
                    fontWeight="600"
                    className="font-mono"
                  >
                    Google 0.30% Critical Spam Threshold
                  </text>

                  {/* Google Safe Zone Line (0.1%) */}
                  <line
                    x1={padding.left}
                    y1={googleSafeY}
                    x2={width - padding.right}
                    y2={googleSafeY}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                  <text
                    x={width - padding.right}
                    y={googleSafeY - 6}
                    textAnchor="end"
                    fill="#10b981"
                    fontSize="10"
                    fontWeight="500"
                    className="font-mono"
                  >
                    Google 0.10% Target Safe Zone
                  </text>

                  {/* Y Axis ticks */}
                  {[0.0, 0.001, 0.002, 0.003, 0.004, 0.005].map((val) => {
                    const y = getSpamY(val);
                    return (
                      <g key={val}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="2 4"
                          strokeWidth="0.5"
                          opacity="0.3"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 3}
                          textAnchor="end"
                          fill="#64748b"
                          fontSize="10"
                          className="font-mono"
                        >
                          {(val * 100).toFixed(1)}%
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

              {activeTab === 'reputation' && (
                <>
                  {['HIGH', 'MEDIUM', 'LOW', 'BAD'].map((status) => {
                    const y = getReputationY(status);
                    return (
                      <g key={status}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke="#334155"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                          opacity="0.4"
                        />
                        <text
                          x={padding.left - 10}
                          y={y + 4}
                          textAnchor="end"
                          fill="#94a3b8"
                          fontSize="11"
                          fontWeight="600"
                        >
                          {status}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

              {activeTab === 'auth' && (
                <>
                  {[0.8, 0.85, 0.9, 0.95, 1.0].map((val) => {
                    const y = getAuthY(val);
                    return (
                      <g key={val}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="2 4"
                          strokeWidth="0.5"
                          opacity="0.3"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 3}
                          textAnchor="end"
                          fill="#64748b"
                          fontSize="10"
                          className="font-mono"
                        >
                          {Math.round(val * 100)}%
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

              {/* Data Curves */}
              {activeTab === 'spam_rate' && (
                <>
                  <path d={spamAreaPath} fill="url(#spamGradient)" />
                  <path d={spamPath} fill="none" stroke="#818cf8" strokeWidth="2.5" />
                </>
              )}

              {activeTab === 'reputation' && (
                <>
                  {history.map((pt, i) => {
                    const x = getX(i);
                    const y = getReputationY(pt.domainReputation);
                    const color =
                      pt.domainReputation === 'HIGH'
                        ? '#10b981'
                        : pt.domainReputation === 'MEDIUM'
                        ? '#f59e0b'
                        : pt.domainReputation === 'LOW'
                        ? '#f97316'
                        : '#f43f5e';
                    return (
                      <g key={pt.id}>
                        {i > 0 && (
                          <line
                            x1={getX(i - 1)}
                            y1={getReputationY(history[i - 1].domainReputation)}
                            x2={x}
                            y2={y}
                            stroke={color}
                            strokeWidth="2.5"
                            opacity="0.7"
                          />
                        )}
                        <circle cx={x} cy={y} r="3.5" fill={color} />
                      </g>
                    );
                  })}
                </>
              )}

              {activeTab === 'auth' && (
                <>
                  <path d={dkimPath} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="none" />
                  <path d={spfPath} fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="3 2" />
                  <path d={dmarcPath} fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="none" />
                </>
              )}

              {/* X Axis dates (Sample 5 to 7 labels) */}
              {history
                .filter((_, idx) => idx % Math.max(1, Math.floor(history.length / 6)) === 0)
                .map((pt) => {
                  const idx = history.indexOf(pt);
                  const x = getX(idx);
                  return (
                    <text
                      key={pt.date}
                      x={x}
                      y={height - 8}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="10"
                      className="font-mono"
                    >
                      {pt.date.slice(5)}
                    </text>
                  );
                })}

              {/* Hover indicator lines & capture circles */}
              {history.map((pt, i) => {
                const x = getX(i);
                return (
                  <rect
                    key={pt.id}
                    x={x - 6}
                    y={padding.top}
                    width="12"
                    height={graphHeight}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredPoint(pt)}
                  />
                );
              })}

              {hoveredPoint && (
                <g>
                  <line
                    x1={getX(history.indexOf(hoveredPoint))}
                    y1={padding.top}
                    x2={getX(history.indexOf(hoveredPoint))}
                    y2={padding.top + graphHeight}
                    stroke="#94a3b8"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                    opacity="0.7"
                  />
                  {activeTab === 'spam_rate' && (
                    <circle
                      cx={getX(history.indexOf(hoveredPoint))}
                      cy={getSpamY(hoveredPoint.userReportedSpamRatio)}
                      r="5"
                      fill="#818cf8"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                </g>
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Floating Hover Tooltip Detail Box */}
      {hoveredPoint && (
        <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-300 font-semibold">{hoveredPoint.date}</span>
            <StatusBadge status={hoveredPoint.domainReputation} size="sm" />
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400">Spam Rate: </span>
              <span
                className={`font-mono font-bold ${
                  hoveredPoint.userReportedSpamRatio > 0.003
                    ? 'text-rose-400'
                    : hoveredPoint.userReportedSpamRatio > 0.001
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {(hoveredPoint.userReportedSpamRatio * 100).toFixed(3)}%
              </span>
            </div>

            <div>
              <span className="text-slate-400">DKIM: </span>
              <span className="font-mono text-sky-400 font-semibold">
                {(hoveredPoint.dkimSuccessRatio * 100).toFixed(1)}%
              </span>
            </div>

            <div>
              <span className="text-slate-400">SPF: </span>
              <span className="font-mono text-purple-400 font-semibold">
                {(hoveredPoint.spfSuccessRatio * 100).toFixed(1)}%
              </span>
            </div>

            <div>
              <span className="text-slate-400">DMARC: </span>
              <span className="font-mono text-emerald-400 font-semibold">
                {(hoveredPoint.dmarcSuccessRatio * 100).toFixed(1)}%
              </span>
            </div>

            <div>
              <span className="text-slate-400">Delivery Errors: </span>
              <span className="font-mono text-slate-300">
                {(hoveredPoint.deliveryErrorsRatio * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chart Footer legend */}
      {activeTab === 'auth' && (
        <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-sky-400 inline-block" />
            <span>DKIM Pass Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-purple-400 inline-block border-dashed" />
            <span>SPF Pass Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
            <span>DMARC Alignment</span>
          </div>
        </div>
      )}
    </div>
  );
};
