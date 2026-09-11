import { BadgeId, GameBadge, GameStats, ReefProgress } from '../types';

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  emoji: string;
  requirement: string;
  effect: string;
  bonusFragments: number;
}

/**
 * Badge System Definitions:
 * The game starts with a base rate of 0 fragments per reef level.
 * (1) Coral: Requirements: 10 total points (regardless of passing reef levels), Effects: None
 * (2) Shell: Requirements: 20 total points (regardless of passing reef levels), Effects: +1 fragments per reef level
 * (3) Nautilus: Requirements: pass reef level 4, Effects: +1 fragments per reef level
 * (4) Diamond: Requirements: pass reef level 50, Effects: +2 fragments per reef.
 * (5) Gulf Stream: Requirements: Complete 10 levels in a row, each in 10 seconds or less, Effects: +1 fragments / reef
 * (6) Atlantis Gate: Requirements: Complete all 50 reefs without dying, Effects: +1 fragments / reef
 */
export const BADGES: BadgeDefinition[] = [
  {
    id: 'coral',
    name: 'Coral',
    emoji: '🪸',
    requirement: '10 total pts',
    effect: 'None',
    bonusFragments: 0,
  },
  {
    id: 'shell',
    name: 'Shell',
    emoji: '🐚',
    requirement: '20 total pts',
    effect: '+1 fragments / reef',
    bonusFragments: 1,
  },
  {
    id: 'nautilus',
    name: 'Nautilus',
    emoji: '🍥',
    requirement: 'Pass Reef 4',
    effect: '+1 fragments / reef',
    bonusFragments: 1,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    emoji: '💎',
    requirement: 'Pass Reef 50',
    effect: '+2 fragments / reef',
    bonusFragments: 2,
  },
  {
    id: 'gulf_stream',
    name: 'Gulf Stream',
    emoji: '🌊',
    requirement: 'Speed run 10 reefs in a row, 10s each',
    effect: '+1 fragments / reef & Sting Ray colors',
    bonusFragments: 1,
  },
  {
    id: 'atlantis_gate',
    name: 'Atlantis Gate',
    emoji: '🏛️',
    requirement: 'Complete 50 reefs without dying',
    effect: '+1 fragments / reef & Puffer Fish colors',
    bonusFragments: 1,
  },
];

/**
 * Checks whether a specific badge is unlocked.
 * - Coral: Earned at 10 total points (regardless of reef level)
 * - Shell: Earned at 20 total points (regardless of reef level)
 * - Nautilus: Earned by passing Reef 4
 * - Diamond: Earned by passing Reef 50
 * - Gulf Stream: Earned by completing 10 levels in a row, each in 10 seconds or less
 * - Atlantis Gate: Earned by completing all 50 reefs in order without dying
 */
export function isBadgeUnlocked(
  badgeId: BadgeId,
  totalPoints: number,
  reefProgress?: ReefProgress,
  stats?: GameStats
): boolean {
  switch (badgeId) {
    case 'coral':
      return totalPoints >= 10;
    case 'shell':
      return totalPoints >= 20;
    case 'nautilus':
      return (
        !!reefProgress?.clearedReefs[4]?.cleared ||
        (reefProgress?.unlockedReef ?? 1) > 4
      );
    case 'diamond':
      return (
        !!reefProgress?.clearedReefs[50]?.cleared ||
        (reefProgress?.unlockedReef ?? 1) > 50
      );
    case 'gulf_stream':
      return (
        !!reefProgress?.gulfStreamUnlocked ||
        !!stats?.gulfStreamUnlocked ||
        (reefProgress?.bestFastReefsInRow !== undefined && reefProgress.bestFastReefsInRow >= 10) ||
        (stats?.bestFastReefsInRow !== undefined && stats.bestFastReefsInRow >= 10) ||
        (reefProgress?.currentFastReefsInRow !== undefined && reefProgress.currentFastReefsInRow >= 10) ||
        (stats?.currentFastReefsInRow !== undefined && stats.currentFastReefsInRow >= 10)
      );
    case 'atlantis_gate':
      return (
        !!reefProgress?.atlantisGateUnlocked ||
        !!stats?.atlantisGateUnlocked ||
        (stats?.bestReefsAchieved !== undefined && stats.bestReefsAchieved >= 50)
      );
    default:
      return false;
  }
}

/**
 * Returns all badges with their unlocked status evaluated.
 */
export function getAllBadges(
  totalPoints: number,
  reefProgress?: ReefProgress,
  stats?: GameStats
): GameBadge[] {
  return BADGES.map((b) => ({
    ...b,
    unlocked: isBadgeUnlocked(b.id, totalPoints, reefProgress, stats),
  }));
}

export interface BadgeProgress {
  current: number;
  target: number;
  unit: string;
  percent: number;
  isAchieved: boolean;
}

/**
 * Calculates current progress toward a badge goal:
 * - Coral & Shell: recorded from total points (targets 10 and 20 pts)
 * - Nautilus & Diamond: recorded from unlocked/passed reef levels (targets 4 and 50 reefs)
 * - Gulf Stream: recorded from Personal Best Depth Score divided by 10 rounded down (target 50 reefs)
 */
export function getBadgeProgress(
  badgeId: BadgeId,
  totalPoints: number,
  reefProgress?: ReefProgress,
  stats?: GameStats
): BadgeProgress {
  const isAchieved = isBadgeUnlocked(badgeId, totalPoints, reefProgress, stats);

  switch (badgeId) {
    case 'coral': {
      const target = 10;
      const current = isAchieved ? target : Math.min(target, Math.max(0, totalPoints));
      const percent = Math.min(100, Math.round((current / target) * 100));
      return { current, target, unit: 'pts', percent, isAchieved };
    }
    case 'shell': {
      const target = 20;
      const current = isAchieved ? target : Math.min(target, Math.max(0, totalPoints));
      const percent = Math.min(100, Math.round((current / target) * 100));
      return { current, target, unit: 'pts', percent, isAchieved };
    }
    case 'nautilus': {
      const target = 4;
      let current = 0;
      if (isAchieved) {
        current = target;
      } else {
        const unlockedReef = reefProgress?.unlockedReef ?? 1;
        current = Math.min(target, Math.max(0, unlockedReef - 1));
      }
      const percent = Math.min(100, Math.round((current / target) * 100));
      return { current, target, unit: 'reefs', percent, isAchieved };
    }
    case 'diamond': {
      const target = 50;
      let current = 0;
      if (isAchieved) {
        current = target;
      } else {
        const unlockedReef = reefProgress?.unlockedReef ?? 1;
        current = Math.min(target, Math.max(0, unlockedReef - 1));
      }
      const percent = Math.min(100, Math.round((current / target) * 100));
      return { current, target, unit: 'reefs', percent, isAchieved };
    }
    case 'gulf_stream': {
      const target = 10;
      let current = 0;
      if (isAchieved) {
        current = target;
      } else {
        const bestInRow = Math.max(
          stats?.bestFastReefsInRow ?? 0,
          reefProgress?.bestFastReefsInRow ?? 0,
          stats?.currentFastReefsInRow ?? 0,
          reefProgress?.currentFastReefsInRow ?? 0
        );
        current = Math.min(target, Math.max(0, bestInRow));
      }
      const percent = Math.min(100, Math.round((current / target) * 100));
      return { current, target, unit: 'reefs in a row', percent, isAchieved };
    }
    case 'atlantis_gate': {
      const target = 50;
      let current = 0;
      if (isAchieved) {
        current = target;
      } else {
        const continuousFromHighScore = Math.floor((stats?.highScore ?? 0) / 10);
        const continuousFromBest = stats?.bestReefsAchieved ?? 0;
        current = Math.min(
          target,
          Math.max(0, Math.max(continuousFromHighScore, continuousFromBest))
        );
      }
      const percent = Math.min(100, Math.round((current / target) * 100));
      return { current, target, unit: 'reefs', percent, isAchieved };
    }
    default:
      return { current: 0, target: 1, unit: '', percent: 0, isAchieved: false };
  }
}

/**
 * Calculates the base floating fragment rate per reef level based on earned badges.
 * Starts with a base rate of 0 fragments per reef level:
 * - Shell: +1 (at 20 total points)
 * - Nautilus: +1 (at Reef 4 cleared)
 * - Diamond: +2 (at Reef 50 cleared)
 * - Gulf Stream: +1 (10 reef levels in a row each in 10s or less)
 * - Atlantis Gate: +1 (Complete all 50 reefs in order without dying)
 * (Coral adds 0 at 10 total points)
 * Example: Completed Reef 50 with all badges = 0 + 1 + 1 + 2 + 1 + 1 = 6 base fragments per reef.
 */
export function getBaseFragments(
  totalPoints: number,
  reefProgress?: ReefProgress,
  stats?: GameStats
): number {
  let base = 0;
  if (isBadgeUnlocked('shell', totalPoints, reefProgress, stats)) {
    base += 1;
  }
  if (isBadgeUnlocked('nautilus', totalPoints, reefProgress, stats)) {
    base += 1;
  }
  if (isBadgeUnlocked('diamond', totalPoints, reefProgress, stats)) {
    base += 2;
  }
  if (isBadgeUnlocked('gulf_stream', totalPoints, reefProgress, stats)) {
    base += 1;
  }
  if (isBadgeUnlocked('atlantis_gate', totalPoints, reefProgress, stats)) {
    base += 1;
  }
  return base;
}

/**
 * Returns highest badge achieved for display in ScoreBoardModal or HUD.
 */
export function getHighestBadge(
  totalPoints: number,
  reefProgress?: ReefProgress,
  stats?: GameStats
): {
  id: BadgeId | 'none';
  label: string;
  emoji: string;
  effect: string;
  color: string;
  border: string;
  bg: string;
} {
  if (isBadgeUnlocked('atlantis_gate', totalPoints, reefProgress, stats)) {
    return {
      id: 'atlantis_gate',
      label: 'Atlantis Gate',
      emoji: '🏛️',
      effect: '+1 fragments / reef & Puffer Fish colors',
      color: 'text-indigo-300',
      border: 'border-indigo-400/60',
      bg: 'bg-gradient-to-b from-indigo-500/30 to-purple-800/60',
    };
  }
  if (isBadgeUnlocked('gulf_stream', totalPoints, reefProgress, stats)) {
    return {
      id: 'gulf_stream',
      label: 'Gulf Stream',
      emoji: '🌊',
      effect: '+1 fragments / reef & Sting Ray colors',
      color: 'text-sky-300',
      border: 'border-sky-400/60',
      bg: 'bg-gradient-to-b from-sky-500/30 to-blue-700/60',
    };
  }
  if (isBadgeUnlocked('diamond', totalPoints, reefProgress, stats)) {
    return {
      id: 'diamond',
      label: 'Diamond',
      emoji: '💎',
      effect: '+2 fragments / reef',
      color: 'text-cyan-300',
      border: 'border-cyan-400/60',
      bg: 'bg-gradient-to-b from-cyan-500/30 to-cyan-700/60',
    };
  }
  if (isBadgeUnlocked('nautilus', totalPoints, reefProgress, stats)) {
    return {
      id: 'nautilus',
      label: 'Nautilus',
      emoji: '🍥',
      effect: '+1 fragments / reef',
      color: 'text-yellow-300',
      border: 'border-yellow-500/60',
      bg: 'bg-gradient-to-b from-yellow-500/30 to-yellow-700/60',
    };
  }
  if (isBadgeUnlocked('shell', totalPoints, reefProgress, stats)) {
    return {
      id: 'shell',
      label: 'Shell',
      emoji: '🐚',
      effect: '+1 fragments / reef',
      color: 'text-slate-200',
      border: 'border-slate-400/60',
      bg: 'bg-gradient-to-b from-slate-500/40 to-slate-700/60',
    };
  }
  if (isBadgeUnlocked('coral', totalPoints, reefProgress, stats)) {
    return {
      id: 'coral',
      label: 'Coral',
      emoji: '🪸',
      effect: 'None',
      color: 'text-amber-300',
      border: 'border-amber-600/60',
      bg: 'bg-gradient-to-b from-amber-700/40 to-amber-900/60',
    };
  }
  return {
    id: 'none',
    label: 'No Badge',
    emoji: '—',
    effect: 'None',
    color: 'text-slate-400',
    border: 'border-white/10',
    bg: 'bg-white/5',
  };
}

/**
 * Visual styling theme for a badge / rune.
 */
export function getBadgeVisual(badgeId: BadgeId): {
  id: BadgeId;
  name: string;
  emoji: string;
  color: string;
  border: string;
  bg: string;
  glow: string;
} {
  switch (badgeId) {
    case 'atlantis_gate':
      return {
        id: 'atlantis_gate',
        name: 'Atlantis Gate',
        emoji: '🏛️',
        color: 'text-indigo-300',
        border: 'border-indigo-400/60',
        bg: 'bg-gradient-to-b from-indigo-950/80 via-purple-950/70 to-slate-950/90',
        glow: 'shadow-[0_0_24px_rgba(129,140,248,0.3)]',
      };
    case 'gulf_stream':
      return {
        id: 'gulf_stream',
        name: 'Gulf Stream',
        emoji: '🌊',
        color: 'text-sky-300',
        border: 'border-sky-400/60',
        bg: 'bg-gradient-to-b from-sky-950/80 via-blue-950/70 to-slate-950/90',
        glow: 'shadow-[0_0_24px_rgba(56,189,248,0.3)]',
      };
    case 'diamond':
      return {
        id: 'diamond',
        name: 'Diamond',
        emoji: '💎',
        color: 'text-cyan-300',
        border: 'border-cyan-400/60',
        bg: 'bg-gradient-to-b from-cyan-950/80 via-teal-950/70 to-slate-950/90',
        glow: 'shadow-[0_0_24px_rgba(6,182,212,0.3)]',
      };
    case 'nautilus':
      return {
        id: 'nautilus',
        name: 'Nautilus',
        emoji: '🍥',
        color: 'text-yellow-300',
        border: 'border-yellow-400/60',
        bg: 'bg-gradient-to-b from-yellow-950/80 via-amber-950/70 to-slate-950/90',
        glow: 'shadow-[0_0_24px_rgba(250,204,21,0.3)]',
      };
    case 'shell':
      return {
        id: 'shell',
        name: 'Shell',
        emoji: '🐚',
        color: 'text-slate-200',
        border: 'border-slate-300/60',
        bg: 'bg-gradient-to-b from-slate-900/80 via-slate-800/70 to-slate-950/90',
        glow: 'shadow-[0_0_24px_rgba(226,232,240,0.25)]',
      };
    case 'coral':
    default:
      return {
        id: 'coral',
        name: 'Coral',
        emoji: '🪸',
        color: 'text-amber-300',
        border: 'border-amber-500/60',
        bg: 'bg-gradient-to-b from-amber-950/80 via-orange-950/70 to-slate-950/90',
        glow: 'shadow-[0_0_24px_rgba(245,158,11,0.3)]',
      };
  }
}

/**
 * Finds the next rune/badge goal based on ranking criteria:
 * (1) Skip it if it is completed
 * (2) The closer to 100% the higher the score
 * (3) The closer to the beginning of the list the higher the score
 */
export function getNextBadgeGoal(
  totalPoints: number,
  reefProgress?: ReefProgress,
  stats?: GameStats
): {
  badge: BadgeDefinition;
  progress: BadgeProgress;
} | null {
  let selected: { badge: BadgeDefinition; progress: BadgeProgress; score: number; index: number } | null = null;

  for (let i = 0; i < BADGES.length; i++) {
    const badge = BADGES[i];
    const progress = getBadgeProgress(badge.id, totalPoints, reefProgress, stats);

    // Skip if completed
    if (progress.isAchieved || progress.percent >= 100) {
      continue;
    }

    const score = progress.target > 0 ? progress.current / progress.target : 0;

    // Strictly greater score wins. Ties preserve the earlier item in BADGES list.
    if (!selected || score > selected.score) {
      selected = { badge, progress, score, index: i };
    }
  }

  return selected ? { badge: selected.badge, progress: selected.progress } : null;
}
