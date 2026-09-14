import { FishType, FloatingFragment, Particle } from '../types';
import { createPRNG } from './reef';
import { getFishById, getFishThemeColor } from './fish';
import { drawFishBadgeCanvas } from './fishBadgeRenderer';

export const FISH_TYPES_LIST: FishType[] = ['octopus', 'pufferfish', 'clownfish', 'singray', 'seahorse'];

/**
 * Generates floating fish fragments for a reef level.
 * Requirements:
 * - Default 2 fish fragments per reef level, or modified by Octopus level: 2 + octopus_level.
 * - When playing Octopus: collects all fragment types (fragments are randomly chosen across all fish).
 * - When playing any other fish: only collects fragments for that same fish type (fragments are for that active fish).
 * - For all fish, allow more than one fragment to appear between two columns (needed when fragment count > columns - 1).
 * - The height of each floating fragment is random and well-distributed.
 * - When multiple fragments appear between the same two columns, they are spaced horizontally and vertically.
 * - The random number generator uses current time in milliseconds as seed instead of level number.
 */
export function generateReefFloatingFragments(
  virtualHeight: number,
  groundHeight: number,
  seed?: number,
  fragmentCount: number = 0,
  activeFish: FishType = 'octopus'
): FloatingFragment[] {
  if (fragmentCount <= 0) return [];
  const count = Math.floor(fragmentCount);
  if (count <= 0) return [];

  // Use current time in milliseconds as the seed instead of the level number
  const prngSeed = typeof seed === 'number' ? seed : Date.now();
  const rng = createPRNG(prngSeed);

  const fragments: FloatingFragment[] = [];
  const minY = 85;
  const maxY = Math.max(minY + 60, virtualHeight - groundHeight - 85);

  // Available column gaps: 1 through 9 (gaps between col 1-2, col 2-3, ... col 9-10)
  const availableGapsCount = 9;

  // Assign each fragment to a column gap
  // When count <= 9, fragments can be assigned across gaps (can share gaps naturally or when count > 9)
  const gapAssignments: number[] = [];

  for (let i = 0; i < count; i++) {
    // Pick a gap between 1 and 9
    const gap = 1 + Math.floor(rng() * availableGapsCount);
    gapAssignments.push(gap);
  }

  // Count how many fragments are assigned to each gap
  const gapCounts = new Map<number, number>();
  for (const g of gapAssignments) {
    gapCounts.set(g, (gapCounts.get(g) || 0) + 1);
  }

  // Track the index of the fragment within its assigned gap
  const gapCurrentIndex = new Map<number, number>();

  for (let i = 0; i < count; i++) {
    const gap = gapAssignments[i];
    const totalInGap = gapCounts.get(gap) || 1;
    const indexInGap = gapCurrentIndex.get(gap) || 0;
    gapCurrentIndex.set(gap, indexInGap + 1);

    // Fragment fish type rule:
    // When playing Octopus, fragments can be for any fish character.
    // When playing any other fish, fragments are for that specific fish.
    const fishType = activeFish === 'octopus'
      ? FISH_TYPES_LIST[Math.floor(rng() * FISH_TYPES_LIST.length)]
      : activeFish;

    // Spread horizontally across gap (e.g. 0.33 & 0.67 if 2 fragments in same gap)
    const gapFraction = (indexInGap + 1) / (totalInGap + 1);

    // Height: if multiple in same gap, partition vertical space so they never overlap in Y
    let height: number;
    if (totalInGap === 1) {
      height = Math.round(minY + rng() * (maxY - minY));
    } else {
      const sliceSize = (maxY - minY) / totalInGap;
      const sliceBase = minY + indexInGap * sliceSize;
      const jitter = (rng() * 0.6 + 0.2) * sliceSize;
      height = Math.round(Math.min(maxY - 10, Math.max(minY + 10, sliceBase + jitter)));
    }

    fragments.push({
      id: i + 1,
      fishType,
      columnGapIndex: gap,
      gapFraction,
      baseY: height,
      currentY: height,
      x: -999,
      radius: 17,
      spawned: false,
      collected: false,
      bobPhase: rng() * Math.PI * 2,
    });
  }

  return fragments;
}

/**
 * Renders a floating fish fragment with luminous ocean crystal aesthetics,
 * pulsing theme aura, iridescent border, and centered fish character emoji.
 * If the fragment is uncollectable for the currently active fish, it renders as semi-transparent.
 */
export function drawFloatingFragment(
  ctx: CanvasRenderingContext2D,
  fragment: FloatingFragment,
  time: number,
  activeFish?: FishType
): void {
  if (!fragment.spawned || fragment.collected) return;

  const isCollectable = !activeFish || activeFish === 'octopus' || fragment.fishType === activeFish;

  const { x, currentY, fishType, radius, bobPhase } = fragment;
  const themeColor = getFishThemeColor(fishType);

  ctx.save();
  if (!isCollectable) {
    ctx.globalAlpha = 0.38;
  }
  ctx.translate(x, currentY);

  // Subtle breathing scale
  const pulse = 1 + Math.sin(time * 0.005 + bobPhase) * 0.08;
  ctx.scale(pulse, pulse);

  // 1. Soft radial outer aura glow
  const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius * 2.1);
  glowGrad.addColorStop(0, `${themeColor}66`); // 40% alpha
  glowGrad.addColorStop(0.6, `${themeColor}22`);
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.1, 0, Math.PI * 2);
  ctx.fill();

  // 2. Rotating diamond / crystal facet ring
  const rotAngle = (time * 0.0015 + bobPhase) % (Math.PI * 2);
  ctx.save();
  ctx.rotate(rotAngle);
  ctx.strokeStyle = `${themeColor}88`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const dSize = radius * 1.25;
  ctx.moveTo(0, -dSize);
  ctx.lineTo(dSize, 0);
  ctx.lineTo(0, dSize);
  ctx.lineTo(-dSize, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // 3. Main crystal medallion body
  const bodyGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 2, 0, 0, radius);
  bodyGrad.addColorStop(0, '#FFFFFF');
  bodyGrad.addColorStop(0.35, themeColor);
  bodyGrad.addColorStop(0.85, '#0F172A');
  bodyGrad.addColorStop(1, '#020617');

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Iridescent border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Golden / Cyan inner rim
  ctx.beginPath();
  ctx.arc(0, 0, radius - 2.5, 0, Math.PI * 2);
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 4. Fish character sprite in center
  drawFishBadgeCanvas(ctx, fishType, 0, 0, radius * 1.35);

  // 5. Specular highlight glint
  ctx.beginPath();
  ctx.ellipse(-radius * 0.38, -radius * 0.38, radius * 0.32, radius * 0.16, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fill();

  ctx.restore();
}

/**
 * Creates sparkling particle burst upon collecting a fish fragment.
 */
export function createFragmentCollectParticles(x: number, y: number, fishType: FishType): Particle[] {
  const particles: Particle[] = [];
  const themeColor = getFishThemeColor(fishType);
  const colors = [themeColor, '#FFFFFF', '#FCD34D', '#67E8F9', '#F43F5E'];

  for (let i = 0; i < 22; i++) {
    const angle = (Math.PI * 2 * i) / 22 + (Math.random() - 0.5) * 0.3;
    const speed = 70 + Math.random() * 110;
    particles.push({
      id: Math.random(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 25,
      size: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      maxLife: 0.65 + Math.random() * 0.35,
      life: 0.65 + Math.random() * 0.35,
      isBubble: Math.random() > 0.4,
    });
  }

  return particles;
}

/**
 * Safely sums all fragments from a FishFragmentCounts or fragment record.
 */
export function countTotalFragments(counts?: Record<string, number> | null): number {
  if (!counts) return 0;
  let sum = 0;
  for (const key of Object.keys(counts)) {
    const val = counts[key];
    if (typeof val === 'number') {
      sum += val;
    }
  }
  return sum;
}
