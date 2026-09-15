import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Home } from 'lucide-react';
import { FishSkeletonIcon } from './FishSkeletonIcon';
import { FishFragmentCounts, FishType, GameDifficulty, GameStats, ReefProgress } from '../types';
import { getReefZoneName } from '../utils/reef';
import { ReefClearedRecordColumns } from './RecordColumnPodView';
import { REEF_FISH_ORDER } from './ReefFragmentRecordList';

interface ScoreBoardModalProps {
  score?: number;
  reefLevel: number;
  reefColumn?: number;
  highScore?: number;
  isNewHighScore?: boolean;
  totalScore?: number;
  reefProgress?: ReefProgress;
  stats?: GameStats;
  difficulty?: GameDifficulty;
  attemptFragments?: FishFragmentCounts;
  reefMaxFragments?: FishFragmentCounts;
  totalFragmentsByFish?: Record<FishType, number>;
  priorTotalFragmentsByFish?: Record<FishType, number>;
  onRestart: () => void;
  onOpenStats?: () => void;
  onGoHome: () => void;
}

export const ScoreBoardModal: React.FC<ScoreBoardModalProps> = ({
  reefLevel,
  attemptFragments,
  reefMaxFragments,
  totalFragmentsByFish,
  priorTotalFragmentsByFish,
  onRestart,
  onGoHome,
}) => {
  // Determine if any new record was achieved during this swim attempt
  const hasNewRecords = REEF_FISH_ORDER.some((fish) => {
    const collected = attemptFragments?.[fish] || 0;
    const prior = Number(reefMaxFragments?.[fish]) || 0;
    return collected > prior;
  });

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Tapping anywhere in the background backdrop starts the replay
    if (e.target === e.currentTarget) {
      onRestart();
    }
  };

  return (
    <div
      id="game-over-modal"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-auto bg-slate-950/85 backdrop-blur-md cursor-pointer overflow-x-hidden"
      title="Tap background to replay"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.85, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 280 }}
        className="w-full max-w-sm max-h-[92vh] overflow-y-auto overflow-x-hidden bg-slate-900/95 border border-rose-500/40 rounded-3xl p-5 shadow-[0_0_50px_rgba(244,63,94,0.25)] text-slate-100 flex flex-col items-center text-center relative cursor-default"
      >
        {/* Ambient failure glow & background failed icon watermark (same size & opacity as reef cleared modal, but red) */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none text-rose-500/[0.08] flex items-center justify-center select-none -z-0">
          <FishSkeletonIcon className="w-44 h-44 -rotate-6" strokeWidth={1.25} />
        </div>

        {/* Game Over Title matching Reef Cleared modal font size */}
        <h2
          id="game-over-title"
          className="relative z-10 text-3xl sm:text-4xl font-black font-game uppercase text-rose-400 tracking-wider mb-1 pt-1 drop-shadow-[0_2px_16px_rgba(244,63,94,0.45)]"
        >
          Tangled in Kelp!
        </h2>

        {/* Reef Zone Name (with difficulty/speed text removed) */}
        <div className="text-xs text-cyan-200/70 mb-3 relative z-10">
          Reef {reefLevel}: {getReefZoneName(reefLevel)}
        </div>

        {/* Reused Fragment Records Summary Layout with Lost Achievements Overlay */}
        <div className="w-full relative my-1 overflow-visible">
          <ReefClearedRecordColumns
            attemptFragments={attemptFragments}
            reefMaxFragments={reefMaxFragments}
            totalFragmentsByFish={totalFragmentsByFish}
            priorTotalFragmentsByFish={priorTotalFragmentsByFish}
            isGameOver={true}
          />

          {/* Emotionally impactful 0.5s animation overlay showing you have lost all new records */}
          {hasNewRecords && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none overflow-hidden rounded-2xl">
              {/* Crimson flash pulse across the achievements container */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.45, 0.2] }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-0 bg-rose-950/60 border border-rose-500/40 rounded-2xl"
              />

              {/* Dynamic diagonal slash lines cutting across achievements */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="absolute top-1/2 left-1 right-1 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_20px_rgba(244,63,94,1)] -rotate-6 origin-center"
              />
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 0.9 }}
                transition={{ delay: 0.06, duration: 0.2, ease: 'easeOut' }}
                className="absolute top-1/2 left-3 right-3 h-0.5 bg-rose-300 shadow-[0_0_12px_rgba(255,255,255,0.9)] -rotate-6 origin-center"
              />

              {/* Shockwave ripple expanding when the stamp impacts */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.4], opacity: [0, 0.9, 0] }}
                transition={{ delay: 0.18, duration: 0.32, ease: 'easeOut' }}
                className="absolute w-60 h-20 rounded-2xl border-2 border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.9)]"
              />

              {/* Heavy impact slam stamp */}
              <motion.div
                initial={{ scale: 2.2, opacity: 0, rotate: -12 }}
                animate={{ scale: [2.2, 0.95, 1], opacity: 1, rotate: -3 }}
                transition={{
                  duration: 0.48,
                  times: [0, 0.72, 1],
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative z-40 bg-slate-950/95 border-2 border-rose-500 rounded-2xl px-6 py-3.5 sm:px-7 sm:py-4 shadow-[0_0_36px_rgba(244,63,94,0.85)] flex items-center justify-center text-center ring-2 ring-rose-500/30"
              >
                <div className="flex items-center gap-2.5 text-rose-400 font-game font-black text-lg sm:text-xl uppercase tracking-widest drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                  <FishSkeletonIcon className="w-6 h-6 text-rose-400 animate-pulse shrink-0" strokeWidth={2.25} />
                  <span>Rewards Lost</span>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 mt-3 relative z-10">
          <button
            id="restart-game-btn"
            onClick={onRestart}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 active:from-cyan-600 border-b-4 border-cyan-800 text-white font-black rounded-2xl transition flex items-center justify-center gap-2.5 text-base shadow-xl cursor-pointer active:scale-98 tracking-wider font-game"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>Replay</span>
          </button>

          <button
            id="game-over-home-btn"
            onClick={onGoHome}
            className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-md active:scale-98"
            title="Return to Home Screen"
          >
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            <span>Home</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

