import React from 'react';

export interface StreakStatsBarProps {
  id?: string;
  streak: number;
  reefsClearedInRun?: number;
  reefColumn?: number;
  highScore?: number;
  isNewHighScore?: boolean;
  timeSeconds?: number;
  currentFastStreak?: number;
  isGameOver?: boolean;
  className?: string;
}

export const StreakStatsBar: React.FC<StreakStatsBarProps> = ({
  id = 'streak-stats-bar',
  streak,
  reefsClearedInRun,
  reefColumn,
  highScore = 0,
  isNewHighScore = false,
  timeSeconds,
  currentFastStreak,
  isGameOver = false,
  className = '',
}) => {
  const isUnder10s = timeSeconds !== undefined && timeSeconds <= 10.05 && !isGameOver;
  const bestScore = Math.max(highScore, streak);

  const streakTooltip = isGameOver
    ? `Survival Streak: ${streak} columns (${
        reefsClearedInRun && reefsClearedInRun > 0
          ? `${reefsClearedInRun} ${reefsClearedInRun === 1 ? 'Reef' : 'Reefs'} Cleared`
          : `Reached Column ${reefColumn || 1}/10`
      })`
    : `Survival Streak: ${streak} columns (${reefsClearedInRun ?? 1} reefs cleared in run)`;

  const timeTooltip = isUnder10s
    ? `Time: ${timeSeconds.toFixed(1)}s (Fast Reef #${currentFastStreak ?? 1}/10 for Gulf Stream)`
    : timeSeconds !== undefined
    ? `Time: ${timeSeconds.toFixed(1)}s`
    : undefined;

  return (
    <div
      id={id}
      className={`w-full mb-3 px-3 py-1.5 bg-slate-950/70 border border-cyan-500/30 rounded-2xl flex items-center justify-between gap-1.5 sm:gap-2 text-xs backdrop-blur-md shadow-md relative z-10 ${className}`}
    >
      {/* Survival Streak */}
      <div
        className="flex items-center gap-1 shrink-0"
        title={streakTooltip}
      >
        <span className="text-cyan-400">🔥</span>
        <span className="text-slate-400 text-[10px] uppercase font-bold hidden sm:inline">Streak:</span>
        <span className="font-game font-bold text-cyan-200">
          {streak}
          <span className="text-[9px] text-cyan-300/70 font-sans ml-0.5">cols</span>
        </span>
        {isNewHighScore && (
          <span className="px-1 py-0.5 bg-amber-400 text-slate-950 text-[8px] font-black rounded font-sans leading-none ml-0.5">
            BEST
          </span>
        )}
      </div>

      {/* Subtle Divider */}
      <div className="w-px h-3 bg-white/15 shrink-0" />

      {/* Best Streak */}
      <div
        className="flex items-center gap-1 shrink-0"
        title={`Best Streak: ${bestScore} columns`}
      >
        <span className="text-amber-400">🏆</span>
        <span className="text-slate-400 text-[10px] uppercase font-bold hidden sm:inline">Best:</span>
        <span className="font-game font-bold text-amber-300">
          {bestScore}
          <span className="text-[9px] text-amber-200/70 font-sans ml-0.5">cols</span>
        </span>
      </div>

      {/* Time Score */}
      {timeSeconds !== undefined && (
        <>
          <div className="w-px h-3 bg-white/15 shrink-0" />
          <div
            className="flex items-center gap-1 shrink-0"
            title={timeTooltip}
          >
            <span className={isUnder10s ? 'text-amber-300' : 'text-slate-400'}>
              {isUnder10s ? '⚡' : '⏱️'}
            </span>
            <span className="text-slate-400 text-[10px] uppercase font-bold hidden sm:inline">Time:</span>
            <span className={`font-mono font-bold ${isUnder10s ? 'text-amber-300' : 'text-slate-200'}`}>
              {timeSeconds.toFixed(1)}s
            </span>
          </div>
        </>
      )}
    </div>
  );
};
