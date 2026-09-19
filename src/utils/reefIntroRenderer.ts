import { getAestheticForReef } from './backgroundAesthetics';
import { getReefZoneName } from './reef';
import { PhysicsConfig } from '../types';

/**
 * Renders the Reef Number and Reef Theme Description at the start of play for the first 2 seconds,
 * positioned between the background layer and the column layer, then smoothly fading out.
 * Flat, darker two-tone styling with static positioning (no movement animation).
 */
export function drawReefIntroTitle(
  ctx: CanvasRenderingContext2D,
  currentReef: number,
  elapsed: number,
  config: PhysicsConfig,
  gameState: string
): void {
  // Only display during active gameplay for the first 2.5 seconds (2.0s full display, then clean fade out)
  if (gameState !== 'PLAYING') return;
  if (elapsed < 0 || elapsed > 2.5) return;

  // Static position, no drift animation
  // Solid opacity for first 2 seconds, then clean fade-out over 0.5s
  let alpha = 1.0;
  if (elapsed > 2.0) {
    alpha = Math.max(0, 1.0 - (elapsed - 2.0) / 0.5);
  }

  if (alpha <= 0.005) return;

  const aesthetic = getAestheticForReef(currentReef);
  const themeDesc = getReefZoneName(currentReef);
  const words = themeDesc.split(/\s+/).filter(Boolean);

  // Flat two-tone darker color space from the reef's deep palette:
  // Tone 1: Darkest deep tone for the number
  // Tone 2: Rich dark secondary tone for the description words
  const tone1 = aesthetic.waterGradient[4] || '#082f49';
  const tone2 = aesthetic.waterGradient[3] || '#0c4a6e';

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // No shadow blur / glow - strictly flat
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  const centerX = config.virtualWidth / 2;

  // Font sizing: very very large font for Number alone, slightly smaller large font for Description words
  const reefNumFontSize = 70;
  let descFontSize = 30;

  // Guard against any unusually long words overflowing virtualWidth
  const maxAllowedWidth = config.virtualWidth * 0.85;
  ctx.font = `800 ${descFontSize}px "Fredoka", -apple-system, sans-serif`;
  for (const word of words) {
    const w = ctx.measureText(word).width;
    if (w > maxAllowedWidth) {
      descFontSize = Math.floor(descFontSize * (maxAllowedWidth / w));
    }
  }

  const reefNumLineHeight = reefNumFontSize + 2;
  const descLineHeight = descFontSize + 6;
  const gapBetween = 10;

  const totalHeight = reefNumLineHeight + gapBetween + words.length * descLineHeight;

  // Center vertically in usable water area (above seabed) - perfectly static, no drift
  const playAreaHeight = config.virtualHeight - config.groundHeight;
  const startY = (playAreaHeight - totalHeight) / 2;

  // 1. Number on its own line in very large bold font (word "Reef" removed)
  const reefY = startY + reefNumLineHeight / 2;
  const reefText = `${currentReef}`;

  ctx.font = `900 ${reefNumFontSize}px "Fredoka", -apple-system, sans-serif`;

  // Subtle clean flat hairline outline for contrast against all water depths
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.strokeText(reefText, centerX, reefY);

  // Flat Tone 1 fill
  ctx.fillStyle = tone1;
  ctx.fillText(reefText, centerX, reefY);

  // 2. Reef Theme Description under that, with each word on its own line
  let currentWordY = startY + reefNumLineHeight + gapBetween + descLineHeight / 2;
  ctx.font = `800 ${descFontSize}px "Fredoka", -apple-system, sans-serif`;

  for (const word of words) {
    // Subtle clean flat hairline outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeText(word, centerX, currentWordY);

    // Flat Tone 2 fill
    ctx.fillStyle = tone2;
    ctx.fillText(word, centerX, currentWordY);

    currentWordY += descLineHeight;
  }

  ctx.restore();
}
