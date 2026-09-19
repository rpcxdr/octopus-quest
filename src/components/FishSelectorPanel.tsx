import React, { useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { BirdSkin, FishType, GameStats, ReefProgress } from '../types';
import { BIRD_SKINS, DEFAULT_FISH_SKINS } from '../utils/physics';
import { FISH_LIST, getFishLevel, isFishUnlocked, getFishSpecialPower, canFishChangeColor, getFishColorUnlockHint } from '../utils/fish';
import { getBaseFragments } from '../utils/badges';
import { GraduatedCylinder } from './GraduatedCylinder';
import { FishBadgeIcon } from './FishBadgeIcon';
import { FishColorSelector } from './FishColorSelector';

export interface FishSelectorPanelProps {
  id?: string;
  selectedFish?: FishType;
  onSelectFish?: (fish: FishType) => void;
  totalFragmentsByFish?: Record<FishType, number>;
  selectedSkin?: BirdSkin;
  fishSkins?: Partial<Record<FishType, BirdSkin>>;
  onSelectSkin?: (skin: BirdSkin, fishType?: FishType) => void;
  stats?: GameStats;
  totalScore?: number;
  reefProgress?: ReefProgress;
  showHeader?: boolean;
  headerTitle?: string;
  className?: string;
  inspectedFish?: FishType | null;
  onInspectedFishChange?: (fish: FishType | null) => void;
}

export const FishSelectorPanel: React.FC<FishSelectorPanelProps> = ({
  id = 'fish-selector-panel',
  selectedFish,
  onSelectFish,
  totalFragmentsByFish = {},
  selectedSkin,
  fishSkins,
  onSelectSkin,
  stats,
  totalScore,
  reefProgress,
  showHeader = false,
  headerTitle = 'Fish Levels & Unlocks',
  className = '',
  inspectedFish: controlledInspectedFish,
  onInspectedFishChange,
}) => {
  const [internalInspectedFish, setInternalInspectedFish] = useState<FishType | null>(null);
  const [lockedHint, setLockedHint] = useState<string | null>(null);

  const isControlled = controlledInspectedFish !== undefined;
  const activeInspectedFish = isControlled ? controlledInspectedFish : internalInspectedFish;

  const setInspectedFish = (updater: (prev: FishType | null) => FishType | null) => {
    const nextVal = updater(activeInspectedFish);
    if (!isControlled) {
      setInternalInspectedFish(nextVal);
    }
    if (onInspectedFishChange) {
      onInspectedFishChange(nextVal);
    }
  };

  const calculatedTotalScore = totalScore ?? stats?.totalScore ?? 0;

  return (
    <div
      id={id}
      className={`w-full bg-slate-950/85 backdrop-blur-xl border border-cyan-500/25 rounded-2xl p-2 sm:p-2.5 shadow-2xl flex flex-col items-center ${className}`}
    >
      {/* Optional Header (e.g., used in StatsModal) */}
      {showHeader && (
        <div className="flex items-center justify-between w-full mb-2 px-1">
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.18em] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{headerTitle}</span>
          </span>
          <span className="text-[10px] text-slate-300 font-bold">
            Level = Fragments / 10
          </span>
        </div>
      )}

      {/* 5 Fish Tabs / Cards */}
      <div className="w-full grid grid-cols-5 gap-1">
        {FISH_LIST.map((fish) => {
          const frags = totalFragmentsByFish[fish.id] || 0;
          const fishLevel = getFishLevel(frags);
          const unlocked = isFishUnlocked(fish.id, fishLevel);
          const isSelected = selectedFish === fish.id;
          const isInspected = activeInspectedFish === fish.id;
          const fragmentsInLevel = frags % 10;

          return (
            <button
              key={fish.id}
              id={`fish-select-${fish.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (unlocked) {
                  if (onSelectFish) {
                    onSelectFish(fish.id);
                  }
                  setLockedHint(null);
                } else {
                  const needed = Math.max(0, 10 - frags);
                  setLockedHint(
                    `🔒 ${fish.name} unlocks at Fish Level 1 (requires 10 fragments across reefs, ${needed} more needed)`
                  );
                }
                setInspectedFish((prev) => (prev === fish.id ? null : fish.id));
              }}
              className={`relative flex items-center justify-between p-1 sm:p-1.5 rounded-xl border transition cursor-pointer text-center ${
                isInspected || isSelected
                  ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_14px_rgba(6,182,212,0.4)] scale-102 ring-1 ring-cyan-400'
                  : unlocked
                  ? 'border-white/10 bg-slate-900/60 hover:bg-slate-800/70 text-slate-300'
                  : 'border-white/5 bg-slate-950/40 text-slate-600 opacity-60'
              }`}
              title={`${fish.name} (Lv. ${fishLevel}) • ${fragmentsInLevel}/10 fragments (${10 - fragmentsInLevel} more to Lv.${fishLevel + 1})`}
            >
              {/* Left side: Fish Emoji/Lock, Name, and Level Badge */}
              <div className="flex flex-col items-center justify-center flex-1 min-w-0">
                {/* Fish Icon / Lock icon */}
                <div className="relative leading-none mb-0.5 flex items-center justify-center">
                  {unlocked ? (
                    <FishBadgeIcon fishType={fish.id} size={19} />
                  ) : (
                    <div className="relative inline-block leading-none">
                      <FishBadgeIcon fishType={fish.id} size={19} className="grayscale opacity-50" />
                      <Lock className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />
                    </div>
                  )}
                </div>

                {/* Fish Name */}
                <span
                  className={`text-[8.5px] font-bold leading-tight truncate w-full text-center ${
                    isSelected || isInspected ? 'text-white' : unlocked ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {fish.name.replace(' Fish', '')}
                </span>

                {/* Level Badge */}
                <span
                  className={`text-[9px] sm:text-[9.5px] font-bold mt-0.5 px-1.5 py-0.5 rounded leading-tight ${
                    isSelected || isInspected
                      ? 'bg-cyan-500/40 text-cyan-200'
                      : unlocked
                      ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {unlocked ? `Lv.${fishLevel}` : 'Lv.1'}
                </span>
              </div>

              {/* To the right of each fish and its level: Graduated cylinder with 10 level marks */}
              <div className="shrink-0 flex items-center justify-center pl-0.5">
                <GraduatedCylinder
                  fragmentsInLevel={fragmentsInLevel}
                  color={fish.themeColor}
                  level={fishLevel}
                  unlocked={unlocked}
                  fishName={fish.name}
                  size="sm"
                  showLabel={true}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Lock Hint Tooltip if tapped */}
      {lockedHint && (
        <div className="mt-1.5 text-[9px] text-amber-300 bg-amber-950/50 border border-amber-500/30 rounded-lg px-2 py-1 text-center font-medium animate-fade-in">
          {lockedHint}
        </div>
      )}

      {/* Fish Special Power Badge & Description - only appears after user clicks a fish */}
      {activeInspectedFish && (() => {
        const targetFish = activeInspectedFish;
        const activeFrags = totalFragmentsByFish[targetFish] || 0;
        const activeLevel = getFishLevel(activeFrags);
        const baseFrags = getBaseFragments(calculatedTotalScore, reefProgress, stats, totalFragmentsByFish);
        const power = getFishSpecialPower(targetFish, activeLevel, baseFrags);
        const activeFishObj = FISH_LIST.find((f) => f.id === targetFish);
        const activeFragmentsInLevel = activeFrags % 10;
        const unlocked = isFishUnlocked(targetFish, activeLevel);
        return (
          <div
            id={`fish-detail-${targetFish}`}
            className="w-full mt-2 pt-2 border-t border-cyan-500/15 flex items-center justify-between gap-2.5 px-2 animate-fade-in"
          >
            <div className="flex flex-col items-start gap-0.5 flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                  {activeFishObj?.name} {unlocked ? `(Lv. ${activeLevel})` : '(Locked)'}:
                </span>
                <span className="text-[10px] font-bold text-amber-300">
                  {power.title}
                </span>
              </div>
              <p className="text-[9px] text-slate-300/90 leading-tight">
                {power.desc}
              </p>
              <div className="text-[8.5px] text-slate-400 font-mono mt-0.5">
                {activeFrags} fragments collected &bull; {activeFragmentsInLevel}/10 to Lv.{activeLevel + 1} ({10 - activeFragmentsInLevel} more needed)
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-center bg-slate-900/60 p-1.5 rounded-xl border border-white/10">
              <GraduatedCylinder
                fragmentsInLevel={activeFragmentsInLevel}
                color={activeFishObj?.themeColor || '#38BDF8'}
                level={activeLevel}
                unlocked={unlocked}
                fishName={activeFishObj?.name || 'Fish Details'}
                size="md"
                showLabel={true}
              />
            </div>
          </div>
        );
      })()}

      {/* Shared color selection UX: Octopus from start, Sting Ray (Gulf Stream), Puffer Fish (Atlantis Gate), Clown Fish (Tidesong) */}
      {activeInspectedFish && (() => {
        const activeFishObj = FISH_LIST.find((f) => f.id === activeInspectedFish);
        const canChange = canFishChangeColor(activeInspectedFish, reefProgress, stats, totalFragmentsByFish);
        const unlockHint = getFishColorUnlockHint(activeInspectedFish, reefProgress, stats, totalFragmentsByFish);
        const fishSkin = fishSkins?.[activeInspectedFish] || selectedSkin || DEFAULT_FISH_SKINS[activeInspectedFish] || 'coral';

        return (
          <FishColorSelector
            fishType={activeInspectedFish}
            fishName={activeFishObj?.name || 'Fish'}
            selectedSkin={fishSkin}
            onSelectSkin={onSelectSkin}
            canChangeColor={canChange}
            unlockHint={unlockHint}
          />
        );
      })()}
    </div>
  );
};
