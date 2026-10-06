import React, { useState, useEffect, useRef } from 'react';
import { BadgeProgress } from '../utils/badges';

export interface ProgressBarWithParticlesProps {
  progress?: BadgeProgress;
  oldProgress?: BadgeProgress;
  isUnlocked?: boolean;
  onComplete?: () => void;
  showLabels?: boolean;
  compact?: boolean;
  barHeight?: string;
  maxWidth?: string;
  className?: string;
  delayStart?: number;
  duration?: number;
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

export const ProgressBarWithParticles: React.FC<ProgressBarWithParticlesProps> = ({
  progress,
  oldProgress,
  isUnlocked,
  onComplete,
  showLabels = true,
  compact = false,
  barHeight,
  maxWidth,
  className = '',
  delayStart = 200,
  duration = 1200,
}) => {
  const startPercent = oldProgress
    ? Math.min(100, Math.max(0, oldProgress.percent))
    : (progress ? Math.min(100, Math.max(0, progress.percent)) : 0);
  const targetPercent = progress
    ? Math.min(100, Math.max(0, progress.percent))
    : (isUnlocked ? 100 : startPercent);

  const startCount = oldProgress ? oldProgress.current : (progress ? progress.current : 0);
  const targetCount = progress ? progress.current : (isUnlocked ? (progress?.target ?? startCount) : startCount);
  const targetTotal = progress ? progress.target : (oldProgress ? oldProgress.target : 10);
  const unit = progress?.unit || oldProgress?.unit || 'pts';

  const shouldAnimate = Boolean(oldProgress && (targetPercent > startPercent || targetCount > startCount));

  const [displayPercent, setDisplayPercent] = useState(shouldAnimate ? startPercent : targetPercent);
  const [displayCount, setDisplayCount] = useState(shouldAnimate ? startCount : targetCount);
  const [isBarFilling, setIsBarFilling] = useState(shouldAnimate);
  const [particles, setParticles] = useState<Particle[]>([]);

  const animRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayPercent(targetPercent);
      setDisplayCount(targetCount);
      setIsBarFilling(false);
      setParticles([]);
      return;
    }

    let pId = 0;
    let localParticles: Particle[] = [];
    const startTime = performance.now() + delayStart;
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
  }, [shouldAnimate, delayStart, duration, startPercent, targetPercent, startCount, targetCount]);

  const heightClass = barHeight || (compact ? 'h-2' : 'h-3');
  const maxWClass = maxWidth || (compact ? 'max-w-[200px]' : 'w-full');

  const content = (
    <>
      {showLabels && (
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
      )}

      <div className={`w-full relative py-1 ${maxWClass}`}>
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
        <div
          className={`w-full bg-slate-900 rounded-full ${heightClass} overflow-hidden border border-white/15 relative shadow-inner`}
        >
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
            <div
              className={`${
                compact ? 'w-4 h-4' : 'w-5 h-5'
              } -translate-x-1/2 rounded-full bg-cyan-400/40 shadow-[0_0_14px_#38bdf8,0_0_24px_#fbbf24] animate-ping opacity-75`}
            />
            {/* Brilliant white & gold diamond core */}
            <div
              className={`${
                compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
              } -translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-0 rounded-full bg-white shadow-[0_0_12px_#38bdf8,0_0_6px_#fbbf24]`}
            />
          </div>
        )}
      </div>
    </>
  );

  if (compact) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`w-full bg-slate-950/90 border border-white/10 rounded-xl p-2.5 flex flex-col gap-1.5 text-left my-0.5 relative ${className}`}
    >
      {content}
    </div>
  );
};
