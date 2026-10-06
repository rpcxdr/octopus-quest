import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Lock, X } from 'lucide-react';
import { BadgeDefinition, BadgeProgress, getBadgeVisual } from '../utils/badges';
import { RuneBadgeIcon } from './RuneBadgeIcon';
import { sound } from '../utils/audio';

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

interface Particle {
  id: number;
  x: number; // percentage along the bar (0 to 100)
  y: number; // pixel offset vertically
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  glowColor: string;
  type: 'orb' | 'sparkle' | 'star';
  rotation: number;
  vRot: number;
}

interface ProgressBarWithParticlesProps {
  progress?: BadgeProgress;
  oldProgress?: BadgeProgress;
  isUnlocked?: boolean;
  onComplete?: () => void;
}

const ProgressBarWithParticles: React.FC<ProgressBarWithParticlesProps> = ({
  progress,
  oldProgress,
  isUnlocked,
  onComplete,
}) => {
  const startPercent = oldProgress
    ? Math.min(100, Math.max(0, oldProgress.percent))
    : (progress ? progress.percent : 0);
  const targetPercent = progress
    ? Math.min(100, Math.max(0, progress.percent))
    : (isUnlocked ? 100 : startPercent);

  const startCount = oldProgress ? oldProgress.current : (progress ? progress.current : 0);
  const targetCount = progress ? progress.current : (isUnlocked ? (progress?.target ?? startCount) : startCount);
  const targetTotal = progress ? progress.target : (oldProgress ? oldProgress.target : 10);
  const unit = progress?.unit || oldProgress?.unit || 'pts';

  const [displayPercent, setDisplayPercent] = useState(startPercent);
  const [displayCount, setDisplayCount] = useState(startCount);
  const [isBarFilling, setIsBarFilling] = useState(Boolean(oldProgress));
  const [particles, setParticles] = useState<Particle[]>([]);

  const animRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!oldProgress) {
      setDisplayPercent(targetPercent);
      setDisplayCount(targetCount);
      setIsBarFilling(false);
      return;
    }

    let pId = 0;
    let localParticles: Particle[] = [];
    const startTime = performance.now() + 200; // 200ms brief pause for modal intro
    const duration = 1200; // 1.2s smooth animation
    let burstFired = false;
    let completionTriggered = false;

    const step = (now: number) => {
      if (now < startTime) {
        animRef.current = requestAnimationFrame(step);
        return;
      }

      const elapsed = now - startTime;
      const progressFrac = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progressFrac, 3);

      const curPct = startPercent + (targetPercent - startPercent) * ease;
      const curCnt = Math.round(startCount + (targetCount - startCount) * ease);

      setDisplayPercent(curPct);
      setDisplayCount(curCnt);

      // (1) Emit active particles at leading edge of progress bar while filling
      if (progressFrac < 1) {
        const palette = [
          { color: '#22d3ee', glow: 'rgba(34, 211, 238, 0.9)', type: 'orb' as const },
          { color: '#67e8f9', glow: 'rgba(103, 232, 249, 1)', type: 'sparkle' as const },
          { color: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.85)', type: 'orb' as const },
          { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.95)', type: 'star' as const },
          { color: '#fef08a', glow: 'rgba(254, 240, 138, 1)', type: 'sparkle' as const },
          { color: '#ffffff', glow: 'rgba(255, 255, 255, 1)', type: 'star' as const },
        ];

        // 3-4 impactful particles per frame
        const countToSpawn = Math.random() < 0.75 ? 3 : 4;
        for (let i = 0; i < countToSpawn; i++) {
          pId++;
          const choice = palette[Math.floor(Math.random() * palette.length)];
          const angle = Math.random() * Math.PI + Math.PI; // upward arc (180 to 360 deg)
          const speed = 0.8 + Math.random() * 2.2;

          localParticles.push({
            id: pId,
            x: curPct + (Math.random() * 2 - 1),
            y: (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * (speed * 0.35) - (0.15 + Math.random() * 0.3),
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: choice.type === 'star' ? 4.5 + Math.random() * 4 : 3 + Math.random() * 3.5,
            color: choice.color,
            glowColor: choice.glow,
            type: choice.type,
            rotation: Math.random() * 360,
            vRot: (Math.random() - 0.5) * 12,
          });
        }
      } else if (!burstFired) {
        // Trigger celebratory radial sparkle burst at the arrival point
        burstFired = true;
        setIsBarFilling(false);

        const burstPalette = [
          { color: '#fbbf24', glow: 'rgba(251, 191, 36, 1)', type: 'star' as const },
          { color: '#fef08a', glow: 'rgba(254, 240, 138, 1)', type: 'star' as const },
          { color: '#22d3ee', glow: 'rgba(34, 211, 238, 1)', type: 'sparkle' as const },
          { color: '#ffffff', glow: 'rgba(255, 255, 255, 1)', type: 'sparkle' as const },
          { color: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.9)', type: 'orb' as const },
        ];

        // 18 dazzling burst particles radiating outward
        for (let i = 0; i < 18; i++) {
          pId++;
          const choice = burstPalette[i % burstPalette.length];
          const angle = (i / 18) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
          const speed = 1.2 + Math.random() * 3.0;

          localParticles.push({
            id: pId,
            x: targetPercent,
            y: 0,
            vx: Math.cos(angle) * (speed * 0.5),
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: 4 + Math.random() * 4.5,
            color: choice.color,
            glowColor: choice.glow,
            type: choice.type,
            rotation: Math.random() * 360,
            vRot: (Math.random() - 0.5) * 16,
          });
        }
      }

      // (2) Dissipate & move particles - smoothly decays each frame
      localParticles = localParticles
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          rotation: p.rotation + p.vRot,
          alpha: p.alpha - (progressFrac >= 1 ? 0.045 : 0.032),
        }))
        .filter((p) => p.alpha > 0);

      setParticles([...localParticles]);

      // If bar reached target, schedule onComplete after burst shines
      if (progressFrac >= 1 && !completionTriggered) {
        completionTriggered = true;
        setTimeout(() => {
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }, 360);
      }

      // Keep running animation loop until all particles have cleanly dissipated!
      if (progressFrac < 1 || localParticles.length > 0) {
        animRef.current = requestAnimationFrame(step);
      } else {
        // Full dissipation complete: no frozen particles left
        setParticles([]);
      }
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [oldProgress, startPercent, targetPercent, startCount, targetCount]);

  return (
    <div className="w-full bg-slate-950/90 border border-white/10 rounded-xl p-2.5 flex flex-col gap-1.5 text-left my-0.5 relative">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-game">
          Progress
        </span>
        <span className="text-xs font-mono font-bold text-cyan-300">
          {displayCount} / {targetTotal} {unit}{' '}
          <span className="text-slate-400 font-sans font-normal text-[11px]">
            ({Math.round(displayPercent)}%)
          </span>
        </span>
      </div>

      <div className="w-full relative py-1">
        {/* Floating particles around the progress bar with star/sparkle/orb shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute pointer-events-none flex items-center justify-center transform-gpu"
              style={{
                left: `${Math.min(100, Math.max(0, p.x))}%`,
                top: `calc(50% + ${p.y}px)`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: Math.max(0, Math.min(1, p.alpha)),
                transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
              }}
            >
              {p.type === 'star' ? (
                <svg
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                  style={{ filter: `drop-shadow(0 0 5px ${p.glowColor})` }}
                >
                  <path
                    d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"
                    fill={p.color}
                  />
                </svg>
              ) : p.type === 'sparkle' ? (
                <svg
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                  style={{ filter: `drop-shadow(0 0 5px ${p.glowColor})` }}
                >
                  <polygon points="12,1 15,12 12,23 9,12" fill={p.color} />
                  <polygon points="1,12 12,15 23,12 12,9" fill={p.color} />
                </svg>
              ) : (
                <div
                  className="w-full h-full rounded-full relative"
                  style={{
                    backgroundColor: p.color,
                    boxShadow: `0 0 6px 2px ${p.glowColor}, 0 0 10px ${p.color}`,
                  }}
                >
                  <span className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-80" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar background track */}
        <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-white/15 relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 via-teal-300 to-amber-300 rounded-full shadow-[0_0_14px_rgba(6,182,212,0.7),0_0_20px_rgba(251,191,36,0.4)]"
            style={{ width: `${Math.min(100, Math.max(0, displayPercent))}%` }}
          />
        </div>

        {/* High-impact multi-layer energy comet head while filling */}
        {isBarFilling && (
          <div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-20"
            style={{ left: `${Math.min(100, Math.max(0, displayPercent))}%` }}
          >
            {/* Outer expanding pulsing energy aura */}
            <div className="w-5 h-5 -translate-x-1/2 rounded-full bg-cyan-400/40 shadow-[0_0_14px_#38bdf8,0_0_24px_#fbbf24] animate-ping opacity-75" />
            {/* Brilliant white & gold diamond core */}
            <div className="w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-0 rounded-full bg-white shadow-[0_0_12px_#38bdf8,0_0_6px_#fbbf24]" />
          </div>
        )}
      </div>
    </div>
  );
};

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
