import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  VolumeX,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Sparkles,
} from 'lucide-react';
import { BirdSkin, FishFragmentCounts, FishType, GameDifficulty, GameStats, ReefProgress } from '../types';
import { getReefZoneName } from '../utils/reef';
import { countTotalFragments } from '../utils/fragments';
import { getNextBadgeGoal, getBadgeVisual } from '../utils/badges';
import { FishSelectorPanel } from './FishSelectorPanel';
import { RuneDetailsPanel } from './RuneDetailsPanel';
import { FishBadgeIcon } from './FishBadgeIcon';

interface StartScreenOverlayProps {
  stats: GameStats;
  selectedSkin: BirdSkin;
  selectedFish: FishType;
  fishSkins?: Record<FishType, BirdSkin>;
  difficulty: GameDifficulty;
  isMuted: boolean;
  reefProgress: ReefProgress;
  currentReefMaxFragments?: FishFragmentCounts;
  totalFragmentsByFish?: Record<FishType, number>;
  onSelectDifficulty: (diff: GameDifficulty) => void;
  onSelectSkin: (skin: BirdSkin, fishType?: FishType) => void;
  onSelectFish: (fish: FishType) => void;
  onToggleMute: () => void;
  onOpenStats: () => void;
  onSelectReef: (reefNumber: number) => void;
  onStartGame: () => void;
}

export const StartScreenOverlay: React.FC<StartScreenOverlayProps> = ({
  stats,
  selectedSkin,
  selectedFish,
  fishSkins,
  difficulty,
  isMuted,
  reefProgress,
  currentReefMaxFragments,
  totalFragmentsByFish,
  onSelectDifficulty,
  onSelectSkin,
  onSelectFish,
  onToggleMute,
  onOpenStats,
  onSelectReef,
  onStartGame,
}) => {
  const [lockedHint, setLockedHint] = useState<string | null>(null);
  const [inspectedFish, setInspectedFish] = useState<FishType | null>(null);
  const [showRuneDetails, setShowRuneDetails] = useState(false);
  const { currentReef, unlockedReef, clearedReefs } = reefProgress;
  const nextRuneGoal = getNextBadgeGoal(stats.totalScore, reefProgress, stats);
  const runeVisual = nextRuneGoal ? getBadgeVisual(nextRuneGoal.badge.id) : null;

  useEffect(() => {
    setShowRuneDetails(false);
  }, [reefProgress.currentReef, reefProgress.clearedReefs.length]);

  const handlePrevReef = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentReef > 1) {
      onSelectReef(currentReef - 1);
    }
  };

  const handleNextReef = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentReef < unlockedReef) {
      onSelectReef(currentReef + 1);
      setLockedHint(null);
    } else {
      setLockedHint(`🔒 Reef ${currentReef + 1} is locked! Complete Reef ${currentReef} to unlock it.`);
    }
  };

  return (
    <div
      id="start-screen-overlay"
      className="absolute inset-0 flex flex-col items-center justify-between p-3 sm:p-4 z-10 pointer-events-auto select-none"
    >
      {/* Top Bar: High Score Badge & Utility Buttons */}
      <div className="w-full flex items-center justify-between pt-1 px-1 shrink-0">
        {/* Local Best Score & Stats Badge */}
        <button
          id="open-stats-header-btn"
          onClick={onOpenStats}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/70 hover:bg-slate-900 border border-white/10 rounded-full shadow-lg text-slate-200 backdrop-blur-xl transition cursor-pointer active:scale-95"
          title="View High Score & Statistics"
        >
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">
            Best:
          </span>
          <span className="text-sm font-black font-game text-cyan-300">
            {stats.highScore}
          </span>
        </button>

        {/* Action Controls: Sound */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-sound-btn"
            onClick={onToggleMute}
            className="w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-white/10 flex items-center justify-center text-slate-200 shadow-lg backdrop-blur-xl transition cursor-pointer active:scale-95"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Title Area: Centered between top bar icons and rune goal */}
      <div
        className="flex flex-col items-center justify-center py-1 sm:py-1.5 w-full max-w-sm min-h-0 shrink-0"
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-center"
        >
          <h1
            className="text-3xl sm:text-4xl font-black tracking-wider font-game uppercase text-cyan-300 drop-shadow-[0_4px_16px_rgba(6,182,212,0.45)]"
            style={{
              WebkitTextStroke: '2px #020617',
              textShadow: '0 4px 0 #020617, 0 8px 16px rgba(0,0,0,0.6)',
            }}
          >
            Octopus Quest
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-200/80 mt-0.5">
            50 Deep Sea Reefs
          </p>
        </motion.div>
      </div>

      {/* Main Controls: Next Rune Goal, Reef Selector Play Button, Difficulty & Fish Selector */}
      <div className="flex flex-col items-center gap-2 sm:gap-2.5 w-full max-w-sm shrink-0">
        {/* Giant Next Rune/Badge Goal Panel (or invisible frame placeholder for spacing when all badges completed) */}
        {nextRuneGoal && runeVisual ? (
          <div
            id="home-next-rune-goal"
            role="button"
            tabIndex={0}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setShowRuneDetails((prev) => !prev);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setShowRuneDetails((prev) => !prev);
              }
            }}
            className={`w-full rounded-2xl border-2 ${runeVisual.border} ${runeVisual.bg} ${runeVisual.glow} relative overflow-hidden ${
              showRuneDetails ? 'p-2.5 sm:p-3' : 'py-3 sm:py-3.5 px-4'
            } flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none hover:scale-[1.01] active:scale-[0.99] shadow-2xl backdrop-blur-xl`}
            title={showRuneDetails ? "Tap to return to Goal view" : `Next Rune Goal: ${nextRuneGoal.badge.name} - Tap to view details`}
          >
            {showRuneDetails ? (
              <RuneDetailsPanel
                badge={nextRuneGoal.badge}
                progress={nextRuneGoal.progress}
                borderless
                id="home-rune-details-subpanel"
              />
            ) : (
              <>
                {/* Giant rune emoji visual in background */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-20 sm:opacity-25 text-7xl sm:text-8xl scale-110 drop-shadow-lg"
                  aria-hidden="true"
                >
                  {nextRuneGoal.badge.emoji}
                </div>

                {/* Overlaid centered text: "Next" newline "Rune" newline "Goal:" newline "[Rune name]" */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center leading-tight w-full">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.22em] text-cyan-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    Next
                  </span>
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.22em] text-cyan-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    Rune
                  </span>
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.22em] text-cyan-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    Goal:
                  </span>
                  <span
                    className={`text-2xl sm:text-3xl font-black font-game uppercase tracking-wider ${runeVisual.color} leading-none mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]`}
                  >
                    {nextRuneGoal.badge.name}
                  </span>

                  {/* Progress bar showing % complete just like on stats page (no words) */}
                  <div className="w-full bg-slate-950/70 rounded-full h-1.5 overflow-hidden mt-2.5 border border-white/10 max-w-[200px] shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        nextRuneGoal.progress.isAchieved
                          ? nextRuneGoal.badge.id === 'atlantis_gate'
                            ? 'bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]'
                            : nextRuneGoal.badge.id === 'gulf_stream'
                            ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]'
                            : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${nextRuneGoal.progress.percent}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Invisible placeholder maintaining identical layout frame spacing when all badges are achieved */
          <div
            id="home-next-rune-goal-placeholder"
            className="w-full rounded-2xl border-2 border-transparent py-3 sm:py-3.5 px-4 flex flex-col items-center justify-center invisible pointer-events-none select-none"
            aria-hidden="true"
          >
            <div className="flex flex-col items-center justify-center text-center leading-tight w-full">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.22em]">Next</span>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.22em]">Rune</span>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.22em]">Goal:</span>
              <span className="text-2xl sm:text-3xl font-black font-game uppercase tracking-wider leading-none mt-1">Placeholder</span>
              <div className="w-full h-1.5 mt-2.5 max-w-[200px]" />
            </div>
          </div>
        )}

        {/* Merged Reef Level Play Button with Left/Right Chevrons:
            Flows: Left Chevron | Large Current Reef Button | Right Chevron */}
        <div className="w-full flex items-stretch gap-1.5 sm:gap-2">
          {/* Left Chevron: dark translucent background, full height of the current Reef button */}
          <button
            id="prev-reef-btn"
            type="button"
            disabled={currentReef <= 1}
            onClick={handlePrevReef}
            className="w-11 sm:w-12 rounded-2xl bg-slate-950/85 hover:bg-slate-900/90 border border-cyan-500/30 flex items-center justify-center text-cyan-300 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer active:scale-95 shrink-0 shadow-xl"
            title="Previous Reef"
          >
            <ChevronLeft className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={2.5} />
          </button>

          {/* Large Current Reef Panel (Background and frame of old Play button, tap anywhere starts the level) */}
          <motion.button
            id="tap-to-start-btn"
            type="button"
            onClick={onStartGame}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 min-w-0 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 border-b-4 border-cyan-800 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col items-center justify-center gap-1 text-white cursor-pointer transition select-none"
            title="Tap to dive into the reef!"
          >
            {/* Top Line: Word "Reef" in smaller font over top of large reef number */}
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100 drop-shadow-sm mb-0.5">
                Reef
              </span>
              <span className="text-6xl sm:text-7xl font-black font-game text-white tracking-wider leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                {currentReef}
              </span>
            </div>

            {/* Full panel width: Reef Theme Description in smaller font */}
            <div className="w-full text-center text-xs sm:text-[13px] font-semibold text-white/95 tracking-wide px-1 truncate drop-shadow-sm">
              {getReefZoneName(currentReef)}
            </div>

            {/* Full panel width: Fragment Record Summary */}
            {(() => {
              const totalFragments = currentReefMaxFragments ? countTotalFragments(currentReefMaxFragments) : 0;
              const fragmentEntries = currentReefMaxFragments
                ? (Object.entries(currentReefMaxFragments) as [FishType, number][]).filter(([_, count]) => count > 0)
                : [];

              return (
                <div className="w-full h-7 flex items-center justify-center px-1 text-[10.5px]">
                  {totalFragments > 0 ? (
                    <div className="w-full flex items-center justify-center gap-2 py-1 px-2.5 rounded-lg bg-cyan-950/40 border border-white/20 font-mono font-bold text-amber-200 flex-wrap shadow-inner">
                      {fragmentEntries.map(([fish, count]) => (
                        <span key={fish} className="flex items-center gap-1" title={`${fish}: ${count}`}>
                          <FishBadgeIcon fishType={fish} size={14} />
                          <span>{count}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full" aria-hidden="true" />
                  )}
                </div>
              );
            })()}
          </motion.button>

          {/* Right Chevron: dark translucent background, full height of the current Reef button */}
          <button
            id="next-reef-btn"
            type="button"
            onClick={handleNextReef}
            className={`w-11 sm:w-12 rounded-2xl bg-slate-950/85 border border-cyan-500/30 flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0 shadow-xl ${
              currentReef >= unlockedReef
                ? 'text-slate-500 opacity-30 hover:text-amber-400 hover:border-amber-500/40'
                : 'text-cyan-300 hover:bg-slate-900/90'
            }`}
            title={
              currentReef >= unlockedReef
                ? `Reef ${currentReef + 1} is locked - Complete Reef ${currentReef} to unlock`
                : "Next Reef"
            }
          >
            <ChevronRight className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={2.5} />
          </button>
        </div>

        {/* Difficulty Mode Selector: Easy, Medium (Default), Hard */}
        <div
          id="difficulty-mode-panel"
          className="w-full bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-1.5 shadow-2xl"
        >
          <div className="grid grid-cols-3 gap-1.5 w-full">
            {/* Easy Mode Button */}
            <button
              id="difficulty-btn-easy"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDifficulty('easy');
              }}
              className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                difficulty === 'easy'
                  ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-950 border border-emerald-300/40 font-black ring-1 ring-emerald-400/50'
                  : 'text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800/80 border border-white/5'
              }`}
              title="Easy mode: Column gap is 20% wider, speed scales 1% to 50%"
            >
              <div className="flex items-center gap-1">
                <span>Easy</span>
              </div>
              <span
                className={`text-[8.5px] leading-tight ${
                  difficulty === 'easy' ? 'text-emerald-100 font-semibold' : 'text-slate-400'
                }`}
              >
                +20% Gap
              </span>
            </button>

            {/* Medium Mode Button */}
            <button
              id="difficulty-btn-medium"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDifficulty('medium');
              }}
              className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                difficulty === 'medium'
                  ? 'bg-gradient-to-b from-cyan-500 to-teal-600 text-white shadow-md shadow-cyan-950 border border-cyan-300/40 font-black ring-1 ring-cyan-400/50'
                  : 'text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800/80 border border-white/5'
              }`}
              title="Medium mode: Standard column gap, speed scales 1% to 50%"
            >
              <div className="flex items-center gap-1">
                <span>Medium</span>
              </div>
              <span
                className="text-[8.5px] leading-tight invisible select-none"
                aria-hidden="true"
              >
                &nbsp;
              </span>
            </button>

            {/* Hard Mode Button */}
            <button
              id="difficulty-btn-hard"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDifficulty('hard');
              }}
              className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                difficulty === 'hard'
                  ? 'bg-gradient-to-b from-orange-500 to-amber-600 text-white shadow-md shadow-orange-950 border border-amber-300/40 font-black ring-1 ring-amber-400/50'
                  : 'text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800/80 border border-white/5'
              }`}
              title="Hard mode: +20% base speed boost, speed scales 21% to 70%"
            >
              <div className="flex items-center gap-1">
                <span>Hard</span>
              </div>
              <span
                className={`text-[8.5px] leading-tight ${
                  difficulty === 'hard' ? 'text-orange-100 font-semibold' : 'text-slate-400'
                }`}
              >
                +20% Speed
              </span>
            </button>
          </div>
        </div>

        {/* Aquatic Fish Character Selector - Reusable FishSelectorPanel */}
        <FishSelectorPanel
          id="fish-selector-panel"
          selectedFish={selectedFish}
          onSelectFish={onSelectFish}
          totalFragmentsByFish={totalFragmentsByFish}
          selectedSkin={selectedSkin}
          fishSkins={fishSkins}
          onSelectSkin={onSelectSkin}
          stats={stats}
          reefProgress={reefProgress}
          inspectedFish={inspectedFish}
          onInspectedFishChange={setInspectedFish}
        />

      {/* Transparent spacer under fish selector panel to stabilize layout whether details are open or closed */}
      <div
        className={`w-full pointer-events-none transition-all duration-200 ${
          inspectedFish ? 'h-0' : 'h-[86px]'
        }`}
        aria-hidden="true"
      />
    </div>

    {/* Bottom flexible spacer to balance vertical distribution and reduce title padding by 1/3 */}
    <div className="w-full max-w-sm pointer-events-none min-h-0 shrink" style={{ flex: 1 }} aria-hidden="true" />
  </div>
);
};
