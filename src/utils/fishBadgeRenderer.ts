import { FishType, BirdState, BirdSkinConfig } from '../types';
import { drawBird } from './renderer';
import { BIRD_SKINS, DEFAULT_FISH_SKINS } from './physics';

export interface FishBadgeConfig {
  offsetX: number;
  offsetY: number;
  scale: number;
}

/**
 * Centering and scaling adjustments for each fish type when rendered in a badge frame.
 * Values account for trailing tentacles, long tails, fins, and snout positions.
 */
export const FISH_BADGE_CONFIGS: Record<FishType, FishBadgeConfig> = {
  octopus: {
    offsetX: 4.5,
    offsetY: 0,
    scale: 0.86,
  },
  pufferfish: {
    offsetX: 4.0,
    offsetY: 0,
    scale: 0.90,
  },
  clownfish: {
    offsetX: 4.0,
    offsetY: 0,
    scale: 0.92,
  },
  singray: {
    offsetX: 7.5,
    offsetY: 0,
    scale: 0.80,
  },
  seahorse: {
    offsetX: -2.0,
    offsetY: 0,
    scale: 0.80,
  },
};

/**
 * Renders a small static fish directly onto a 2D Canvas context at (centerX, centerY).
 * Uses static defaults (coral skin, resting wing frame, 0 velocity/rotation) scaled to `targetSize`.
 */
export function drawFishBadgeCanvas(
  ctx: CanvasRenderingContext2D,
  fishType: FishType,
  centerX: number,
  centerY: number,
  targetSize: number = 18,
  customSkin?: BirdSkinConfig
): void {
  const config = FISH_BADGE_CONFIGS[fishType] || FISH_BADGE_CONFIGS.octopus;
  const baseScale = (targetSize / 38) * config.scale;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(baseScale, baseScale);

  const staticBird: BirdState = {
    x: config.offsetX,
    y: config.offsetY,
    width: 28,
    height: 28,
    velocity: 0,
    rotation: 0,
    wingFrame: 1, // Neutral resting/glide frame
    wingTimer: 0,
    alive: true,
  };

  const defaultSkinId = DEFAULT_FISH_SKINS[fishType] || 'coral';
  const skin = customSkin || BIRD_SKINS[defaultSkinId] || BIRD_SKINS.coral;
  drawBird(ctx, staticBird, skin, 300, fishType);
  ctx.restore();
}

// In-memory cache for pre-rendered PNG data URLs (high-DPI 64x64)
const dataUrlCache = new Map<string, string>();

/**
 * Returns a high-resolution PNG data URL rendering of the static fish badge.
 * Cached in memory for instant reuse without canvas overhead.
 */
export function getFishBadgeDataUrl(fishType: FishType, customSkin?: BirdSkinConfig): string {
  if (typeof document === 'undefined') return '';

  const cacheKey = customSkin ? `${fishType}_${customSkin.id}` : fishType;
  const cached = dataUrlCache.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  const canvasSize = 64;
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw centered at (32, 32) scaled to fit comfortably inside 64x64 with soft halo clearance
  drawFishBadgeCanvas(ctx, fishType, canvasSize / 2, canvasSize / 2, 50, customSkin);

  const dataUrl = canvas.toDataURL('image/png');
  dataUrlCache.set(cacheKey, dataUrl);
  return dataUrl;
}
