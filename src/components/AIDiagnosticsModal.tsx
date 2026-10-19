import React, { useState } from 'react';
import type { MonitoredDomain } from '../types/index.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { Sparkles, ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { safeFetch } from '../utils/api.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  domains: MonitoredDomain[];
  selectedDomainId: string;
}

export const AIDiagnosticsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  domains,
  selectedDomainId,
}) => {
  const [activeId, setActiveId] = useState(selectedDomainId || (domains[0]?.id ?? ''));
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);

  if (!isOpen) return null;

  const currentDomain = domains.find((d) => d.id === activeId) || domains[0];

  const runDiagnosis = async (domainId: string) => {
    setIsLoading(true);
    try {
      const res = await safeFetch<any>('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });
      if (res.ok && res.data) {
        setReport(res.data);
      } else {
        setReport({
          domain: currentDomain?.domainName || 'Domain',
          reputation: currentDomain?.domainReputation || 'UNKNOWN',
          severity: 'warning',
          summary: res.error || 'Diagnostic service temporarily unreachable. Ensure API route is mapped.',
          recommendations: [
            'Verify SPF record contains valid sending IPs and includes (maximum 10 lookups).',
            'Verify DKIM selector key is at least 2048-bit RSA.',
            'Ensure DMARC p=reject or p=quarantine policy is active with rua reporting.',
            'Monitor user-reported spam rates to stay strictly below Google 0.3% threshold.'
          ]
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeId) {
      runDiagnosis(activeId);
    }
  }, [activeId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              AI Deliverability Diagnostic Engine
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Google Bulk Sender Compliance Audit (SPF, DKIM, DMARC, RFC 8058, & Spam Rates)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Domain selection */}
        <div className="mt-5 flex items-center justify-between gap-4">
          <label className="text-xs font-semibold text-slate-300">
            Select Domain for Analysis:
          </label>
          <select
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.domainName} ({d.domainReputation})
              </option>
            ))}
          </select>
        </div>

        {/* Report Content */}
        <div className="mt-5 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Analyzing Google Postmaster signals & DNS alignment...</span>
            </div>
          ) : report ? (
            <>
              {/* Summary card */}
              <div className={`p-4 rounded-xl border ${
                report.severity === 'critical'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : report.severity === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-emerald-950/20 border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={report.reputation} size="sm" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {report.severity} Deliverability Risk
                    </span>
                  </div>
                  <button
                    onClick={() => runDiagnosis(activeId)}
                    className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-run
                  </button>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {report.summary}
                </p>
              </div>

              {/* Actionable recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Recommended Deliverability Remediations
                </h4>
                <div className="space-y-2">
                  {report.recommendations.map((rec: string, index: number) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3"
                    >
                      <div className="mt-0.5 p-1 rounded-md bg-indigo-500/10 text-indigo-400">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Google Bulk Sender Compliance Checklist */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Google 2024+ Bulk Sender Mandates Checklist
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>SPF & DKIM Authenticated</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>DMARC Policy Enforced</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Spam Rate strictly below 0.3%</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>One-Click Unsubscribe (RFC 8058)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Valid Forward & Reverse DNS (PTR)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>TLS In-Transit Delivery</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-end mt-6 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
