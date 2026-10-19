import React, { useState } from 'react';
import { Key, ShieldCheck, CheckCircle2, Copy, Check, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  oauthConfigured: boolean;
}

export const GoogleOAuthModal: React.FC<Props> = ({ isOpen, onClose, oauthConfigured }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const originUrl = window.location.origin;
  const redirectUri = `${originUrl}/api/auth/google/callback`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              Google Postmaster Tools OAuth 2.0 Integration
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Connect your Google Workspace / Gmail Postmaster account securely
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Google Cloud Console Configuration
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              To connect real Google Postmaster data, create an OAuth 2.0 Client ID in your{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300 inline-flex items-center gap-0.5"
              >
                Google Cloud Console <ExternalLink className="w-3 h-3" />
              </a>{' '}
              with these settings:
            </p>

            {/* Redirect URI */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>Authorized Redirect URI:</span>
                <button
                  onClick={() => handleCopy(redirectUri, 'uri')}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedKey === 'uri' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'uri' ? 'Copied' : 'Copy URI'}</span>
                </button>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 break-all select-all">
                {redirectUri}
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-1">
              <span className="text-xs text-slate-300 font-semibold">Requested Scope:</span>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-sky-400 break-all">
                https://www.googleapis.com/auth/postmaster.readonly
              </div>
            </div>

            {/* Env vars */}
            <div className="space-y-1 text-xs">
              <span className="font-semibold text-slate-300">Environment Variables to set in .env:</span>
              <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"{'\n'}
                GOOGLE_CLIENT_SECRET="your-client-secret"
              </pre>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
            <div className="text-xs">
              <div className="font-semibold text-indigo-300">OAuth Status:</div>
              <div className="text-slate-400 text-[11px]">
                {oauthConfigured
                  ? 'Credentials configured. Ready to link your Google account.'
                  : 'Operating in Demo Mode with preloaded enterprise deliverability data.'}
              </div>
            </div>
            <a
              href="/api/auth/google"
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              Connect with Google
            </a>
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
