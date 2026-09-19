import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Lock, X } from 'lucide-react';
import { BadgeDefinition, BadgeProgress, getBadgeVisual } from '../utils/badges';

export interface RunePowerUnlockedPanelProps {
  badge: BadgeDefinition;
  isUnlocked?: boolean;
  progress?: BadgeProgress;
  delayIndex?: number;
  className?: string;
  isGameOver?: boolean;
  onClose?: () => void;
}

export const RunePowerUnlockedPanel: React.FC<RunePowerUnlockedPanelProps> = ({
  badge,
  isUnlocked = true,
  progress,
  delayIndex = 0,
  className = '',
  isGameOver = false,
  onClose,
}) => {
  const visual = getBadgeVisual(badge.id);

  if (!isUnlocked) {
    // LOCKED STATE: Unsaturated, completely static (no animations), says "Rune Power Locked", includes Progress Bar
    return (
      <div
        id={`rune-power-panel-${badge.id}`}
        className={`w-full relative overflow-hidden rounded-2xl border-2 border-slate-700/80 bg-slate-950/95 p-4 text-slate-300 shadow-2xl flex flex-col items-center text-center select-none ${className}`}
      >
        {/* Optional Close Button */}
        {onClose && (
          <button
            id="close-rune-power-panel-btn"
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top ribbon: Rune Power Locked */}
        <div className="flex justify-center mb-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 shadow-sm">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-300 font-game">
              Rune Power Locked
            </span>
          </div>
        </div>

        {/* Badge Icon Emblem Centerpiece - Unsaturated & Static (No animations) */}
        <div className="relative flex flex-col items-center justify-center my-2 z-10">
          <div className="relative shrink-0 w-32 h-32 sm:w-36 sm:h-36 rounded-3xl border-2 border-slate-700/80 bg-slate-900/80 shadow-inner flex items-center justify-center overflow-hidden">
            <div className="text-6xl sm:text-7xl select-none filter grayscale opacity-50">
              {badge.emoji}
            </div>
            {/* Small lock emblem badge in bottom corner */}
            <div className="absolute bottom-2 right-2 bg-slate-950/90 p-1 rounded-lg border border-slate-700 text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Badge Name */}
        <h3 className="text-xl sm:text-2xl font-black font-game text-slate-200 tracking-wide truncate mt-2 mb-2 relative z-10">
          {badge.name}
        </h3>

        {/* Unified Rune Goal, Progress Bar & Power Effect Card */}
        <div className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 shadow-inner relative z-10 flex flex-col gap-2">
          {/* Rune Goal */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 bg-slate-800 border border-slate-600 px-2 py-0.5 rounded-full font-game">
              Goal
            </span>
            <span className="font-semibold text-slate-200">
              {badge.requirement}
            </span>
          </div>

          {/* Progress Bar (Always shown when locked) */}
          {progress && (
            <div className="w-full bg-slate-950/90 border border-white/10 rounded-xl p-2.5 flex flex-col gap-1.5 text-left my-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-game">
                  Progress
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {progress.current} / {progress.target} {progress.unit}{' '}
                  <span className="text-slate-400 font-sans font-normal text-[11px]">
                    ({progress.percent}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                  style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
                />
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="w-full h-px bg-slate-700/50" />

          {/* Power Effect Description */}
          <div className="text-xs sm:text-sm font-semibold text-slate-400 leading-snug">
            {badge.effect}
          </div>
        </div>
      </div>
    );
  }

  // UNLOCKED STATE: Full golden animations, vibrant styling, and unlocked celebration effects
  return (
    <motion.div
      key={badge.id}
      id={`rune-power-panel-${badge.id}`}
      initial={{ scale: 0.88, opacity: 0, y: 16 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        damping: 18,
        stiffness: 240,
        delay: delayIndex * 0.15,
      }}
      className={`w-full relative overflow-hidden rounded-2xl border-2 ${visual.border} ${visual.bg} ${visual.glow} p-4 text-slate-100 shadow-2xl flex flex-col items-center text-center ${className}`}
    >
      {/* Optional Close Button */}
      {onClose && (
        <button
          id="close-rune-power-panel-btn"
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/10 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Ambient golden core glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Ambient rotating celebration golden sunburst rays (2.5x bigger to fill entire background) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        style={{
          maskImage: 'radial-gradient(circle, black 30%, rgba(0,0,0,0.6) 65%, transparent 88%)',
          WebkitMaskImage: 'radial-gradient(circle, black 30%, rgba(0,0,0,0.6) 65%, transparent 88%)',
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-35 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(251,191,36,0.45)_15deg,transparent_30deg,rgba(245,158,11,0.5)_45deg,transparent_60deg,rgba(251,191,36,0.45)_75deg,transparent_90deg,rgba(245,158,11,0.5)_105deg,transparent_120deg,rgba(251,191,36,0.45)_135deg,transparent_150deg,rgba(245,158,11,0.5)_165deg,transparent_180deg,rgba(251,191,36,0.45)_195deg,transparent_210deg,rgba(245,158,11,0.5)_225deg,transparent_240deg,rgba(251,191,36,0.45)_255deg,transparent_270deg,rgba(245,158,11,0.5)_285deg,transparent_300deg,rgba(251,191,36,0.45)_315deg,transparent_330deg,rgba(245,158,11,0.5)_345deg,transparent_360deg)]"
      />

      {/* Glowing top ribbon: Rune Power Unlocked! */}
      <div className="flex justify-center mb-3 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 shadow-[0_0_14px_rgba(251,191,36,0.35)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-200 font-game">
            Rune Power Unlocked!
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
        </div>
      </div>

      {/* Badge Icon Emblem Centerpiece - Twice as big with 2-second Celebration Animation */}
      <div className="relative flex flex-col items-center justify-center my-2 z-10">
        {/* Expanding 2-second celebration shockwave ring 1 */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 1.4, 1.85], opacity: [0, 0.85, 0] }}
          transition={{ duration: 2.0, ease: 'easeOut', times: [0, 0.4, 1] }}
          className={`absolute w-32 h-32 sm:w-36 sm:h-36 rounded-3xl border-2 ${visual.border} pointer-events-none`}
        />

        {/* Expanding 2-second celebration shockwave ring 2 */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.7, 1.6, 2.2], opacity: [0, 0.7, 0] }}
          transition={{ duration: 2.0, delay: 0.25, ease: 'easeOut', times: [0, 0.45, 1] }}
          className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-3xl border border-amber-300/80 shadow-[0_0_24px_rgba(251,191,36,0.6)] pointer-events-none"
        />

        {/* Floating ambient celebration sparkles around the icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.8] }}
          transition={{ duration: 1.8, delay: 0.3 }}
          className="absolute -top-3 -left-3 pointer-events-none text-amber-300"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.8] }}
          transition={{ duration: 1.8, delay: 0.45 }}
          className="absolute -bottom-2 -right-3 pointer-events-none text-cyan-300"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
        </motion.div>

        {/* Main Badge Emblem (Twice as big: w-32 h-32 sm:w-36 sm:h-36) with celebration motion */}
        <motion.div
          initial={{ scale: 0.2, rotate: -20, opacity: 0 }}
          animate={{
            scale: [0.2, 1.24, 0.95, 1.05, 1],
            rotate: [-20, 8, -4, 2, 0],
            opacity: 1,
          }}
          transition={{
            duration: 1.8,
            ease: 'easeOut',
            scale: {
              duration: 1.8,
              times: [0, 0.35, 0.6, 0.82, 1],
              ease: 'easeOut',
            },
            rotate: {
              duration: 1.8,
              times: [0, 0.35, 0.6, 0.82, 1],
              ease: 'easeOut',
            },
            opacity: {
              duration: 0.75,
              ease: 'easeOut',
            },
          }}
          className={`relative shrink-0 w-32 h-32 sm:w-36 sm:h-36 rounded-3xl border-2 ${visual.border} bg-slate-950/90 shadow-[0_0_36px_rgba(255,255,255,0.25)] flex items-center justify-center overflow-hidden`}
        >
          {/* 2-Second Shimmer Light Sweep */}
          <motion.div
            initial={{ x: '-150%', opacity: 0 }}
            animate={{ x: '250%', opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.2, delay: 0.6, ease: 'easeInOut' }}
            className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
          />

          {/* Gentle floating emoji */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl sm:text-7xl select-none filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)]"
          >
            {badge.emoji}
          </motion.div>

          {/* Corner sparkle ping */}
          <span className="absolute top-2.5 right-2.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-300" />
          </span>
        </motion.div>
      </div>

      {/* Badge Name */}
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-xl sm:text-2xl font-black font-game text-white tracking-wide truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mt-2 mb-2 relative z-10"
      >
        {badge.name}
      </motion.h3>

      {/* Unified Rune Goal & Power Effect Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="w-full bg-gradient-to-r from-amber-950/40 via-slate-950/80 to-amber-950/40 border border-amber-400/40 rounded-xl p-3 backdrop-blur-sm shadow-[inset_0_0_16px_rgba(251,191,36,0.1)] relative z-10 flex flex-col gap-2"
      >
        {/* Rune Goal */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-200">
          <span className="text-[10px] uppercase font-black tracking-wider text-cyan-300 bg-cyan-950/90 border border-cyan-400/50 px-2 py-0.5 rounded-full font-game">
            Goal
          </span>
          <span className="font-semibold text-cyan-100/90">
            {badge.requirement}
          </span>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-amber-400/20" />

        {/* Power Effect Description */}
        <div className="text-xs sm:text-sm font-bold text-amber-200 leading-snug">
          {badge.effect}
        </div>
      </motion.div>
    </motion.div>
  );
};
