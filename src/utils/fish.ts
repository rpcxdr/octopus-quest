import { FishType, FishUnlockTier, GameStats, ReefProgress } from '../types';
import { isBadgeUnlocked } from './badges';

export const FISH_LIST: FishUnlockTier[] = [
  {
    id: 'octopus',
    name: 'Octopus',
    unlockLevel: 0,
    description: 'Bioluminescent master of the kelp forest with undulating tentacles.',
    badgeEmoji: '🐙',
    themeColor: '#FB7185',
    accentColor: '#FDA4AF',
    specialPowerTitle: 'More Fragments',
    specialPowerDesc: 'Increases floating fragments in each reef by +1 per level (Base 2 + Level).',
    fragmentsToCollect: 5,
  },
  {
    id: 'pufferfish',
    name: 'Puffer Fish',
    unlockLevel: 1,
    description: 'Round and buoyant spiky swimmer with rapid fluttering pectoral fins.',
    badgeEmoji: '🐡',
    themeColor: '#FACC15',
    accentColor: '#CA8A04',
    specialPowerTitle: 'Survival Shield',
    specialPowerDesc: 'Survival shield lasts 0.5s + 0.5s per level (Lv.1 = 0.5s, Lv.5 = 2.5s). One use per reef.',
    fragmentsToCollect: 5,
  },
  {
    id: 'clownfish',
    name: 'Clown Fish',
    unlockLevel: 1,
    description: 'Iconic orange reef explorer with bold white bands and wavy tail.',
    badgeEmoji: '🐠',
    themeColor: '#F97316',
    accentColor: '#0F172A',
    specialPowerTitle: 'Ascent Multiplier',
    specialPowerDesc: 'Consecutive upward flaps scale speed and gravity: octopusValue * (min(taps, level+1)/(level+1)). Resets when traveling downward.',
    fragmentsToCollect: 5,
  },
  {
    id: 'singray',
    name: 'Sting Ray',
    unlockLevel: 1,
    description: 'Graceful manta ray gliding with rippling wingtips and long tail.',
    badgeEmoji: '🌊',
    themeColor: '#38BDF8',
    accentColor: '#0284C7',
    specialPowerTitle: 'Hydro Surge',
    specialPowerDesc: 'Moves 10*level % faster forward (x direction) for 0.3s on space press.',
    fragmentsToCollect: 5,
  },
  {
    id: 'seahorse',
    name: 'Seahorse',
    unlockLevel: 1,
    description: 'Majestic deep sea seahorse with crown coronet and curled tail.',
    badgeEmoji: '🪸',
    themeColor: '#C084FC',
    accentColor: '#9333EA',
    specialPowerTitle: 'Wave Switch',
    specialPowerDesc: 'Space switches between swimming up for 0.1*level s & down for 0.1*level s, settling straight.',
    fragmentsToCollect: 5,
  },
];

export function getBestReefScore(stats: GameStats, progress: ReefProgress): number {
  const clearedKeys = Object.keys(progress?.clearedReefs || {})
    .filter((k) => progress.clearedReefs[Number(k)]?.cleared)
    .map(Number);

  const highestCleared = clearedKeys.length > 0 ? Math.max(...clearedKeys) : 0;
  const countCleared = clearedKeys.length;
  const unlockedPrev = Math.max(0, (progress?.unlockedReef || 1) - 1);
  const scoreFromColumns = Math.floor((stats?.highScore || 0) / 10);
  const explicitBest = stats?.bestReefsAchieved || 0;

  return Math.max(highestCleared, countCleared, unlockedPrev, scoreFromColumns, explicitBest);
}

/**
 * Calculates the fish level for a given fish based on total collected fragments across all reef levels.
 * Level 1 requires 5 fragments.
 * Subsequent levels require 10 fragments each (Level 2 = 15, Level 3 = 25, Level 4 = 35...).
 * Level 0 = 0 to 4 fragments.
 */
export function getFishLevel(totalFragments: number): number {
   // TODO: Remove this HACK
   return 20;
  const count = Math.max(0, Math.floor(totalFragments || 0));
  if (count < 5) return 0;
  return 1 + Math.floor((count - 5) / 10);
}

/**
 * Checks if a fish is unlocked.
 * Octopus starts already unlocked at level 0.
 * All other fish unlock at level 1 (requires 5 total fragments).
 */
export function isFishUnlocked(fishId: FishType, fishLevel: number): boolean {
   // TODO: Remove this HACK
   return true;
  if (fishId === 'octopus') return true;
  return fishLevel >= 1;
}

/**
 * Checks if a fish is unlocked given its total fragments.
 */
export function isFishUnlockedByFragments(fishId: FishType, totalFragments: number): boolean {
  if (fishId === 'octopus') return true;
  return getFishLevel(totalFragments) >= 1;
}

/**
 * Checks if all fish in the ecosystem have been unlocked.
 * Octopus starts unlocked by default.
 * Pufferfish, Clownfish, Stingray, and Seahorse each unlock at Level 1 (>= 5 fragments).
 */
export function areAllFishUnlocked(fragments?: Partial<Record<FishType, number>>): boolean {
  if (!fragments) return false;
  return (
    (fragments.pufferfish || 0) >= 5 &&
    (fragments.clownfish || 0) >= 5 &&
    (fragments.singray || 0) >= 5 &&
    (fragments.seahorse || 0) >= 5
  );
}

/**
 * Calculates progress toward the next fish level.
 * Level 1 requires 5 fragments (0..4 in level, needed: 5 - count, max: 5).
 * Level 2+ requires 10 fragments each (0..9 in level, needed: 10 - count, max: 10).
 */
export function getFishLevelProgress(totalFragments: number): {
  level: number;
  fragmentsInLevel: number;
  maxFragmentsInLevel: number; // 5 if level === 0, else 10
  fragmentsNeededForNext: number;
  progressPercent: number; // 0..100
} {
  const count = Math.max(0, Math.floor(totalFragments || 0));
  const level = getFishLevel(count);
  if (level === 0) {
    const fragmentsInLevel = count;
    const maxFragmentsInLevel = 5;
    const fragmentsNeededForNext = 5 - count;
    return {
      level: 0,
      fragmentsInLevel,
      maxFragmentsInLevel,
      fragmentsNeededForNext,
      progressPercent: (fragmentsInLevel / 5) * 100,
    };
  } else {
    const fragmentsInLevel = (count - 5) % 10;
    const maxFragmentsInLevel = 10;
    const fragmentsNeededForNext = 10 - fragmentsInLevel;
    return {
      level,
      fragmentsInLevel,
      maxFragmentsInLevel,
      fragmentsNeededForNext,
      progressPercent: (fragmentsInLevel / 10) * 100,
    };
  }
}

/**
 * Checks if any fish has just achieved a new level threshold (e.g. 10 fragments for Level 1, 20 for Level 2, etc.).
 * Returns the fish tier along with the achieved level if a new level was crossed.
 */
export function checkNewlyUnlockedFish(
  prevFragments: Record<FishType, number>,
  newFragments: Record<FishType, number>
): FishUnlockTier | null {
  for (const fish of FISH_LIST) {
    const prevLevel = getFishLevel(prevFragments[fish.id] || 0);
    const newLevel = getFishLevel(newFragments[fish.id] || 0);
    if (newLevel > prevLevel && newLevel >= 1) {
      return {
        ...fish,
        achievedLevel: newLevel,
      };
    }
  }
  return null;
}

export interface FishLevelProgressionResult {
  prevLevel: number;
  achievedLevel: number;
  hasNewFishLevel: boolean;
  beyondRecordSlots: number;
}

/**
 * Calculates fish level progression for a given fish attempt.
 * Shared across both Reef Cleared modal and Tangled in Kelp (game over) modal.
 *
 * In Reef Cleared (isGameOver = false), totalFragments already includes the banked beyondRecordSlots.
 * In Tangled in Kelp (isGameOver = true), totalFragments is the unbanked baseline;
 * we determine if banking the beyondRecordSlots from this attempt would have reached a new fish level.
 */
export function computeFishLevelProgression({
  collected,
  priorRecord,
  totalFragments,
  priorTotalFragments,
  isGameOver = false,
}: {
  collected: number;
  priorRecord: number;
  totalFragments: number;
  priorTotalFragments?: number;
  isGameOver?: boolean;
}): FishLevelProgressionResult {
  const isBeyondRecord = collected > priorRecord;
  const beyondRecordSlots = isBeyondRecord ? collected - priorRecord : 0;

  if (isGameOver) {
    const baseline = Math.max(0, totalFragments || 0);
    const potentialTotal = baseline + beyondRecordSlots;
    const prevLevel = getFishLevel(baseline);
    const achievedLevel = getFishLevel(potentialTotal);
    const hasNewFishLevel = beyondRecordSlots > 0 && achievedLevel > prevLevel;

    return {
      prevLevel,
      achievedLevel,
      hasNewFishLevel,
      beyondRecordSlots,
    };
  } else {
    const currentTotal = Math.max(0, totalFragments || 0);
    const priorTotal = priorTotalFragments !== undefined
      ? priorTotalFragments
      : Math.max(0, currentTotal - beyondRecordSlots);
    const prevLevel = getFishLevel(priorTotal);
    const achievedLevel = getFishLevel(currentTotal);
    const hasNewFishLevel = beyondRecordSlots > 0 && achievedLevel > prevLevel;

    return {
      prevLevel,
      achievedLevel,
      hasNewFishLevel,
      beyondRecordSlots,
    };
  }
}

export function getFishById(fishId: FishType): FishUnlockTier {
  return FISH_LIST.find((f) => f.id === fishId) || FISH_LIST[0];
}

export function getFishThemeColor(fishId: FishType): string {
  const fish = getFishById(fishId);
  return fish.themeColor || '#38BDF8';
}

export function getFishAccentColor(fishId: FishType): string {
  const fish = getFishById(fishId);
  return fish.accentColor || '#0284C7';
}

export function getFishEmoji(fishId: FishType): string {
  const fish = getFishById(fishId);
  return fish.badgeEmoji || '🐟';
}

export function getFishDisplayName(fishId: FishType): string {
  const fish = getFishById(fishId);
  return fish.name || fishId;
}

/**
 * Returns the dynamic special power title and level-adjusted description for a given fish.
 */
export function getFishSpecialPower(
  fishType: FishType,
  level: number = 0,
  baseFragments: number = 0
): { title: string; desc: string } {
  switch (fishType) {
    case 'octopus': {
      const extra = Math.max(0, level);
      const total = baseFragments + extra;
      return {
        title: 'Fragment Magnetism',
        desc:
          extra > 0 || baseFragments > 0
            ? `Collects all fragment types and adds +${extra} fragments per reef (Base ${baseFragments} + Lv.${extra} = ${total} fragments).`
            : `Collects all fragment types. Each fish level adds +1 fragment per reef (Base 0 + Lv.0 = 0). Earn badges to increase base fragments!`,
      };
    }
    case 'pufferfish': {
      const lvl = Math.max(1, level);
      const duration = 0.5 * lvl;
      return {
        title: 'Survival Shield',
        desc: `Survival shield lasts ${duration.toFixed(1)}s (0.5s per level; Lv.${lvl} = ${duration.toFixed(1)}s). One use per reef.`,
      };
    }
    case 'clownfish': {
      const lvl = Math.max(1, level);
      return {
        title: 'Ascent Multiplier',
        desc: `Upward speed and gravity scale with consecutive upward taps: octopusValue * (min(taps, ${lvl + 1}) / ${lvl + 1}). Resets to 0 on descent.`,
      };
    }
    case 'singray': {
      const lvl = Math.max(1, level);
      const boost = 10 * lvl;
      return {
        title: 'Hydro Surge',
        desc: `Moves ${boost}% faster forward in the x direction for 0.3s on space press (10*level %).`,
      };
    }
    case 'seahorse': {
      const lvl = Math.max(1, level);
      const duration = 0.1 * lvl;
      return {
        title: 'Wave Switch',
        desc: `Space switches between swimming up (${duration.toFixed(1)}s) & down (${duration.toFixed(1)}s), settling straight.`,
      };
    }
    default:
      return {
        title: 'Standard Swimming',
        desc: 'Classic swimming physics with balanced underwater buoyancy.',
      };
  }
}

/**
 * Checks whether a fish is eligible to have its color customized.
 * - Octopus has this option from the start.
 * - Sting Ray earns this ability when the Gulf Stream rune is achieved.
 * - Puffer Fish earns this ability when the Atlantis Gate rune is achieved.
 * - Clown Fish earns this ability when the Tidesong rune is achieved.
 * - Any other fish can be enabled dynamically as new rune goals or mechanics are introduced.
 */
export function canFishChangeColor(
  fishType: FishType,
  reefProgress?: ReefProgress,
  stats?: GameStats,
  totalFragmentsByFish?: Partial<Record<FishType, number>>
): boolean {
  switch (fishType) {
    case 'octopus':
      return true;
    case 'singray':
      return isBadgeUnlocked('gulf_stream', 0, reefProgress, stats, totalFragmentsByFish);
    case 'pufferfish':
      return isBadgeUnlocked('atlantis_gate', 0, reefProgress, stats, totalFragmentsByFish);
    case 'clownfish':
      return isBadgeUnlocked('tidesong', 0, reefProgress, stats, totalFragmentsByFish);
    case 'seahorse':
      return isBadgeUnlocked('coral_seahorse', 0, reefProgress, stats, totalFragmentsByFish);
    default:
      return false;
  }
}

/**
 * Returns the unlock requirement prompt for fish that cannot yet change color.
 */
export function getFishColorUnlockHint(
  fishType: FishType,
  reefProgress?: ReefProgress,
  stats?: GameStats,
  totalFragmentsByFish?: Partial<Record<FishType, number>>
): string | null {
  if (canFishChangeColor(fishType, reefProgress, stats, totalFragmentsByFish)) {
    return null;
  }
  switch (fishType) {
    case 'singray':
      return '🌊 Complete Gulf Stream Rune to unlock Sting Ray shades';
    case 'pufferfish':
      return '🏛️ Complete Atlantis Gate Rune to unlock Puffer Fish shades';
    case 'clownfish':
      return '🐟 Complete Tidesong Rune to unlock Clown Fish shades';
    case 'seahorse':
      return '🪸 Complete Coral Seahorse Rune to unlock Seahorse shades';
    default:
      return null;
  }
}

