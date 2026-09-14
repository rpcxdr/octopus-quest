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
 * Predictable column order for all reef levels:
 * Column 1: Octopus
 * Column 2: Puffer Fish
 * Column 3: Clown Fish
 * Column 4: Stingray
 * Column 5: Seahorse
 */
export const REEF_FISH_ORDER: FishType[] = [
  'octopus',
  'pufferfish',
  'clownfish',
  'singray',
  'seahorse',
];

/**
 * Individual row for a Reef's retained fragment records.
 * Layout from left to right:
 * 1. Reef Number (fixed width, prominent display font)
 * 2. 5 Aligned Fragment Columns (Octopus, Puffer, Clown, Stingray, Seahorse)
 *    If count is 0, leaves an empty space with no fish and no number.
 * 3. Play button if unlocked OR Lock icon if locked
 */
export const ReefFragmentRecordRow: React.FC<ReefFragmentRecordItemProps> = ({
  reefLevel,
  counts,
  isUnlocked,
  onSelectReef,
}) => {
  const reefStyle = getReefLevelStyle(reefLevel, isUnlocked);

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
      className={`w-full px-2.5 py-1.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-1.5 sm:gap-2 select-none ${
        isUnlocked
          ? 'cursor-pointer hover:brightness-115 hover:border-cyan-300/60 active:scale-[0.99] group/row'
          : 'cursor-default opacity-60'
      }`}
    >
      {/* 1. Reef Number: Fixed width for perfect vertical alignment across all levels */}
      <div className="w-6 sm:w-7 flex items-center justify-start shrink-0">
        <span
          className={`font-game font-black text-base sm:text-lg leading-none ${
            isUnlocked
              ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] group-hover/row:text-cyan-200 transition-colors'
              : 'text-[#757575]'
          }`}
        >
          {reefLevel}
        </span>
      </div>

      {/* 2. Fragments Collected: 5 Predictable Columns (Octopus, Puffer, Clown, Stingray, Seahorse) */}
      <div className="flex-1 grid grid-cols-5 items-center gap-1 sm:gap-1.5 min-w-0 px-0.5 sm:px-1">
        {REEF_FISH_ORDER.map((fish) => {
          const c = counts[fish] || 0;
          if (c <= 0) {
            // Empty space with no fish and no number
            return (
              <div
                key={fish}
                className="h-5 flex items-center justify-start"
                aria-hidden="true"
              />
            );
          }

          return (
            <div
              key={fish}
              className="flex items-center justify-start gap-1 shrink-0 whitespace-nowrap min-w-0"
              title={`${getFishDisplayName(fish)}: ${c}`}
            >
              <FishBadgeIcon
                fishType={fish}
                size={15}
                className={`drop-shadow-sm shrink-0 ${!isUnlocked ? 'grayscale opacity-50' : ''}`}
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
          );
        })}
      </div>

      {/* 3. Action: Play button if unlocked OR Lock icon if locked */}
      <div className="w-6 sm:w-7 shrink-0 flex items-center justify-end">
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
