import { BirdSkinConfig, BirdState, Pipe, Particle, Cloud, PhysicsConfig, FishType } from '../types';
import { FishAbilityState } from './fishAbilities';
import { getAestheticForReef, BackgroundAesthetic } from './backgroundAesthetics';
import {
  getColumnThemeForReef,
  getColumnThemePalette,
  ColumnThemeType,
  ColumnThemePalette,
} from './columnThemes';

export function createInitialClouds(): Cloud[] {
  return [
    { x: 30, y: 70, speed: 10, scale: 1.1, opacity: 0.25 },
    { x: 180, y: 120, speed: 7, scale: 0.85, opacity: 0.2 },
    { x: 290, y: 50, speed: 13, scale: 1.25, opacity: 0.3 },
  ];
}

/**
 * Renders the underwater background with dynamic aesthetics rotating every three reefs:
 * - Unique 5-stop oceanic water column gradient per biome
 * - Harmonized god rays / light beams with custom colors and sway
 * - Shimmering surface refraction and ripple reflections
 * - Distinct biome background silhouettes (kelp, coral fans, spires, crystals, vents, sunken pillars)
 * - Thematic ambient floating particles (bubbles, bioluminescent motes, golden dust, embers, ice crystals, alien spores, pearls)
 */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  groundHeight: number,
  clouds: Cloud[],
  groundScroll: number,
  time: number = 0,
  reefLevel: number = 1
) {
  const aesthetic = getAestheticForReef(reefLevel);
  const waterHeight = height - groundHeight;
  const tSec = time / 1000;

  // 1. Oceanic Water Column Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, waterHeight);
  oceanGrad.addColorStop(0, aesthetic.waterGradient[0]);
  oceanGrad.addColorStop(0.18, aesthetic.waterGradient[1]);
  oceanGrad.addColorStop(0.5, aesthetic.waterGradient[2]);
  oceanGrad.addColorStop(0.82, aesthetic.waterGradient[3]);
  oceanGrad.addColorStop(1, aesthetic.waterGradient[4]);
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, waterHeight);

  // 2. Animated God Rays / Light Shafts (underwater sunbeams)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const rayCount = aesthetic.rayCount;
  for (let i = 0; i < rayCount; i++) {
    // Sway each ray slightly with sinusoidal drift
    const rayPhase = i * 1.35;
    const sway = Math.sin(tSec * 0.8 + rayPhase) * 22;
    const baseTopX = (width / (rayCount + 1)) * (i + 1) + sway;
    const rayAngle = -0.18 + Math.sin(tSec * 0.5 + i) * 0.06;
    const rayWidth = 28 + Math.sin(tSec * 1.2 + i * 2) * 10;
    const rayReach = waterHeight * (0.65 + (i % 3) * 0.15);

    const rayGrad = ctx.createLinearGradient(
      baseTopX,
      0,
      baseTopX + Math.sin(rayAngle) * rayReach,
      rayReach
    );
    const alphaPulse =
      aesthetic.rayAlpha + Math.sin(tSec * 1.5 + rayPhase) * (aesthetic.rayAlpha * 0.4);
    rayGrad.addColorStop(0, aesthetic.rayColors.top);
    rayGrad.addColorStop(0.38, aesthetic.rayColors.mid);
    rayGrad.addColorStop(1, aesthetic.rayColors.bottom);

    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(baseTopX - rayWidth * 0.4, 0);
    ctx.lineTo(baseTopX + rayWidth * 0.4, 0);
    ctx.lineTo(baseTopX + Math.sin(rayAngle) * rayReach + rayWidth * 1.5, rayReach);
    ctx.lineTo(baseTopX + Math.sin(rayAngle) * rayReach - rayWidth * 1.5, rayReach);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 3. Shimmering Water Surface Line (top 16px)
  ctx.save();
  const surfaceGrad = ctx.createLinearGradient(0, 0, 0, 16);
  surfaceGrad.addColorStop(0, aesthetic.surface.topColor);
  surfaceGrad.addColorStop(0.5, aesthetic.surface.midColor);
  surfaceGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = surfaceGrad;
  ctx.fillRect(0, 0, width, 16);

  // Surface ripples
  ctx.strokeStyle = aesthetic.surface.rippleStroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let sx = 0; sx <= width; sx += 8) {
    const sy =
      4 + Math.sin(sx * 0.08 + tSec * 3) * 2.5 + Math.cos(sx * 0.03 - tSec * 2) * 1.5;
    if (sx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.restore();

  // 4. Distant Background Silhouettes (slow parallax)
  drawDistantSilhouettes(ctx, width, waterHeight, groundScroll, tSec, aesthetic);

  // 5. Ambient Rising/Floating Thematic Particles
  drawAmbientParticles(ctx, width, waterHeight, tSec, aesthetic);
}

function drawDistantSilhouettes(
  ctx: CanvasRenderingContext2D,
  width: number,
  waterHeight: number,
  groundScroll: number,
  tSec: number,
  aesthetic: BackgroundAesthetic
) {
  ctx.save();
  ctx.fillStyle = aesthetic.silhouette.color;
  ctx.strokeStyle = aesthetic.silhouette.color;

  const type = aesthetic.silhouette.type;
  const offset = (groundScroll * 0.22) % 200;
  const positions = [18, 68, 122, 172];

  for (let shift = -200; shift < width + 200; shift += 200) {
    for (let pIdx = 0; pIdx < positions.length; pIdx++) {
      const sx = positions[pIdx] + shift - offset;
      if (sx > -60 && sx < width + 60) {
        if (type === 'kelp') {
          drawDistantKelpStalk(ctx, sx, waterHeight, tSec, aesthetic.silhouette.color);
        } else if (type === 'coral_fans') {
          drawDistantCoralFan(ctx, sx, waterHeight, tSec, pIdx);
        } else if (type === 'spires') {
          drawDistantSpire(ctx, sx, waterHeight, pIdx);
        } else if (type === 'crystal_pillars') {
          drawDistantCrystalPillar(ctx, sx, waterHeight, pIdx);
        } else if (type === 'vent_chimneys') {
          drawDistantVentChimney(ctx, sx, waterHeight, tSec, pIdx);
        } else if (type === 'ancient_pillars') {
          drawDistantAncientPillar(ctx, sx, waterHeight, pIdx);
        }
      }
    }
  }
  ctx.restore();
}

function drawDistantKelpStalk(
  ctx: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  tSec: number,
  color: string
) {
  const stalkH = bottomY * 0.85;
  ctx.beginPath();
  ctx.moveTo(x, bottomY);

  const segments = 6;
  const segH = stalkH / segments;
  for (let i = 1; i <= segments; i++) {
    const curY = bottomY - i * segH;
    const sway = Math.sin(tSec * 1.2 + i * 0.7 + x * 0.05) * (i * 2.5);
    ctx.lineTo(x + sway, curY);

    if (i % 2 === 0) {
      const dir = i % 4 === 0 ? 1 : -1;
      const leafX = x + sway + dir * 14;
      const leafY = curY - 6;
      ctx.quadraticCurveTo(leafX, leafY, x + sway, curY - 12);
    }
  }
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawDistantCoralFan(
  ctx: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  tSec: number,
  seed: number
) {
  const fanH = 70 + (seed % 3) * 20;
  const sway = Math.sin(tSec * 0.9 + seed) * 3;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, bottomY);
  ctx.quadraticCurveTo(x + sway * 0.5, bottomY - fanH * 0.5, x + sway, bottomY - fanH);
  ctx.stroke();

  // Branching fan spokes
  ctx.lineWidth = 1.5;
  const branches = 6;
  for (let b = 0; b < branches; b++) {
    const angle = -Math.PI / 2 + ((b - (branches - 1) / 2) / branches) * 1.4;
    const branchLen = fanH * (0.45 + (b % 2) * 0.15);
    const startY = bottomY - fanH * 0.45;
    const bx = x + Math.cos(angle) * branchLen + sway;
    const by = startY + Math.sin(angle) * branchLen;
    ctx.beginPath();
    ctx.moveTo(x + sway * 0.5, startY);
    ctx.quadraticCurveTo(x + sway, startY - 10, bx, by);
    ctx.stroke();
  }
}

function drawDistantSpire(
  ctx: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  seed: number
) {
  const spireH = 90 + (seed % 4) * 35;
  const baseW = 18 + (seed % 2) * 6;
  ctx.beginPath();
  ctx.moveTo(x - baseW / 2, bottomY);
  ctx.lineTo(x - baseW * 0.25, bottomY - spireH * 0.6);
  ctx.lineTo(x, bottomY - spireH);
  ctx.lineTo(x + baseW * 0.25, bottomY - spireH * 0.6);
  ctx.lineTo(x + baseW / 2, bottomY);
  ctx.closePath();
  ctx.fill();
}

function drawDistantCrystalPillar(
  ctx: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  seed: number
) {
  const h = 80 + (seed % 3) * 30;
  const w = 16 + (seed % 2) * 4;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, bottomY);
  ctx.lineTo(x - w / 2, bottomY - h + 18);
  ctx.lineTo(x, bottomY - h);
  ctx.lineTo(x + w / 2, bottomY - h + 12);
  ctx.lineTo(x + w / 2, bottomY);
  ctx.closePath();
  ctx.fill();
}

function drawDistantVentChimney(
  ctx: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  tSec: number,
  seed: number
) {
  const h = 75 + (seed % 3) * 25;
  const w = 22;
  // Chimney shaft
  ctx.beginPath();
  ctx.moveTo(x - w / 2, bottomY);
  ctx.lineTo(x - w * 0.35, bottomY - h);
  ctx.lineTo(x + w * 0.35, bottomY - h);
  ctx.lineTo(x + w / 2, bottomY);
  ctx.closePath();
  ctx.fill();

  // Chimney smoke plume puffs
  for (let p = 0; p < 3; p++) {
    const pY = bottomY - h - ((tSec * 25 + p * 30 + seed * 15) % 80);
    const pX = x + Math.sin(tSec * 2 + p) * 6;
    const pR = 5 + (bottomY - h - pY) * 0.12;
    ctx.save();
    ctx.globalAlpha = 0.25 * (1 - (bottomY - h - pY) / 80);
    ctx.beginPath();
    ctx.arc(pX, pY, pR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawDistantAncientPillar(
  ctx: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  seed: number
) {
  const h = 95 + (seed % 2) * 20;
  const w = 18;
  // Base
  ctx.fillRect(x - w * 0.7, bottomY - 8, w * 1.4, 8);
  // Column shaft
  ctx.fillRect(x - w * 0.45, bottomY - h + 10, w * 0.9, h - 18);
  // Capital
  ctx.fillRect(x - w * 0.65, bottomY - h, w * 1.3, 10);
}

function drawAmbientParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tSec: number,
  aesthetic: BackgroundAesthetic
) {
  ctx.save();
  const count = aesthetic.particles.count || 16;
  const type = aesthetic.particles.type;
  const primaryColor = aesthetic.particles.color;
  const glowColor = aesthetic.particles.glowColor;

  for (let i = 0; i < count; i++) {
    const seed = i + 1;
    const speed = 20 + ((seed * 17) % 25);
    const totalDist = height + 40;
    const y = height - ((tSec * speed + seed * 63) % totalDist);
    const wobbleFreq = 1.2 + (seed % 3) * 0.5;
    const wobbleAmp = 8 + (seed % 4) * 3;
    const xBase = ((seed * 0.065) % 0.9 + 0.05) * width;
    const x = xBase + Math.sin(tSec * wobbleFreq + seed * 2.5) * wobbleAmp;

    if (y < 0 || y > height) continue;

    if (type === 'bubbles') {
      const r = 2.5 + (seed % 4) * 1.2;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Specular highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'biolum_motes') {
      const pulse = 0.5 + Math.sin(tSec * 3 + seed * 1.5) * 0.4;
      const r = 2.2 + (seed % 3) * 0.8;
      if (glowColor) {
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'golden_dust') {
      const r = 1.6 + (seed % 3) * 0.7;
      const sparkle = Math.sin(tSec * 4 + seed * 2) > 0.6;
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      if (sparkle) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + 3, y);
        ctx.moveTo(x, y - 3);
        ctx.lineTo(x, y + 3);
        ctx.stroke();
      }
    } else if (type === 'crimson_embers') {
      const r = 2.0 + (seed % 3) * 0.9;
      const flicker = 0.6 + Math.sin(tSec * 6 + seed) * 0.4;
      if (glowColor) {
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.2 * flicker, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'ice_crystals') {
      const rot = tSec * 0.8 + seed;
      const size = 3.5 + (seed % 3);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.lineTo(size, 0);
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.stroke();
      ctx.restore();
    } else if (type === 'neon_spores') {
      const r = 2.4 + (seed % 3) * 0.8;
      const pulse = 0.7 + Math.sin(tSec * 2.5 + seed) * 0.3;
      if (glowColor) {
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.2 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'pearl_bubbles') {
      const r = 3.0 + (seed % 4) * 1.2;
      ctx.strokeStyle = glowColor || 'rgba(94, 234, 212, 0.6)';
      ctx.lineWidth = 1.4;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Renders the Obstacles with 7 rotating Column Themes changing every 2 reefs:
 * 1. Original Kelp-Pipe Columns (lush swaying kelp with air bladders & curled fronds)
 * 2. Minecraft Columns (16-bit voxel blocks with pixel dithering & stepped slabs)
 * 3. Candy Columns (glossy peppermint spiral candy canes with sugar sheen)
 * 4. Tangled Kelp Columns (interwoven fibrous vines & braided organic ropes)
 * 5. Matrix-Style Columns (cybernetic terminal scanlines & cascading neon glyphs)
 * 6. Lava Columns (basalt obsidian crags with glowing molten magma fissures)
 * 7. Sunken Atlantis Columns (classical fluted marble pillars, gold friezes & Atlantean crystals)
 *
 * Each theme dynamically harmonizes its colors with the active underwater water theme!
 */
export function drawPipes(
  ctx: CanvasRenderingContext2D,
  pipes: Pipe[],
  config: PhysicsConfig,
  time: number = 0,
  reefLevel: number = 1
) {
  const capHeight = 28;
  const tSec = time / 1000;
  const aesthetic = getAestheticForReef(reefLevel);
  const theme = getColumnThemeForReef(reefLevel);
  const palette = getColumnThemePalette(theme, aesthetic);

  for (const pipe of pipes) {
    const x = pipe.x;
    const w = pipe.width;
    const topH = pipe.topHeight;
    const gap = pipe.gap || config.pipeGap;
    const botY = topH + gap;
    const botH = pipe.bottomHeight;
    const colNum = pipe.columnNumber;

    switch (theme) {
      case 'original_kelp':
        drawKelpColumn(ctx, x, w, topH, botY, botH, capHeight, tSec, colNum, palette);
        break;
      case 'minecraft':
        drawMinecraftColumn(ctx, x, w, topH, botY, botH, capHeight, tSec, colNum, palette);
        break;
      case 'candy':
        drawCandyColumn(ctx, x, w, topH, botY, botH, capHeight, tSec, colNum, palette);
        break;
      case 'tangled_kelp':
        drawTangledKelpColumn(ctx, x, w, topH, botY, botH, capHeight, tSec, colNum, palette);
        break;
      case 'matrix':
        drawMatrixColumn(ctx, x, w, topH, botY, botH, capHeight, tSec, colNum, palette);
        break;
      case 'lava':
        drawLavaColumn(ctx, x, w, topH, botY, botH, capHeight, tSec, colNum, palette);
        break;
      case 'sunken_atlantis':
        drawSunkenAtlantisColumn(ctx, x, w, topH, botY, botH, capHeight, tSec, colNum, palette);
        break;
    }
  }
}

// ==========================================
// 1. THEME: ATLANTIS MYSTICAL SPIRES
// ==========================================
function drawKelpColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  topH: number,
  botY: number,
  botH: number,
  capHeight: number,
  tSec: number,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  if (topH > 0) {
    drawAtlantisMysticSpireBody(ctx, x, 0, w, topH - capHeight, true, tSec, colNum, palette);
    drawAtlantisMysticCap(ctx, x - 4, topH - capHeight, w + 8, capHeight, true, tSec, undefined, palette);
  }
  if (botH > 0) {
    drawAtlantisMysticCap(ctx, x - 4, botY, w + 8, capHeight, false, tSec, colNum, palette);
    drawAtlantisMysticSpireBody(ctx, x, botY + capHeight, w, botH - capHeight, false, tSec, colNum, palette);
  }
}

/**
 * Renders the body of the Atlantis Mystical Spire:
 * - Transparent crystalline structure letting the underwater ocean background shine through
 * - Subtle animations: pulsing central core beam, ascending power motes, caustic sheen, and breathing runes
 * - Atlantis mystical theme: orichalcum filigree braces, ancient glyphs, and sacred geometry
 * - 4 distinct architectural variations (Trident, Concentric City Canals, Tide Vortex, Astral Compass)
 */
function drawAtlantisMysticSpireBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isTop: boolean,
  tSec: number,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  if (h <= 0) return;
  ctx.save();

  const colVariant = (((colNum !== undefined ? colNum : Math.floor(x / 75)) % 4) + 4) % 4;

  // 1. Transparent Crystalline Background
  // Multi-stop translucent gradient: ocean background clearly visible through the column
  const crystalGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  crystalGrad.addColorStop(0, palette.bodyGradient[0]);
  crystalGrad.addColorStop(0.22, palette.bodyGradient[1]);
  crystalGrad.addColorStop(0.5, palette.bodyGradient[2]);
  crystalGrad.addColorStop(0.78, palette.bodyGradient[1]);
  crystalGrad.addColorStop(1, palette.bodyGradient[3]);
  ctx.fillStyle = crystalGrad;
  ctx.fillRect(x, y, w, h);

  // Inner crystalline refraction chamber (soft prismatic glass light)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(x + 4, y, w - 8, h);

  // Specular facet lines & internal crystal reflection
  ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.fillRect(x + 2, y, 1.5, h); // Left high specular sheen
  ctx.fillStyle = palette.accentGlow;
  ctx.fillRect(x + 6, y, 1, h); // Prismatic refraction band
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fillRect(x + w - 3, y, 1.5, h); // Right inner shadow

  // Outer glowing crystal border
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // 2. Subtle Animation: Pulsing Central Energy Conduit
  const corePulse = 0.55 + 0.45 * Math.sin(tSec * 2.2 + (colNum || 0) * 1.3);
  const coreGrad = ctx.createLinearGradient(x + w / 2 - 6, 0, x + w / 2 + 6, 0);
  coreGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
  coreGrad.addColorStop(0.5, `rgba(56, 189, 248, ${0.42 * corePulse})`);
  coreGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(x + w / 2 - 6, y, 12, h);

  ctx.fillStyle = `rgba(255, 255, 255, ${0.58 * corePulse})`;
  ctx.fillRect(x + w / 2 - 1, y, 2, h);

  // 3. Subtle Animation: Ascending Mystic Light Motes / Atlantean Sparkles
  const seedBase = Math.abs(Math.floor(x * 0.17)) + (colNum || 0) * 19;
  const moteCount = Math.min(6, Math.max(3, Math.floor(h / 35)));
  for (let m = 0; m < moteCount; m++) {
    const mSeed = (seedBase * 37 + m * 59) % 1000;
    const speed = 16 + (mSeed % 14);
    const cycle = Math.max(30, h);
    const my = y + ((mSeed * 13 + (cycle - (tSec * speed) % cycle)) % cycle);
    const sway = Math.sin(tSec * 1.8 + m * 1.2) * 3;
    const mx = x + 8 + (mSeed % Math.max(1, w - 16)) + sway;
    const mRadius = 1.2 + (mSeed % 3) * 0.5;
    const mAlpha = 0.35 + 0.35 * Math.sin(tSec * 2.5 + m);

    ctx.fillStyle =
      m % 2 === 0
        ? `rgba(56, 189, 248, ${mAlpha})`
        : `rgba(251, 191, 36, ${mAlpha * 0.9})`;
    ctx.beginPath();
    ctx.arc(mx, my, mRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Subtle Animation: Caustic Wave Sheen drifting along the crystal
  const waveY = y + ((tSec * 38 + (colNum || 0) * 25) % Math.max(40, h));
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, waveY, w * 0.42, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. Orichalcum Filigree Framework Braces (Sunken Gold Clasps)
  const bandSpacing = 68;
  const startBandY = isTop ? y + h - 16 : y + 16;
  const bracePositions: number[] = [startBandY];
  if (h > 90) {
    for (let by = y + 36; by < y + h - 30; by += bandSpacing) {
      bracePositions.push(by);
    }
  }

  for (const by of bracePositions) {
    drawOrichalcumBrace(ctx, x + 2, by, w - 4, palette, tSec);
  }

  // 6. 4 Distinct Architectural Variations & Sacred Atlantean Glyphs
  drawAtlantisSpireVariation(ctx, x, y, w, h, colVariant, tSec, palette);

  // 7. Secondary Inscribed Ancient Glyphs Along Tall Columns
  if (h > 120) {
    const glyphSpacing = 55;
    let idx = 0;
    for (let gy = y + 45; gy < y + h - 45; gy += glyphSpacing) {
      if (Math.abs(gy - (y + h * 0.5)) > 26) {
        drawSmallAtlantisGlyph(ctx, x + w / 2, gy, idx, tSec, palette);
        idx++;
      }
    }
  }

  ctx.restore();
}

/**
 * Draws sunken Atlantean orichalcum gold filigree brace bands with stepped corners and jewel studs
 */
function drawOrichalcumBrace(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  bw: number,
  palette: ColumnThemePalette,
  tSec: number
) {
  // Gold band shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(bx, by + 1, bw, 4);

  // Orichalcum metallic gold body
  ctx.fillStyle = palette.accentSecondary;
  ctx.fillRect(bx, by, bw, 3.5);

  // Gold specular top edge
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(bx, by, bw, 1);

  // Center Atlantean gem stud
  const gemPulse = 0.6 + 0.4 * Math.sin(tSec * 3 + by * 0.1);
  ctx.fillStyle = `rgba(34, 211, 238, ${gemPulse})`;
  ctx.beginPath();
  ctx.arc(bx + bw / 2, by + 1.7, 2, 0, Math.PI * 2);
  ctx.fill();

  // Stepped corner rivets
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(bx + 1, by + 0.5, 2, 2.5);
  ctx.fillRect(bx + bw - 3, by + 0.5, 2, 2.5);
}

/**
 * Renders one of 4 distinct sacred Atlantean architectural motifs across columns
 */
function drawAtlantisSpireVariation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  variant: number,
  tSec: number,
  palette: ColumnThemePalette
) {
  const midY = y + h * 0.5;
  const cx = x + w / 2;

  switch (variant) {
    // Variation 0: The Royal Trident of Atlantis
    case 0: {
      // Dual vertical orichalcum resonance rods
      ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.fillRect(x + 9, y, 1.5, h);
      ctx.fillRect(x + w - 10.5, y, 1.5, h);

      // Inscribed glowing Poseidon Trident emblem
      if (h >= 45) {
        const tridentGlow = 0.65 + 0.35 * Math.sin(tSec * 2.0);
        ctx.save();
        ctx.strokeStyle = `rgba(34, 211, 238, ${tridentGlow})`;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = palette.accentPrimary;
        ctx.shadowBlur = 6;

        // Central trident shaft
        ctx.beginPath();
        ctx.moveTo(cx, midY - 14);
        ctx.lineTo(cx, midY + 14);
        ctx.stroke();

        // Cross-guard
        ctx.beginPath();
        ctx.moveTo(cx - 9, midY - 4);
        ctx.lineTo(cx + 9, midY - 4);
        ctx.stroke();

        // Left & right curved prongs
        ctx.beginPath();
        ctx.moveTo(cx - 9, midY - 4);
        ctx.quadraticCurveTo(cx - 9, midY - 12, cx - 6, midY - 15);
        ctx.moveTo(cx + 9, midY - 4);
        ctx.quadraticCurveTo(cx + 9, midY - 12, cx + 6, midY - 15);
        ctx.stroke();

        // Base ring
        ctx.fillStyle = palette.accentSecondary;
        ctx.beginPath();
        ctx.arc(cx, midY + 14, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
      break;
    }

    // Variation 1: The Concentric Sunken Canals of Atlantis (Plato's Sacred Rings)
    case 1: {
      // Diagonal criss-cross orichalcum diamond trellis filigree
      const step = 28;
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let ly = y; ly < y + h; ly += step) {
        ctx.moveTo(x + 4, ly);
        ctx.lineTo(x + w - 4, ly + step);
        ctx.moveTo(x + w - 4, ly);
        ctx.lineTo(x + 4, ly + step);
      }
      ctx.stroke();
      ctx.restore();

      // Inscribed concentric rings emblem
      if (h >= 45) {
        const ringPulse = 0.65 + 0.35 * Math.sin(tSec * 2.3);
        ctx.save();
        ctx.strokeStyle = `rgba(251, 191, 36, ${ringPulse})`;
        ctx.lineWidth = 1.5;

        // Outer ring
        ctx.beginPath();
        ctx.arc(cx, midY, 12, 0, Math.PI * 2);
        ctx.stroke();

        // Middle water canal ring
        ctx.strokeStyle = `rgba(34, 211, 238, ${ringPulse})`;
        ctx.beginPath();
        ctx.arc(cx, midY, 7.5, 0, Math.PI * 2);
        ctx.stroke();

        // Central citadel node
        ctx.fillStyle = palette.accentPrimary;
        ctx.beginPath();
        ctx.arc(cx, midY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Radiating 4 access channels
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(cx - 13, midY);
        ctx.lineTo(cx + 13, midY);
        ctx.moveTo(cx, midY - 13);
        ctx.lineTo(cx, midY + 13);
        ctx.stroke();

        ctx.restore();
      }
      break;
    }

    // Variation 2: The Temple of the Tide (Oceanic Vortex & Wave Filaments)
    case 2: {
      // Dual undulating sine-wave energy filaments running down the crystal
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let py = y; py <= y + h; py += 4) {
        const wave1 = Math.sin(tSec * 2.8 + py * 0.05) * 7;
        if (py === y) ctx.moveTo(cx + wave1, py);
        else ctx.lineTo(cx + wave1, py);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.beginPath();
      for (let py = y; py <= y + h; py += 4) {
        const wave2 = Math.sin(tSec * 2.8 + py * 0.05 + Math.PI) * 7;
        if (py === y) ctx.moveTo(cx + wave2, py);
        else ctx.lineTo(cx + wave2, py);
      }
      ctx.stroke();
      ctx.restore();

      // Inscribed Nautilus spiral vortex emblem
      if (h >= 45) {
        const vortexPulse = 0.7 + 0.3 * Math.sin(tSec * 2.5);
        ctx.save();
        ctx.strokeStyle = `rgba(34, 211, 238, ${vortexPulse})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx, midY, 11, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 2, midY + 2, 6.5, 0, Math.PI * 1.4);
        ctx.stroke();

        // Pulsing vortex core jewel
        ctx.fillStyle = palette.accentSecondary;
        ctx.beginPath();
        ctx.arc(cx + 3, midY + 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    // Variation 3: The Astral Compass of Poseidon
    case 3: {
      // Segmented crystal resonator plates
      const segStep = 36;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
      for (let sy = y + 10; sy < y + h - 10; sy += segStep) {
        ctx.fillRect(x + 7, sy, w - 14, 2);
        ctx.fillStyle = palette.accentSecondary;
        ctx.fillRect(x + 5, sy - 1, 2, 4);
        ctx.fillRect(x + w - 7, sy - 1, 2, 4);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
      }

      // Inscribed eight-pointed nautical compass emblem
      if (h >= 45) {
        const starPulse = 0.65 + 0.35 * Math.sin(tSec * 1.9);
        ctx.save();
        ctx.strokeStyle = `rgba(251, 191, 36, ${starPulse})`;
        ctx.lineWidth = 1.5;

        // 4 Primary cardinal rays
        ctx.beginPath();
        ctx.moveTo(cx, midY - 13);
        ctx.lineTo(cx, midY + 13);
        ctx.moveTo(cx - 13, midY);
        ctx.lineTo(cx + 13, midY);
        ctx.stroke();

        // 4 Secondary diagonal rays
        ctx.strokeStyle = `rgba(34, 211, 238, ${starPulse * 0.8})`;
        ctx.beginPath();
        ctx.moveTo(cx - 8, midY - 8);
        ctx.lineTo(cx + 8, midY + 8);
        ctx.moveTo(cx + 8, midY - 8);
        ctx.lineTo(cx - 8, midY + 8);
        ctx.stroke();

        // Center jewel bezel
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, midY, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
  }
}

/**
 * Renders small secondary ancient Atlantean glyphs along tall columns
 */
function drawSmallAtlantisGlyph(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  index: number,
  tSec: number,
  palette: ColumnThemePalette
) {
  const pulse = 0.5 + 0.5 * Math.sin(tSec * 2.2 + index * 1.5);
  ctx.save();
  ctx.strokeStyle = `rgba(34, 211, 238, ${pulse * 0.65})`;
  ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.7})`;
  ctx.lineWidth = 1.2;

  const glyphType = index % 3;
  if (glyphType === 0) {
    // Chevron pair
    ctx.beginPath();
    ctx.moveTo(gx - 5, gy - 3);
    ctx.lineTo(gx, gy);
    ctx.lineTo(gx + 5, gy - 3);
    ctx.moveTo(gx - 5, gy + 1);
    ctx.lineTo(gx, gy + 4);
    ctx.lineTo(gx + 5, gy + 1);
    ctx.stroke();
  } else if (glyphType === 1) {
    // Diamond rhombus with center dot
    ctx.beginPath();
    ctx.moveTo(gx, gy - 5);
    ctx.lineTo(gx + 4.5, gy);
    ctx.lineTo(gx, gy + 5);
    ctx.lineTo(gx - 4.5, gy);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(gx, gy, 1.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Atlantean concentric runic dot
    ctx.beginPath();
    ctx.arc(gx, gy, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renders the ornate Atlantean Capital / Plinth Cap at the gap border:
 * - Stepped orichalcum and deep-sea marble cornice
 * - Hovering/mounted brilliant apex power crystal pointing into the gap
 * - Sunken Atlantean medal for column numbers
 */
function drawAtlantisMysticCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isTop: boolean,
  tSec: number,
  columnNumber: number | undefined,
  palette: ColumnThemePalette
) {
  ctx.save();

  // 1. Stepped Outer Rim
  ctx.fillStyle = palette.borderColor;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

  // 2. Stepped Cornice Gradient Body
  const capGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  capGrad.addColorStop(0, palette.capGradient[0]);
  capGrad.addColorStop(0.25, palette.capGradient[1]);
  capGrad.addColorStop(0.7, palette.capGradient[2]);
  capGrad.addColorStop(1, palette.capGradient[3]);
  ctx.fillStyle = capGrad;
  ctx.fillRect(x, y, w, h);

  // 3. Polished Orichalcum Gold Frieze Trim Line
  const goldTrimY = isTop ? y + h - 5 : y + 3;
  ctx.fillStyle = palette.accentSecondary;
  ctx.fillRect(x + 2, goldTrimY, w - 4, 2.5);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x + 2, goldTrimY, w - 4, 0.8);

  // 4. Stepped Corner Gold Brackets
  ctx.fillStyle = palette.accentSecondary;
  const bracketY = isTop ? y + h - 9 : y + 1;
  ctx.fillRect(x + 1, bracketY, 6, 8);
  ctx.fillRect(x + w - 7, bracketY, 6, 8);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x + 2, bracketY + 1, 2, 6);
  ctx.fillRect(x + w - 4, bracketY + 1, 2, 6);

  // 5. Specular Vertical Highlight on Cap Face
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(x + 7, y + 2, 3, h - 4);

  // 6. Brilliant Pulsing Apex Power Crystal pointing into the gap
  drawApexPowerCrystal(ctx, x + w / 2, isTop ? y + h : y, isTop, tSec, palette);

  // 7. Sunken Atlantean Seal / Column Number Medallion
  if (columnNumber !== undefined && !isTop) {
    drawAtlantisMedallionBadge(ctx, x + w / 2, y + h / 2, columnNumber, palette);
  }

  ctx.restore();
}

/**
 * Draws the brilliant faceted Atlantean power crystal mounted at the apex facing the swimming gap
 */
function drawApexPowerCrystal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  edgeY: number,
  isTop: boolean,
  tSec: number,
  palette: ColumnThemePalette
) {
  ctx.save();
  const dir = isTop ? 1 : -1;
  const crystalCenterY = edgeY + dir * 6;
  const crystalHalfW = 6;
  const crystalHalfH = 8;
  const crystalTipY = edgeY + dir * 14;

  // Pulsing glow aura
  const auraPulse = 0.65 + 0.35 * Math.sin(tSec * 3.5 + cx * 0.05);
  ctx.shadowColor = palette.accentPrimary;
  ctx.shadowBlur = 10 * auraPulse;

  // Faceted Rhombus Crystal
  // Left facet (medium shadow)
  ctx.fillStyle = '#0891b2';
  ctx.beginPath();
  ctx.moveTo(cx, edgeY);
  ctx.lineTo(cx - crystalHalfW, crystalCenterY);
  ctx.lineTo(cx, crystalTipY);
  ctx.closePath();
  ctx.fill();

  // Right facet (highlight facet)
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.moveTo(cx, edgeY);
  ctx.lineTo(cx + crystalHalfW, crystalCenterY);
  ctx.lineTo(cx, crystalTipY);
  ctx.closePath();
  ctx.fill();

  // Facet center ridge & specular shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.moveTo(cx, edgeY + dir * 2);
  ctx.lineTo(cx + 1.2, crystalCenterY);
  ctx.lineTo(cx, crystalTipY - dir * 2);
  ctx.lineTo(cx - 0.8, crystalCenterY);
  ctx.closePath();
  ctx.fill();

  // Gold mounting prongs
  ctx.fillStyle = palette.accentSecondary;
  ctx.beginPath();
  ctx.arc(cx - crystalHalfW + 1, crystalCenterY, 2, 0, Math.PI * 2);
  ctx.arc(cx + crystalHalfW - 1, crystalCenterY, 2, 0, Math.PI * 2);
  ctx.fill();

  // 4 Radiant sparkle glints (+ cross star rays)
  const glintLen = 4 + 2 * Math.sin(tSec * 4 + cx);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * auraPulse})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, crystalTipY - glintLen);
  ctx.lineTo(cx, crystalTipY + glintLen);
  ctx.moveTo(cx - glintLen, crystalTipY);
  ctx.lineTo(cx + glintLen, crystalTipY);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the sunken Atlantean Seal medallion for column counters:
 * - Concentric orichalcum gold rim with 8 beaded rivets
 * - Deep navy/abyssal crystal center
 * - Crisp column number
 */
function drawAtlantisMedallionBadge(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  columnNumber: number,
  palette: ColumnThemePalette
) {
  ctx.save();

  // Outer gold rim
  ctx.fillStyle = palette.accentSecondary;
  ctx.beginPath();
  ctx.arc(bx, by, 10.5, 0, Math.PI * 2);
  ctx.fill();

  // Inner deep sea enamel
  ctx.fillStyle = palette.badgeBg;
  ctx.beginPath();
  ctx.arc(bx, by, 8.5, 0, Math.PI * 2);
  ctx.fill();

  // 8 Tiny perimeter rivets
  ctx.fillStyle = '#fef08a';
  for (let r = 0; r < 8; r++) {
    const angle = (r * Math.PI) / 4;
    const rx = bx + Math.cos(angle) * 9.5;
    const ry = by + Math.sin(angle) * 9.5;
    ctx.fillRect(rx - 0.75, ry - 0.75, 1.5, 1.5);
  }

  // Text: Column Number
  ctx.fillStyle = palette.badgeText;
  ctx.font = 'bold 9px "Press Start 2P", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(columnNumber), bx, by + 0.5);

  ctx.restore();
}

// ==========================================
// 2. THEME: MINECRAFT COLUMNS
// ==========================================
function drawMinecraftColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  topH: number,
  botY: number,
  botH: number,
  capHeight: number,
  tSec: number,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  if (topH > 0) {
    drawMinecraftPillarBody(ctx, x, 0, w, topH - capHeight, palette);
    drawMinecraftCap(ctx, x - 4, topH - capHeight, w + 8, capHeight, true, undefined, palette);
  }
  if (botH > 0) {
    drawMinecraftCap(ctx, x - 4, botY, w + 8, capHeight, false, colNum, palette);
    drawMinecraftPillarBody(ctx, x, botY + capHeight, w, botH - capHeight, palette);
  }
}

function drawMinecraftPillarBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  palette: ColumnThemePalette
) {
  if (h <= 0) return;
  ctx.save();

  // Pillar background
  ctx.fillStyle = palette.bodyGradient[3];
  ctx.fillRect(x, y, w, h);

  const blockSize = 26; // 2 columns across 52px width
  const cols = Math.max(1, Math.floor(w / blockSize));
  const rows = Math.ceil(h / blockSize);

  for (let r = 0; r < rows; r++) {
    const by = y + r * blockSize;
    const bh = Math.min(blockSize, y + h - by);
    if (bh <= 0) continue;

    for (let c = 0; c < cols; c++) {
      const bx = x + c * blockSize;
      const bw = (c === cols - 1) ? (x + w - bx) : blockSize;

      // Base block fill
      ctx.fillStyle = palette.bodyGradient[1];
      ctx.fillRect(bx, by, bw, bh);

      // 16-bit block pixel bevels
      // Top bevel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(bx, by, bw, 2);
      // Left bevel
      ctx.fillRect(bx, by, 2, bh);
      // Bottom shaded bevel
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(bx, by + bh - 2, bw, 2);
      // Right shaded bevel
      ctx.fillRect(bx + bw - 2, by, 2, bh);

      // Pixel texture flecks (Minecraft block dithering)
      const seed = (c * 17 + r * 31) % 7;
      ctx.fillStyle = palette.accentPrimary;
      ctx.fillRect(bx + 4 + (seed % 3) * 4, by + 4 + (seed % 4) * 3, 3, 3);
      ctx.fillRect(bx + 14 + (seed % 2) * 3, by + 12 + (seed % 3) * 3, 3, 3);

      ctx.fillStyle = palette.borderColor;
      ctx.fillRect(bx + 8 + (seed % 2) * 5, by + 16, 3, 3);

      // Block outline
      ctx.strokeStyle = palette.borderColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    }
  }
  ctx.restore();
}

function drawMinecraftCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isTop: boolean,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  ctx.save();
  // Stepped blocky slab / capital
  ctx.fillStyle = palette.borderColor;
  ctx.fillRect(x, y, w, h);

  // Main block slab body
  ctx.fillStyle = palette.capGradient[1];
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

  // Minecraft stepped notch near the gap boundary
  const notchH = 8;
  const notchY = isTop ? y + h - notchH : y;
  ctx.fillStyle = palette.capGradient[2];
  ctx.fillRect(x + 6, notchY, w - 12, notchH);

  // Crisp pixelated border highlight
  ctx.fillStyle = palette.capRim;
  ctx.fillRect(x + 2, isTop ? y + 2 : y + h - 4, w - 4, 2);
  ctx.fillRect(x + 2, y + 2, 2, h - 4);

  // Stepped edge outline
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  // Pixel Item Frame Badge for Column Number
  if (colNum !== undefined && !isTop) {
    const badgeX = x + w / 2;
    const badgeY = y + h / 2 + 1;
    const size = 18;

    // Square Item Frame backplate
    ctx.fillStyle = palette.badgeBg;
    ctx.fillRect(badgeX - size / 2, badgeY - size / 2, size, size);

    ctx.strokeStyle = palette.badgeBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(badgeX - size / 2, badgeY - size / 2, size, size);

    // 4 pixel corner rivets
    ctx.fillStyle = palette.accentSecondary;
    ctx.fillRect(badgeX - size / 2 + 1, badgeY - size / 2 + 1, 2, 2);
    ctx.fillRect(badgeX + size / 2 - 3, badgeY - size / 2 + 1, 2, 2);
    ctx.fillRect(badgeX - size / 2 + 1, badgeY + size / 2 - 3, 2, 2);
    ctx.fillRect(badgeX + size / 2 - 3, badgeY + size / 2 - 3, 2, 2);

    ctx.fillStyle = palette.badgeText;
    ctx.font = 'bold 9px "Press Start 2P", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(colNum), badgeX, badgeY + 1);
  }
  ctx.restore();
}

// ==========================================
// 3. THEME: CANDY COLUMNS
// ==========================================
function drawCandyColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  topH: number,
  botY: number,
  botH: number,
  capHeight: number,
  tSec: number,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  if (topH > 0) {
    drawCandyPillarBody(ctx, x, 0, w, topH - capHeight, palette);
    drawCandyCap(ctx, x - 4, topH - capHeight, w + 8, capHeight, true, undefined, palette);
  }
  if (botH > 0) {
    drawCandyCap(ctx, x - 4, botY, w + 8, capHeight, false, colNum, palette);
    drawCandyPillarBody(ctx, x, botY + capHeight, w, botH - capHeight, palette);
  }
}

function drawCandyPillarBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  palette: ColumnThemePalette
) {
  if (h <= 0) return;
  ctx.save();

  // Cylindrical candy base gradient
  const baseGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  baseGrad.addColorStop(0, palette.bodyGradient[0]);
  baseGrad.addColorStop(0.3, palette.bodyGradient[1]);
  baseGrad.addColorStop(0.7, palette.bodyGradient[2]);
  baseGrad.addColorStop(1, palette.bodyGradient[3]);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(x, y, w, h);

  // Clip to pillar body for diagonal candy cane spiral stripes
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const stripeSpacing = 28;
  const startOffset = -w * 2;
  const endOffset = h + w * 2;

  for (let sy = startOffset; sy < endOffset; sy += stripeSpacing) {
    // Primary candy spiral stripe (sugar white / vibrant accent)
    ctx.fillStyle = palette.accentPrimary;
    ctx.beginPath();
    ctx.moveTo(x, sy);
    ctx.lineTo(x + w, sy + w * 0.85);
    ctx.lineTo(x + w, sy + w * 0.85 + 11);
    ctx.lineTo(x, sy + 11);
    ctx.closePath();
    ctx.fill();

    // Secondary delicate pinstripe
    ctx.fillStyle = palette.accentSecondary;
    ctx.beginPath();
    ctx.moveTo(x, sy + 15);
    ctx.lineTo(x + w, sy + w * 0.85 + 15);
    ctx.lineTo(x + w, sy + w * 0.85 + 17.5);
    ctx.lineTo(x, sy + 17.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // High-gloss vertical candy shine streak
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.fillRect(x + 6, y, 4, h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(x + 12, y, 2, h);

  // Dark candy outline
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  ctx.restore();
}

function drawCandyCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isTop: boolean,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  ctx.save();
  // Bulbous gumdrop / ribbon candy cap
  ctx.fillStyle = palette.borderColor;
  ctx.beginPath();
  ctx.roundRect(x - 1, y - 1, w + 2, h + 2, 8);
  ctx.fill();

  const capGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  capGrad.addColorStop(0, palette.capGradient[0]);
  capGrad.addColorStop(0.3, palette.capGradient[1]);
  capGrad.addColorStop(0.7, palette.capGradient[2]);
  capGrad.addColorStop(1, palette.capGradient[3]);
  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.fill();

  // Wavy sugar stripes across the cap
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const midY = isTop ? y + h - 8 : y + 8;
  ctx.moveTo(x + 4, midY);
  ctx.quadraticCurveTo(x + w * 0.3, midY + (isTop ? 4 : -4), x + w * 0.5, midY);
  ctx.quadraticCurveTo(x + w * 0.7, midY + (isTop ? -4 : 4), x + w - 4, midY);
  ctx.stroke();

  // Sparkling sugar crystals
  ctx.fillStyle = palette.accentSecondary;
  const sparkles = [
    { ox: 8, oy: isTop ? 6 : h - 6 },
    { ox: w / 2 - 10, oy: isTop ? 8 : h - 8 },
    { ox: w / 2 + 10, oy: isTop ? 6 : h - 6 },
    { ox: w - 8, oy: isTop ? 8 : h - 8 },
  ];
  for (const s of sparkles) {
    ctx.beginPath();
    ctx.arc(x + s.ox, y + s.oy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Peppermint swirl disc badge
  if (colNum !== undefined && !isTop) {
    const badgeX = x + w / 2;
    const badgeY = y + h / 2 + 1;
    const r = 9.5;

    ctx.fillStyle = palette.badgeBg;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, r, 0, Math.PI * 2);
    ctx.fill();

    // 4 candy spiral rays
    ctx.strokeStyle = palette.badgeBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = palette.badgeText;
    ctx.font = 'bold 9px "Press Start 2P", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(colNum), badgeX, badgeY + 0.5);
  }
  ctx.restore();
}

// ==========================================
// 4. THEME: TANGLED KELP COLUMNS
// ==========================================
function drawTangledKelpColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  topH: number,
  botY: number,
  botH: number,
  capHeight: number,
  tSec: number,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  if (topH > 0) {
    drawTangledKelpPillarBody(ctx, x, 0, w, topH - capHeight, true, tSec, palette);
    drawTangledKelpCap(ctx, x - 4, topH - capHeight, w + 8, capHeight, true, tSec, undefined, palette);
  }
  if (botH > 0) {
    drawTangledKelpCap(ctx, x - 4, botY, w + 8, capHeight, false, tSec, colNum, palette);
    drawTangledKelpPillarBody(ctx, x, botY + capHeight, w, botH - capHeight, false, tSec, palette);
  }
}

/**
 * Calculates the exact horizontal position of a specific waving kelp strand at vertical position py.
 * Used for both drawing continuous stipes and anchoring attached pods in perfect mathematical synchrony.
 */
function getTangledStrandX(py: number, strandIndex: number, cx: number, w: number, tSec: number): number {
  switch (strandIndex) {
    case 0: // Deep background shadow strand
      return cx + Math.sin(py * 0.032 + tSec * 1.05 + 0.3) * (w * 0.30) + Math.cos(py * 0.065 + tSec * 0.5) * (w * 0.08);
    case 1: // Left undulating strand
      return cx + Math.sin(py * 0.036 + tSec * 1.35 + 1.8) * (w * 0.34);
    case 2: // Right undulating strand
      return cx + Math.sin(py * 0.036 - tSec * 1.20 + 4.1) * (w * 0.34);
    case 3: // Foreground central strand
    default:
      return cx + Math.sin(py * 0.042 + tSec * 1.45 + 0.9) * (w * 0.26);
  }
}

function drawTangledKelpPillarBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isTop: boolean,
  tSec: number,
  palette: ColumnThemePalette
) {
  if (h <= 0) return;
  ctx.save();

  const cx = x + w * 0.5;

  // NOTE: Background is left completely CLEAR so the ocean water, caustics, bubbles,
  // and distant marine silhouettes show through between and behind the waving kelp strands!

  // --- STEP 1: Draw continuous waving kelp strands ---
  const drawContinuousStrand = (strandIndex: number, color: string, width: number, step: number = 8) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let py = y; py <= y + h; py += step) {
      const sx = getTangledStrandX(py, strandIndex, cx, w, tSec);
      if (py === y) ctx.moveTo(sx, py);
      else ctx.lineTo(sx, py);
    }
    // ensure line reaches exact boundary
    const finalSx = getTangledStrandX(y + h, strandIndex, cx, w, tSec);
    ctx.lineTo(finalSx, y + h);
    ctx.stroke();
  };

  // 1. Deep shadow strand in background
  drawContinuousStrand(0, palette.bodyGradient[0], 7.5);

  // 2. Interwoven cross-tendrils connecting strands organically (tangled vines)
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.6;
  const crossStep = 44;
  for (let cy = y + 20; cy < y + h - 20; cy += crossStep) {
    const x0 = getTangledStrandX(cy, 1, cx, w, tSec);
    const x1 = getTangledStrandX(cy + 18, 2, cx, w, tSec);
    const midX = cx + Math.sin(tSec * 2.0 + cy * 0.1) * 8;
    const midY = cy + 9;
    ctx.beginPath();
    ctx.moveTo(x0, cy);
    ctx.quadraticCurveTo(midX, midY, x1, cy + 18);
    ctx.stroke();
  }

  // 3. Left-weaving main strand
  drawContinuousStrand(1, palette.bodyGradient[1], 6.5);

  // 4. Right-weaving main strand
  drawContinuousStrand(2, palette.bodyGradient[2], 6.5);

  // 5. Central twisting foreground strand
  drawContinuousStrand(3, palette.bodyGradient[1], 5.2);

  // 6. Specular wet kelp highlight line on foreground strand
  ctx.save();
  ctx.globalAlpha = 0.65;
  drawContinuousStrand(3, palette.capRim, 1.8);
  ctx.restore();

  // --- STEP 2: Draw kelp pods attached directly to the waving strands ---
  // Each pod (pneumatocyst) grows directly out of an anchor point on one of the waving strands,
  // featuring a connecting petiole (stalk), bulbous air bladder, glowing core, specular highlight,
  // and an undulating leaf frond extending off the pod.
  const podSpacing = 32;
  let podIndex = 0;

  for (let py = y + 16; py < y + h - 16; py += podSpacing) {
    podIndex++;
    // Alternate attachment between Left (1), Right (2), and Center (3) waving strands
    const strandIdx = ((podIndex % 3) === 0 ? 3 : (podIndex % 3 === 1 ? 1 : 2));
    const dir = (strandIdx === 1 ? -1 : (strandIdx === 2 ? 1 : (podIndex % 2 === 0 ? 1 : -1)));

    // Calculate exact waving coordinate of the strand at this vertical position
    const anchorX = getTangledStrandX(py, strandIdx, cx, w, tSec);
    const anchorY = py;

    // Organic stalk growing from the strand to the pod
    const stalkLen = 9 + (podIndex % 3) * 2.5;
    const buoyantTilt = isTop ? 0.3 : -0.3; // Kelp gas bladders buoy upward toward the ocean surface
    const currentSway = Math.sin(tSec * 2.2 + py * 0.1) * 0.12;
    const stalkAngle = dir * (0.40 + currentSway) + buoyantTilt;
    const podX = anchorX + dir * stalkLen * Math.cos(stalkAngle);
    const podY = anchorY + stalkLen * Math.sin(stalkAngle);

    // 1. Stalk / petiole connection: seamlessly attaches the strand to the pod
    ctx.strokeStyle = palette.borderColor;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.quadraticCurveTo((anchorX + podX) / 2, anchorY, podX, podY);
    ctx.stroke();

    ctx.strokeStyle = palette.bodyGradient[1];
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.quadraticCurveTo((anchorX + podX) / 2, anchorY, podX, podY);
    ctx.stroke();

    // Swollen junction collar at the stipe joint
    ctx.fillStyle = palette.borderColor;
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.bodyGradient[2];
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // 2. The Pod (Pneumatocyst gas bladder): bulbous, buoyant, glowing
    ctx.save();
    ctx.translate(podX, podY);
    ctx.rotate(stalkAngle + dir * 0.2);

    const radX = 5.2;
    const radY = 7.8;

    // Pod outer shadow / border
    ctx.fillStyle = palette.borderColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, radX + 1.2, radY + 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pod body gradient: lush kelp green to translucent bladder
    const podGrad = ctx.createLinearGradient(-radX, -radY, radX, radY);
    podGrad.addColorStop(0, palette.accentPrimary);
    podGrad.addColorStop(0.4, palette.bodyGradient[1]);
    podGrad.addColorStop(1, palette.bodyGradient[0]);
    ctx.fillStyle = podGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Internal buoyant gas glow (pneumatocyst core)
    ctx.fillStyle = palette.accentSecondary;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(dir * 0.8, -1.2, radX * 0.55, radY * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Wet glistening specular highlight (light reflecting through clear water)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-dir * 1.5, -radY * 0.35, 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(-dir * 0.6, -radY * 0.55, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 3. Undulating kelp frond (leaf blade) growing outward from the tip of the pod
    const frondTipY = isTop ? (radY + 14) : (-radY - 14);
    const frondSway = Math.sin(tSec * 2.8 + py * 0.12) * 5.5;
    const frondTipX = dir * 15 + frondSway;

    ctx.beginPath();
    ctx.moveTo(0, isTop ? radY - 1 : -radY + 1);
    ctx.quadraticCurveTo(dir * 8, isTop ? radY + 6 : -radY - 6, frondTipX, frondTipY);
    ctx.quadraticCurveTo(dir * 3, isTop ? radY + 10 : -radY - 10, 0, isTop ? radY - 1 : -radY + 1);
    ctx.closePath();

    ctx.fillStyle = palette.bodyGradient[2];
    ctx.fill();
    ctx.strokeStyle = palette.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

function drawTangledKelpCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isTop: boolean,
  tSec: number,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  ctx.save();

  // Braided root & vine holdfast collar defining the gap rim
  // Border backing
  ctx.fillStyle = palette.borderColor;
  ctx.beginPath();
  ctx.roundRect(x - 1, y - 1, w + 2, h + 2, 7);
  ctx.fill();

  // Rich fibrous organic rim gradient
  const capGrad = ctx.createLinearGradient(x, y, x, y + h);
  capGrad.addColorStop(0, palette.capGradient[0]);
  capGrad.addColorStop(0.3, palette.capGradient[1]);
  capGrad.addColorStop(0.7, palette.capGradient[2]);
  capGrad.addColorStop(1, palette.capGradient[3]);
  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();

  // Braided root wraps across the cap collar
  ctx.strokeStyle = palette.capRim;
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 4; i++) {
    const rx = x + 6 + i * ((w - 12) / 3);
    ctx.beginPath();
    ctx.moveTo(rx - 5, y + 2);
    ctx.lineTo(rx + 5, y + h - 2);
    ctx.stroke();
  }

  // Dangling wild root tips and tendrils waving into the clear ocean gap
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 2.0;
  const tipY = isTop ? y + h : y;
  for (let tx = x + 5; tx < x + w - 5; tx += 10) {
    const sway = Math.sin(tSec * 2.4 + tx * 0.15) * 3.5;
    ctx.beginPath();
    ctx.moveTo(tx, tipY);
    ctx.quadraticCurveTo(tx + sway * 0.5, tipY + (isTop ? 4 : -4), tx + sway, tipY + (isTop ? 7 : -7));
    ctx.stroke();
  }

  // Marine Pearl Badge with column number (rendered on bottom pipe cap)
  if (colNum !== undefined && !isTop) {
    drawMarinePearlBadge(ctx, x + w / 2, y + h / 2 + 1, colNum, palette);
  }
  ctx.restore();
}

// ==========================================
// 5. THEME: MATRIX-STYLE COLUMNS
// ==========================================
function drawMatrixColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  topH: number,
  botY: number,
  botH: number,
  capHeight: number,
  tSec: number,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  if (topH > 0) {
    drawMatrixPillarBody(ctx, x, 0, w, topH - capHeight, tSec, palette);
    drawMatrixCap(ctx, x - 4, topH - capHeight, w + 8, capHeight, true, undefined, palette);
  }
  if (botH > 0) {
    drawMatrixCap(ctx, x - 4, botY, w + 8, capHeight, false, colNum, palette);
    drawMatrixPillarBody(ctx, x, botY + capHeight, w, botH - capHeight, tSec, palette);
  }
}

function drawMatrixPillarBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tSec: number,
  palette: ColumnThemePalette
) {
  if (h <= 0) return;
  ctx.save();

  // Dark obsidian terminal background
  ctx.fillStyle = palette.bodyGradient[3];
  ctx.fillRect(x, y, w, h);

  // Digital circuit border lines
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // Horizontal scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  for (let sy = y; sy < y + h; sy += 5) {
    ctx.fillRect(x, sy, w, 1);
  }

  // Digital Circuit Traces on sides
  ctx.strokeStyle = palette.accentGlow;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 3, y);
  ctx.lineTo(x + 3, y + h);
  ctx.moveTo(x + w - 3, y);
  ctx.lineTo(x + w - 3, y + h);
  ctx.stroke();

  // 3 Vertical Data Streams of Falling Matrix Glyphs
  const tracks = [x + 10, x + w / 2, x + w - 10];
  const glyphs = ['1', '0', '>', ':', '#', 'X', '7', 'Z', '<', '+'];

  for (let t = 0; t < tracks.length; t++) {
    const tx = tracks[t];
    const speed = 40 + t * 18;
    const streamH = h + 60;
    const streamY = ((tSec * speed + t * 65) % streamH) - 30;

    // Stream characters (6 trailing glyphs)
    for (let g = 0; g < 6; g++) {
      const gy = y + streamY - g * 12;
      if (gy < y || gy > y + h - 10) continue;

      const gIdx = Math.floor(tSec * 4 + g + t * 3) % glyphs.length;
      const char = glyphs[gIdx];

      if (g === 0) {
        // Bright leading head character
        ctx.fillStyle = palette.accentSecondary;
        ctx.shadowBlur = 8;
        ctx.shadowColor = palette.accentGlow;
      } else {
        // Fading phosphorescent trail
        const alpha = Math.max(0.15, 1 - g * 0.18);
        ctx.fillStyle = palette.accentPrimary;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 0;
      }

      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(char, tx, gy);
      ctx.globalAlpha = 1.0;
    }
  }
  ctx.restore();
}

function drawMatrixCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isTop: boolean,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  ctx.save();
  // Cyber HUD bracket cap
  ctx.fillStyle = palette.bodyGradient[3];
  ctx.fillRect(x, y, w, h);

  // Digital border
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // Glowing energy conduit line along the gap boundary
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 6;
  ctx.shadowColor = palette.accentGlow;
  const edgeY = isTop ? y + h - 2 : y + 2;
  ctx.beginPath();
  ctx.moveTo(x + 6, edgeY);
  ctx.lineTo(x + w - 6, edgeY);
  ctx.stroke();

  // Corner HUD brackets
  ctx.strokeStyle = palette.capRim;
  ctx.lineWidth = 1.8;
  ctx.shadowBlur = 0;
  // Left bracket
  ctx.strokeRect(x + 3, y + 3, 5, h - 6);
  // Right bracket
  ctx.strokeRect(x + w - 8, y + 3, 5, h - 6);

  // Hexagonal Cyber Terminal Badge
  if (colNum !== undefined && !isTop) {
    const badgeX = x + w / 2;
    const badgeY = y + h / 2 + 1;
    const r = 9;

    ctx.fillStyle = palette.badgeBg;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = badgeX + r * Math.cos(angle);
      const hy = badgeY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = palette.badgeBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = palette.badgeText;
    ctx.font = 'bold 9px "Press Start 2P", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(colNum), badgeX, badgeY + 0.5);
  }
  ctx.restore();
}

// ==========================================
// 6. THEME: LAVA COLUMNS
// ==========================================
function drawLavaColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  topH: number,
  botY: number,
  botH: number,
  capHeight: number,
  tSec: number,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  if (topH > 0) {
    drawLavaPillarBody(ctx, x, 0, w, topH - capHeight, tSec, palette);
    drawLavaCap(ctx, x - 4, topH - capHeight, w + 8, capHeight, true, tSec, undefined, palette);
  }
  if (botH > 0) {
    drawLavaCap(ctx, x - 4, botY, w + 8, capHeight, false, tSec, colNum, palette);
    drawLavaPillarBody(ctx, x, botY + capHeight, w, botH - capHeight, tSec, palette);
  }
}

function drawLavaPillarBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tSec: number,
  palette: ColumnThemePalette
) {
  if (h <= 0) return;
  ctx.save();

  // Solid dark volcanic basalt rock fill
  const rockGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  rockGrad.addColorStop(0, palette.bodyGradient[0]);
  rockGrad.addColorStop(0.3, palette.bodyGradient[1]);
  rockGrad.addColorStop(0.7, palette.bodyGradient[2]);
  rockGrad.addColorStop(1, palette.bodyGradient[3]);
  ctx.fillStyle = rockGrad;
  ctx.fillRect(x, y, w, h);

  // Jagged basalt rock plates & border
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // Molten Fissures: Glowing lava veins wandering down the basalt
  const drawFissure = (phase: number, width: number, isMain: boolean) => {
    ctx.beginPath();
    for (let fy = y; fy <= y + h; fy += 14) {
      const fx = x + w * 0.5 + Math.sin(fy * 0.05 + phase) * (w * 0.3) + Math.cos(fy * 0.12) * 4;
      if (fy === y) ctx.moveTo(fx, fy);
      else ctx.lineTo(fx, fy);
    }

    // Outer molten thermal glow
    ctx.save();
    ctx.strokeStyle = palette.accentPrimary;
    ctx.lineWidth = width + (isMain ? 3 : 1.5);
    ctx.shadowBlur = 10;
    ctx.shadowColor = palette.accentGlow;
    ctx.stroke();

    // Incandescent molten lava core
    ctx.strokeStyle = palette.accentSecondary;
    ctx.lineWidth = width;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
  };

  // Main central fissure
  drawFissure(1.2, 2.5, true);
  // Secondary branching fissure
  drawFissure(3.8, 1.5, false);

  // Rising micro-heat sparks
  for (let s = 0; s < 3; s++) {
    const sy = y + h - ((tSec * 35 + s * 30) % h);
    const sx = x + w * 0.5 + Math.sin(tSec * 3 + s) * 14;
    ctx.fillStyle = palette.accentSecondary;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLavaCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isTop: boolean,
  tSec: number,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  ctx.save();
  // Solidified jagged basalt shelf
  ctx.fillStyle = palette.borderColor;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

  ctx.fillStyle = palette.capGradient[1];
  ctx.fillRect(x, y, w, h);

  // Molten lava brim along the gap boundary
  ctx.save();
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 3.5;
  ctx.shadowBlur = 8;
  ctx.shadowColor = palette.accentGlow;
  const brimY = isTop ? y + h - 2 : y + 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, brimY);
  ctx.lineTo(x + w - 4, brimY);
  ctx.stroke();
  ctx.restore();

  // Bubbling molten lava blisters
  const blisters = [
    { ox: 10, oy: isTop ? h - 5 : 5, r: 3.2 },
    { ox: w / 2 - 8, oy: isTop ? h - 6 : 6, r: 2.5 },
    { ox: w / 2 + 8, oy: isTop ? h - 5 : 5, r: 3.5 },
    { ox: w - 10, oy: isTop ? h - 6 : 6, r: 2.8 },
  ];
  for (const b of blisters) {
    const pulse = 0.8 + Math.sin(tSec * 4 + b.ox) * 0.25;
    ctx.fillStyle = palette.accentPrimary;
    ctx.beginPath();
    ctx.arc(x + b.ox, y + b.oy, b.r * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.accentSecondary;
    ctx.beginPath();
    ctx.arc(x + b.ox - 1, y + b.oy - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fiery Volcanic Rune Seal Badge
  if (colNum !== undefined && !isTop) {
    const badgeX = x + w / 2;
    const badgeY = y + h / 2 + 1;
    const r = 9.5;

    ctx.fillStyle = palette.badgeBg;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.badgeBorder;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 5;
    ctx.shadowColor = palette.accentGlow;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = palette.badgeText;
    ctx.font = 'bold 9px "Press Start 2P", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(colNum), badgeX, badgeY + 0.5);
  }
  ctx.restore();
}

// ==========================================
// 7. THEME: SUNKEN ATLANTIS COLUMNS
// ==========================================
function drawSunkenAtlantisColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  topH: number,
  botY: number,
  botH: number,
  capHeight: number,
  tSec: number,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  if (topH > 0) {
    drawSunkenAtlantisPillarBody(ctx, x, 0, w, topH - capHeight, tSec, palette);
    drawSunkenAtlantisCap(ctx, x - 4, topH - capHeight, w + 8, capHeight, true, tSec, undefined, palette);
  }
  if (botH > 0) {
    drawSunkenAtlantisCap(ctx, x - 4, botY, w + 8, capHeight, false, tSec, colNum, palette);
    drawSunkenAtlantisPillarBody(ctx, x, botY + capHeight, w, botH - capHeight, tSec, palette);
  }
}

function drawSunkenAtlantisPillarBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tSec: number,
  palette: ColumnThemePalette
) {
  if (h <= 0) return;
  ctx.save();

  // 1. Classical marble column foundation
  const baseGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  baseGrad.addColorStop(0, palette.bodyGradient[0]);
  baseGrad.addColorStop(0.25, palette.bodyGradient[1]);
  baseGrad.addColorStop(0.7, palette.bodyGradient[2]);
  baseGrad.addColorStop(1, palette.bodyGradient[3]);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(x, y, w, h);

  // Outer carved stone border
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // 2. Classical Fluting: 5 vertical carved flutes across the shaft
  const fluteCount = 5;
  const fluteWidth = (w - 8) / fluteCount;
  for (let f = 0; f < fluteCount; f++) {
    const fx = x + 4 + f * fluteWidth;

    // Concave shadow line
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(fx + 0.5, y, 1.5, h);

    // Flute specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(fx + fluteWidth - 1.5, y, 1.2, h);
  }

  // 3. Atlantean Gilded Frieze Bands (horizontal gold-embossed trim bands)
  const bandStep = 64;
  for (let by = y + 24; by < y + h - 16; by += bandStep) {
    // Gold band
    ctx.fillStyle = palette.accentPrimary;
    ctx.fillRect(x + 2, by, w - 4, 3);

    // Glowing Atlantean geometric rune dot in center
    ctx.fillStyle = palette.accentSecondary;
    ctx.beginPath();
    ctx.arc(x + w / 2, by + 1.5, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Subtle submerged sea moss / patina clusters along edges
  ctx.fillStyle = palette.accentSecondary;
  ctx.globalAlpha = 0.3;
  for (let my = y + 18; my < y + h; my += 48) {
    ctx.fillRect(x + 1, my, 3, 6);
    ctx.fillRect(x + w - 4, my + 24, 3, 6);
  }
  ctx.globalAlpha = 1.0;

  ctx.restore();
}

function drawSunkenAtlantisCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isTop: boolean,
  tSec: number,
  colNum: number | undefined,
  palette: ColumnThemePalette
) {
  ctx.save();

  // 1. Classical Stepped Abacus & Echinus
  ctx.fillStyle = palette.borderColor;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

  const capGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  capGrad.addColorStop(0, palette.capGradient[0]);
  capGrad.addColorStop(0.3, palette.capGradient[1]);
  capGrad.addColorStop(0.7, palette.capGradient[2]);
  capGrad.addColorStop(1, palette.capGradient[3]);
  ctx.fillStyle = capGrad;
  ctx.fillRect(x, y, w, h);

  // Gilded abacus trim
  ctx.fillStyle = palette.capRim;
  const abacusY = isTop ? y + h - 4 : y + 2;
  ctx.fillRect(x + 2, abacusY, w - 4, 2.5);

  // 2. Carved Ionic Volute Scrolls on left & right corners
  const voluteY = isTop ? y + h - 10 : y + 10;
  const drawVolute = (vx: number) => {
    ctx.strokeStyle = palette.capRim;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(vx, voluteY, 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = palette.accentPrimary;
    ctx.beginPath();
    ctx.arc(vx, voluteY, 1.8, 0, Math.PI * 2);
    ctx.fill();
  };
  drawVolute(x + 6);
  drawVolute(x + w - 6);

  // 3. Central Glowing Atlantean Crystal / Cabochon
  const gemX = x + w / 2;
  const gemY = y + h / 2;
  const pulse = 0.85 + Math.sin(tSec * 3 + x) * 0.15;

  ctx.save();
  ctx.fillStyle = palette.accentSecondary;
  ctx.shadowBlur = 8;
  ctx.shadowColor = palette.accentGlow;
  ctx.beginPath();
  // Diamond / rhombus Atlantean crystal
  ctx.moveTo(gemX, gemY - 4 * pulse);
  ctx.lineTo(gemX + 4 * pulse, gemY);
  ctx.lineTo(gemX, gemY + 4 * pulse);
  ctx.lineTo(gemX - 4 * pulse, gemY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Atlantean Solar Seal Badge for Column Numbers
  if (colNum !== undefined && !isTop) {
    const badgeX = x + w / 2;
    const badgeY = y + h / 2 + 1;
    const r = 9.5;

    // Gilded medallion backplate
    ctx.fillStyle = palette.badgeBg;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, r, 0, Math.PI * 2);
    ctx.fill();

    // Ornate gold border with glow
    ctx.save();
    ctx.strokeStyle = palette.badgeBorder;
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 5;
    ctx.shadowColor = palette.accentGlow;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4 cardinal gold notches (sun rays)
    ctx.fillStyle = palette.accentPrimary;
    ctx.fillRect(badgeX - 1, badgeY - r - 2, 2, 2.5);
    ctx.fillRect(badgeX - 1, badgeY + r - 0.5, 2, 2.5);
    ctx.fillRect(badgeX - r - 2, badgeY - 1, 2.5, 2);
    ctx.fillRect(badgeX + r - 0.5, badgeY - 1, 2.5, 2);

    // Number text
    ctx.fillStyle = palette.badgeText;
    ctx.font = 'bold 9px "Press Start 2P", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(colNum), badgeX, badgeY + 0.5);
  }

  ctx.restore();
}

/**
 * Standard Marine Pearl Badge for Column Numbers
 */
function drawMarinePearlBadge(
  ctx: CanvasRenderingContext2D,
  badgeX: number,
  badgeY: number,
  columnNumber: number,
  palette: ColumnThemePalette
) {
  // Glowing badge background
  ctx.fillStyle = palette.badgeBg;
  ctx.strokeStyle = palette.badgeBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Text: Column Number
  ctx.fillStyle = palette.badgeText;
  ctx.font = 'bold 9px "Press Start 2P", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(columnNumber), badgeX, badgeY + 0.5);
}

/**
 * Renders the sandy Seabed with multi-depth 3D parallax scrolling:
 * - Far sand ridge & holdfast line (1.05x speed)
 * - Midground undulating sand dune waves & swaying seagrass (1.20x speed)
 * - Foreground ocean floor shelf (1.38x speed - slightly faster for tactile 3D depth)
 * - Detailed starfish (coral pink & sun amber) with soft 3D drop shadows and texture
 * - Pearlescent scallop shells & spiral conch shells with cast shadows
 * - Smooth sea pebbles and ambient water caustic shimmer
 */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  groundHeight: number,
  scrollOffset: number,
  time: number = 0,
  reefLevel: number = 1
) {
  const aesthetic = getAestheticForReef(reefLevel);
  const y = height - groundHeight;
  const tSec = time / 1000;

  // 1. Far Sand Ridge / Upper Lip (Speed: 1.05x)
  const farLipSpeed = 1.05;
  const farPeriod = 60;
  const farOffset = ((scrollOffset * farLipSpeed) % farPeriod + farPeriod) % farPeriod;

  // Shimmering seafoam / coral sediment edge
  ctx.fillStyle = aesthetic.seabed.sandGradient[1];
  ctx.fillRect(0, y, width, 4);

  // Far undulating sand edge highlight
  ctx.fillStyle = aesthetic.seabed.sandGradient[0];
  ctx.beginPath();
  ctx.moveTo(0, y + 2);
  for (let fx = -farOffset; fx <= width + farPeriod; fx += 20) {
    const cy = y + 2 + Math.sin((fx + farOffset) * 0.08) * 1.5;
    ctx.lineTo(fx, cy);
  }
  ctx.lineTo(width, y + 5);
  ctx.lineTo(0, y + 5);
  ctx.closePath();
  ctx.fill();

  // 2. Deep Sandy Reef Bed Multi-Stop Gradient (Rich 3D slope matching current aesthetic)
  const sandGrad = ctx.createLinearGradient(0, y + 4, 0, height);
  sandGrad.addColorStop(0, aesthetic.seabed.sandGradient[0]);   // upper sunlit sand shelf
  sandGrad.addColorStop(0.35, aesthetic.seabed.sandGradient[1]); // mid sand dune
  sandGrad.addColorStop(1, aesthetic.seabed.sandGradient[2]);   // abyssal trench sand
  ctx.fillStyle = sandGrad;
  ctx.fillRect(0, y + 4, width, groundHeight - 4);

  // 3. Midground 3D Sand Wave Ripples & Dunes (Speed: 1.20x)
  ctx.save();
  const midSpeed = 1.2;
  const rippleStep = 44;
  const rOffset = ((scrollOffset * midSpeed) % rippleStep + rippleStep) % rippleStep;

  // Upper illuminated ripple crests
  ctx.strokeStyle = aesthetic.seabed.rippleCrest;
  ctx.lineWidth = 2;
  for (let rx = -rOffset; rx < width + rippleStep; rx += rippleStep) {
    ctx.beginPath();
    ctx.moveTo(rx, y + 16);
    ctx.quadraticCurveTo(rx + 22, y + 21, rx + 44, y + 16);
    ctx.stroke();

    // Secondary ripple tier
    ctx.beginPath();
    ctx.moveTo(rx + 22, y + 34);
    ctx.quadraticCurveTo(rx + 44, y + 39, rx + 66, y + 34);
    ctx.stroke();
  }

  // Soft shaded ripple troughs directly under crests for 3D sand dune depth
  ctx.strokeStyle = aesthetic.seabed.rippleTrough;
  ctx.lineWidth = 1.5;
  for (let rx = -rOffset; rx < width + rippleStep; rx += rippleStep) {
    ctx.beginPath();
    ctx.moveTo(rx + 1, y + 18);
    ctx.quadraticCurveTo(rx + 22, y + 23, rx + 43, y + 18);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Swaying Seagrass Tufts along the seabed shelf (Speed: 1.15x)
  ctx.save();
  const grassSpeed = 1.15;
  const grassStep = 32;
  const gOffset = ((scrollOffset * grassSpeed) % grassStep + grassStep) % grassStep;
  ctx.lineCap = 'round';

  for (let gx = -gOffset; gx < width + grassStep; gx += grassStep) {
    const grassSway = Math.sin(tSec * 3 + gx * 0.15) * 7;

    // Deep back blade
    ctx.strokeStyle = aesthetic.seabed.grassColors[0];
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(gx - 3, y + 4);
    ctx.quadraticCurveTo(gx - 3 + grassSway * 0.4, y - 8, gx - 3 + grassSway * 0.8, y - 18);
    ctx.stroke();

    // Vibrant main blade
    ctx.strokeStyle = aesthetic.seabed.grassColors[1];
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(gx, y + 4);
    ctx.quadraticCurveTo(gx + grassSway * 0.5, y - 9, gx + grassSway, y - 20);
    ctx.stroke();

    // Bright front tender blade
    ctx.strokeStyle = aesthetic.seabed.grassColors[2];
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(gx + 4, y + 4);
    ctx.quadraticCurveTo(gx + 4 + grassSway * 0.7, y - 7, gx + 5 + grassSway * 1.3, y - 14);
    ctx.stroke();
  }
  ctx.restore();

  // 5. FOREGROUND 3D SHELF: Starfish, Seashells, and Pebbles (Speed: 1.38x - Slightly Faster for 3D Depth!)
  ctx.save();
  const fgSpeed = 1.38;
  const decorPeriod = 230; // Clean repeating period for diverse spread
  const dOffset = ((scrollOffset * fgSpeed) % decorPeriod + decorPeriod) % decorPeriod;

  for (let bx = -dOffset; bx < width + decorPeriod; bx += decorPeriod) {
    // 5a. Coral-Pink Crown Starfish with 3D drop shadow and white tubercle beads
    drawStarfish(
      ctx,
      bx + 36,
      y + 44,
      8.5,
      -0.12,
      '#fb7185',
      '#e11d48',
      '#ffe4e6'
    );

    // 5b. Pearlescent Scallop Shell with radiating ivory flutes and drop shadow
    drawScallopShell(
      ctx,
      bx + 94,
      y + 68,
      8.0,
      0.08
    );

    // 5c. Smooth Sea Pebble with specular highlight and drop shadow
    drawSeaPebble(
      ctx,
      bx + 140,
      y + 78,
      5.5,
      3.8,
      -0.2,
      '#0f766e',
      '#5eead4'
    );

    // 5d. Sun-Amber Reef Starfish (distinct angle & warm golden color)
    drawStarfish(
      ctx,
      bx + 182,
      y + 52,
      7.5,
      0.35,
      '#f59e0b',
      '#b45309',
      '#fef08a'
    );

    // 5e. Spiral Nautilus / Conch Shell with interior depth aperture
    drawSpiralShell(
      ctx,
      bx + 218,
      y + 70,
      7.5,
      -0.25
    );

    // 5f. Small Luminous Sea Glass Pebble
    drawSeaPebble(
      ctx,
      bx + 72,
      y + 82,
      4.2,
      2.8,
      0.4,
      '#14b8a6',
      '#99f6e4'
    );
  }
  ctx.restore();

  // 6. Ambient Caustic Water Light Shimmer across seabed
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = aesthetic.seabed.causticColor;
  const cSpeed = 0.9;
  const cPeriod = 120;
  const cOffset = ((scrollOffset * cSpeed) % cPeriod + cPeriod) % cPeriod;
  for (let cx = -cOffset; cx < width + cPeriod; cx += cPeriod) {
    ctx.beginPath();
    ctx.ellipse(cx + 40, y + 42, 38, 14, -0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Detailed 5-pointed Starfish with:
 * - Soft 3D cast drop shadow on the sand
 * - Naturally curved, tapered rays
 * - Central raised disk with highlight
 * - Dotted tubercle rows along arms
 */
function drawStarfish(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  bodyColor: string,
  outlineColor: string,
  beadColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // 1. Soft 3D Drop Shadow onto the sand
  ctx.fillStyle = 'rgba(2, 26, 21, 0.45)';
  ctx.beginPath();
  ctx.ellipse(2, 4, r * 1.05, r * 0.65, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // 2. Starfish Body (5 points with curved valleys)
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.3;
  ctx.lineJoin = 'round';
  ctx.beginPath();

  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const isTip = i % 2 === 0;
    const rad = isTip ? r : r * 0.42;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Central Raised Star Disk
  ctx.fillStyle = beadColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = outlineColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // 4. Delicate decorative tubercles along each ray
  ctx.fillStyle = beadColor;
  for (let i = 0; i < points; i++) {
    const a = (i * 2 * Math.PI) / points - Math.PI / 2;
    const dirX = Math.cos(a);
    const dirY = Math.sin(a);

    // Mid tubercle
    ctx.beginPath();
    ctx.arc(dirX * r * 0.52, dirY * r * 0.52, 1.1, 0, Math.PI * 2);
    ctx.fill();

    // Tip tubercle
    ctx.beginPath();
    ctx.arc(dirX * r * 0.78, dirY * r * 0.78, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Pearlescent Fan Scallop Shell with:
 * - Soft cast 3D shadow on sand
 * - Radiating ivory/gold flutes
 * - Shimmering crest rim
 */
function drawScallopShell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // 1. Soft 3D Drop Shadow
  ctx.fillStyle = 'rgba(2, 26, 21, 0.45)';
  ctx.beginPath();
  ctx.ellipse(2, 3.5, r * 0.95, r * 0.6, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // 2. Shell Base Outline
  const shellGrad = ctx.createLinearGradient(0, r * 0.5, 0, -r);
  shellGrad.addColorStop(0, '#d97706');    // golden amber hinge
  shellGrad.addColorStop(0.3, '#fde047');  // warm gold
  shellGrad.addColorStop(0.7, '#fef9c3');  // pearlescent cream
  shellGrad.addColorStop(1, '#ffffff');    // bright specular crest
  ctx.fillStyle = shellGrad;
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.1;

  ctx.beginPath();
  // Fan contour
  ctx.moveTo(-r * 0.3, r * 0.4); // hinge left
  ctx.lineTo(r * 0.3, r * 0.4);  // hinge right
  ctx.quadraticCurveTo(r * 0.9, r * 0.1, r * 0.95, -r * 0.3);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.9, 0, -r);
  ctx.quadraticCurveTo(-r * 0.6, -r * 0.9, -r * 0.95, -r * 0.3);
  ctx.quadraticCurveTo(-r * 0.9, r * 0.1, -r * 0.3, r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Radiating Flute Ribs
  ctx.strokeStyle = 'rgba(180, 83, 9, 0.4)';
  ctx.lineWidth = 0.9;
  const ribAngles = [-0.55, -0.28, 0, 0.28, 0.55];
  for (const ra of ribAngles) {
    ctx.beginPath();
    ctx.moveTo(0, r * 0.3);
    const targetX = Math.sin(ra) * r * 0.92;
    const targetY = -Math.cos(ra) * r * 0.92;
    ctx.quadraticCurveTo(targetX * 0.5, targetY * 0.5, targetX, targetY);
    ctx.stroke();
  }

  // 4. Specular Pearl Highlight at rim
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, -r * 0.2, r * 0.75, -Math.PI * 0.75, -Math.PI * 0.25);
  ctx.stroke();

  ctx.restore();
}

/**
 * Coiled Spiral Conch Shell with:
 * - 3D cast drop shadow
 * - Elegant golden-amber spiral coils
 * - Dark aperture opening creating interior depth
 */
function drawSpiralShell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // 1. Soft 3D Drop Shadow
  ctx.fillStyle = 'rgba(2, 26, 21, 0.45)';
  ctx.beginPath();
  ctx.ellipse(2, 3.5, r * 1.1, r * 0.55, 0.05, 0, Math.PI * 2);
  ctx.fill();

  // 2. Spiral Shell Body
  const coneGrad = ctx.createLinearGradient(-r, 0, r, 0);
  coneGrad.addColorStop(0, '#78350f');   // dark tip
  coneGrad.addColorStop(0.35, '#d97706'); // amber body
  coneGrad.addColorStop(0.7, '#fde68a');  // cream band
  coneGrad.addColorStop(1, '#ffffff');   // bright outer rim
  ctx.fillStyle = coneGrad;
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.1;

  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.1); // tapered cone tip
  ctx.quadraticCurveTo(-r * 0.3, -r * 0.7, r * 0.6, -r * 0.5);
  ctx.quadraticCurveTo(r * 1.05, -r * 0.1, r * 0.8, r * 0.45);
  ctx.quadraticCurveTo(r * 0.3, r * 0.55, -r * 0.3, r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Concentric Spiral Whorl Lines
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.45)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.4);
  ctx.quadraticCurveTo(-r * 0.4, 0, -r * 0.15, r * 0.32);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.58);
  ctx.quadraticCurveTo(r * 0.1, 0, r * 0.32, r * 0.48);
  ctx.stroke();

  // 4. Deep Aperture Opening (gives hollow interior depth)
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.ellipse(r * 0.58, r * 0.08, r * 0.28, r * 0.35, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Highlight along aperture lip
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(r * 0.65, -r * 0.1, r * 0.26, -Math.PI * 0.6, Math.PI * 0.2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Smooth River Sea Pebble with 3D shadow & specular glint
 */
function drawSeaPebble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: number,
  baseColor: string,
  highlightColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Cast shadow
  ctx.fillStyle = 'rgba(2, 26, 21, 0.45)';
  ctx.beginPath();
  ctx.ellipse(1.5, 2.5, rx * 1.05, ry * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pebble body
  ctx.fillStyle = baseColor;
  ctx.strokeStyle = '#042f2e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Top specular gleam
  ctx.fillStyle = highlightColor;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(-rx * 0.28, -ry * 0.3, rx * 0.45, ry * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.restore();
}

/**
 * Renders the chosen Aquatic Character:
 * - Octopus (Best 0-4)
 * - Puffer Fish (Best 5-9)
 * - Clown Fish (Best 10-14)
 * - Sting Ray (Best 15-19)
 * - Seahorse (Best 20-24)
 */
export function drawBird(
  ctx: CanvasRenderingContext2D,
  bird: BirdState,
  skin: BirdSkinConfig,
  time: number = 0,
  fishType: FishType = 'octopus',
  abilityState?: FishAbilityState
) {
  // If Sting Ray is dashing, render the satisfying water "whoosh" directly behind the stingray first
  // so the stingray's sleek body and wings sit cleanly on top of the wake
  if (fishType === 'singray' && abilityState?.isDashing) {
    drawHydroDashWhoosh(ctx, bird, time, abilityState);
  }

  // 1. Draw Fish Sprite
  switch (fishType) {
    case 'pufferfish':
      drawPufferFish(ctx, bird, skin, time);
      break;
    case 'clownfish':
      drawClownFish(ctx, bird, time);
      break;
    case 'singray':
      drawSingRay(ctx, bird, skin, time);
      break;
    case 'seahorse':
      drawSeahorse(ctx, bird, time);
      break;
    case 'octopus':
    default:
      drawOctopus(ctx, bird, skin, time);
      break;
  }

  // 2. Render Fish Power Overlays & Indicators
  if (abilityState) {
    if (fishType === 'pufferfish' && abilityState.shieldState === 'active') {
      drawBubbleShield(ctx, bird.x, bird.y, abilityState.shieldTimeRemaining, time);
    } else if (fishType === 'seahorse') {
      drawSeahorseDirectionCue(ctx, bird, abilityState.seahorseNextDirection, time);
    }
  }
}

/**
 * 3D Iridescent Protective Bubble Shield for Puffer Fish
 */
function drawBubbleShield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timeRemaining: number,
  time: number
) {
  ctx.save();
  const tSec = time / 1000;
  const isExpiringSoon = timeRemaining < 1.5;
  const pulse = Math.sin(tSec * (isExpiringSoon ? 14 : 6)) * 1.8;
  const radius = 24 + pulse;

  // Outer iridescent aura
  const auraGrad = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius + 10);
  if (isExpiringSoon) {
    auraGrad.addColorStop(0, 'rgba(251, 146, 60, 0.25)');
    auraGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.4)');
    auraGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
  } else {
    auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    auraGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.35)');
    auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  }
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
  ctx.fill();

  // Glassy Bubble Surface Ring
  ctx.lineWidth = isExpiringSoon ? 3.0 : 2.2;
  ctx.strokeStyle = isExpiringSoon ? '#f87171' : '#38bdf8';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Specular Reflection Curve on top-left
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(x, y, radius - 3, -Math.PI * 0.85, -Math.PI * 0.4);
  ctx.stroke();

  // Secondary lower shimmer
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, radius - 3, Math.PI * 0.2, Math.PI * 0.45);
  ctx.stroke();

  // Floating countdown timer tag above shield
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tagY = y - radius - 8;
  const tagText = `🛡️ ${Math.max(0, timeRemaining).toFixed(1)}s`;

  ctx.fillStyle = isExpiringSoon ? 'rgba(220, 38, 38, 0.9)' : 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(x - 24, tagY - 6, 48, 13, 6);
  ctx.fill();

  ctx.strokeStyle = isExpiringSoon ? '#fca5a5' : '#38bdf8';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(tagText, x, tagY);

  ctx.restore();
}

/**
 * Hydrodynamic Water "Whoosh" & Wake Surge trailing directly behind Sting Ray during Hydrodash.
 * Situates an authentic aquatic cavitation cone, curved shockwave pressure rings, 
 * streamlined water ribbons, and wake vortex froth directly behind the stingray's tail.
 */
function drawHydroDashWhoosh(
  ctx: CanvasRenderingContext2D,
  bird: BirdState,
  time: number,
  abilityState?: FishAbilityState
) {
  ctx.save();

  // Position directly at the stingray, softened with rotation so the whoosh trails backward into the water
  ctx.translate(bird.x, bird.y);
  const wakeAngle = bird.rotation * 0.55;
  ctx.rotate(wakeAngle);

  const tSec = time / 1000;
  const remaining = abilityState?.dashTimeRemaining ?? 0.15;
  const progress = Math.max(0, Math.min(1, 1 - remaining / 0.3));
  // Fade smoothly as the 0.3s dash finishes
  const dashAlpha = Math.sin(Math.min(1, remaining / 0.3) * Math.PI * 0.5);

  // 1. Water Propulsion Flash / Cavitation Core at the tail base (x = -20)
  const coreGrad = ctx.createRadialGradient(-20, 0, 2, -20, 0, 22);
  coreGrad.addColorStop(0, `rgba(224, 242, 254, ${0.8 * dashAlpha})`);
  coreGrad.addColorStop(0.35, `rgba(56, 189, 248, ${0.5 * dashAlpha})`);
  coreGrad.addColorStop(0.7, `rgba(2, 132, 199, ${0.2 * dashAlpha})`);
  coreGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.ellipse(-20, 0, 22, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Concentric Curved Water Pressure "Whoosh" Arcs (Cavitation shockwaves)
  // Crescent shockwave rings expanding backward away from behind the tail (x <= -28)
  const arcCount = 4;
  for (let k = 0; k < arcCount; k++) {
    const cycle = ((progress * 2.8 + k * (1 / arcCount)) % 1);
    const distBack = 28 + cycle * 58; // from -28 to -86 directly behind stingray
    const halfHeight = 7 + cycle * 19; // expanding wake fan-out
    const arcAlpha = Math.sin(cycle * Math.PI) * 0.8 * dashAlpha;

    if (arcAlpha > 0.04) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${arcAlpha})`;
      ctx.lineWidth = Math.max(1.0, (1 - cycle) * 3.0);
      ctx.beginPath();
      // Curved whoosh pressure shockwave: opening towards the stingray (convex to the rear)
      const curveIndent = 8 + cycle * 11;
      ctx.moveTo(-distBack, -halfHeight);
      ctx.quadraticCurveTo(-distBack - curveIndent, 0, -distBack, halfHeight);
      ctx.stroke();

      // Bright white-water shimmer at the apex of the whoosh ring
      ctx.strokeStyle = `rgba(255, 255, 255, ${arcAlpha * 1.15})`;
      ctx.lineWidth = Math.max(0.8, (1 - cycle) * 1.6);
      ctx.beginPath();
      ctx.moveTo(-distBack - curveIndent * 0.45, -halfHeight * 0.45);
      ctx.quadraticCurveTo(-distBack - curveIndent, 0, -distBack - curveIndent * 0.45, halfHeight * 0.45);
      ctx.stroke();
    }
  }

  // 3. Streamlined Fluid Water Ribbons (Undulating wake slipstreams)
  // Originating right behind the tail (-28) and trailing rear wingtips (-16, +/-10)
  const ribbons = [
    // Center tail wake jet
    { startX: -28, startY: 0, endX: -85, endY: 0, amp: 2.8, freq: 32, width: 3.4, phase: 0 },
    // Upper wing slipstream
    { startX: -16, startY: -10, endX: -72, endY: -17, amp: 3.2, freq: 28, width: 2.4, phase: 1.2 },
    // Lower wing slipstream
    { startX: -16, startY: 10, endX: -72, endY: 17, amp: 3.2, freq: 28, width: 2.4, phase: 2.4 },
    // Intermediate upper jet
    { startX: -24, startY: -5, endX: -68, endY: -8, amp: 2.0, freq: 36, width: 1.8, phase: 0.6 },
    // Intermediate lower jet
    { startX: -24, startY: 5, endX: -68, endY: 8, amp: 2.0, freq: 36, width: 1.8, phase: 1.8 },
  ];

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ribbons.forEach((r) => {
    const wave = Math.sin(tSec * r.freq + r.phase) * r.amp;
    const waveMid = Math.cos(tSec * (r.freq * 0.8) + r.phase) * (r.amp * 0.8);

    const grad = ctx.createLinearGradient(r.startX, r.startY, r.endX, r.endY);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * dashAlpha})`);
    grad.addColorStop(0.22, `rgba(186, 230, 253, ${0.8 * dashAlpha})`);
    grad.addColorStop(0.65, `rgba(56, 189, 248, ${0.45 * dashAlpha})`);
    grad.addColorStop(1, 'rgba(2, 132, 199, 0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = r.width;
    ctx.beginPath();
    ctx.moveTo(r.startX, r.startY);
    const midX = (r.startX + r.endX) * 0.5;
    const midY = (r.startY + r.endY) * 0.5 + wave;
    ctx.quadraticCurveTo(midX, midY, r.endX, r.endY + waveMid);
    ctx.stroke();
  });

  // 4. Dynamic Cavitation Micro-Bubbles in the Whoosh Slipstream
  const bubbleCount = 8;
  for (let b = 0; b < bubbleCount; b++) {
    const bCycle = ((tSec * 4.5 + b * 0.14) % 1);
    const bDist = 26 + bCycle * 56; // -26 to -82 directly behind stingray
    const maxConeH = 4 + bCycle * 15;
    const bY = Math.sin(b * 3.7 + tSec * 11) * maxConeH;
    const bAlpha = Math.sin(bCycle * Math.PI) * 0.85 * dashAlpha;
    const bRadius = 1.2 + bCycle * 2.4;

    if (bAlpha > 0.05) {
      ctx.fillStyle = `rgba(224, 242, 254, ${bAlpha * 0.65})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${bAlpha * 0.9})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(-bDist, bY, bRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Directional Arrow Indicator floating near Seahorse
 */
function drawSeahorseDirectionCue(
  ctx: CanvasRenderingContext2D,
  bird: BirdState,
  nextDirection: 'up' | 'down',
  time: number
) {
  if (!bird.alive) return;
  ctx.save();

  const tSec = time / 1000;
  const bob = Math.sin(tSec * 7) * 2;
  const cueX = bird.x + 24;
  const cueY = bird.y - 12 + bob;

  const isUp = nextDirection === 'up';
  ctx.fillStyle = isUp ? 'rgba(34, 197, 94, 0.9)' : 'rgba(249, 115, 22, 0.9)';
  ctx.beginPath();
  ctx.roundRect(cueX - 8, cueY - 7, 16, 14, 6);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw arrow glyph
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  if (isUp) {
    ctx.moveTo(cueX, cueY - 4);
    ctx.lineTo(cueX - 4, cueY + 3);
    ctx.lineTo(cueX + 4, cueY + 3);
  } else {
    ctx.moveTo(cueX, cueY + 4);
    ctx.lineTo(cueX - 4, cueY - 3);
    ctx.lineTo(cueX + 4, cueY - 3);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawOctopus(
  ctx: CanvasRenderingContext2D,
  bird: BirdState,
  skin: BirdSkinConfig,
  time: number = 0
) {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  const tSec = time / 1000;
  const isSwimmingUp = bird.velocity < -50;
  const isDiving = bird.velocity > 120;

  // 1. Bioluminescent Ambient Water Halo
  const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 38);
  halo.addColorStop(0, `${skin.bodyColor}66`); // 40% alpha
  halo.addColorStop(0.6, `${skin.wingColor}22`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, Math.PI * 2);
  ctx.fill();

  // Squash & Stretch: mantle slightly stretches when propelling
  const stretchX = isSwimmingUp ? 1.08 : (isDiving ? 0.94 : 1.0);
  const stretchY = isSwimmingUp ? 0.92 : (isDiving ? 1.06 : 1.0);

  ctx.scale(stretchX, stretchY);

  // 2. Trailing Tentacles (drawn behind mantle)
  drawOctopusTentacles(ctx, bird.wingFrame, skin, isSwimmingUp, isDiving, tSec);

  // 3. Siphon / Funnel on side
  drawOctopusSiphon(ctx, skin, isSwimmingUp);

  // 4. Mantle (Head)
  drawOctopusMantle(ctx, skin, bird.width, bird.height);

  // 5. Bioluminescent Mantle Spots / Freckles
  drawMantleSpots(ctx, skin);

  // 6. Cute Rosy Cheeks
  ctx.fillStyle = skin.accentColor;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(6, 4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // 7. Expressive Cute Eyes
  drawOctopusEyes(ctx, isSwimmingUp, bird.alive);

  ctx.restore();
}

/**
 * PUFFER FISH (Best 5-9):
 * Plump, spiky golden sphere with fluttering pectoral fins, puckered mouth, and cute spines.
 * Supports dynamic skin customization when Atlantis Gate rune is earned.
 */
function drawPufferFish(
  ctx: CanvasRenderingContext2D,
  bird: BirdState,
  skin: BirdSkinConfig,
  time: number
) {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  const tSec = time / 1000;
  const isSwimmingUp = bird.velocity < -50;
  const isDiving = bird.velocity > 120;
  const r = 13;

  // Ambient water halo
  const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, 34);
  halo.addColorStop(0, `${skin.bodyColor}73`);
  halo.addColorStop(0.6, `${skin.wingColor}26`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();

  const stretchX = isSwimmingUp ? 1.06 : (isDiving ? 0.94 : 1.0);
  const stretchY = isSwimmingUp ? 0.94 : (isDiving ? 1.06 : 1.0);
  ctx.scale(stretchX, stretchY);

  // Caudal tail fin (wagging behind)
  const tailAngle = Math.sin(tSec * 14) * 0.28;
  ctx.save();
  ctx.translate(-r + 1, 0);
  ctx.rotate(tailAngle);
  ctx.fillStyle = skin.wingColor;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-12, -7);
  ctx.quadraticCurveTo(-15, 0, -12, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Spines / Quills protruding symmetrically around perimeter
  const spineCount = 10;
  ctx.fillStyle = skin.spotColor || skin.wingColor;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1;
  for (let i = 0; i < spineCount; i++) {
    const angle = (i / spineCount) * Math.PI * 1.8 - Math.PI * 0.9;
    const sx = Math.cos(angle) * (r - 1);
    const sy = Math.sin(angle) * (r - 1);
    const tipX = Math.cos(angle) * (r + 4.5);
    const tipY = Math.sin(angle) * (r + 4.5);
    ctx.beginPath();
    ctx.moveTo(sx - Math.sin(angle) * 2, sy + Math.cos(angle) * 2);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(sx + Math.sin(angle) * 2, sy - Math.cos(angle) * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Round body outline
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.arc(0, 0, r + 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Puffer Body gradient
  const bodyGrad = ctx.createRadialGradient(-3, -4, 2, 0, 0, r);
  bodyGrad.addColorStop(0, skin.accentColor);
  bodyGrad.addColorStop(0.35, skin.bodyColor);
  bodyGrad.addColorStop(0.85, skin.wingColor);
  bodyGrad.addColorStop(1, skin.spotColor || skin.wingColor);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Creamy soft belly
  ctx.fillStyle = skin.bellyColor;
  ctx.beginPath();
  ctx.ellipse(1, 4, r * 0.75, r * 0.45, 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Spots / Freckles on forehead
  ctx.fillStyle = skin.spotColor || skin.wingColor;
  ctx.beginPath();
  ctx.arc(-2, -6, 1.4, 0, Math.PI * 2);
  ctx.arc(2, -8, 1.2, 0, Math.PI * 2);
  ctx.arc(-6, -3, 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Flapping pectoral fin
  const finFlap = bird.wingFrame === 0 ? -0.38 : bird.wingFrame === 1 ? 0.05 : 0.42;
  ctx.save();
  ctx.translate(-2, 2);
  ctx.rotate(finFlap);
  ctx.fillStyle = skin.accentColor;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-4, 0, 5.5, 3.5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Pouting fish lips
  ctx.fillStyle = skin.wingColor;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(r - 1, 2, 2.5, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.fill();
  ctx.stroke();

  // Rosy cheeks
  ctx.fillStyle = skin.wingColor;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(4, 3, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Eye
  drawSimpleFishEye(ctx, 4, -4, 5.5, bird.alive, isSwimmingUp);

  ctx.restore();
}

/**
 * CLOWN FISH (Best 10-14):
 * Vibrant orange body with 3 bold white bands trimmed in black, undulating fins.
 */
function drawClownFish(ctx: CanvasRenderingContext2D, bird: BirdState, time: number) {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  const tSec = time / 1000;
  const isSwimmingUp = bird.velocity < -50;
  const isDiving = bird.velocity > 120;

  // Ambient coral orange glow
  const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, 34);
  halo.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
  halo.addColorStop(0.6, 'rgba(234, 88, 12, 0.15)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();

  const stretchX = isSwimmingUp ? 1.05 : (isDiving ? 0.95 : 1.0);
  const stretchY = isSwimmingUp ? 0.95 : (isDiving ? 1.05 : 1.0);
  ctx.scale(stretchX, stretchY);

  // Wavy caudal tail fin
  const tailAngle = Math.sin(tSec * 13) * 0.25;
  ctx.save();
  ctx.translate(-13, 0);
  ctx.rotate(tailAngle);
  ctx.fillStyle = '#f97316';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-10, -9, -15, -8);
  ctx.quadraticCurveTo(-12, 0, -15, 8);
  ctx.quadraticCurveTo(-10, 9, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White tip on tail
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-13, 0, 3.2, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.fill();
  ctx.restore();

  // Curved dorsal fin on back
  ctx.fillStyle = '#ea580c';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-7, -8);
  ctx.quadraticCurveTo(-2, -15, 4, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Body Base
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orange Body Gradient
  const fishGrad = ctx.createLinearGradient(-14, 0, 14, 0);
  fishGrad.addColorStop(0, '#ea580c');
  fishGrad.addColorStop(0.3, '#f97316');
  fishGrad.addColorStop(0.7, '#fb923c');
  fishGrad.addColorStop(1, '#c2410c');
  ctx.fillStyle = fishGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3 Iconic White Bands with crisp black edges
  // Band 1: Head stripe (behind eye)
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(2, 0, 2.5, 8.5, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Band 2: Mid-body stripe (curved)
  ctx.beginPath();
  ctx.ellipse(-5, 0, 2.5, 8.2, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Band 3: Tail base stripe
  ctx.beginPath();
  ctx.ellipse(-11, 0, 2, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pectoral fin (flapping with swim cycle)
  const finAngle = bird.wingFrame === 0 ? -0.4 : bird.wingFrame === 1 ? 0.0 : 0.38;
  ctx.save();
  ctx.translate(0, 2);
  ctx.rotate(finAngle);
  ctx.fillStyle = '#f97316';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-3, 0, 5, 3.5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Mouth
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.arc(13, 1, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  drawSimpleFishEye(ctx, 8, -3, 5, bird.alive, isSwimmingUp);

  ctx.restore();
}

/**
 * STING RAY (Best 15-19):
 * Graceful diamond manta/stingray with flexible undulating wings and long tail.
 * Supports dynamic skin customization when Gulf Stream rune is earned.
 */
function drawSingRay(
  ctx: CanvasRenderingContext2D,
  bird: BirdState,
  skin: BirdSkinConfig,
  time: number
) {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  const tSec = time / 1000;
  const isSwimmingUp = bird.velocity < -50;

  // Bioluminescent halo
  const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, 36);
  halo.addColorStop(0, `${skin.bodyColor}73`);
  halo.addColorStop(0.6, `${skin.wingColor}26`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fill();

  // Long trailing tail with whip wave
  const tailWave = Math.sin(tSec * 10) * 3.5;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.quadraticCurveTo(-22, tailWave, -32, tailWave * 1.5);
  ctx.stroke();

  ctx.strokeStyle = skin.bodyColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.quadraticCurveTo(-22, tailWave, -32, tailWave * 1.5);
  ctx.stroke();

  // Wing flap animation
  const wingFlex = bird.wingFrame === 0 ? 5 : bird.wingFrame === 1 ? 0 : -5;

  // Manta Ray body shape
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.quadraticCurveTo(8, -12 - wingFlex, -4, -15 - wingFlex);
  ctx.quadraticCurveTo(-10, -6, -11, 0);
  ctx.quadraticCurveTo(-10, 6, -4, 15 + wingFlex);
  ctx.quadraticCurveTo(8, 12 + wingFlex, 14, 0);
  ctx.closePath();
  ctx.fill();

  // Body Gradient
  const rayGrad = ctx.createRadialGradient(2, 0, 3, 0, 0, 16);
  rayGrad.addColorStop(0, skin.accentColor);
  rayGrad.addColorStop(0.4, skin.bodyColor);
  rayGrad.addColorStop(0.85, skin.wingColor);
  rayGrad.addColorStop(1, skin.spotColor || skin.wingColor);
  ctx.fillStyle = rayGrad;
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.quadraticCurveTo(7, -11 - wingFlex, -4, -14 - wingFlex);
  ctx.quadraticCurveTo(-9, -5, -10, 0);
  ctx.quadraticCurveTo(-9, 5, -4, 14 + wingFlex);
  ctx.quadraticCurveTo(7, 11 + wingFlex, 13, 0);
  ctx.closePath();
  ctx.fill();

  // Bioluminescent spots on manta wings
  ctx.fillStyle = skin.bellyColor;
  ctx.globalAlpha = 0.85;
  const spots = [
    { x: -2, y: -7 },
    { x: 3, y: -5 },
    { x: -5, y: 0 },
    { x: 3, y: 5 },
    { x: -2, y: 7 },
  ];
  for (const s of spots) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Eye
  drawSimpleFishEye(ctx, 7, -3, 4.5, bird.alive, isSwimmingUp);

  ctx.restore();
}

/**
 * SEAHORSE (Best 20-24):
 * Elegant S-curve anatomy with coronet crown, tubular snout, fluttering dorsal propeller, and curled tail.
 */
function drawSeahorse(ctx: CanvasRenderingContext2D, bird: BirdState, time: number) {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  const tSec = time / 1000;
  const isSwimmingUp = bird.velocity < -50;

  // Ambient Lavender Halo
  const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, 34);
  halo.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
  halo.addColorStop(0.6, 'rgba(147, 51, 234, 0.15)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();

  // Rapidly fluttering dorsal fin on back
  const finFlutter = Math.sin(tSec * 28) * 0.35;
  ctx.save();
  ctx.translate(-7, 2);
  ctx.rotate(finFlutter);
  ctx.fillStyle = 'rgba(233, 213, 255, 0.85)';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-3, 0, 5, 2.8, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Prehensile Curled Tail at bottom-rear
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-3, 8);
  ctx.quadraticCurveTo(-9, 12, -10, 16);
  ctx.quadraticCurveTo(-11, 20, -7, 20);
  ctx.quadraticCurveTo(-4, 18, -6, 16);
  ctx.stroke();

  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, 8);
  ctx.quadraticCurveTo(-9, 12, -10, 16);
  ctx.quadraticCurveTo(-11, 20, -7, 20);
  ctx.quadraticCurveTo(-4, 18, -6, 16);
  ctx.stroke();

  // Seahorse Body
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.arc(5, -7, 7, 0, Math.PI * 2);
  ctx.ellipse(0, 3, 7.5, 9, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Amethyst Body Gradient
  const horseGrad = ctx.createLinearGradient(-6, -12, 10, 12);
  horseGrad.addColorStop(0, '#e9d5ff');
  horseGrad.addColorStop(0.3, '#c084fc');
  horseGrad.addColorStop(0.7, '#a855f7');
  horseGrad.addColorStop(1, '#7e22ce');
  ctx.fillStyle = horseGrad;

  // Head
  ctx.beginPath();
  ctx.arc(5, -7, 6, 0, Math.PI * 2);
  ctx.fill();

  // Chest
  ctx.beginPath();
  ctx.ellipse(0, 3, 6.5, 8, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = '#020617';
  ctx.fillRect(9, -7, 7, 3.5);
  ctx.fillStyle = '#c084fc';
  ctx.fillRect(9, -6.5, 6, 2.5);

  // Crown / Coronet spikes on top of head
  ctx.fillStyle = '#fde047';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1;
  const crownSpikes = [
    { x: 3, y: -13 },
    { x: 5, y: -15 },
    { x: 7, y: -13 },
  ];
  for (const cs of crownSpikes) {
    ctx.beginPath();
    ctx.moveTo(cs.x - 1.5, -11);
    ctx.lineTo(cs.x, cs.y);
    ctx.lineTo(cs.x + 1.5, -11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Segmented armor ridges on belly
  ctx.strokeStyle = '#f3e8ff';
  ctx.lineWidth = 1.2;
  for (let r = -2; r <= 6; r += 2.5) {
    ctx.beginPath();
    ctx.moveTo(-3, r);
    ctx.lineTo(4, r);
    ctx.stroke();
  }

  // Eye
  drawSimpleFishEye(ctx, 6, -8, 4.5, bird.alive, isSwimmingUp);

  ctx.restore();
}

/**
 * Common Expressive Fish Eye
 */
function drawSimpleFishEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alive: boolean,
  isSwimming: boolean
) {
  ctx.save();
  if (!alive) {
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 3);
    ctx.lineTo(x + 3, y + 3);
    ctx.moveTo(x + 3, y - 3);
    ctx.lineTo(x - 3, y + 3);
    ctx.stroke();
  } else {
    // Dark rim
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(x, y, r + 0.8, 0, Math.PI * 2);
    ctx.fill();

    // White sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Dark pupil looking forward
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(x + 1.2, y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Specular reflection sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 2, y - 1.2, 1.4, 0, Math.PI * 2);
    ctx.arc(x + 0.4, y + 1, 0.8, 0, Math.PI * 2);
    ctx.fill();

    if (isSwimming) {
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawOctopusMantle(
  ctx: CanvasRenderingContext2D,
  skin: BirdSkinConfig,
  bw: number,
  bh: number
) {
  const headR = 15;
  ctx.save();

  // Dark outline for crisp definition in water
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.ellipse(3, -2, headR + 2.5, headR + 1.5, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // Main Mantle Gradient
  const mantleGrad = ctx.createRadialGradient(0, -6, 3, 3, -2, headR + 2);
  mantleGrad.addColorStop(0, '#ffffff'); // specular top glint
  mantleGrad.addColorStop(0.3, skin.bodyColor);
  mantleGrad.addColorStop(0.85, skin.wingColor);
  mantleGrad.addColorStop(1, '#020617');
  ctx.fillStyle = mantleGrad;
  ctx.beginPath();
  ctx.ellipse(3, -2, headR, headR - 1, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // Soft pearly belly under-tint
  ctx.fillStyle = skin.bellyColor;
  ctx.beginPath();
  ctx.ellipse(4, 5, headR * 0.7, headR * 0.5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMantleSpots(ctx: CanvasRenderingContext2D, skin: BirdSkinConfig) {
  const spotColor = skin.spotColor || skin.accentColor;
  ctx.fillStyle = spotColor;
  ctx.globalAlpha = 0.7;

  // Cute bioluminescent rings on forehead
  const spots = [
    { x: -3, y: -9, r: 2.2 },
    { x: 3, y: -11, r: 2.6 },
    { x: 9, y: -8, r: 2.0 },
    { x: -7, y: -4, r: 1.8 },
  ];

  for (const s of spots) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

function drawOctopusSiphon(
  ctx: CanvasRenderingContext2D,
  skin: BirdSkinConfig,
  isSwimming: boolean
) {
  ctx.save();
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.ellipse(-10, 6, 4.5, 3.5, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.wingColor;
  ctx.beginPath();
  ctx.ellipse(-10, 6, 3.8, 2.8, 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Siphon opening
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.ellipse(-12, 6.5, 1.8, 2.2, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawOctopusEyes(
  ctx: CanvasRenderingContext2D,
  isSwimming: boolean,
  alive: boolean
) {
  const eyeX = 7;
  const eyeY = -4;
  const eyeR = 6.2;

  ctx.save();

  if (!alive) {
    // Cute dead dizzy "X" eyes
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(eyeX - 4, eyeY - 4);
    ctx.lineTo(eyeX + 4, eyeY + 4);
    ctx.moveTo(eyeX + 4, eyeY - 4);
    ctx.lineTo(eyeX - 4, eyeY + 4);
    ctx.stroke();
  } else {
    // Outer dark rim
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR + 1.2, 0, Math.PI * 2);
    ctx.fill();

    // White sclera
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Big cute dark pupil looking forward
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(eyeX + 1.5, eyeY, 3.4, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle reflections (large star glint + small bubble)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeX + 2.5, eyeY - 1.5, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(eyeX + 0.5, eyeY + 1.2, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Joyful eyelid squint if swimming upward
    if (isSwimming) {
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeR, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Draws 6 undulating tentacles with suction cups.
 * WingFrame 0: flared powerful propulsion stroke
 * WingFrame 1: streamlined trailing swim
 * WingFrame 2: curled water drag fall
 */
function drawOctopusTentacles(
  ctx: CanvasRenderingContext2D,
  frame: number,
  skin: BirdSkinConfig,
  isSwimmingUp: boolean,
  isDiving: boolean,
  tSec: number
) {
  ctx.save();

  // 6 tentacles with distinct offsets, wave curves, and suction cups
  const tentacleConfigs = [
    { baseOffsetY: -6, length: 24, spread: -0.55, phase: 0 },
    { baseOffsetY: -2, length: 28, spread: -0.35, phase: 1.2 },
    { baseOffsetY: 2, length: 30, spread: -0.1, phase: 2.1 },
    { baseOffsetY: 6, length: 28, spread: 0.18, phase: 3.0 },
    { baseOffsetY: 10, length: 25, spread: 0.45, phase: 4.2 },
    { baseOffsetY: 14, length: 20, spread: 0.7, phase: 5.1 },
  ];

  for (let i = 0; i < tentacleConfigs.length; i++) {
    const tc = tentacleConfigs[i];
    const startX = -6;
    const startY = tc.baseOffsetY;

    let endX: number;
    let endY: number;
    let ctrlX: number;
    let ctrlY: number;

    if (frame === 0 || isSwimmingUp) {
      // Propelling thrust stroke: tentacles flare wide, then kick backward
      const kickSway = Math.sin(tSec * 14 + tc.phase) * 4;
      ctrlX = startX - tc.length * 0.4;
      ctrlY = startY + tc.spread * 18 + kickSway;
      endX = startX - tc.length * 1.1;
      endY = startY + tc.spread * 6 + kickSway * 0.5;
    } else if (frame === 1) {
      // Streamlined glide
      const wave = Math.sin(tSec * 8 + tc.phase) * 5;
      ctrlX = startX - tc.length * 0.5;
      ctrlY = startY + wave;
      endX = startX - tc.length;
      endY = startY + tc.spread * 10 - wave * 0.5;
    } else {
      // Falling / curled upward by water resistance
      const curl = Math.sin(tSec * 6 + tc.phase) * 6;
      ctrlX = startX - tc.length * 0.35;
      ctrlY = startY - 8 + tc.spread * 12;
      endX = startX - tc.length * 0.75;
      endY = startY - 14 + curl;
    }

    // Draw tentacle outline
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();

    // Draw tentacle body
    ctx.strokeStyle = skin.wingColor;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();

    // Suction cups along the inner edge of each tentacle
    ctx.fillStyle = skin.accentColor;
    const cupT = 0.55;
    // Midpoint on quadratic curve
    const cupX = (1 - cupT) * (1 - cupT) * startX + 2 * (1 - cupT) * cupT * ctrlX + cupT * cupT * endX;
    const cupY = (1 - cupT) * (1 - cupT) * startY + 2 * (1 - cupT) * cupT * ctrlY + cupT * cupT * endY;
    ctx.beginPath();
    ctx.arc(cupX + 1, cupY + 1.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    const tipCupT = 0.85;
    const tipCupX = (1 - tipCupT) * (1 - tipCupT) * startX + 2 * (1 - tipCupT) * tipCupT * ctrlX + tipCupT * tipCupT * endX;
    const tipCupY = (1 - tipCupT) * (1 - tipCupT) * startY + 2 * (1 - tipCupT) * tipCupT * ctrlY + tipCupT * tipCupT * endY;
    ctx.beginPath();
    ctx.arc(tipCupX + 0.8, tipCupY + 1, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws buoyant underwater bubbles and coral impact particles
 */
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;

    if (p.isBubble) {
      // Buoyant water bubble with refraction
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(224, 242, 254, 0.2)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Specular highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.28, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Coral sparkle or glow particle
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function drawInGameScore(ctx: CanvasRenderingContext2D, score: number, width: number) {
  // HTML HUD handles prominent score cards, fallback silent
}
