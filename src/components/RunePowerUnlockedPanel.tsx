import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Lock, X } from 'lucide-react';
import { BadgeDefinition, BadgeProgress, getBadgeVisual } from '../utils/badges';
import { RuneBadgeIcon } from './RuneBadgeIcon';
import { sound } from '../utils/audio';
import { ProgressBarWithParticles } from './ProgressBarWithParticles';

export interface RunePowerUnlockedPanelProps {
  badge: BadgeDefinition;
  isUnlocked?: boolean;
  progress?: BadgeProgress;
  oldProgress?: BadgeProgress;
  delayIndex?: number;
  className?: string;
  isGameOver?: boolean;
  onClose?: () => void;
}

export const RunePowerUnlockedPanel: React.FC<RunePowerUnlockedPanelProps> = ({
  badge,
  isUnlocked = true,
  progress,
  oldProgress,
  delayIndex = 0,
  className = '',
  isGameOver = false,
  onClose,
}) => {
  const visual = getBadgeVisual(badge.id);

  // If oldProgress is specified and current progress is complete (isUnlocked === true),
  // start in the LOCKED rendering, and at the moment the progress bar completes,
  // change to the RunePowerUnlocked view.
  const shouldAnimateToUnlock = Boolean(isUnlocked && oldProgress);
  const [isTransformedToUnlocked, setIsTransformedToUnlocked] = useState(
    !shouldAnimateToUnlock && isUnlocked
  );

  const handleAnimationComplete = () => {
    if (shouldAnimateToUnlock) {
      setIsTransformedToUnlocked(true);
      try {
        sound.playFishLevelUpSplash();
      } catch {
        // audio fallback
      }
    }
  };

  const isCurrentlyLocked = !isTransformedToUnlocked;

  return (
    <AnimatePresence mode="wait">
      {isCurrentlyLocked ? (
        // LOCKED STATE: Unsaturated, says "Rune Power Locked", includes animated Progress Bar
        <motion.div
          key="panel-locked"
          id={`rune-power-panel-${badge.id}`}
          initial={{ opacity: 0.95 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.25 }}
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

          {/* Badge Icon Emblem Centerpiece - Unsaturated & Static */}
          <div className="relative flex flex-col items-center justify-center my-2 z-10">
            <div className="relative shrink-0 w-32 h-32 sm:w-36 sm:h-36 rounded-3xl border-2 border-slate-700/80 bg-slate-900/80 shadow-inner flex items-center justify-center overflow-hidden p-2">
              <RuneBadgeIcon
                badgeId={badge.id}
                emoji={badge.emoji}
                size={badge.id === 'tidesong' ? 90 : '4.25rem'}
                grayscale={true}
                className="drop-shadow-none"
              />
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

            {/* Animated Progress Bar with Particle Effect */}
            {(progress || oldProgress) && (
              <ProgressBarWithParticles
                progress={progress}
                oldProgress={oldProgress}
                isUnlocked={isUnlocked}
                onComplete={handleAnimationComplete}
              />
            )}

            {/* Divider */}
            <div className="w-full h-px bg-slate-700/50" />

            {/* Power Effect Description */}
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 bg-slate-800 border border-slate-600 px-2 py-0.5 rounded-full font-game shrink-0">
                Power
              </span>
              <span className="font-semibold text-slate-400 leading-snug">
                {badge.effect}
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        // UNLOCKED STATE: Full golden animations, vibrant styling, and unlocked celebration effects
        <motion.div
          key="panel-unlocked"
          id={`rune-power-panel-${badge.id}`}
          initial={{ scale: 0.88, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            damping: 18,
            stiffness: 240,
            delay: shouldAnimateToUnlock ? 0 : delayIndex * 0.15,
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

          {/* Ambient rotating celebration golden sunburst rays */}
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

          {/* Badge Icon Emblem Centerpiece with Celebration Animation */}
          <div className="relative flex flex-col items-center justify-center my-2 z-10">
            {/* Expanding celebration shockwave ring 1 */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.6, 1.4, 1.85], opacity: [0, 0.85, 0] }}
              transition={{ duration: 2.0, ease: 'easeOut', times: [0, 0.4, 1] }}
              className={`absolute w-32 h-32 sm:w-36 sm:h-36 rounded-3xl border-2 ${visual.border} pointer-events-none`}
            />

            {/* Expanding celebration shockwave ring 2 */}
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

            {/* Main Badge Emblem with celebration motion */}
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
              {/* Shimmer Light Sweep */}
              <motion.div
                initial={{ x: '-150%', opacity: 0 }}
                animate={{ x: '250%', opacity: [0, 0.9, 0] }}
                transition={{ duration: 1.2, delay: 0.6, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
              />

              {/* Gentle floating emoji / custom school of fish icon */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center justify-center select-none filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)]"
              >
                <RuneBadgeIcon
                  badgeId={badge.id}
                  emoji={badge.emoji}
                  size={badge.id === 'tidesong' ? 95 : '4.5rem'}
                />
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
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm">
              <span className="text-[10px] uppercase font-black tracking-wider text-cyan-300 bg-cyan-950/90 border border-cyan-400/50 px-2 py-0.5 rounded-full font-game shrink-0">
                Power
              </span>
              <span className="font-bold text-amber-200 leading-snug">
                {badge.effect}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
