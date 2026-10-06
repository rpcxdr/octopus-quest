import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { BadgeDefinition, BadgeProgress } from '../utils/badges';
import { RunePowerUnlockedPanel } from './RunePowerUnlockedPanel';

export interface RuneAchievementModalProps {
  isOpen: boolean;
  badges: BadgeDefinition[];
  isUnlocked?: boolean;
  progress?: BadgeProgress;
  oldProgress?: BadgeProgress;
  onContinue: () => void;
}

export const RuneAchievementModal: React.FC<RuneAchievementModalProps> = ({
  isOpen,
  badges,
  isUnlocked = true,
  progress,
  oldProgress,
  onContinue,
}) => {
  const [canInteract, setCanInteract] = useState(false);

  useEffect(() => {
    if (!isOpen || !badges || badges.length === 0) {
      setCanInteract(false);
      return;
    }
    setCanInteract(false);
    // If animating progress to unlock, allow extra time for the progress fill + celebration animation
    const lockoutDuration = isUnlocked && oldProgress ? 2200 : 1000;
    const timer = setTimeout(() => {
      setCanInteract(true);
    }, lockoutDuration);
    return () => clearTimeout(timer);
  }, [isOpen, badges, isUnlocked, oldProgress]);

  // Block spacebar, Enter, and arrow keys for lockout duration in capture phase;
  // trigger onContinue once canInteract is true
  useEffect(() => {
    if (!isOpen || !badges || badges.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (canInteract) {
          onContinue();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, badges, canInteract, onContinue]);

  // Block all pointer/click/tap inputs anywhere for the lockout duration
  useEffect(() => {
    if (!isOpen || !badges || badges.length === 0 || canInteract) return;

    const blockEvent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    window.addEventListener('pointerdown', blockEvent, true);
    window.addEventListener('touchstart', blockEvent, true);
    window.addEventListener('click', blockEvent, true);
    return () => {
      window.removeEventListener('pointerdown', blockEvent, true);
      window.removeEventListener('touchstart', blockEvent, true);
      window.removeEventListener('click', blockEvent, true);
    };
  }, [isOpen, badges, canInteract]);

  if (!isOpen || !badges || badges.length === 0) return null;

  const handleButtonClick = () => {
    if (!canInteract) return;
    onContinue();
  };

  const showGoldenBorder = isUnlocked && !oldProgress;

  return (
    <AnimatePresence>
      <div
        id="rune-achievement-modal-backdrop"
        style={{ transform: 'translateZ(0)' }}
        className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-3 sm:p-4 pointer-events-auto overflow-x-hidden overflow-y-auto transform-gpu will-change-transform"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <motion.div
          id="rune-achievement-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          className={`w-full max-w-sm bg-slate-900/95 border ${
            showGoldenBorder
              ? 'border-amber-400/40 shadow-[0_0_60px_rgba(251,191,36,0.3)]'
              : 'border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)]'
          } rounded-3xl p-5 text-slate-100 flex flex-col items-center relative overflow-hidden transform-gpu will-change-transform transition-colors duration-500`}
        >
          {/* Ambient background celebration glow */}
          <div
            className={`absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 ${
              showGoldenBorder ? 'bg-amber-400/20' : 'bg-cyan-500/20'
            } rounded-full blur-3xl pointer-events-none transition-colors duration-500`}
          />

          {/* Rune Power Achievement Panel */}
          <div className="w-full flex flex-col gap-3 relative z-10">
            {badges.map((badge, idx) => (
              <RunePowerUnlockedPanel
                key={badge.id}
                badge={badge}
                isUnlocked={isUnlocked}
                progress={progress}
                oldProgress={oldProgress}
                delayIndex={idx}
                isGameOver={false}
              />
            ))}
          </div>

          {/* "Keep Swimming" Button directly under the achievement panel */}
          <div className="w-full mt-4 relative z-10">
            <button
              id="rune-achievement-keep-swimming-btn"
              type="button"
              disabled={!canInteract}
              onClick={handleButtonClick}
              className={`w-full py-3.5 sm:py-4 px-5 font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2.5 shadow-lg transition-all duration-300 text-base sm:text-lg select-none ${
                canInteract
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-cyan-500/30 active:scale-98 cursor-pointer'
                  : 'bg-slate-800 text-slate-400 border border-slate-700/60 opacity-50 cursor-not-allowed pointer-events-none'
              }`}
            >
              <span>Keep Swimming</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
