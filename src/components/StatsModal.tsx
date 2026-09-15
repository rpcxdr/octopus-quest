import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Award, Flame, Zap, Trash2, X, Check, ChevronRight, ChevronDown, Sparkles, Home, Compass } from 'lucide-react';
import { AllReefFragments, BadgeId, BirdSkin, FishType, GameStats, ReefProgress } from '../types';
import { getBestReefScore } from '../utils/fish';
import { BADGES, isBadgeUnlocked, getBaseFragments, getBadgeProgress } from '../utils/badges';
import { TOTAL_REEF_LEVELS } from '../utils/reef';
import { getReefLevelStyle } from '../utils/backgroundAesthetics';
import { countTotalFragments } from '../utils/fragments';
import { FishFragmentArchiveModal } from './FishFragmentArchiveModal';
import { FishSelectorPanel } from './FishSelectorPanel';
import { RuneDetailsPanel } from './RuneDetailsPanel';

interface StatsModalProps {
  stats: GameStats;
  reefProgress?: ReefProgress;
  allReefFragments?: AllReefFragments;
  totalFragmentsByFish?: Record<FishType, number>;
  selectedFish?: FishType;
  onSelectFish?: (fish: FishType) => void;
  selectedSkin?: BirdSkin;
  fishSkins?: Record<FishType, BirdSkin>;
  onSelectSkin?: (skin: BirdSkin, fishType?: FishType) => void;
  onSelectReef?: (reefLevel: number) => void;
  onClose: () => void;
  onClearStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  stats,
  reefProgress,
  allReefFragments = {},
  totalFragmentsByFish = {},
  selectedFish,
  onSelectFish,
  selectedSkin,
  fishSkins,
  onSelectSkin,
  onSelectReef,
  onClose,
  onClearStats,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showFragmentModal, setShowFragmentModal] = useState(false);
  const [isDepthScoreOpen, setIsDepthScoreOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState<BadgeId | null>(null);
  const [inspectedFish, setInspectedFish] = useState<FishType | null>(null);
  const bestReefs = getBestReefScore(stats, reefProgress);
  const unlockedReefCount = reefProgress?.unlockedReef ?? 1;
  const totalFragmentsCount = countTotalFragments(totalFragmentsByFish);

  // Keyboard shortcut: Spacebar (or Escape) closes the stats screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'Escape' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (showFragmentModal) {
          setShowFragmentModal(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose, showFragmentModal]);

  return (
    <div id="stats-modal" className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-slate-950/95 border border-white/15 rounded-3xl shadow-2xl p-5 text-slate-100 flex flex-col relative ring-1 ring-white/10 max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          id="close-stats-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xl font-black font-game uppercase tracking-wider text-cyan-400 drop-shadow-[0_2px_8px_rgba(6,182,212,0.35)]">
            Deep Sea Records & Stats
          </h3>
        </div>

        {/* Primary High Score Highlight (Clickable Accordion unfolding Dives, Points, Strokes, Fish Power) */}
        <div
          id="stat-depth-score-card"
          className={`rounded-2xl border transition-all duration-200 shadow-xl mb-4 overflow-hidden ${
            isDepthScoreOpen
              ? 'bg-slate-900/95 border-cyan-400/80 ring-1 ring-cyan-400/40'
              : 'bg-gradient-to-r from-cyan-500/20 via-slate-900 to-slate-900 border-cyan-500/30 hover:border-cyan-400/60'
          }`}
        >
          <button
            type="button"
            id="toggle-depth-score-details-btn"
            onClick={() => {
              setIsDepthScoreOpen((prev) => {
                const next = !prev;
                if (next) {
                  setSelectedBadgeId(null);
                  setInspectedFish(null);
                }
                return next;
              });
            }}
            className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition select-none group"
            aria-expanded={isDepthScoreOpen}
          >
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                Personal Best Depth Score
              </div>
              <div className="text-4xl font-black font-game mt-0.5 text-white drop-shadow-[0_2px_10px_rgba(6,182,212,0.3)]">
                {stats.highScore}
              </div>
              {stats.dateSet && (
                <div className="text-[10px] text-cyan-200/60 mt-1">
                  Achieved: {stats.dateSet}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/40 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Trophy className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-white/10 transition">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isDepthScoreOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>
          </button>

          {/* Unfolded Details: The Dives, Points, Strokes, and Cumulative Fragments Found (Title: Fish Power) */}
          {isDepthScoreOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-4 pt-1 border-t border-cyan-500/20"
            >
              <div className="grid grid-cols-2 gap-2 mt-2">
                {/* Dives */}
                <div
                  id="stat-dives-completed"
                  className="bg-slate-950/80 p-2.5 rounded-xl border border-white/10 flex flex-col justify-between shadow-inner"
                >
                  <div className="flex items-center gap-1 text-slate-400 text-[9px] font-black uppercase tracking-tight">
                    <Flame className="w-3 h-3 text-orange-400 shrink-0" />
                    <span className="truncate" title="Dives">Dives</span>
                  </div>
                  <span className="text-lg sm:text-xl font-black font-game text-white mt-1 truncate">
                    {stats.gamesPlayed}
                  </span>
                </div>

                {/* Points */}
                <div
                  id="stat-total-points"
                  className="bg-slate-950/80 p-2.5 rounded-xl border border-white/10 flex flex-col justify-between shadow-inner"
                >
                  <div className="flex items-center gap-1 text-slate-400 text-[9px] font-black uppercase tracking-tight">
                    <Award className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate" title="Points">Points</span>
                  </div>
                  <span className="text-lg sm:text-xl font-black font-game text-white mt-1 truncate">
                    {stats.totalScore}
                  </span>
                </div>

                {/* Strokes */}
                <div
                  id="stat-total-strokes"
                  className="bg-slate-950/80 p-2.5 rounded-xl border border-white/10 flex flex-col justify-between shadow-inner"
                >
                  <div className="flex items-center gap-1 text-slate-400 text-[9px] font-black uppercase tracking-tight">
                    <Zap className="w-3 h-3 text-teal-300 shrink-0" />
                    <span className="truncate" title="Strokes">Strokes</span>
                  </div>
                  <span
                    className="text-lg sm:text-xl font-black font-game text-white mt-1 truncate"
                    title={stats.totalFlaps.toLocaleString()}
                  >
                    {stats.totalFlaps.toLocaleString()}
                  </span>
                </div>

                {/* Cumulative Fragments Found (Titled "Fish Power") */}
                <div
                  id="stat-fish-power"
                  className="bg-slate-950/80 p-2.5 rounded-xl border border-amber-500/25 flex flex-col justify-between shadow-inner"
                >
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-tight">
                    <div className="flex items-center gap-1 text-amber-300 truncate" title="Fish Power">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">Fish Power</span>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mt-1.5">
                    <span className="text-lg sm:text-xl font-black font-game text-amber-300 truncate">
                      {totalFragmentsCount}
                    </span>
                    <span className="text-[8.5px] text-amber-200/60 font-medium truncate ml-1">
                      Fragments
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Reef Levels Button (Opens Level Selection) with 50-column dynamic background */}
        <button
          id="open-fragment-archive-btn"
          type="button"
          onClick={() => setShowFragmentModal(true)}
          className="relative w-full overflow-hidden border border-cyan-500/40 hover:border-cyan-400/70 py-3.5 px-4 rounded-2xl mb-4 text-left transition-all cursor-pointer shadow-lg group active:scale-[0.99] flex items-center justify-between"
        >
          {/* 50 equal-width background columns colored by level aesthetic and unlock status */}
          <div className="absolute inset-0 flex pointer-events-none" aria-hidden="true">
            {Array.from({ length: TOTAL_REEF_LEVELS }, (_, i) => i + 1).map((level) => {
              const isUnlocked = level <= unlockedReefCount;
              const levelStyle = getReefLevelStyle(level, isUnlocked);
              return (
                <div
                  key={level}
                  className="flex-1 h-full border-r border-black/20 last:border-r-0"
                  style={{ background: levelStyle.background }}
                />
              );
            })}
          </div>

          {/* Contrast preservation overlay: allows the 50 colored columns to clearly shine through while keeping text 100% legible */}
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px] pointer-events-none group-hover:bg-slate-950/30 transition-colors" />

          {/* Button Content */}
          <div className="relative z-10 flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-950/75 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 group-hover:border-cyan-400/70 shadow-md transition-all">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <span className="text-base sm:text-lg font-bold text-white tracking-wide truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              Reef Levels: <span className="font-black text-cyan-300 font-game">{unlockedReefCount}/50</span>
            </span>
          </div>
          <div className="relative z-10 w-7 h-7 rounded-lg bg-slate-950/60 border border-white/15 flex items-center justify-center shrink-0 ml-2 group-hover:border-cyan-400/50 transition-colors shadow-sm">
            <ChevronRight className="w-5 h-5 stroke-[2.5] text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Rune Powers & Fragment Boosts */}
        <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/10 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Rune Powers
            </span>
            <span className="text-[10px] font-bold text-amber-300">
              Base: +{getBaseFragments(stats.totalScore, reefProgress, stats)} frags/reef
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
            {BADGES.map((b) => {
              const unlocked = isBadgeUnlocked(b.id, stats.totalScore, reefProgress, stats);
              const progress = getBadgeProgress(b.id, stats.totalScore, reefProgress, stats);
              const isSelected = selectedBadgeId === b.id;
              return (
                <button
                  key={b.id}
                  id={`stat-badge-${b.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedBadgeId((prev) => {
                      const next = prev === b.id ? null : b.id;
                      if (next !== null) {
                        setInspectedFish(null);
                        setIsDepthScoreOpen(false);
                      }
                      return next;
                    });
                  }}
                  className={`p-1.5 rounded-xl border flex flex-col items-center justify-between transition cursor-pointer active:scale-95 select-none min-h-[74px] ${
                    isSelected
                      ? 'ring-2 ring-cyan-400 border-cyan-400 scale-[1.03]'
                      : 'hover:border-white/20'
                  } ${
                    unlocked
                      ? b.id === 'atlantis_gate'
                        ? 'bg-indigo-500/20 border-indigo-400/60 text-indigo-300 shadow-[0_0_12px_rgba(129,140,248,0.25)]'
                        : b.id === 'gulf_stream'
                        ? 'bg-sky-500/20 border-sky-400/60 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                        : b.id === 'diamond'
                        ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300'
                        : b.id === 'nautilus'
                        ? 'bg-yellow-500/15 border-yellow-400/50 text-yellow-300'
                        : b.id === 'shell'
                        ? 'bg-slate-300/15 border-slate-300/50 text-slate-200'
                        : 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-white/5 border-white/5 opacity-40 text-slate-500'
                  }`}
                  title={`${b.name} (${progress.current}/${progress.target} ${progress.unit})`}
                >
                  <div className="text-xl sm:text-2xl">{b.emoji}</div>
                  <div className="text-[9px] sm:text-[9.5px] font-bold mt-0.5 leading-tight text-center w-full break-words min-h-[22px] flex items-center justify-center">
                    {b.name}
                  </div>
                  {/* Simple visual progress bar (no words or numbers) */}
                  <div className="w-full bg-slate-950/70 rounded-full h-1.5 overflow-hidden mt-1 border border-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress.isAchieved
                          ? b.id === 'atlantis_gate'
                            ? 'bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]'
                            : b.id === 'gulf_stream'
                            ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]'
                            : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Badge Goal & Rune Power details */}
          {(() => {
            const selectedBadge = BADGES.find((b) => b.id === selectedBadgeId);
            if (!selectedBadge) {
              return null;
            }
            const selectedProgress = getBadgeProgress(
              selectedBadge.id,
              stats.totalScore,
              reefProgress,
              stats
            );
            return (
              <RuneDetailsPanel
                badge={selectedBadge}
                progress={selectedProgress}
              />
            );
          })()}
        </div>

        {/* Fish Character Levels & Unlocks - Reusable FishSelectorPanel */}
        <FishSelectorPanel
          id="stats-fish-selector-panel"
          selectedFish={selectedFish}
          onSelectFish={(fish) => {
            onSelectFish?.(fish);
            setSelectedBadgeId(null);
            setIsDepthScoreOpen(false);
          }}
          totalFragmentsByFish={totalFragmentsByFish}
          selectedSkin={selectedSkin}
          fishSkins={fishSkins}
          onSelectSkin={onSelectSkin}
          stats={stats}
          reefProgress={reefProgress}
          showHeader={true}
          headerTitle="Fish Levels & Unlocks"
          className="mb-4 bg-slate-900/70"
          inspectedFish={inspectedFish}
          onInspectedFishChange={(fish) => {
            setInspectedFish(fish);
            if (fish !== null) {
              setSelectedBadgeId(null);
              setIsDepthScoreOpen(false);
            }
          }}
        />

        {/* Clear Stats Confirmation & Home Button */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          {!confirmDelete ? (
            <button
              id="clear-stats-btn"
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer transition py-1 px-2 rounded-lg hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Records</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400 font-bold">Reset?</span>
              <button
                id="confirm-reset-stats-btn"
                onClick={() => {
                  onClearStats();
                  setConfirmDelete(false);
                }}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Yes</span>
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            id="close-stats-modal-btn"
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-md active:scale-95"
            title="Return to Home Screen"
          >
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            <span>Home</span>
          </button>
        </div>
      </motion.div>

      {/* Fish Fragment Archive Sub-Modal */}
      <FishFragmentArchiveModal
        isOpen={showFragmentModal}
        onClose={() => setShowFragmentModal(false)}
        totalFragmentsByFish={totalFragmentsByFish}
        allReefFragments={allReefFragments}
        unlockedReef={reefProgress?.unlockedReef ?? 1}
        onSelectReefAndClose={(reefLevel) => {
          setShowFragmentModal(false);
          onSelectReef?.(reefLevel);
          onClose();
        }}
      />
    </div>
  );
};

