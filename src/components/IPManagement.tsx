import React, { useState } from 'react';
import type { MonitoredDomain, MonitoredIP } from '../types/index.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { Server, Plus, Trash2, Search, Network, HardDrive, BarChart3 } from 'lucide-react';

interface Props {
  ips: MonitoredIP[];
  domains: MonitoredDomain[];
  onAddIP: (data: { ipAddress: string; hostname?: string; domainId?: string }) => Promise<void>;
  onDeleteIP: (id: string) => Promise<void>;
}

export const IPManagement: React.FC<Props> = ({ ips, domains, onAddIP, onDeleteIP }) => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ipInput, setIpInput] = useState('');
  const [hostnameInput, setHostnameInput] = useState('');
  const [domainIdInput, setDomainIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredIPs = ips.filter((ip) => {
    const q = search.toLowerCase();
    return (
      ip.ipAddress.toLowerCase().includes(q) ||
      ip.hostname.toLowerCase().includes(q) ||
      (ip.domainName && ip.domainName.toLowerCase().includes(q))
    );
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddIP({
        ipAddress: ipInput.trim(),
        hostname: hostnameInput.trim() || undefined,
        domainId: domainIdInput || undefined,
      });
      setIpInput('');
      setHostnameInput('');
      setDomainIdInput('');
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header bar */}
      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-400" />
            Monitored Sending IP Addresses
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dedicated IP deliverability telemetry, PTR hostnames, and Google Postmaster subnet reputation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search IPs or hostnames..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all w-56"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add IP</span>
          </button>
        </div>
      </div>

      {/* IP Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-5">IP Address</th>
              <th className="py-3 px-4">PTR / Reverse DNS</th>
              <th className="py-3 px-4">Subnet Range</th>
              <th className="py-3 px-4">Assigned Domain</th>
              <th className="py-3 px-4">Reputation</th>
              <th className="py-3 px-4">Sample Volume</th>
              <th className="py-3 px-4">Spam Rate</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredIPs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No monitored sending IPs configured.
                </td>
              </tr>
            ) : (
              filteredIPs.map((ip) => (
                <tr key={ip.id} className="transition-colors hover:bg-slate-800/40">
                  {/* IP Address */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-sky-400" />
                      <span className="font-mono font-bold text-white text-xs">
                        {ip.ipAddress}
                      </span>
                    </div>
                  </td>

                  {/* PTR Hostname */}
                  <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                    {ip.hostname}
                  </td>

                  {/* Subnet */}
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    {ip.subnet || 'N/A'}
                  </td>

                  {/* Domain */}
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-200">
                      {ip.domainName || 'Unassigned'}
                    </span>
                  </td>

                  {/* IP Reputation */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={ip.ipReputation} size="sm" />
                  </td>

                  {/* Volume */}
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {ip.sampleVolume.toLocaleString()} msgs
                  </td>

                  {/* Spam Rate */}
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    {(ip.spamRate * 100).toFixed(2)}%
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Remove IP ${ip.ipAddress} from monitoring?`)) {
                          onDeleteIP(ip.id);
                        }
                      }}
                      title="Delete IP"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add IP Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-sky-400" />
              Add Monitored Sending IP
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add your outbound MTA sending IP address to monitor its Google Postmaster IP reputation and subnet sample telemetry.
            </p>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  IP Address (IPv4 or IPv6)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 198.51.100.45"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reverse DNS (PTR Hostname) - Optional
                </label>
                <input
                  type="text"
                  placeholder="e.g. relay-01.mail.company.com"
                  value={hostnameInput}
                  onChange={(e) => setHostnameInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Associate with Sending Domain - Optional
                </label>
                <select
                  value={domainIdInput}
                  onChange={(e) => setDomainIdInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                >
                  <option value="">None (Independent IP)</option>
                  {domains.map((dom) => (
                    <option key={dom.id} value={dom.id}>
                      {dom.domainName}
                    </option>
                  ))}
                </select>
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
                  disabled={isSubmitting || !ipInput.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Adding...' : 'Add Sending IP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
