import React, { useState } from 'react';
import type { MonitoredDomain, ReputationStatus } from '../types/index.ts';
import { StatusBadge } from './StatusBadge.tsx';
import {
  Globe,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  AlertCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  domains: MonitoredDomain[];
  onAddDomain: (domainName: string) => Promise<void>;
  onDeleteDomain: (id: string) => Promise<void>;
  onSyncDomain: (id: string) => Promise<void>;
  onVerifyDomain: (id: string) => Promise<void>;
  onSelectDomainForChart: (id: string) => void;
  selectedDomainId: string;
}

export const DomainManagement: React.FC<Props> = ({
  domains,
  onAddDomain,
  onDeleteDomain,
  onSyncDomain,
  onVerifyDomain,
  onSelectDomainForChart,
  selectedDomainId,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [dnsModalDomain, setDnsModalDomain] = useState<MonitoredDomain | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddDomain(newDomainInput.trim());
      setNewDomainInput('');
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncClick = async (id: string) => {
    setSyncingId(id);
    try {
      await onSyncDomain(id);
    } finally {
      setSyncingId(null);
    }
  };

  const filteredDomains = domains.filter((d) => {
    const matchesSearch = d.domainName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || d.domainReputation === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Top action bar */}
      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Monitored Sending Domains
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Google Postmaster verified sending domains with deliverability telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-48 sm:w-60"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Reputations</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
              <option value="BAD">Bad Only</option>
            </select>
          </div>

          {/* Add domain button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {/* Domain Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-5">Domain</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4">Reputation</th>
              <th className="py-3 px-4">Spam Rate</th>
              <th className="py-3 px-4">Auth (DKIM / SPF / DMARC)</th>
              <th className="py-3 px-4">TLS Encryption</th>
              <th className="py-3 px-4">Delivery Errors</th>
              <th className="py-3 px-4">Last Synced</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredDomains.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">
                        {domains.length === 0 ? 'No Sending Domains Monitored in this Account' : 'No domains match your filter'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        {domains.length === 0
                          ? 'Register your email sending domain or subdomain to obtain your official Google Postmaster DNS TXT / CNAME verification keys.'
                          : 'Try clearing your search term or reputation filter.'}
                      </p>
                    </div>
                    {domains.length === 0 && (
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Your First Domain</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredDomains.map((dom) => {
                const isSelected = dom.id === selectedDomainId;
                const isSpamHigh = dom.spamRate > 0.003; // >0.3%
                const isSpamWarning = dom.spamRate > 0.001; // >0.1%

                return (
                  <tr
                    key={dom.id}
                    className={`transition-colors hover:bg-slate-800/40 ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Domain Name */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            dom.verificationStatus === 'verified'
                              ? 'bg-emerald-400'
                              : 'bg-amber-400 animate-pulse'
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            {dom.domainName}
                            {isSelected && (
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded font-mono font-normal">
                                Active Chart
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {dom.ipCount || 0} Sending IPs mapped
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3.5 px-4">
                      {dom.verificationStatus === 'verified' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => setDnsModalDomain(dom)}
                          className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Pending DNS
                        </button>
                      )}
                    </td>

                    {/* Reputation Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={dom.domainReputation} size="sm" />
                    </td>

                    {/* Spam Rate */}
                    <td className="py-3.5 px-4">
                      {dom.verificationStatus === 'verified' ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              isSpamHigh
                                ? 'text-rose-400'
                                : isSpamWarning
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {(dom.spamRate * 100).toFixed(2)}%
                          </span>
                          {isSpamHigh && (
                            <span
                              title="Spam rate exceeds Google Postmaster 0.3% threshold. High risk of inbox deliverability degradation."
                              className="text-rose-400 bg-rose-500/10 p-0.5 rounded"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">--</span>
                      )}
                    </td>

                    {/* Auth breakdown */}
                    <td className="py-3.5 px-4">
                      {dom.verificationStatus === 'verified' ? (
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span title="DKIM Pass Rate" className="text-sky-400">
                            D: {Math.round(dom.dkimSuccessRate * 100)}%
                          </span>
                          <span className="text-slate-600">|</span>
                          <span title="SPF Pass Rate" className="text-purple-400">
                            S: {Math.round(dom.spfSuccessRate * 100)}%
                          </span>
                          <span className="text-slate-600">|</span>
                          <span title="DMARC Alignment Rate" className="text-emerald-400">
                            M: {Math.round(dom.dmarcSuccessRate * 100)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">Pending DNS</span>
                      )}
                    </td>

                    {/* TLS Encryption */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {dom.verificationStatus === 'verified' ? `${Math.round(dom.tlsRate * 100)}%` : '--'}
                    </td>

                    {/* Delivery Errors */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {dom.verificationStatus === 'verified' ? `${(dom.deliveryErrorsRate * 100).toFixed(2)}%` : '--'}
                    </td>

                    {/* Last Synced */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                      {new Date(dom.lastSyncedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectDomainForChart(dom.id)}
                          title="View Trajectory in Chart"
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDnsModalDomain(dom)}
                          title="View DNS Records"
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleSyncClick(dom.id)}
                          disabled={syncingId === dom.id}
                          title="Sync Google Postmaster Telemetry"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${syncingId === dom.id ? 'animate-spin text-emerald-400' : ''}`}
                          />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Remove ${dom.domainName} from Postmaster monitoring?`)) {
                              onDeleteDomain(dom.id);
                            }
                          }}
                          title="Delete Domain"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Domain Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              Add Monitored Sending Domain
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add your email sending domain or subdomain to track official Google Postmaster Tools reputation and spam rates.
            </p>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Domain Name or Subdomain
                </label>
                <input
                  type="text"
                  placeholder="e.g. notifications.yourcompany.com"
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1.5 block">
                  Tip: It is best practice to add specific sending subdomains (e.g., mail.example.com) rather than the root apex domain.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newDomainInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Add Domain & Generate DNS Tokens'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DNS Records Verification Modal */}
      {dnsModalDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                  Google Postmaster DNS Verification
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Domain: <span className="text-slate-200 font-mono font-semibold">{dnsModalDomain.domainName}</span>
                </p>
              </div>
              <button
                onClick={() => setDnsModalDomain(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Option 1: DNS TXT Record (Recommended)
                  </span>
                  <button
                    onClick={() => handleCopy(dnsModalDomain.txtRecord, 'txt')}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    {copiedKey === 'txt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'txt' ? 'Copied!' : 'Copy Value'}
                  </button>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs text-emerald-400 select-all break-all">
                  {dnsModalDomain.txtRecord}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Option 2: DNS CNAME Record
                  </span>
                  <button
                    onClick={() => handleCopy(dnsModalDomain.cnameRecord, 'cname')}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    {copiedKey === 'cname' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'cname' ? 'Copied!' : 'Copy CNAME'}
                  </button>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs text-sky-400 select-all break-all">
                  {dnsModalDomain.cnameRecord}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
                <p className="font-semibold mb-1">How Google Postmaster Verification Works:</p>
                <p className="text-[11px] text-indigo-300/90 leading-relaxed">
                  Google queries your public DNS zone to verify that you own or administer the sending domain before releasing Gmail deliverability and spam telemetry.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDnsModalDomain(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              {dnsModalDomain.verificationStatus !== 'verified' && (
                <button
                  type="button"
                  onClick={async () => {
                    await onVerifyDomain(dnsModalDomain.id);
                    setDnsModalDomain(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify DNS Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
