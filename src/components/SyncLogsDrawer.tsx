import React from 'react';
import type { SyncLog } from '../types/index.ts';
import { History, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: SyncLog[];
}

export const SyncLogsDrawer: React.FC<Props> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md h-full p-6 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Postmaster Sync Audit Logs</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            History of automated cron runs and manual Google Postmaster API telemetry fetches.
          </p>

          <div className="mt-5 space-y-3 overflow-y-auto max-h-[75vh] pr-1">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No sync events recorded yet.
              </div>
            ) : (
              logs.map((log) => {
                const isSuccess = log.status === 'success';
                const isPartial = log.status === 'partial';

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isSuccess ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isPartial ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {log.triggeredBy} Sync
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {log.details}
                    </p>

                    <div className="text-[11px] text-indigo-400 font-mono">
                      Domains Processed: {log.domainsProcessed}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
};
