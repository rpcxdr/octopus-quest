import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowRight, RotateCcw, Sparkles, Check, Home } from 'lucide-react';
import { FishFragmentCounts, FishType, FishUnlockTier, GameDifficulty } from '../types';
import { getReefZoneName, TOTAL_REEF_LEVELS } from '../utils/reef';
import { ReefClearedRecordColumns } from './RecordColumnPodView';
import { StreakStatsBar } from './StreakStatsBar';

interface ReefClearedModalProps {
  isOpen: boolean;
  reefLevel: number;
  difficulty?: GameDifficulty;
  flapsThisRun?: number;
  runTotalColumns?: number;
  reefsClearedInRun?: number;
  highScore?: number;
  isNewHighScore?: boolean;
  bestFlaps?: number;
  unlockedFish?: FishUnlockTier | null;
  selectedFish?: FishType;
  attemptFragments?: FishFragmentCounts;
  priorReefMaxFragments?: FishFragmentCounts;
  reefMaxFragments?: FishFragmentCounts;
  totalFragmentsByFish?: Record<FishType, number>;
  priorTotalFragmentsByFish?: Record<FishType, number>;
  clearTimeSeconds?: number;
  currentFastStreak?: number;
  onNextReef: () => void;
  onReplayReef: () => void;
  onOpenStats?: () => void;
  onExitToMenu?: () => void;
  onEquipFish?: (fish: FishType) => void;
}

export const ReefClearedModal: React.FC<ReefClearedModalProps> = ({
  isOpen,
  reefLevel,
  difficulty = 'medium',
  flapsThisRun,
  runTotalColumns,
  reefsClearedInRun,
  highScore,
  isNewHighScore,
  bestFlaps,
  unlockedFish,
  selectedFish,
  attemptFragments,
  priorReefMaxFragments,
  reefMaxFragments,
  totalFragmentsByFish,
  priorTotalFragmentsByFish,
  clearTimeSeconds,
  currentFastStreak,
  onNextReef,
  onReplayReef,
  onOpenStats,
  onExitToMenu,
  onEquipFish,
}) => {
  if (!isOpen) return null;

  const isFinalReef = reefLevel >= TOTAL_REEF_LEVELS;
  const isEquipped = unlockedFish && selectedFish === unlockedFish.id;
  const isUnder10s = clearTimeSeconds !== undefined && clearTimeSeconds <= 10.05;

  let nextReefButtonText = 'Keep Swimming!';
  if (isFinalReef) {
    if (difficulty === 'easy') {
      nextReefButtonText = 'Swim Reef 1 on Medium Difficulty!';
    } else if (difficulty === 'medium') {
      nextReefButtonText = 'Swim Reef 1 on Hard Difficulty!';
    } else {
      nextReefButtonText = 'Keep Swimming Reef 1!';
    }
  }

  // 0.5s lockout so the player won't accidentally close the modal too soon
  const [canInteract, setCanInteract] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCanInteract(false);
      return;
    }
    setCanInteract(false);
    const timer = setTimeout(() => {
      setCanInteract(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Suppress Space and Enter keys for the first 0.5 seconds in capture phase
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (!canInteract) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, canInteract]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canInteract) return;
    if (e.target === e.currentTarget) {
      onNextReef();
    }
  };

  return (
    <AnimatePresence>
      <div
        id="reef-cleared-backdrop"
        onClick={handleBackdropClick}
        style={{ transform: 'translateZ(0)' }}
        className={`fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-3 sm:p-4 pointer-events-auto overflow-x-hidden transform-gpu will-change-transform ${
          canInteract ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <motion.div
          id="reef-cleared-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.85, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          className="w-full max-w-sm max-h-[92vh] overflow-y-auto overflow-x-hidden bg-slate-900/95 border border-cyan-400/40 rounded-3xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 flex flex-col items-center text-center relative cursor-default transform-gpu will-change-transform"
        >
          {/* Ambient celebration glow & background trophy watermark */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none text-cyan-400/[0.08] flex items-center justify-center select-none -z-0">
            <Trophy className="w-44 h-44 -rotate-6" strokeWidth={1.25} />
          </div>

          <h2 className="relative z-10 text-3xl sm:text-4xl font-black font-game text-white tracking-wider mb-1 pt-1 drop-shadow-[0_2px_12px_rgba(6,182,212,0.45)]">
            Reef {reefLevel} Cleared!
          </h2>

          <div className="text-xs text-cyan-200/70 mb-2.5">
            {getReefZoneName(reefLevel)}
          </div>

          {/* Reusable Merged Single-Line Stats: Survival Streak, Best Streak & Time Score */}
          <StreakStatsBar
            id="reef-cleared-stats-line"
            streak={runTotalColumns ?? 0}
            reefsClearedInRun={reefsClearedInRun}
            highScore={highScore}
            isNewHighScore={isNewHighScore}
            timeSeconds={clearTimeSeconds}
            currentFastStreak={currentFastStreak}
            isGameOver={false}
          />

          {/* Reef Fish Fragments Collected - Displaying Record Column pods from left to right */}
          <ReefClearedRecordColumns
            attemptFragments={attemptFragments}
            priorReefMaxFragments={priorReefMaxFragments}
            reefMaxFragments={reefMaxFragments}
            totalFragmentsByFish={totalFragmentsByFish}
            priorTotalFragmentsByFish={priorTotalFragmentsByFish}
          />

          {/* Newly Unlocked Fish Celebration */}
          {unlockedFish && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-gradient-to-r from-cyan-950/80 via-teal-950/80 to-slate-900/90 border-2 border-cyan-400 rounded-2xl p-3 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-center flex flex-col items-center gap-1.5"
            >
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                <span>
                  {unlockedFish.achievedLevel && unlockedFish.achievedLevel > 1
                    ? `${unlockedFish.name} Level ${unlockedFish.achievedLevel} Achieved!`
                    : 'New Fish Character Unlocked!'}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-game text-white tracking-wider my-1">
                {unlockedFish.name}
              </div>
              {unlockedFish.specialPowerTitle && (
                <div className="bg-slate-900/80 border border-cyan-500/20 rounded-xl px-2.5 py-1 text-center my-0.5 max-w-xs">
                  <div className="text-[10px] font-black text-amber-300">
                    ⚡ Special Power: {unlockedFish.specialPowerTitle}
                  </div>
                  <div className="text-[9px] text-slate-300">
                    {unlockedFish.specialPowerDesc}
                  </div>
                </div>
              )}
              {onEquipFish && (
                <button
                  id="equip-new-fish-btn"
                  disabled={!canInteract}
                  onClick={() => {
                    if (!canInteract) return;
                    onEquipFish(unlockedFish.id);
                  }}
                  className={`mt-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1 transition ${
                    !canInteract
                      ? 'opacity-40 pointer-events-none cursor-not-allowed'
                      : isEquipped
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-pointer'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md active:scale-95 cursor-pointer'
                  }`}
                >
                  {isEquipped ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Equipped as Active Swimmer</span>
                    </>
                  ) : (
                    <span>Equip {unlockedFish.name.split(' ')[0]} Now</span>
                  )}
                </button>
              )}
            </motion.div>
          )}

          {/* Action buttons - ghosted and disabled for first 0.5s */}
          <div
            className={`w-full flex flex-col gap-2 transition-all duration-300 ${
              canInteract
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-40 grayscale-[25%] pointer-events-none select-none'
            }`}
          >
            {isFinalReef && (
              <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold text-center shadow-sm">
                🏆 Master of the Deep! All 50 Reefs Cleared!
              </div>
            )}

            <button
              id="next-reef-btn"
              disabled={!canInteract}
              onClick={() => {
                if (!canInteract) return;
                onNextReef();
              }}
              className="w-full py-3.5 sm:py-4 px-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-98 cursor-pointer text-sm sm:text-base text-center leading-tight"
            >
              <span>{nextReefButtonText}</span>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="replay-reef-cleared-btn"
                disabled={!canInteract}
                onClick={() => {
                  if (!canInteract) return;
                  onReplayReef();
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer border border-white/10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>

              {onExitToMenu && (
                <button
                  id="exit-to-menu-cleared-btn"
                  disabled={!canInteract}
                  onClick={() => {
                    if (!canInteract) return;
                    onExitToMenu();
                  }}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer border border-white/10"
                >
                  <Home className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Home</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
