import { AllReefFragments, BirdSkin, FishFragmentCounts, FishType, GameDifficulty, GameStats, MedalType, ReefProgress } from '../types';
import { DEFAULT_FISH_SKINS } from './physics';

const STORAGE_KEY = 'flappy_bird_stats_v1';
const REEF_PROGRESS_KEY = 'flappy_reef_progress_v1';
const SELECTED_FISH_KEY = 'flappy_selected_fish_v1';
const FISH_SKINS_KEY = 'flappy_fish_skins_v1';
const LEGACY_SKIN_KEY = 'flappy_selected_skin_v1';
const DIFFICULTY_KEY = 'flappy_game_difficulty_v1';
export const FRAGMENTS_STORAGE_KEY = 'flappy_reef_fragments_v1';

export function createEmptyFragmentCounts(): FishFragmentCounts {
  return {
    octopus: 0,
    pufferfish: 0,
    clownfish: 0,
    singray: 0,
    seahorse: 0,
  };
}

export function loadGameDifficulty(): GameDifficulty {
  try {
    const raw = localStorage.getItem(DIFFICULTY_KEY);
    if (raw && ['easy', 'medium', 'hard'].includes(raw)) {
      return raw as GameDifficulty;
    }
  } catch {
    // fallback
  }
  return 'medium';
}

export function saveGameDifficulty(diff: GameDifficulty): void {
  try {
    localStorage.setItem(DIFFICULTY_KEY, diff);
  } catch {
    // fallback
  }
}

const DEFAULT_STATS: GameStats = {
  highScore: 0,
  gamesPlayed: 0,
  totalScore: 0,
  totalFlaps: 0,
  lastScore: 0,
  bestReefsAchieved: 0,
  gulfStreamUnlocked: false,
  atlantisGateUnlocked: false,
  tidesongUnlocked: false,
  currentFastReefsInRow: 0,
  bestFastReefsInRow: 0,
};

export function loadSelectedFish(): FishType {
  try {
    const raw = localStorage.getItem(SELECTED_FISH_KEY);
    if (raw && ['octopus', 'pufferfish', 'clownfish', 'singray', 'seahorse'].includes(raw)) {
      return raw as FishType;
    }
  } catch {
    // fallback
  }
  return 'octopus';
}

export function saveSelectedFish(fishId: FishType): void {
  try {
    localStorage.setItem(SELECTED_FISH_KEY, fishId);
  } catch {
    // fallback
  }
}

export function resetSelectedFish(): FishType {
  try {
    localStorage.removeItem(SELECTED_FISH_KEY);
  } catch {
    // fallback
  }
  return 'octopus';
}

export function loadFishSkins(): Record<FishType, BirdSkin> {
  try {
    const raw = localStorage.getItem(FISH_SKINS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_FISH_SKINS, ...parsed };
    }
    const legacy = localStorage.getItem(LEGACY_SKIN_KEY);
    if (legacy && ['coral', 'azure', 'amethyst', 'mimic'].includes(legacy)) {
      return { ...DEFAULT_FISH_SKINS, octopus: legacy as BirdSkin };
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_FISH_SKINS };
}

export function saveFishSkins(skins: Record<FishType, BirdSkin>): void {
  try {
    localStorage.setItem(FISH_SKINS_KEY, JSON.stringify(skins));
  } catch {
    // fallback
  }
}

export const DEFAULT_REEF_PROGRESS: ReefProgress = {
  unlockedReef: 1,
  currentReef: 1,
  clearedReefs: {},
  gulfStreamUnlocked: false,
  atlantisGateUnlocked: false,
  tidesongUnlocked: false,
  currentFastReefsInRow: 0,
  bestFastReefsInRow: 0,
};

export function resetReefProgress(): ReefProgress {
  try {
    localStorage.removeItem(REEF_PROGRESS_KEY);
  } catch {
    // ignore
  }
  const isShellUnlocked = loadGameStats().totalScore >= 20;
  return {
    unlockedReef: isShellUnlocked ? 5 : 1,
    currentReef: 1,
    clearedReefs: {},
    gulfStreamUnlocked: false,
    atlantisGateUnlocked: false,
    tidesongUnlocked: false,
    currentFastReefsInRow: 0,
    bestFastReefsInRow: 0,
  };
}

/**
 * Calculates the highest unlocked reef directly from completed reefs.
 * Reef 1 is unlocked by default. To unlock Reef N, the player must complete Reef N-1.
 * If Shell Rune power is unlocked (20 total points earned), the first five reef levels
 * (Reefs 1, 2, 3, 4, and 5) are immediately unlocked!
 */
export function computeUnlockedReef(
  clearedReefs: Record<number, { cleared: boolean }>,
  isShellUnlocked?: boolean
): number {
  const shellActive =
    isShellUnlocked !== undefined
      ? isShellUnlocked
      : loadGameStats().totalScore >= 20;

  let highestCompleted = 0;
  for (let r = 1; r <= 50; r++) {
    if (clearedReefs[r]?.cleared) {
      if (r > highestCompleted) {
        highestCompleted = r;
      }
    }
  }
  const minUnlocked = shellActive ? 5 : 1;
  return Math.min(50, Math.max(minUnlocked, highestCompleted + 1));
}

export function loadReefProgress(): ReefProgress {
  try {
    const curStats = loadGameStats();
    const isShellUnlocked = curStats.totalScore >= 20;
    const raw = localStorage.getItem(REEF_PROGRESS_KEY);
    if (!raw) {
      return {
        ...DEFAULT_REEF_PROGRESS,
        unlockedReef: isShellUnlocked ? 5 : 1,
      };
    }
    const parsed = JSON.parse(raw);
    const clearedReefs = parsed.clearedReefs || {};

    // Strictly validate and compute unlockedReef from completed reefs and Shell Rune power:
    const unlocked = computeUnlockedReef(clearedReefs, isShellUnlocked);
    const current = Math.max(1, Math.min(unlocked, Number(parsed.currentReef) || 1));

    const progress: ReefProgress = {
      unlockedReef: unlocked,
      currentReef: current,
      clearedReefs,
      gulfStreamUnlocked: Boolean(parsed.gulfStreamUnlocked),
      atlantisGateUnlocked: Boolean(parsed.atlantisGateUnlocked),
      currentFastReefsInRow: Math.max(0, Number(parsed.currentFastReefsInRow) || 0),
      bestFastReefsInRow: Math.max(0, Number(parsed.bestFastReefsInRow) || 0),
    };

    // Sanitize and persist corrected progress if localStorage had invalid/unearned unlockedReef
    if (Number(parsed.unlockedReef) !== unlocked || Number(parsed.currentReef) !== current) {
      try {
        localStorage.setItem(REEF_PROGRESS_KEY, JSON.stringify(progress));
      } catch {
        // ignore
      }
    }

    return progress;
  } catch {
    const isShellUnlocked = loadGameStats().totalScore >= 20;
    return {
      ...DEFAULT_REEF_PROGRESS,
      unlockedReef: isShellUnlocked ? 5 : 1,
    };
  }
}

export function saveReefSelection(reefNumber: number): ReefProgress {
  const progress = loadReefProgress();
  const safeReef = Math.max(1, Math.min(progress.unlockedReef, Math.floor(reefNumber)));
  const updated: ReefProgress = {
    ...progress,
    currentReef: safeReef,
  };
  try {
    localStorage.setItem(REEF_PROGRESS_KEY, JSON.stringify(updated));
  } catch {
    // fallback
  }
  return updated;
}

export function completeReefLevel(
  reefNumber: number,
  flaps: number,
  isFullRunWithoutDying: boolean = false,
  reefTimeSeconds: number = 0
): {
  progress: ReefProgress;
  isFirstClear: boolean;
  nextReefUnlocked: boolean;
  atlantisGateUnlockedNow: boolean;
  gulfStreamUnlockedNow: boolean;
  tidesongUnlockedNow: boolean;
  isUnder10s: boolean;
  currentFastStreak: number;
  bestFastStreak: number;
} {
  const progress = loadReefProgress();
  const curStats = loadGameStats();
  const isFirstClear = !progress.clearedReefs[reefNumber]?.cleared;

  // Requirement: Complete 10 levels in a row, each in 10 seconds or less
  const isUnder10s = reefTimeSeconds > 0 && reefTimeSeconds <= 10.05;
  const prevFastStreak = progress.currentFastReefsInRow || 0;
  const prevBestStreak = Math.max(
    progress.bestFastReefsInRow || 0,
    curStats.bestFastReefsInRow || 0
  );

  const currentFastStreak = isUnder10s ? prevFastStreak + 1 : 0;
  const bestFastStreak = Math.max(prevBestStreak, currentFastStreak);

  const gulfStreamUnlockedNow = Boolean(
    (currentFastStreak >= 10 || bestFastStreak >= 10) &&
    !progress.gulfStreamUnlocked &&
    !curStats.gulfStreamUnlocked
  );

  const atlantisGateUnlockedNow = Boolean(
    isFullRunWithoutDying &&
    !progress.atlantisGateUnlocked &&
    !curStats.atlantisGateUnlocked
  );

  const allFrags = loadReefFragments();
  const totalFrags = getTotalFragmentsByFish(allFrags);
  const allFishActivated =
    (totalFrags.pufferfish || 0) >= 10 &&
    (totalFrags.clownfish || 0) >= 10 &&
    (totalFrags.singray || 0) >= 10 &&
    (totalFrags.seahorse || 0) >= 10;

  const tidesongUnlockedNow = Boolean(
    allFishActivated &&
    !progress.tidesongUnlocked &&
    !curStats.tidesongUnlocked
  );

  const updatedCleared = {
    ...progress.clearedReefs,
    [reefNumber]: {
      cleared: true,
      bestFlaps: Math.min(
        flaps,
        progress.clearedReefs[reefNumber]?.bestFlaps ?? flaps
      ),
      clearedAt: new Date().toLocaleDateString(),
    },
  };

  const newUnlocked = computeUnlockedReef(updatedCleared);
  const nextReefUnlocked = newUnlocked > progress.unlockedReef;

  const updated: ReefProgress = {
    unlockedReef: newUnlocked,
    currentReef: reefNumber,
    clearedReefs: updatedCleared,
    gulfStreamUnlocked: Boolean(
      progress.gulfStreamUnlocked ||
      curStats.gulfStreamUnlocked ||
      currentFastStreak >= 10 ||
      bestFastStreak >= 10
    ),
    atlantisGateUnlocked: Boolean(
      progress.atlantisGateUnlocked ||
      curStats.atlantisGateUnlocked ||
      isFullRunWithoutDying
    ),
    tidesongUnlocked: Boolean(
      progress.tidesongUnlocked ||
      curStats.tidesongUnlocked ||
      allFishActivated
    ),
    currentFastReefsInRow: currentFastStreak,
    bestFastReefsInRow: bestFastStreak,
  };

  try {
    localStorage.setItem(REEF_PROGRESS_KEY, JSON.stringify(updated));
  } catch {
    // fallback
  }

  try {
    const updatedStats: GameStats = {
      ...curStats,
      gulfStreamUnlocked: updated.gulfStreamUnlocked,
      atlantisGateUnlocked: updated.atlantisGateUnlocked,
      tidesongUnlocked: updated.tidesongUnlocked,
      currentFastReefsInRow: currentFastStreak,
      bestFastReefsInRow: bestFastStreak,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));
  } catch {
    // fallback
  }

  return {
    progress: updated,
    isFirstClear,
    nextReefUnlocked,
    atlantisGateUnlockedNow,
    gulfStreamUnlockedNow,
    tidesongUnlockedNow,
    isUnder10s,
    currentFastStreak,
    bestFastStreak,
  };
}

export function resetFastStreakOnDeath(): void {
  try {
    const progress = loadReefProgress();
    if (progress.currentFastReefsInRow && progress.currentFastReefsInRow > 0) {
      const updated = { ...progress, currentFastReefsInRow: 0 };
      localStorage.setItem(REEF_PROGRESS_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}

export function loadGameStats(): GameStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      highScore: Number(parsed.highScore) || 0,
      gamesPlayed: Number(parsed.gamesPlayed) || 0,
      totalScore: Number(parsed.totalScore) || 0,
      totalFlaps: Number(parsed.totalFlaps) || 0,
      lastScore: Number(parsed.lastScore) || 0,
      bestReefsAchieved: Number(parsed.bestReefsAchieved) || 0,
      dateSet: parsed.dateSet || undefined,
      gulfStreamUnlocked: Boolean(parsed.gulfStreamUnlocked),
      atlantisGateUnlocked: Boolean(parsed.atlantisGateUnlocked),
      currentFastReefsInRow: Math.max(0, Number(parsed.currentFastReefsInRow) || 0),
      bestFastReefsInRow: Math.max(0, Number(parsed.bestFastReefsInRow) || 0),
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function checkAndUpdateHighScore(
  currentScore: number,
  reefsAchieved?: number
): { stats: GameStats; isNewHighScore: boolean } {
  const current = loadGameStats();
  const isNewHighScore = currentScore > current.highScore;
  const currentBestReefs = current.bestReefsAchieved || 0;
  const updatedBestReefs = reefsAchieved !== undefined
    ? Math.max(currentBestReefs, reefsAchieved)
    : currentBestReefs;

  if (isNewHighScore || (reefsAchieved !== undefined && reefsAchieved > currentBestReefs)) {
    const updated: GameStats = {
      ...current,
      highScore: isNewHighScore ? currentScore : current.highScore,
      lastScore: currentScore,
      bestReefsAchieved: updatedBestReefs,
      dateSet: isNewHighScore ? new Date().toLocaleDateString() : current.dateSet,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }
    return { stats: updated, isNewHighScore };
  }

  return { stats: current, isNewHighScore: false };
}

export function recordCompletedReefStats(
  columnsEarned: number,
  flapsEarned: number,
  currentRunScore: number,
  reefsAchieved?: number,
  incrementGameCount: boolean = false
): { stats: GameStats; isNewHighScore: boolean } {
  const current = loadGameStats();
  const isNewHighScore = currentRunScore > current.highScore;
  const currentBestReefs = current.bestReefsAchieved || 0;
  const updatedBestReefs = reefsAchieved !== undefined
    ? Math.max(currentBestReefs, reefsAchieved)
    : currentBestReefs;

  const updated: GameStats = {
    ...current,
    highScore: isNewHighScore ? currentRunScore : current.highScore,
    gamesPlayed: incrementGameCount ? current.gamesPlayed + 1 : current.gamesPlayed,
    totalScore: current.totalScore + Math.max(0, columnsEarned),
    totalFlaps: current.totalFlaps + Math.max(0, flapsEarned),
    lastScore: currentRunScore,
    bestReefsAchieved: updatedBestReefs,
    dateSet: isNewHighScore ? new Date().toLocaleDateString() : current.dateSet,
    gulfStreamUnlocked: current.gulfStreamUnlocked,
    atlantisGateUnlocked: current.atlantisGateUnlocked,
    currentFastReefsInRow: current.currentFastReefsInRow || 0,
    bestFastReefsInRow: current.bestFastReefsInRow || 0,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // fallback
  }

  return { stats: updated, isNewHighScore };
}

export function saveGameStats(
  newScore: number,
  flapsThisGame: number,
  reefsAchieved?: number,
  alreadyBankedScore: number = 0,
  alreadyBankedFlaps: number = 0,
  alreadyCountedGame: boolean = false
): { stats: GameStats; isNewHighScore: boolean } {
  const current = loadGameStats();
  const isNewHighScore = newScore > current.highScore;
  const currentBestReefs = current.bestReefsAchieved || 0;
  const updatedBestReefs = reefsAchieved !== undefined
    ? Math.max(currentBestReefs, reefsAchieved)
    : currentBestReefs;

  const scoreToAdd = Math.max(0, newScore - alreadyBankedScore);
  const flapsToAdd = Math.max(0, flapsThisGame - alreadyBankedFlaps);

  // On death, consecutive streak resets to 0 while personal best streak is preserved
  resetFastStreakOnDeath();

  const updated: GameStats = {
    highScore: isNewHighScore ? newScore : current.highScore,
    gamesPlayed: alreadyCountedGame ? current.gamesPlayed : current.gamesPlayed + 1,
    totalScore: current.totalScore + scoreToAdd,
    totalFlaps: current.totalFlaps + flapsToAdd,
    lastScore: newScore,
    bestReefsAchieved: updatedBestReefs,
    dateSet: isNewHighScore ? new Date().toLocaleDateString() : current.dateSet,
    gulfStreamUnlocked: current.gulfStreamUnlocked,
    atlantisGateUnlocked: current.atlantisGateUnlocked,
    currentFastReefsInRow: 0,
    bestFastReefsInRow: current.bestFastReefsInRow || 0,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // fallback
  }

  // If Shell Rune power was unlocked (20 total points), ensure unlockedReef is at least 5 in saved progress
  if (current.totalScore < 20 && updated.totalScore >= 20) {
    try {
      const rawProg = localStorage.getItem(REEF_PROGRESS_KEY);
      if (rawProg) {
        const parsedProg = JSON.parse(rawProg);
        const unlocked = Math.max(5, Number(parsedProg.unlockedReef) || 1);
        parsedProg.unlockedReef = unlocked;
        localStorage.setItem(REEF_PROGRESS_KEY, JSON.stringify(parsedProg));
      }
    } catch {
      // ignore
    }
  }

  return { stats: updated, isNewHighScore };
}

export function clearGameStats(): GameStats {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REEF_PROGRESS_KEY);
    localStorage.removeItem(FRAGMENTS_STORAGE_KEY);
  } catch {
    // ignore
  }
  return DEFAULT_STATS;
}

/**
 * Loads all recorded max fragments for every reef level.
 * Map: reefNumber -> { octopus, pufferfish, clownfish, singray, seahorse }
 */
export function loadReefFragments(): AllReefFragments {
  try {
    const raw = localStorage.getItem(FRAGMENTS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

/**
 * Gets the recorded max fish fragments for a specific reef level.
 */
export function getReefMaxFragments(reefNumber: number): FishFragmentCounts {
  const safeReef = Math.max(1, Math.min(50, Math.floor(reefNumber || 1)));
  const all = loadReefFragments();
  const saved = all[safeReef];
  const defaults = createEmptyFragmentCounts();
  if (!saved) return defaults;
  return {
    octopus: Number(saved.octopus) || 0,
    pufferfish: Number(saved.pufferfish) || 0,
    clownfish: Number(saved.clownfish) || 0,
    singray: Number(saved.singray) || 0,
    seahorse: Number(saved.seahorse) || 0,
  };
}

/**
 * Records fish fragments collected during a reef play.
 * Core Requirement:
 * "Each reef has an associated max number of fish fragments you have collected for that reef number:
 * for example, if you play reef number 32 one time and collect 3 puffer fish fragments, the game records 3 puffer fish fragments.
 * If you play reef 32 a second time and earn 2 puffer fish fragments, you retain the max number of puffer fish fragments, which is 3.
 * If you play it a third time and collect 2 clown fish fragments, the game records that you have earned 2 clown fish fragments and 3 puffer fish fragments."
 */
export function recordReefFragments(
  reefNumber: number,
  attemptFragments: Partial<FishFragmentCounts>
): { updated: AllReefFragments; isNewReefMax: boolean } {
  const safeReef = Math.max(1, Math.min(50, Math.floor(reefNumber || 1)));
  const all = loadReefFragments();
  const existing = all[safeReef] || createEmptyFragmentCounts();
  let isNewReefMax = false;

  const updatedReef: FishFragmentCounts = {
    octopus: Number(existing.octopus) || 0,
    pufferfish: Number(existing.pufferfish) || 0,
    clownfish: Number(existing.clownfish) || 0,
    singray: Number(existing.singray) || 0,
    seahorse: Number(existing.seahorse) || 0,
  };

  for (const fish of Object.keys(attemptFragments) as FishType[]) {
    const attemptCount = Number(attemptFragments[fish]) || 0;
    const prevMax = updatedReef[fish] || 0;
    if (attemptCount > prevMax) {
      updatedReef[fish] = attemptCount;
      isNewReefMax = true;
    }
  }

  all[safeReef] = updatedReef;

  try {
    localStorage.setItem(FRAGMENTS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // fallback
  }

  return { updated: all, isNewReefMax };
}

/**
 * Computes the total number of fragments collected for each fish type across all reefs.
 */
export function getTotalFragmentsByFish(fragmentsMap?: AllReefFragments): FishFragmentCounts {
  const all = fragmentsMap || loadReefFragments();
  const total = createEmptyFragmentCounts();

  for (let r = 1; r <= 50; r++) {
    const reefRecord = all[r];
    if (reefRecord) {
      for (const fish of Object.keys(total) as FishType[]) {
        total[fish] += Number(reefRecord[fish]) || 0;
      }
    }
  }

  return total;
}

/**
 * Gets total fragments collected for a single fish type across all reefs.
 */
export function getTotalFragmentsForFish(fishType: FishType): number {
  const totals = getTotalFragmentsByFish();
  return totals[fishType] || 0;
}

export function getMedal(score: number): MedalType {
  if (score >= 40) return 'platinum';
  if (score >= 30) return 'gold';
  if (score >= 20) return 'silver';
  if (score >= 10) return 'bronze';
  return 'none';
}
