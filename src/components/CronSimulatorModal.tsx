import React, { useState } from 'react';
import { Calendar, Play, Key, Terminal, CheckCircle2, AlertCircle, Copy, Check, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTriggerCron: (secret: string) => Promise<any>;
}

export const CronSimulatorModal: React.FC<Props> = ({ isOpen, onClose, onTriggerCron }) => {
  const [secretInput, setSecretInput] = useState('cron-sync-secret-auth-key-12345');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const data = await onTriggerCron(secretInput);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const curlExample = `curl -X POST https://your-app.vercel.app/api/cron/sync-reputation \\
  -H "Authorization: Bearer ${secretInput}"`;

  const vercelJsonExample = `{
  "crons": [
    {
      "path": "/api/cron/sync-reputation",
      "schedule": "0 4 * * *"
    }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Automated Cron Synchronization Route
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Endpoint: <code className="text-indigo-300 font-mono">/api/cron/sync-reputation</code> secured by <code className="text-slate-300 font-mono">CRON_SECRET</code>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* CRON_SECRET Input & Test Trigger */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                CRON_SECRET Authorization Token
              </label>
              <span className="text-[10px] text-slate-400">Header: Authorization: Bearer &lt;SECRET&gt;</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Invoking...' : 'Run Cron Now'}</span>
              </button>
            </div>
          </div>

          {/* Execution Result Box */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cron Execution Succeeded (HTTP 200 OK)</span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Cron Execution Failed</span>
              </div>
              <p className="text-xs text-rose-300 font-mono">{error}</p>
            </div>
          )}

          {/* Vercel vercel.json Deployment Snippet */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                Vercel Cron Configuration (vercel.json)
              </span>
              <button
                onClick={() => handleCopy(vercelJsonExample, 'vercel')}
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
              >
                {copiedKey === 'vercel' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'vercel' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
              {vercelJsonExample}
            </pre>
            <p className="text-[11px] text-slate-400">
              Vercel invokes <code className="text-slate-300">/api/cron/sync-reputation</code> automatically every day at 04:00 UTC and transmits Google Postmaster updates to PostgreSQL.
            </p>
          </div>

          {/* cURL Manual Invocation */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                External CLI / Cloud Scheduler Trigger
              </span>
              <button
                onClick={() => handleCopy(curlExample, 'curl')}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                {copiedKey === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'curl' ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
              {curlExample}
            </pre>
          </div>
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
