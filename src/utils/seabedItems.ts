import { BackgroundAesthetic } from './backgroundAesthetics';
import { ColumnThemeType, getColumnThemePalette, ColumnThemePalette } from './columnThemes';

/**
 * Seabed Items Renderer:
 * Renders small, simple themed items scattered along the sea floor for each column theme.
 * Every column theme has 5-6 unique items exploring the theme deeper.
 * Colors dynamically adapt to match both the column theme and background water aesthetic.
 */

// Soft shadow color that blends with the sand
function getSandShadow(aesthetic: BackgroundAesthetic): string {
  const deepSand = aesthetic.seabed?.sandGradient?.[2] || '#021a15';
  if (deepSand.startsWith('#')) {
    const r = parseInt(deepSand.slice(1, 3), 16) || 2;
    const g = parseInt(deepSand.slice(3, 5), 16) || 26;
    const b = parseInt(deepSand.slice(5, 7), 16) || 21;
    return `rgba(${Math.min(30, r)}, ${Math.min(35, g)}, ${Math.min(35, b)}, 0.45)`;
  }
  return 'rgba(2, 26, 21, 0.45)';
}

/* ========================================================================== */
/* 1. ORIGINAL KELP / ATLANTIS RUINS SEABED ITEMS                            */
/* ========================================================================== */

function drawStarfish(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  bodyColor: string,
  outlineColor: string,
  beadColor: string,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Cast shadow
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 3.5, r * 1.05, r * 0.65, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // 5-pointed Starfish Body
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.2;
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

  // Central Raised Disk
  ctx.fillStyle = beadColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = outlineColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Dotted tubercles along arms
  ctx.fillStyle = beadColor;
  for (let i = 0; i < points; i++) {
    const a = (i * 2 * Math.PI) / points - Math.PI / 2;
    const dirX = Math.cos(a);
    const dirY = Math.sin(a);

    ctx.beginPath();
    ctx.arc(dirX * r * 0.52, dirY * r * 0.52, 1.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(dirX * r * 0.78, dirY * r * 0.78, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawScallopShell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  hingeColor: string,
  midColor: string,
  rimColor: string,
  outlineColor: string,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 3.2, r * 0.95, r * 0.6, 0.1, 0, Math.PI * 2);
  ctx.fill();

  const shellGrad = ctx.createLinearGradient(0, r * 0.5, 0, -r);
  shellGrad.addColorStop(0, hingeColor);
  shellGrad.addColorStop(0.35, midColor);
  shellGrad.addColorStop(0.75, rimColor);
  shellGrad.addColorStop(1, '#ffffff');
  ctx.fillStyle = shellGrad;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.1;

  ctx.beginPath();
  ctx.moveTo(-r * 0.3, r * 0.4);
  ctx.lineTo(r * 0.3, r * 0.4);
  ctx.quadraticCurveTo(r * 0.9, r * 0.1, r * 0.95, -r * 0.3);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.9, 0, -r);
  ctx.quadraticCurveTo(-r * 0.6, -r * 0.9, -r * 0.95, -r * 0.3);
  ctx.quadraticCurveTo(-r * 0.9, r * 0.1, -r * 0.3, r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Radiating flute ribs
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 0.8;
  const ribAngles = [-0.55, -0.28, 0, 0.28, 0.55];
  for (const ra of ribAngles) {
    ctx.beginPath();
    ctx.moveTo(0, r * 0.3);
    const targetX = Math.sin(ra) * r * 0.92;
    const targetY = -Math.cos(ra) * r * 0.92;
    ctx.quadraticCurveTo(targetX * 0.5, targetY * 0.5, targetX, targetY);
    ctx.stroke();
  }

  // Specular rim highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(0, -r * 0.2, r * 0.75, -Math.PI * 0.75, -Math.PI * 0.25);
  ctx.stroke();

  ctx.restore();
}

function drawSpiralShell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  tipColor: string,
  bodyColor: string,
  rimColor: string,
  apertureColor: string,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 3.2, r * 1.1, r * 0.55, 0.05, 0, Math.PI * 2);
  ctx.fill();

  const coneGrad = ctx.createLinearGradient(-r, 0, r, 0);
  coneGrad.addColorStop(0, tipColor);
  coneGrad.addColorStop(0.4, bodyColor);
  coneGrad.addColorStop(0.8, rimColor);
  coneGrad.addColorStop(1, '#ffffff');
  ctx.fillStyle = coneGrad;
  ctx.strokeStyle = tipColor;
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.1);
  ctx.quadraticCurveTo(-r * 0.3, -r * 0.7, r * 0.6, -r * 0.5);
  ctx.quadraticCurveTo(r * 1.05, -r * 0.1, r * 0.8, r * 0.45);
  ctx.quadraticCurveTo(r * 0.3, r * 0.55, -r * 0.3, r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Spiral Whorls
  ctx.strokeStyle = tipColor;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.4);
  ctx.quadraticCurveTo(-r * 0.4, 0, -r * 0.15, r * 0.32);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.58);
  ctx.quadraticCurveTo(r * 0.1, 0, r * 0.32, r * 0.48);
  ctx.stroke();

  // Aperture
  ctx.fillStyle = apertureColor;
  ctx.beginPath();
  ctx.ellipse(r * 0.58, r * 0.08, r * 0.28, r * 0.35, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSeaPebble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: number,
  baseColor: string,
  highlightColor: string,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.2, 2.2, rx * 1.05, ry * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Specular gleam
  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  ctx.ellipse(-rx * 0.28, -ry * 0.32, rx * 0.38, ry * 0.28, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ========================================================================== */
/* 2. BLOCK THEME SEABED ITEMS (Voxel / 8-Bit Pixelated Depths)               */
/* ========================================================================== */

// 2a. Small Voxel Cobblestone / Mossy Cube
function drawBlockCobblestone(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Cast shadow
  ctx.fillStyle = shadowColor;
  ctx.fillRect(-size * 0.7, size * 0.4, size * 1.4, size * 0.5);

  // Front face
  ctx.fillStyle = palette.bodyGradient[1];
  ctx.fillRect(-size * 0.5, -size * 0.3, size, size);

  // Top face highlight
  ctx.fillStyle = palette.capRim;
  ctx.fillRect(-size * 0.5, -size * 0.5, size, size * 0.25);

  // Bevel border
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.0;
  ctx.strokeRect(-size * 0.5, -size * 0.5, size, size * 1.2);

  // Moss / mineral pixel notch
  ctx.fillStyle = palette.accentPrimary;
  ctx.fillRect(-size * 0.3, -size * 0.1, size * 0.35, size * 0.35);

  ctx.restore();
}

// 2b. Block Clam / Turtle Egg with Pearl Pixel
function drawBlockClam(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.fillRect(-size * 0.6, size * 0.35, size * 1.2, size * 0.4);

  // Bottom shell half
  ctx.fillStyle = palette.capGradient[2];
  ctx.fillRect(-size * 0.5, 0, size, size * 0.45);

  // Top shell half (angled open)
  ctx.fillStyle = palette.capGradient[1];
  ctx.fillRect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.4);

  // Glowing pearl pixel
  ctx.fillStyle = palette.accentSecondary;
  ctx.fillRect(-size * 0.18, -size * 0.15, size * 0.36, size * 0.36);

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.0;
  ctx.strokeRect(-size * 0.5, -size * 0.45, size, size * 0.9);

  ctx.restore();
}

// 2c. Prismatic Voxel Gem Shard
function drawBlockGemShard(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.fillRect(-size * 0.4, size * 0.4, size * 0.8, size * 0.35);

  // Diamond-stepped pixel shard
  ctx.fillStyle = palette.accentPrimary;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.7);
  ctx.lineTo(size * 0.55, 0);
  ctx.lineTo(0, size * 0.6);
  ctx.lineTo(-size * 0.55, 0);
  ctx.closePath();
  ctx.fill();

  // Internal facet reflection
  ctx.fillStyle = palette.accentSecondary;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.6);
  ctx.lineTo(size * 0.35, 0);
  ctx.lineTo(0, size * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.restore();
}

// 2d. Pixel Sea Pickle Sprout
function drawBlockSeaPickle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.fillRect(-w * 0.8, h * 0.4, w * 1.6, h * 0.3);

  // Left sprout stalk
  ctx.fillStyle = palette.bodyGradient[1];
  ctx.fillRect(-w * 0.6, -h * 0.5, w * 0.5, h);

  // Right sprout stalk
  ctx.fillRect(0, -h * 0.7, w * 0.5, h * 1.2);

  // Bioluminescent pixel tips
  ctx.fillStyle = palette.accentPrimary;
  ctx.fillRect(-w * 0.6, -h * 0.6, w * 0.5, h * 0.25);
  ctx.fillStyle = palette.accentSecondary;
  ctx.fillRect(0, -h * 0.85, w * 0.5, h * 0.3);

  // Outlines
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 0.9;
  ctx.strokeRect(-w * 0.6, -h * 0.6, w * 0.5, h * 1.1);
  ctx.strokeRect(0, -h * 0.85, w * 0.5, h * 1.35);

  ctx.restore();
}

// 2e. Pixel Nautilus / Stepped Tile
function drawBlockNautilus(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.fillRect(-size * 0.6, size * 0.3, size * 1.2, size * 0.4);

  // Stepped spiral blocks
  ctx.fillStyle = palette.capGradient[1];
  ctx.fillRect(-size * 0.5, -size * 0.3, size, size * 0.7);

  ctx.fillStyle = palette.capRim;
  ctx.fillRect(-size * 0.5, -size * 0.5, size * 0.6, size * 0.3);

  ctx.fillStyle = palette.accentPrimary;
  ctx.fillRect(-size * 0.1, -size * 0.1, size * 0.35, size * 0.35);

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.0;
  ctx.strokeRect(-size * 0.5, -size * 0.5, size, size * 0.9);

  ctx.restore();
}

// 2f. Gold / Mineral Nugget Cubelet
function drawBlockNugget(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.fillRect(-size * 0.5, size * 0.35, size, size * 0.35);

  // Tiny metallic cubelet
  ctx.fillStyle = palette.accentSecondary;
  ctx.fillRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-size * 0.3, -size * 0.3, size * 0.3, size * 0.3);

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 0.9;
  ctx.strokeRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8);

  ctx.restore();
}

/* ========================================================================== */
/* 3. CANDY THEME SEABED ITEMS (Sweet Sugary Confectionery)                    */
/* ========================================================================== */

// 3a. Peppermint Swirl Candy Drop
function drawCandySwirlDrop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 3.2, r * 1.05, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Candy base
  ctx.fillStyle = palette.capRim;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Spiral pinwheel stripes
  ctx.fillStyle = palette.accentPrimary;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, a, a + Math.PI / 4);
    ctx.closePath();
    ctx.fill();
  }

  // Glossy sugar specular gleam
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.35, r * 0.2, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// 3b. Gummy Starfish with Sugar Crystal Sparkles
function drawGummyStarfish(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 3.0, r * 1.05, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Translucent gummy body
  ctx.fillStyle = palette.accentSecondary;
  ctx.beginPath();
  const pts = 5;
  for (let i = 0; i < pts * 2; i++) {
    const a = (i * Math.PI) / pts - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.52;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Sugar crystal sparkles
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < pts; i++) {
    const a = (i * 2 * Math.PI) / pts - Math.PI / 2;
    ctx.fillRect(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, 1.2, 1.2);
  }

  ctx.strokeStyle = palette.capRim;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.restore();
}

// 3c. Wrapped Taffy / Toffee Twist
function drawWrappedTaffy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  angle: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 3.0, w * 1.1, h * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cellophane crinkle ends
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.moveTo(-w * 0.9, -h * 0.6);
  ctx.lineTo(-w * 0.45, 0);
  ctx.lineTo(-w * 0.9, h * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w * 0.9, -h * 0.6);
  ctx.lineTo(w * 0.45, 0);
  ctx.lineTo(w * 0.9, h * 0.6);
  ctx.closePath();
  ctx.fill();

  // Candy center roll
  ctx.fillStyle = palette.capGradient[1];
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.5, h * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Center stripe
  ctx.strokeStyle = palette.capRim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.5);
  ctx.lineTo(0, h * 0.5);
  ctx.stroke();

  ctx.restore();
}

// 3d. Rock Candy Sugar Geode Pebble
function drawRockCandyGeode(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.2, 2.5, r * 1.1, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jagged sugar crystal facets
  ctx.fillStyle = palette.bodyGradient[1];
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, 0);
  ctx.lineTo(-r * 0.4, -r * 0.7);
  ctx.lineTo(r * 0.2, -r * 0.8);
  ctx.lineTo(r * 0.9, -r * 0.2);
  ctx.lineTo(r * 0.6, r * 0.6);
  ctx.lineTo(-r * 0.3, r * 0.7);
  ctx.closePath();
  ctx.fill();

  // Internal translucent sugar gleam
  ctx.fillStyle = palette.capRim;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.5);
  ctx.lineTo(r * 0.1, -r * 0.6);
  ctx.lineTo(r * 0.4, -r * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.restore();
}

// 3e. Glossy Pastille / Candy Button
function drawCandyButton(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.0, 2.0, r * 1.05, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Smooth dome
  ctx.fillStyle = palette.accentPrimary;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Specular ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, -Math.PI * 0.75, -Math.PI * 0.1);
  ctx.stroke();

  ctx.restore();
}

// 3f. Mini Curved Candy Cane / Jellybean
function drawCandyCaneCrook(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.8, r * 1.1, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Curved bean / crook
  ctx.fillStyle = palette.capRim;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.9, r * 0.5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Diagonal peppermint stripes
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -r * 0.4);
  ctx.lineTo(-r * 0.1, r * 0.4);
  ctx.moveTo(r * 0.1, -r * 0.4);
  ctx.lineTo(r * 0.4, r * 0.4);
  ctx.stroke();

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.9, r * 0.5, 0.2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/* ========================================================================== */
/* 4. TANGLED KELP SEABED ITEMS (Wild Roots, Urchins & Holdfasts)             */
/* ========================================================================== */

// 4a. Kelp Root Holdfast Gripping a River Pebble
function drawKelpHoldfast(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 3.0, r * 1.2, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Central round stone anchor
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.7, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gnarled root tentacles gripping the stone
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';

  const roots = [-0.6, -0.2, 0.2, 0.6];
  for (const rx of roots) {
    ctx.beginPath();
    ctx.moveTo(rx * r * 0.5, -r * 0.6);
    ctx.quadraticCurveTo(rx * r * 0.8, 0, rx * r * 1.2, r * 0.4);
    ctx.stroke();
  }

  ctx.restore();
}

// 4b. Kelp Gas Bladder Bulb (Pneumatocyst with leaf frond)
function drawKelpBladder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.5, r * 1.05, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Oval air float bulb
  ctx.fillStyle = palette.bodyGradient[1];
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Specular sheen
  ctx.fillStyle = palette.accentPrimary;
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.2, r * 0.35, r * 0.18, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Curling leaf frond
  ctx.strokeStyle = palette.accentSecondary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(r * 0.7, 0);
  ctx.quadraticCurveTo(r * 1.2, -r * 0.5, r * 1.5, -r * 0.2);
  ctx.stroke();

  ctx.restore();
}

// 4c. Spiny Sea Urchin (Deep kelp forest inhabitant)
function drawSeaUrchin(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.2, 2.5, r * 1.1, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Radiating spines
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 1.2;
  const spineCount = 12;
  for (let i = 0; i < spineCount; i++) {
    const a = (i * 2 * Math.PI) / spineCount;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 0.9);
    ctx.stroke();
  }

  // Central urchin dome
  ctx.fillStyle = palette.bodyGradient[0];
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Glowing center dot
  ctx.fillStyle = palette.accentSecondary;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 4d. Tangled Brittle Star (Sinuous curling arms)
function drawBrittleStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.8, r * 1.15, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Slender serpent-like arms
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 1.1;
  const arms = 5;
  for (let i = 0; i < arms; i++) {
    const a = (i * 2 * Math.PI) / arms;
    const dirX = Math.cos(a);
    const dirY = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(dirX * r * 0.25, dirY * r * 0.25);
    ctx.quadraticCurveTo(dirX * r * 0.7 + dirY * r * 0.3, dirY * r * 0.7 - dirX * r * 0.3, dirX * r * 1.2, dirY * r * 1.2);
    ctx.stroke();
  }

  // Small central disc
  ctx.fillStyle = palette.capRim;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 4e. Ribbed Turban Snail Shell
function drawTurbanSnailShell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.8, r * 1.1, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Conical spiral shell
  ctx.fillStyle = palette.bodyGradient[1];
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, r * 0.3);
  ctx.lineTo(0, -r * 0.8);
  ctx.lineTo(r * 0.8, r * 0.3);
  ctx.closePath();
  ctx.fill();

  // Spiral whorl grooves
  ctx.strokeStyle = palette.accentSecondary;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(0, -r * 0.1, r * 0.45, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
}

// 4f. Bioluminescent Kelp Spore Pod
function drawKelpSporePod(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.2, 2.2, r * 1.1, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cluster of 3 glowing spore pearls
  const offsets = [
    [-r * 0.35, r * 0.15],
    [r * 0.35, r * 0.15],
    [0, -r * 0.35],
  ];

  for (const [ox, oy] of offsets) {
    ctx.fillStyle = palette.accentPrimary;
    ctx.beginPath();
    ctx.arc(ox, oy, r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ox - r * 0.1, oy - r * 0.1, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/* ========================================================================== */
/* 5. CYBER GRID THEME SEABED ITEMS (Cyberpunk Digital Grid & Silicon Substrate) */
/* ========================================================================== */

// 5a. Silicon Microchip / IC Die (lying flat on the seabed)
function drawCyberGridMicrochip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Soft contact shadow on the sand
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.5, w * 0.75, h * 0.38, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Lay flat on sea bed plane: foreshorten Y and apply subtle parallelogram skew
  ctx.transform(1, 0, -0.35, 0.48, 0, 0);

  // Subtle 3D edge thickness of the chip lying on the sand
  ctx.fillStyle = '#02060d';
  ctx.fillRect(-w * 0.5, -h * 0.5 + 2, w, h);

  // Golden contact pins (resting flat on substrate)
  ctx.fillStyle = palette.accentSecondary;
  for (let i = -w * 0.4; i <= w * 0.4; i += w * 0.25) {
    ctx.fillRect(i - 1, -h * 0.68, 2.2, h * 0.22);
    ctx.fillRect(i - 1, h * 0.46, 2.2, h * 0.22);
  }

  // Black silicon package
  ctx.fillStyle = '#050b14';
  ctx.fillRect(-w * 0.5, -h * 0.5, w, h);

  // Glowing laser circuit dot
  ctx.fillStyle = palette.accentPrimary;
  ctx.beginPath();
  ctx.arc(-w * 0.25, -h * 0.2, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.0;
  ctx.strokeRect(-w * 0.5, -h * 0.5, w, h);

  ctx.restore();
}

// 5b. Hexagonal Data Node (lying flat on the seabed)
function drawCyberGridHexNode(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  time: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Soft contact shadow on the sand
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.5, r * 1.15, r * 0.5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Lay flat on sea bed with slight perspective skew
  ctx.transform(1, 0, 0.28, 0.48, 0, 0);

  // Hexagon base
  ctx.fillStyle = palette.badgeBg || '#02181c';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Pulsing center phosphor
  const pulse = 0.5 + Math.sin(time / 250) * 0.3;
  ctx.fillStyle = palette.accentPrimary;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.4 * (1 + pulse * 0.2), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.capRim;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.restore();
}

// 5c. Quantum Qubit Capacitor (lying flat on the seabed)
function drawCyberGridQubit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Soft contact shadow on the sand
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.5, w * 0.7, h * 0.4, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Lay flat on sea bed with parallelogram skew
  ctx.transform(1, 0, 0.32, 0.48, 0, 0);

  // Cylinder body lying flat
  ctx.fillStyle = palette.bodyGradient[1];
  ctx.fillRect(-w * 0.45, -h * 0.5, w * 0.9, h);

  // Polarity strip
  ctx.fillStyle = palette.accentSecondary;
  ctx.fillRect(-w * 0.45, -h * 0.5, w * 0.25, h);

  // Glowing core
  ctx.fillStyle = palette.accentPrimary;
  ctx.fillRect(w * 0.05, -h * 0.2, w * 0.2, h * 0.4);

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.0;
  ctx.strokeRect(-w * 0.45, -h * 0.5, w * 0.9, h);

  ctx.restore();
}

// 5d. Embedded Code Glyph Tile (lying flat on the seabed)
function drawCyberGridGlyphTile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Soft contact shadow on the sand
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.5, size * 0.75, size * 0.4, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Lay flat on seabed with parallelogram skew
  ctx.transform(1, 0, -0.32, 0.48, 0, 0);

  // Dark substrate wafer lying flat on sand
  ctx.fillStyle = '#021013';
  ctx.fillRect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9);

  // 3x3 digital code pixels
  ctx.fillStyle = palette.accentPrimary;
  const pSize = size * 0.18;
  ctx.fillRect(-size * 0.25, -size * 0.25, pSize, pSize);
  ctx.fillRect(size * 0.05, -size * 0.25, pSize, pSize);
  ctx.fillRect(-size * 0.1, 0.05, pSize, pSize);

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 1.0;
  ctx.strokeRect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9);

  ctx.restore();
}

// 5e. Coiled Fiber-Optic Cable (lying flat on the seabed)
function drawCyberGridFiberCable(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Soft contact shadow on the sand
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.5, r * 1.15, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lay flat on seabed with gentle perspective skew
  ctx.transform(1, 0, -0.25, 0.48, 0, 0);

  // Cable sheath loop flat on the sand
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.65, 0, Math.PI * 1.7);
  ctx.stroke();

  // Glowing optical core tip
  ctx.fillStyle = palette.accentPrimary;
  ctx.beginPath();
  ctx.arc(r * 0.65, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(r * 0.65, 0, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 5f. Polyhedral Data Bit Cube (lying flat on the seabed)
function drawCyberGridDataCube(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Soft contact shadow on the sand
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.5, size * 0.75, size * 0.4, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Lay flat on sea bed with parallelogram skew
  ctx.transform(1, 0, 0.35, 0.48, 0, 0);

  // Isometric translucent cube wafer lying flat
  ctx.fillStyle = palette.badgeBg || '#031a1e';
  ctx.fillRect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9);

  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 1.1;
  ctx.strokeRect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9);

  // Center data bit pip
  ctx.fillStyle = palette.accentSecondary;
  ctx.fillRect(-size * 0.15, -size * 0.15, size * 0.3, size * 0.3);

  ctx.restore();
}

/* ========================================================================== */
/* 6. LAVA THEME SEABED ITEMS (Hydrothermal Vents, Magma & Obsidian)           */
/* ========================================================================== */

// 6a. Mini Hydrothermal Vent Chimney (Black smoker pinnacle)
function drawLavaChimney(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, h * 0.45, w * 1.1, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Steep basalt pinnacle
  ctx.fillStyle = palette.bodyGradient[0];
  ctx.beginPath();
  ctx.moveTo(-w * 0.6, h * 0.4);
  ctx.lineTo(-w * 0.25, -h * 0.5);
  ctx.lineTo(w * 0.25, -h * 0.5);
  ctx.lineTo(w * 0.6, h * 0.4);
  ctx.closePath();
  ctx.fill();

  // Glowing molten vent crater rim
  ctx.fillStyle = palette.accentPrimary;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.5, w * 0.3, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.accentSecondary;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.restore();
}

// 6b. Porous Lava Pumice Pebble
function drawLavaPumice(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.2, 2.5, r * 1.05, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark porous basalt
  ctx.fillStyle = palette.bodyGradient[1];
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.9, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Vesicular pits
  ctx.fillStyle = palette.borderColor;
  ctx.fillRect(-r * 0.4, -r * 0.2, 1.8, 1.8);
  ctx.fillRect(r * 0.1, -r * 0.1, 1.5, 1.5);
  ctx.fillRect(-r * 0.1, r * 0.2, 1.4, 1.4);

  ctx.restore();
}

// 6c. Cracked Magma Geode / Ember Core
function drawLavaEmberCore(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.8, r * 1.1, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark stone shell
  ctx.fillStyle = palette.bodyGradient[0];
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Glowing hot magma fracture fissures
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, 0);
  ctx.lineTo(0, -r * 0.2);
  ctx.lineTo(r * 0.5, r * 0.2);
  ctx.stroke();

  // Incandescent fissure core
  ctx.fillStyle = palette.accentSecondary;
  ctx.beginPath();
  ctx.arc(0, -r * 0.1, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 6d. Glossy Obsidian Teardrop
function drawLavaObsidian(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.5, r * 1.1, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glossy black obsidian
  ctx.fillStyle = '#090a0f';
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, 0);
  ctx.quadraticCurveTo(0, -r * 0.8, r * 0.8, 0);
  ctx.quadraticCurveTo(0, r * 0.7, -r * 0.8, 0);
  ctx.closePath();
  ctx.fill();

  // Sharp specular rim
  ctx.strokeStyle = palette.capRim || 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(0, -r * 0.2, r * 0.5, -Math.PI * 0.7, -Math.PI * 0.2);
  ctx.stroke();

  ctx.restore();
}

// 6e. Hydrothermal Pyrite / Sulfide Mineral Cluster
function drawLavaPyrite(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.2, 2.2, r * 1.1, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Prismatic cubic sulfide facets
  ctx.fillStyle = palette.accentSecondary;
  ctx.fillRect(-r * 0.6, -r * 0.5, r * 0.7, r * 0.7);

  ctx.fillStyle = palette.capRim;
  ctx.fillRect(-r * 0.1, -r * 0.2, r * 0.6, r * 0.6);

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 0.9;
  ctx.strokeRect(-r * 0.6, -r * 0.5, r * 0.7, r * 0.7);
  ctx.strokeRect(-r * 0.1, -r * 0.2, r * 0.6, r * 0.6);

  ctx.restore();
}

// 6f. Cooling Lava Cinder Crust
function drawLavaCinderCrust(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.8, w * 1.1, h * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Crust body
  ctx.fillStyle = palette.bodyGradient[1];
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.85, h * 0.5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Glowing incandescent molten rim
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.85, h * 0.5, 0.1, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
}

/* ========================================================================== */
/* 7. SUNKEN ATLANTIS SEABED ITEMS (Classical Antiquities & Sacred Relics)    */
/* ========================================================================== */

// 7a. Ancient Atlantean Gold Coin / Drachma
function drawAtlantisCoin(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.8, r * 1.1, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stamped coin disc
  ctx.fillStyle = palette.accentPrimary;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Embossed trident symbol
  ctx.strokeStyle = palette.capRim;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.4);
  ctx.lineTo(0, -r * 0.4);
  ctx.moveTo(-r * 0.25, -r * 0.2);
  ctx.lineTo(-r * 0.25, -r * 0.4);
  ctx.moveTo(r * 0.25, -r * 0.2);
  ctx.lineTo(r * 0.25, -r * 0.4);
  ctx.stroke();

  // Outer stamped coin rim
  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// 7b. Broken Fluted Marble Column Drum / Capital
function drawAtlantisColumnPiece(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, h * 0.4, w * 1.1, h * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fluted marble cylinder
  ctx.fillStyle = palette.capRim;
  ctx.fillRect(-w * 0.5, -h * 0.4, w, h * 0.8);

  // Classical fluting grooves
  ctx.strokeStyle = palette.bodyGradient[1];
  ctx.lineWidth = 1.0;
  for (let fx = -w * 0.3; fx <= w * 0.3; fx += w * 0.25) {
    ctx.beginPath();
    ctx.moveTo(fx, -h * 0.4);
    ctx.lineTo(fx, h * 0.4);
    ctx.stroke();
  }

  // Toppled acanthus scroll / capital rim
  ctx.strokeStyle = palette.accentSecondary;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-w * 0.5, -h * 0.4, w, h * 0.8);

  ctx.restore();
}

// 7c. Submerged Terracotta Amphora
function drawAtlantisAmphora(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.8, r * 1.1, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Amphora body
  ctx.fillStyle = '#b45309'; // Terracotta clay
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.65, r * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck and mouth
  ctx.fillRect(-r * 0.3, -r * 1.2, r * 0.6, r * 0.35);

  // Twin handles
  ctx.strokeStyle = palette.capRim;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(-r * 0.55, -r * 0.5, r * 0.3, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 0.55, -r * 0.5, r * 0.3, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();

  ctx.restore();
}

// 7d. Orichalcum Trident / Spear Fragment
function drawAtlantisSpearhead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.5, r * 1.1, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Spear tip blade
  ctx.fillStyle = palette.accentPrimary;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.4, r * 0.4);
  ctx.lineTo(-r * 0.4, r * 0.4);
  ctx.closePath();
  ctx.fill();

  // Center ridge line
  ctx.strokeStyle = palette.capRim;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r * 0.7);
  ctx.stroke();

  ctx.restore();
}

// 7e. Broken Mosaic Tile Fragment (Greek meander motif)
function drawAtlantisMosaicTile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.fillRect(-size * 0.5, size * 0.35, size, size * 0.35);

  // Tile background
  ctx.fillStyle = palette.capRim;
  ctx.fillRect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9);

  // Greek key meander motif
  ctx.strokeStyle = palette.accentPrimary;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-size * 0.3, -size * 0.3);
  ctx.lineTo(size * 0.3, -size * 0.3);
  ctx.lineTo(size * 0.3, 0);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, -size * 0.15);
  ctx.stroke();

  ctx.strokeStyle = palette.borderColor;
  ctx.lineWidth = 0.9;
  ctx.strokeRect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9);

  ctx.restore();
}

// 7f. Carved Atlantean Talisman / Medallion with Glowing Inlay
function drawAtlantisMedallion(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: ColumnThemePalette,
  shadowColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(1.5, 2.8, r * 1.1, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer stone relief
  ctx.fillStyle = palette.bodyGradient[1];
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Inlaid glowing orichalcum / lapis gem
  ctx.fillStyle = palette.accentPrimary;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-r * 0.15, -r * 0.15, r * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.capRim;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/* ========================================================================== */
/* MASTER THEMED SEABED DISPATCHER                                            */
/* ========================================================================== */

/**
 * Draws the 5-6 sea floor items matched to the active column theme,
 * with their colors adapting harmoniously to the background water aesthetic.
 */
export function drawThemedSeabedDecorations(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  groundHeight: number,
  scrollOffset: number,
  theme: ColumnThemeType,
  aesthetic: BackgroundAesthetic,
  time: number
) {
  ctx.save();

  const fgSpeed = 1.38;
  const decorPeriod = 240; // Staggered period
  const dOffset = ((scrollOffset * fgSpeed) % decorPeriod + decorPeriod) % decorPeriod;
  const shadow = getSandShadow(aesthetic);
  const palette = getColumnThemePalette(theme, aesthetic);

  const waterId = aesthetic.id || '';
  const isVolcanic = waterId.includes('volcanic') || waterId.includes('magma') || waterId.includes('crimson');
  const isCrystal = waterId.includes('crystal') || waterId.includes('abyssal') || waterId.includes('twilight') || waterId.includes('neon');
  const isGold = waterId.includes('atlantis') || waterId.includes('golden') || waterId.includes('sunken');
  const isGlacial = waterId.includes('ice') || waterId.includes('glacial') || waterId.includes('frozen');

  for (let bx = -dOffset; bx < width + decorPeriod; bx += decorPeriod) {
    switch (theme) {
      /* ---------------------------------------------------------------------- */
      /* THEME 1: ORIGINAL KELP / ATLANTIS RUINS (Dynamic coral/amber/pebbles)  */
      /* ---------------------------------------------------------------------- */
      case 'original_kelp': {
        // Colors adapt to water aesthetic
        let star1Body = '#fb7185';
        let star1Outline = '#e11d48';
        let star1Bead = '#ffe4e6';

        let star2Body = '#f59e0b';
        let star2Outline = '#b45309';
        let star2Bead = '#fef08a';

        let shellHinge = '#d97706';
        let shellMid = '#fde047';
        let shellRim = '#fef9c3';

        let pebble1Base = '#0f766e';
        let pebble1Glint = '#5eead4';

        let pebble2Base = '#14b8a6';
        let pebble2Glint = '#99f6e4';

        if (isVolcanic) {
          star1Body = '#ef4444';
          star1Outline = '#b91c1c';
          star1Bead = '#fef08a';
          star2Body = '#f97316';
          star2Outline = '#c2410c';
          star2Bead = '#fdba74';
          shellHinge = '#7c2d12';
          shellMid = '#ea580c';
          shellRim = '#fed7aa';
          pebble1Base = '#451a03';
          pebble1Glint = '#f97316';
          pebble2Base = '#78350f';
          pebble2Glint = '#fde047';
        } else if (isCrystal) {
          star1Body = '#c084fc';
          star1Outline = '#7e22ce';
          star1Bead = '#f3e8ff';
          star2Body = '#38bdf8';
          star2Outline = '#0284c7';
          star2Bead = '#e0f2fe';
          shellHinge = '#581c87';
          shellMid = '#a855f7';
          shellRim = '#e9d5ff';
          pebble1Base = '#3b0764';
          pebble1Glint = '#c084fc';
          pebble2Base = '#0369a1';
          pebble2Glint = '#38bdf8';
        } else if (isGold) {
          star1Body = '#eab308';
          star1Outline = '#a16207';
          star1Bead = '#fef08a';
          star2Body = '#f59e0b';
          star2Outline = '#78350f';
          star2Bead = '#fef9c3';
          shellHinge = '#854d0e';
          shellMid = '#eab308';
          shellRim = '#fefce8';
          pebble1Base = '#713f12';
          pebble1Glint = '#fde047';
          pebble2Base = '#854d0e';
          pebble2Glint = '#fef08a';
        } else if (isGlacial) {
          star1Body = '#38bdf8';
          star1Outline = '#0284c7';
          star1Bead = '#e0f2fe';
          star2Body = '#7dd3fc';
          star2Outline = '#0369a1';
          star2Bead = '#ffffff';
          shellHinge = '#0e7490';
          shellMid = '#38bdf8';
          shellRim = '#f0f9ff';
          pebble1Base = '#0c4a6e';
          pebble1Glint = '#bae6fd';
          pebble2Base = '#075985';
          pebble2Glint = '#e0f2fe';
        }

        // 1. Starfish 1
        drawStarfish(ctx, bx + 36, y + 44, 8.5, -0.12, star1Body, star1Outline, star1Bead, shadow);
        // 2. Scallop Shell
        drawScallopShell(ctx, bx + 94, y + 68, 8.0, 0.08, shellHinge, shellMid, shellRim, '#78350f', shadow);
        // 3. Smooth Sea Pebble
        drawSeaPebble(ctx, bx + 140, y + 78, 5.5, 3.8, -0.2, pebble1Base, pebble1Glint, shadow);
        // 4. Starfish 2
        drawStarfish(ctx, bx + 182, y + 52, 7.5, 0.35, star2Body, star2Outline, star2Bead, shadow);
        // 5. Spiral Conch Shell
        drawSpiralShell(ctx, bx + 218, y + 70, 7.5, -0.25, shellHinge, shellMid, shellRim, '#451a03', shadow);
        // 6. Sea Glass Pebble
        drawSeaPebble(ctx, bx + 72, y + 82, 4.2, 2.8, 0.4, pebble2Base, pebble2Glint, shadow);
        break;
      }

      /* ---------------------------------------------------------------------- */
      /* THEME 2: BLOCK WORLD THEME (Voxel / 8-Bit Pixelated Seafloor Items)    */
      /* ---------------------------------------------------------------------- */
      case 'blockWorld': {
        // 1. Small Voxel Cobblestone
        drawBlockCobblestone(ctx, bx + 34, y + 46, 10, palette, shadow);
        // 2. Pixel Sea Clam with Pearl
        drawBlockClam(ctx, bx + 92, y + 68, 9, palette, shadow);
        // 3. Prismatic Gem Shard
        drawBlockGemShard(ctx, bx + 142, y + 76, 8, palette, shadow);
        // 4. Pixel Sea Pickle Sprout
        drawBlockSeaPickle(ctx, bx + 182, y + 50, 7, 10, palette, shadow);
        // 5. Stepped Nautilus Tile
        drawBlockNautilus(ctx, bx + 220, y + 70, 9, palette, shadow);
        // 6. Gold / Mineral Nugget Cubelet
        drawBlockNugget(ctx, bx + 70, y + 82, 6, palette, shadow);
        break;
      }

      /* ---------------------------------------------------------------------- */
      /* THEME 3: CANDY THEME (Peppermint Swirls, Gummy Stars & Taffy)          */
      /* ---------------------------------------------------------------------- */
      case 'candy': {
        // 1. Peppermint Swirl Hard Candy
        drawCandySwirlDrop(ctx, bx + 36, y + 45, 8.0, palette, shadow);
        // 2. Translucent Gummy Starfish
        drawGummyStarfish(ctx, bx + 94, y + 68, 8.0, 0.15, palette, shadow);
        // 3. Wrapped Taffy Twist
        drawWrappedTaffy(ctx, bx + 140, y + 76, 8.5, 5.0, -0.2, palette, shadow);
        // 4. Rock Candy Sugar Geode
        drawRockCandyGeode(ctx, bx + 184, y + 52, 7.5, palette, shadow);
        // 5. Glossy Candy Button
        drawCandyButton(ctx, bx + 218, y + 72, 6.0, palette, shadow);
        // 6. Mini Candy Cane Crook
        drawCandyCaneCrook(ctx, bx + 72, y + 80, 7.0, 0.4, palette, shadow);
        break;
      }

      /* ---------------------------------------------------------------------- */
      /* THEME 4: TANGLED KELP THEME (Holdfasts, Urchins & Brittle Stars)        */
      /* ---------------------------------------------------------------------- */
      case 'tangled_kelp': {
        // 1. Kelp Root Holdfast
        drawKelpHoldfast(ctx, bx + 36, y + 46, 8.5, palette, shadow);
        // 2. Kelp Float Bladder
        drawKelpBladder(ctx, bx + 94, y + 66, 7.5, 0.25, palette, shadow);
        // 3. Spiny Sea Urchin
        drawSeaUrchin(ctx, bx + 140, y + 78, 7.5, palette, shadow);
        // 4. Tangled Brittle Star
        drawBrittleStar(ctx, bx + 182, y + 52, 8.0, -0.15, palette, shadow);
        // 5. Ribbed Turban Snail Shell
        drawTurbanSnailShell(ctx, bx + 218, y + 70, 7.0, palette, shadow);
        // 6. Bioluminescent Kelp Spore Pod
        drawKelpSporePod(ctx, bx + 72, y + 82, 5.5, palette, shadow);
        break;
      }

      /* ---------------------------------------------------------------------- */
      /* THEME 5: CYBER GRID THEME (Microchips, Hex Nodes, Qubits & Fibers)     */
      /* ---------------------------------------------------------------------- */
      case 'cyberGrid': {
        // 1. Silicon Microchip Die (lying flat)
        drawCyberGridMicrochip(ctx, bx + 36, y + 46, 13, 10, palette, shadow);
        // 2. Hexagonal Data Node (lying flat)
        drawCyberGridHexNode(ctx, bx + 92, y + 68, 8.0, time, palette, shadow);
        // 3. Quantum Qubit Capacitor (lying flat)
        drawCyberGridQubit(ctx, bx + 140, y + 78, 11, 7, palette, shadow);
        // 4. Embedded Code Glyph Tile (lying flat)
        drawCyberGridGlyphTile(ctx, bx + 184, y + 52, 10, palette, shadow);
        // 5. Coiled Fiber-Optic Cable (lying flat)
        drawCyberGridFiberCable(ctx, bx + 220, y + 70, 8.0, palette, shadow);
        // 6. Polyhedral Data Bit Cube (lying flat)
        drawCyberGridDataCube(ctx, bx + 70, y + 82, 8.5, palette, shadow);
        break;
      }

      /* ---------------------------------------------------------------------- */
      /* THEME 6: LAVA THEME (Hydrothermal Smokers, Magma Geodes & Obsidian)    */
      /* ---------------------------------------------------------------------- */
      case 'lava': {
        // 1. Mini Hydrothermal Smoker Chimney
        drawLavaChimney(ctx, bx + 36, y + 44, 9, 12, palette, shadow);
        // 2. Porous Lava Pumice Pebble
        drawLavaPumice(ctx, bx + 94, y + 68, 7.0, palette, shadow);
        // 3. Cracked Magma Geode Ember
        drawLavaEmberCore(ctx, bx + 140, y + 76, 7.5, palette, shadow);
        // 4. Glossy Obsidian Glass Teardrop
        drawLavaObsidian(ctx, bx + 182, y + 52, 7.0, palette, shadow);
        // 5. Hydrothermal Pyrite Cluster
        drawLavaPyrite(ctx, bx + 218, y + 70, 7.5, palette, shadow);
        // 6. Cooling Lava Cinder Crust
        drawLavaCinderCrust(ctx, bx + 72, y + 80, 10, 6, palette, shadow);
        break;
      }

      /* ---------------------------------------------------------------------- */
      /* THEME 7: SUNKEN ATLANTIS THEME (Coins, Column Capitals & Amphorae)     */
      /* ---------------------------------------------------------------------- */
      case 'sunken_atlantis': {
        // 1. Ancient Atlantean Gold Coin
        drawAtlantisCoin(ctx, bx + 36, y + 45, 8.0, palette, shadow);
        // 2. Broken Fluted Marble Column Piece
        drawAtlantisColumnPiece(ctx, bx + 94, y + 66, 12, 8, palette, shadow);
        // 3. Submerged Terracotta Amphora
        drawAtlantisAmphora(ctx, bx + 140, y + 76, 7.5, 0.35, palette, shadow);
        // 4. Orichalcum Spearhead Fragment
        drawAtlantisSpearhead(ctx, bx + 182, y + 52, 8.0, -0.25, palette, shadow);
        // 5. Broken Mosaic Meander Tile
        drawAtlantisMosaicTile(ctx, bx + 218, y + 70, 8.5, palette, shadow);
        // 6. Carved Atlantean Medallion Talisman
        drawAtlantisMedallion(ctx, bx + 72, y + 80, 7.5, palette, shadow);
        break;
      }
    }
  }

  ctx.restore();
}
