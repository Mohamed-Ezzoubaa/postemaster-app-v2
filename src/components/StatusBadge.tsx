import React from 'react';
import type { ReputationStatus } from '../types/index.ts';
import { ShieldCheck, AlertTriangle, ShieldAlert, XCircle, HelpCircle } from 'lucide-react';

interface Props {
  status: ReputationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md', showIcon = true }) => {
  const config = {
    HIGH: {
      label: 'High',
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      dot: 'bg-emerald-400 shadow-emerald-500/50',
      icon: ShieldCheck,
      description: 'Good sending reputation with almost no spam marks. Gmail filters treat mail favorably.',
    },
    MEDIUM: {
      label: 'Medium',
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      dot: 'bg-amber-400 shadow-amber-500/50',
      icon: AlertTriangle,
      description: 'Known good sender with occasional low spam spikes. Safe deliverability.',
    },
    LOW: {
      label: 'Low',
      bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      dot: 'bg-orange-400 shadow-orange-500/50',
      icon: ShieldAlert,
      description: 'History of sending considerable spam. Mail likely to land in spam folder.',
    },
    BAD: {
      label: 'Bad',
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      dot: 'bg-rose-400 shadow-rose-500/50',
      icon: XCircle,
      description: 'History of egregious spam volume. High probability of outright rejection or spam filtering.',
    },
    UNKNOWN: {
      label: 'Unknown',
      bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
      dot: 'bg-slate-400',
      icon: HelpCircle,
      description: 'Insufficient volume data to compute reputation (<100 daily Gmail messages).',
    },
  }[status] || {
    label: status,
    bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    dot: 'bg-slate-400',
    icon: HelpCircle,
    description: 'Status unavailable',
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-medium',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      title={config.description}
      className={`inline-flex items-center rounded-full border transition-colors cursor-default select-none ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${config.dot}`} />
      {showIcon && <Icon className={iconSizes} />}
      <span className="font-semibold uppercase tracking-wider">{config.label}</span>
    </span>
  );
};
