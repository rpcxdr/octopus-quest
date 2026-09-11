import React from 'react';
import { Play, Lock } from 'lucide-react';
import { AllReefFragments, FishType } from '../types';
import { getFishDisplayName } from '../utils/fish';
import { getReefLevelStyle } from '../utils/backgroundAesthetics';
import { TOTAL_REEF_LEVELS } from '../utils/reef';
import { FishBadgeIcon } from './FishBadgeIcon';

export interface ReefFragmentRecordItemProps {
  reefLevel: number;
  counts: Partial<Record<FishType, number>>;
  isUnlocked: boolean;
  onSelectReef?: (reefLevel: number) => void;
}

/**
 * Individual row for a Reef's retained fragment records.
 * Layout from left to right:
 * 1. Reef Number (just the number, large font)
 * 2. Fragments collected (no sub frames, single line, no horizontal scrollbar)
 * 3. Play button if unlocked OR Lock icon if locked
 *
 * Background:
 * - If unlocked: matches the color palette of the level's background theme
 * - If locked: zero saturation grey background (#202020)
 *
 * Interaction:
 * - Clicking anywhere on an unlocked level selects it to be played.
 */
export const ReefFragmentRecordRow: React.FC<ReefFragmentRecordItemProps> = ({
  reefLevel,
  counts,
  isUnlocked,
  onSelectReef,
}) => {
  const reefStyle = getReefLevelStyle(reefLevel, isUnlocked);

  // Non-zero fragment entries
  const fragmentEntries = (Object.entries(counts) as [FishType, number][])
    .filter(([_, c]) => c > 0)
    .sort((a, b) => b[1] - a[1]);

  // Styling based on unlocked status
  const rowStyle: React.CSSProperties = {
    background: reefStyle.background,
    borderColor: reefStyle.borderColor,
    boxShadow: reefStyle.boxShadow,
  };

  const handleRowClick = () => {
    if (isUnlocked && onSelectReef) {
      onSelectReef(reefLevel);
    }
  };

  return (
    <div
      id={`reef-fragment-record-${reefLevel}`}
      role={isUnlocked ? 'button' : undefined}
      tabIndex={isUnlocked ? 0 : undefined}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (isUnlocked && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleRowClick();
        }
      }}
      style={rowStyle}
      title={isUnlocked ? `Reef ${reefLevel} — Click to play` : `Reef ${reefLevel} — Locked`}
      className={`w-full px-2.5 py-1.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2.5 select-none ${
        isUnlocked
          ? 'cursor-pointer hover:brightness-115 hover:border-cyan-300/60 active:scale-[0.99] group/row'
          : 'cursor-default opacity-60'
      }`}
    >
      {/* 1. Reef Number: Just the number, prominent display font */}
      <div className="flex items-center min-w-[1.6rem] sm:min-w-[2rem] shrink-0">
        <span
          className={`font-game font-black text-lg sm:text-xl leading-none ${
            isUnlocked
              ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] group-hover/row:text-cyan-200 transition-colors'
              : 'text-[#757575]'
          }`}
        >
          {reefLevel}
        </span>
      </div>

      {/* 2. Fragments Collected: Compact, single line, absolutely no scrollbar */}
      <div className="flex-1 flex items-center gap-2 sm:gap-3 flex-nowrap overflow-hidden justify-start min-w-0 px-0.5">
        {fragmentEntries.length > 0 &&
          fragmentEntries.map(([fish, c]) => (
            <div
              key={fish}
              className="flex items-center gap-1 shrink-0 whitespace-nowrap"
              title={`${getFishDisplayName(fish)}: ${c}`}
            >
              <FishBadgeIcon
                fishType={fish}
                size={16}
                className={`drop-shadow-sm ${!isUnlocked ? 'grayscale opacity-50' : ''}`}
              />
              <span
                className={`font-mono font-black text-xs sm:text-sm leading-none ${
                  isUnlocked
                    ? 'text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]'
                    : 'text-[#808080]'
                }`}
              >
                {c}
              </span>
            </div>
          ))}
      </div>

      {/* 3. Action: Play button if unlocked OR Lock icon if locked */}
      <div className="shrink-0 flex items-center">
        {isUnlocked ? (
          <div
            id={`play-reef-record-${reefLevel}`}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/25 group-hover/row:bg-emerald-500/40 border border-emerald-400/50 text-emerald-200 group-hover/row:text-white flex items-center justify-center shrink-0 transition shadow-sm"
            title={`Play Reef ${reefLevel}`}
          >
            <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current ml-0.5 group-hover/row:scale-110 transition-transform" />
          </div>
        ) : (
          <div
            id={`locked-reef-record-${reefLevel}`}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#181818] border border-[#2c2c2c] text-[#606060] flex items-center justify-center shrink-0"
            title={`Reef ${reefLevel} Locked`}
          >
            <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
};

export interface ReefFragmentRecordListProps {
  allReefFragments?: AllReefFragments;
  unlockedReef?: number;
  onSelectReef?: (reefLevel: number) => void;
  className?: string;
  totalLevels?: number;
  records?: Array<{
    reefLevel: number;
    counts: Partial<Record<FishType, number>>;
  }>;
}

/**
 * Reusable single-column list rendering retained fragment records per reef.
 * By default includes all 50 levels (including levels with 0 fragments and locked ones).
 */
export const ReefFragmentRecordList: React.FC<ReefFragmentRecordListProps> = ({
  allReefFragments = {},
  unlockedReef = 1,
  onSelectReef,
  className = '',
  totalLevels = TOTAL_REEF_LEVELS,
  records,
}) => {
  // If custom records array is passed, use it; otherwise build full 1..totalLevels list
  const listItems =
    records ??
    Array.from({ length: totalLevels }, (_, i) => {
      const level = i + 1;
      return {
        reefLevel: level,
        counts: (allReefFragments[level] || {}) as Partial<Record<FishType, number>>,
      };
    });

  return (
    <div
      id="reef-fragment-record-list"
      className={`flex flex-col gap-1.5 ${className}`}
    >
      {listItems.map((item) => (
        <ReefFragmentRecordRow
          key={item.reefLevel}
          reefLevel={item.reefLevel}
          counts={item.counts}
          isUnlocked={item.reefLevel <= unlockedReef}
          onSelectReef={onSelectReef}
        />
      ))}
    </div>
  );
};
