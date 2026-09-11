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
    specialPowerTitle: 'Fragment Magnetism',
    specialPowerDesc: 'Increases floating fragments in each reef by +1 per level (Base 2 + Level).',
    fragmentsToCollect: 10,
  },
  {
    id: 'pufferfish',
    name: 'Puffer Fish',
    unlockLevel: 1,
    description: 'Round and buoyant spiky swimmer with rapid fluttering pectoral fins.',
    badgeEmoji: '🐡',
    themeColor: '#FACC15',
    accentColor: '#EA580C',
    specialPowerTitle: 'Survival Shield',
    specialPowerDesc: 'Survival shield lasts 0.5s + 0.5s per level (Lv.1 = 0.5s, Lv.5 = 2.5s). One use per reef.',
    fragmentsToCollect: 10,
  },
  {
    id: 'clownfish',
    name: 'Clown Fish',
    unlockLevel: 1,
    description: 'Iconic orange reef explorer with bold white bands and wavy tail.',
    badgeEmoji: '🐠',
    themeColor: '#F97316',
    accentColor: '#0F172A',
    specialPowerTitle: 'Buoyant Glide',
    specialPowerDesc: 'Upward motion reduced via 1 - 0.80*(1-(7/8)^level), downward motion fixed 10% slower.',
    fragmentsToCollect: 10,
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
    fragmentsToCollect: 10,
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
    fragmentsToCollect: 10,
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
 * Starts at 0. Level = Math.floor(totalFragments / 10).
 * E.g., 11 fragments = 11 / 10 = 1.
 */
export function getFishLevel(totalFragments: number): number {
  return Math.floor(Math.max(0, totalFragments || 0) / 10);
}

/**
 * Checks if a fish is unlocked.
 * Octopus starts already unlocked at level 0.
 * All other fish unlock at level 1 (requires 10 total fragments).
 */
export function isFishUnlocked(fishId: FishType, fishLevel: number): boolean {
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
 * Calculates progress toward the next fish level.
 */
export function getFishLevelProgress(totalFragments: number): {
  level: number;
  fragmentsInLevel: number; // 0..9
  fragmentsNeededForNext: number; // 10 - fragmentsInLevel
  progressPercent: number; // 0..100
} {
  const count = Math.max(0, totalFragments || 0);
  const level = Math.floor(count / 10);
  const fragmentsInLevel = count % 10;
  return {
    level,
    fragmentsInLevel,
    fragmentsNeededForNext: 10 - fragmentsInLevel,
    progressPercent: fragmentsInLevel * 10,
  };
}

/**
 * Checks if any fish has just unlocked (crossed from level 0 to level >= 1).
 */
export function checkNewlyUnlockedFish(
  prevFragments: Record<FishType, number>,
  newFragments: Record<FishType, number>
): FishUnlockTier | null {
  for (const fish of FISH_LIST) {
    if (fish.id === 'octopus') continue;
    const prevLevel = getFishLevel(prevFragments[fish.id] || 0);
    const newLevel = getFishLevel(newFragments[fish.id] || 0);
    if (prevLevel === 0 && newLevel >= 1) {
      return fish;
    }
  }
  return null;
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
      const reduction = 0.80 * (1 - Math.pow(7 / 8, lvl));
      return {
        title: 'Buoyant Glide',
        desc: `Upward motion reduced by ${(reduction * 100).toFixed(1)}% (via 1-0.80*(1-(7/8)^lvl)), downward motion fixed 10% slower.`,
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
 * - Any other fish can be enabled dynamically as new rune goals or mechanics are introduced.
 */
export function canFishChangeColor(
  fishType: FishType,
  reefProgress?: ReefProgress,
  stats?: GameStats
): boolean {
  switch (fishType) {
    case 'octopus':
      return true;
    case 'singray':
      return isBadgeUnlocked('gulf_stream', 0, reefProgress, stats);
    case 'pufferfish':
      return isBadgeUnlocked('atlantis_gate', 0, reefProgress, stats);
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
  stats?: GameStats
): string | null {
  if (canFishChangeColor(fishType, reefProgress, stats)) {
    return null;
  }
  switch (fishType) {
    case 'singray':
      return '🌊 Complete Gulf Stream Rune to unlock Sting Ray shades';
    case 'pufferfish':
      return '🏛️ Complete Atlantis Gate Rune to unlock Puffer Fish shades';
    default:
      return null;
  }
}

