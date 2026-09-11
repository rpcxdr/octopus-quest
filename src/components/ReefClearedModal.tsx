import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowRight, RotateCcw, Sparkles, Check, Home } from 'lucide-react';
import { FishFragmentCounts, FishType, FishUnlockTier, GameDifficulty } from '../types';
import { getReefZoneName, TOTAL_REEF_LEVELS } from '../utils/reef';
import { getSpeedIncreasePercent } from '../utils/physics';
import { getFishDisplayName, FISH_LIST } from '../utils/fish';
import { countTotalFragments } from '../utils/fragments';
import { FishBadgeIcon } from './FishBadgeIcon';

interface ReefClearedModalProps {
  isOpen: boolean;
  reefLevel: number;
  difficulty?: GameDifficulty;
  flapsThisRun?: number;
  runTotalColumns?: number;
  bestFlaps?: number;
  unlockedFish?: FishUnlockTier | null;
  selectedFish?: FishType;
  attemptFragments?: FishFragmentCounts;
  reefMaxFragments?: FishFragmentCounts;
  totalFragmentsByFish?: Record<FishType, number>;
  isAtlantisGateUnlocked?: boolean;
  isGulfStreamUnlocked?: boolean;
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
  bestFlaps,
  unlockedFish,
  selectedFish,
  attemptFragments,
  reefMaxFragments,
  totalFragmentsByFish,
  isAtlantisGateUnlocked,
  isGulfStreamUnlocked,
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

  return (
    <AnimatePresence>
      <div
        id="reef-cleared-backdrop"
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pointer-events-auto"
      >
        <motion.div
          id="reef-cleared-modal"
          initial={{ scale: 0.85, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          className="w-full max-w-sm bg-slate-900/95 border border-cyan-400/40 rounded-3xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Ambient celebration glow & background trophy watermark */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none text-cyan-400/[0.08] flex items-center justify-center select-none -z-0">
            <Trophy className="w-44 h-44 -rotate-6" strokeWidth={1.25} />
          </div>

          <h2 className="relative z-10 text-3xl sm:text-4xl font-black font-game text-white tracking-wider mb-1 pt-1 drop-shadow-[0_2px_12px_rgba(6,182,212,0.45)]">
            Reef {reefLevel} Cleared!
          </h2>

          <div className="text-xs text-cyan-200/70 mb-1">
            {getReefZoneName(reefLevel)}
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5">
            <span
              className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                difficulty === 'easy'
                  ? 'text-emerald-300 border-emerald-500/40 bg-emerald-950/80'
                  : difficulty === 'hard'
                  ? 'text-orange-300 border-orange-500/40 bg-orange-950/80'
                  : 'text-cyan-300 border-cyan-500/40 bg-cyan-950/80'
              }`}
            >
              {difficulty} &bull; +{getSpeedIncreasePercent(difficulty, reefLevel)}% speed
            </span>
            {clearTimeSeconds !== undefined && (
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  isUnder10s
                    ? 'text-amber-300 border-amber-500/40 bg-amber-950/80'
                    : 'text-slate-300 border-white/10 bg-slate-800/80'
                }`}
              >
                ⏱️ {clearTimeSeconds.toFixed(1)}s {isUnder10s ? `(⚡ Fast Reef #${currentFastStreak ?? 1}/10)` : ''}
              </span>
            )}
          </div>

          {/* Continuous Survival Run Banner (if applicable) */}
          {runTotalColumns !== undefined && runTotalColumns > 10 && (
            <div className="w-full mb-3 px-3 py-1.5 bg-gradient-to-r from-amber-500/15 via-teal-500/10 to-cyan-500/15 rounded-xl border border-amber-400/30 text-[11px] text-amber-200 flex items-center justify-between">
              <span className="font-bold flex items-center gap-1">
                🔥 Continuous Survival Run:
              </span>
              <span className="font-black font-game text-amber-300 text-sm">
                {runTotalColumns} Columns
              </span>
            </div>
          )}

          {/* Atlantis Gate Badge Unlock Banner */}
          {isAtlantisGateUnlocked && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full mb-3 px-3 py-2 bg-gradient-to-r from-indigo-600/30 via-purple-500/25 to-pink-500/30 rounded-2xl border border-indigo-400/60 text-left shadow-[0_0_20px_rgba(129,140,248,0.25)]"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-indigo-300 font-game flex items-center gap-1.5">
                    <span>Badge Unlocked: Atlantis Gate</span>
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                  </div>
                  <div className="text-[10px] text-indigo-100/90 font-medium leading-tight mt-0.5">
                    Completed all 50 reefs in order without dying! (+1 fragments / reef & Puffer Fish colors)
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Gulf Stream Badge Unlock Banner */}
          {isGulfStreamUnlocked && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full mb-3 px-3 py-2 bg-gradient-to-r from-blue-600/30 via-sky-500/25 to-teal-500/30 rounded-2xl border border-sky-400/60 text-left shadow-[0_0_20px_rgba(56,189,248,0.25)]"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌊</span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-sky-300 font-game flex items-center gap-1.5">
                    <span>Badge Unlocked: Gulf Stream</span>
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                  </div>
                  <div className="text-[10px] text-sky-100/90 font-medium leading-tight mt-0.5">
                    Speed run 10 reefs in a row, 10s each! (+1 fragments / reef & Sting Ray colors)
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reef Fish Fragments Collected & Max Record */}
          <div className="w-full bg-slate-950/80 border border-amber-500/25 rounded-2xl p-3 mb-4 text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 text-sm">🧩</span>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 font-game">
                  Fish Fragments Collected
                </span>
              </div>
              <span className="text-[9px] text-slate-400">
                Reef {reefLevel} Record
              </span>
            </div>

            {/* Current attempt vs Retained Reef Max */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-slate-900/90 border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                  Found This Swim
                </span>
                {attemptFragments && countTotalFragments(attemptFragments) > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(Object.entries(attemptFragments) as [FishType, number][])
                      .filter(([_, count]) => count > 0)
                      .map(([fish, count]) => (
                        <span
                          key={fish}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-[11px] font-bold text-amber-200 inline-flex items-center gap-1"
                        >
                          <FishBadgeIcon fishType={fish} size={15} />
                          <span>+{count} {getFishDisplayName(fish)}</span>
                        </span>
                      ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-sans mt-0.5 block">
                    None picked up
                  </span>
                )}
              </div>

              <div className="p-2 rounded-xl bg-slate-900/90 border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                  Reef {reefLevel} Max Retained
                </span>
                {reefMaxFragments && countTotalFragments(reefMaxFragments) > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(Object.entries(reefMaxFragments) as [FishType, number][])
                      .filter(([_, count]) => count > 0)
                      .map(([fish, count]) => (
                        <span
                          key={fish}
                          className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-[11px] font-bold text-cyan-200 inline-flex items-center gap-1"
                        >
                          <FishBadgeIcon fishType={fish} size={15} />
                          <span>{count} {getFishDisplayName(fish)}</span>
                        </span>
                      ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-sans mt-0.5 block">
                    0 fragments saved
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Newly Unlocked Fish Celebration */}
          {unlockedFish && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-gradient-to-r from-cyan-950/80 via-teal-950/80 to-slate-900/90 border-2 border-cyan-400 rounded-2xl p-3 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-center flex flex-col items-center gap-1.5"
            >
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                <span>New Fish Character Unlocked!</span>
              </div>
              <div className="my-1 flex items-center justify-center">
                <FishBadgeIcon fishType={unlockedFish.id} size={38} />
              </div>
              <div className="text-base font-black font-game text-white tracking-wider">
                {unlockedFish.name}
              </div>
              <div className="text-[11px] text-cyan-200/80">
                Unlocked at Fish Level 1 (10 Fragments collected across reefs)!
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
                  onClick={() => onEquipFish(unlockedFish.id)}
                  className={`mt-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer ${
                    isEquipped
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md active:scale-95'
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

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-2">
            {!isFinalReef ? (
              <button
                id="next-reef-btn"
                onClick={onNextReef}
                className="w-full py-3.5 sm:py-4 px-5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/25 transition active:scale-98 cursor-pointer text-base sm:text-lg"
              >
                <span>Keep Swimming!</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold mb-1">
                🏆 Master of the Deep! All 50 Reefs Cleared!
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                id="replay-reef-cleared-btn"
                onClick={onReplayReef}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer border border-white/10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>

              {onExitToMenu && (
                <button
                  id="exit-to-menu-cleared-btn"
                  onClick={onExitToMenu}
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
