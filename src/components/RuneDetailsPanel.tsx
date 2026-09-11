import React from 'react';
import { BadgeDefinition, BadgeProgress } from '../utils/badges';

export interface RuneDetailsPanelProps {
  badge: BadgeDefinition;
  progress: BadgeProgress;
  className?: string;
  id?: string;
  onClick?: (e: React.MouseEvent) => void;
  borderless?: boolean;
}

export const RuneDetailsPanel: React.FC<RuneDetailsPanelProps> = ({
  badge,
  progress,
  className = '',
  id = 'selected-badge-details',
  onClick,
  borderless = false,
}) => {
  const containerClasses = borderless
    ? `w-full text-left transition-all ${className}`
    : `p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-left transition-all ${className}`;

  return (
    <div id={id} className={containerClasses} onClick={onClick}>
      {/* Header: Emoji, Name & Status pill */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-lg shrink-0">{badge.emoji}</span>
          <span className="text-xs font-black uppercase tracking-wider text-cyan-300 font-game truncate">
            {badge.name}
          </span>
        </div>
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
            progress.isAchieved
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800 text-slate-400 border-white/10'
          }`}
        >
          {progress.isAchieved ? '✓ Unlocked' : '🔒 Locked'}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        {/* Goal */}
        <div className="flex items-start justify-between gap-2 bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-white/5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mt-0.5">
            Goal:
          </span>
          <span className="text-xs font-bold text-slate-100 text-right break-words flex-1 leading-snug">
            {badge.requirement}
          </span>
        </div>

        {/* Progress with actual numbers and progress bar */}
        <div className="flex flex-col gap-1 bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Progress:
            </span>
            <span className="text-xs font-bold font-mono text-cyan-300">
              {progress.current} / {progress.target} {progress.unit}{' '}
              <span className="text-slate-400 font-sans font-normal text-[11px]">
                ({progress.percent}%)
              </span>
            </span>
          </div>
          <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-white/10 mt-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress.isAchieved
                  ? badge.id === 'gulf_stream'
                    ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                    : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  : 'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.4)]'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        {/* Rune Power */}
        <div className="flex items-center justify-between gap-2 bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-white/5">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 shrink-0">
            Rune Power:
          </span>
          <span className="text-xs font-bold text-amber-300 text-right break-words flex-1 leading-snug">
            {badge.effect}
          </span>
        </div>
      </div>
    </div>
  );
};
