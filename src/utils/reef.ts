import { GameDifficulty, PhysicsConfig, ReefColumnTemplate } from '../types';
import { getAestheticForReef } from './backgroundAesthetics';

export const TOTAL_REEF_LEVELS = 50;
export const COLUMNS_PER_REEF = 10;

/**
 * 32-bit Mulberry32 Seeded Pseudo-Random Number Generator.
 * Given the same integer seed (the Reef level number 1..50),
 * this yields the exact same deterministic sequence of pseudo-random numbers.
 */
export function createPRNG(seed: number): () => number {
  let s = Math.floor(Math.abs(seed)) || 1;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pre-computes the 10 deterministic columns for a given Reef level (1..50).
 * Every time Reef `levelNumber` is played, the exact same set of column
 * heights and gaps will be generated.
 * In Easy mode, the column gap is made 20 percent wider.
 */
export function generateReefColumns(
  levelNumber: number,
  config: PhysicsConfig,
  difficulty: GameDifficulty = 'medium'
): ReefColumnTemplate[] {
  const safeLevel = Math.max(1, Math.min(TOTAL_REEF_LEVELS, Math.floor(levelNumber)));
  const rng = createPRNG(safeLevel * 1000 + 73);

  const columns: ReefColumnTemplate[] = [];
  const playableHeight = config.virtualHeight - config.groundHeight;
  const minTop = 50;

  for (let i = 0; i < COLUMNS_PER_REEF; i++) {
    // Deterministic base gap: ranges comfortably between 132px and 146px
    // with subtle progression variance per column
    const gapVariance = Math.floor(rng() * 15); // 0 to 14
    let gap = 132 + gapVariance;
    if (difficulty === 'easy') {
      gap = Math.round(gap * 1.20); // Easy mode: 20% wider column gap
    }

    const maxTop = playableHeight - gap - 50;

    let topHeight: number;
    if (i === 0) {
      // First column: centered towards the middle for smooth entry
      const mid = minTop + (maxTop - minTop) * 0.45;
      const spread = (maxTop - minTop) * 0.25;
      topHeight = Math.floor(mid + (rng() - 0.5) * spread);
    } else {
      // Subsequent columns: smooth step deltas to maintain achievable jumps
      const prevTop = columns[i - 1].topHeight;
      const maxDelta = 125;
      const low = Math.max(minTop, prevTop - maxDelta);
      const high = Math.min(maxTop, prevTop + maxDelta);
      topHeight = Math.floor(low + rng() * (high - low));
    }

    // Clamp topHeight within boundaries
    topHeight = Math.max(minTop, Math.min(maxTop, topHeight));
    const bottomHeight = playableHeight - topHeight - gap;

    columns.push({
      columnNumber: i + 1,
      topHeight,
      gap,
      bottomHeight,
      width: 58,
    });
  }

  return columns;
}

/**
 * Descriptive reef zones based on level range for rich marine atmosphere.
 * Synchronized with the 3-reef rotating underwater background aesthetic.
 */
export function getReefZoneName(level: number): string {
  return getAestheticForReef(level).name;
}

