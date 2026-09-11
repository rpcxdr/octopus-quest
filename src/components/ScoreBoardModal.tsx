import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Trophy, Sparkles, Home } from 'lucide-react';
import { FishFragmentCounts, FishType, GameDifficulty, GameStats, ReefProgress } from '../types';
import { getHighestBadge } from '../utils/badges';
import { getReefZoneName } from '../utils/reef';
import { getSpeedIncreasePercent } from '../utils/physics';
import { getFishDisplayName } from '../utils/fish';
import { countTotalFragments } from '../utils/fragments';
import { FishBadgeIcon } from './FishBadgeIcon';

interface ScoreBoardModalProps {
  score: number;
  reefLevel: number;
  reefColumn?: number;
  highScore: number;
  isNewHighScore: boolean;
  totalScore?: number;
  reefProgress?: ReefProgress;
  stats?: GameStats;
  difficulty?: GameDifficulty;
  attemptFragments?: FishFragmentCounts;
  reefMaxFragments?: FishFragmentCounts;
  onRestart: () => void;
  onOpenStats?: () => void;
  onGoHome: () => void;
}

export const ScoreBoardModal: React.FC<ScoreBoardModalProps> = ({
  score,
  reefLevel,
  reefColumn,
  highScore,
  isNewHighScore,
  totalScore,
  reefProgress,
  stats,
  difficulty,
  attemptFragments,
  reefMaxFragments,
  onRestart,
  onOpenStats,
  onGoHome,
}) => {
  const currentBadge = getHighestBadge(totalScore ?? Math.max(score, highScore), reefProgress, stats);

  return (
    <div id="game-over-modal" className="absolute inset-0 flex items-center justify-center p-4 z-20 pointer-events-auto bg-slate-950/80 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        className="w-full max-w-xs bg-slate-950/95 border border-cyan-500/25 rounded-3xl shadow-2xl p-5 text-slate-100 flex flex-col items-center select-none ring-1 ring-cyan-500/10"
      >
        {/* Game Over Title & Reef subheader */}
        <h2 id="game-over-title" className="text-2xl font-black tracking-wider font-game uppercase text-rose-400 drop-shadow-[0_4px_16px_rgba(244,63,94,0.35)] mb-0.5">
          Tangled in Kelp!
        </h2>
        <div className="text-[11px] font-bold text-cyan-300/80 mb-3 flex items-center gap-1.5">
          <span>Reef {reefLevel}: {getReefZoneName(reefLevel)}</span>
          {difficulty && (
            <span
              className={`text-[8.5px] uppercase font-black px-1.5 py-0.5 rounded-full border ${
                difficulty === 'easy'
                  ? 'text-emerald-300 border-emerald-500/40 bg-emerald-950/80'
                  : difficulty === 'hard'
                  ? 'text-orange-300 border-orange-500/40 bg-orange-950/80'
                  : 'text-cyan-300 border-cyan-500/40 bg-cyan-950/80'
              }`}
            >
              {difficulty} &bull; +{getSpeedIncreasePercent(difficulty, reefLevel)}% spd
            </span>
          )}
        </div>

        {/* Score Board Box */}
        <div id="score-summary-card" className="w-full bg-slate-900/90 border border-cyan-500/15 rounded-2xl p-3.5 shadow-2xl mb-4">
          <div className="flex items-center justify-between gap-3">
            {/* Badge Section */}
            <div className="flex flex-col items-center justify-center p-2 bg-slate-950/70 rounded-xl border border-white/10 min-w-[84px]">
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider mb-1">
                Badge
              </span>
              <div
                className={`w-12 h-12 rounded-full border-2 ${currentBadge.border} ${currentBadge.bg} flex items-center justify-center shadow-lg relative text-xl`}
              >
                {currentBadge.id !== 'none' ? (
                  <>
                    <span>{currentBadge.emoji}</span>
                    <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold">—</span>
                )}
              </div>
              <span className={`text-[10px] font-bold mt-1 ${currentBadge.color}`}>
                {currentBadge.label}
              </span>
              <span className="text-[8px] text-slate-400 font-medium leading-none mt-0.5">
                {currentBadge.effect}
              </span>
            </div>

            {/* Score & Best Section */}
            <div className="flex-1 flex flex-col gap-2">
              {/* Columns Passed This Run */}
              <div className="flex items-center justify-between bg-slate-950/70 px-3 py-1.5 rounded-xl border border-white/10">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Run Columns</span>
                  {reefColumn !== undefined && (
                    <span className="text-[9px] text-slate-400 font-sans">
                      Reef {reefLevel} ({reefColumn}/10)
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span id="game-current-score" className="text-xl font-black text-white font-game">
                    {score}
                  </span>
                </div>
              </div>

              {/* Best High Score */}
              <div className="flex items-center justify-between bg-slate-950/70 px-3 py-1.5 rounded-xl border border-white/10 relative">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Best Trophy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isNewHighScore && (
                    <span className="text-[9px] font-black uppercase bg-rose-500 text-white px-1.5 py-0.5 rounded-full animate-bounce shadow-md">
                      NEW!
                    </span>
                  )}
                  <span id="game-best-score" className="text-xl font-black text-amber-400 font-game">
                    {highScore}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reef Fragments Summary */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col gap-1 text-left">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-amber-300">
                Fragments (Attempt):
              </span>
              <span className="text-slate-400 text-[9px]">Reef {reefLevel} Max Kept</span>
            </div>
            <div className="flex items-center justify-between bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-white/5">
              <div>
                {attemptFragments && countTotalFragments(attemptFragments) > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 opacity-60">
                      {(Object.entries(attemptFragments) as [FishType, number][])
                        .filter(([_, c]) => c > 0)
                        .map(([fish, count]) => (
                          <span key={fish} className="text-xs font-bold text-rose-300/90 line-through inline-flex items-center gap-1">
                            <FishBadgeIcon fishType={fish} size={13} />
                            <span>+{count}</span>
                          </span>
                        ))}
                    </div>
                    <span className="text-[8px] text-rose-400 font-medium">
                      Lost (Level not completed)
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400">None found</span>
                )}
              </div>

              <div className="text-right">
                {reefMaxFragments && countTotalFragments(reefMaxFragments) > 0 ? (
                  <div className="flex items-center gap-1.5">
                    {(Object.entries(reefMaxFragments) as [FishType, number][])
                      .filter(([_, c]) => c > 0)
                      .map(([fish, count]) => (
                        <span key={fish} className="text-[11px] font-bold text-cyan-300 inline-flex items-center gap-1">
                          <FishBadgeIcon fishType={fish} size={13} />
                          <span>{count} max</span>
                        </span>
                      ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400">0 max</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            id="restart-game-btn"
            onClick={onRestart}
            className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 active:from-cyan-600 border-b-4 border-cyan-800 text-white font-black rounded-2xl transition flex items-center justify-center gap-2.5 text-lg shadow-xl cursor-pointer active:scale-98 tracking-wider font-game"
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

