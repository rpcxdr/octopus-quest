import { BackgroundAesthetic } from './backgroundAesthetics';

export type ColumnThemeType =
  | 'original_kelp'
  | 'block'
  | 'minecraft'
  | 'candy'
  | 'tangled_kelp'
  | 'matrix'
  | 'lava'
  | 'sunken_atlantis';

export const COLUMN_THEMES: ColumnThemeType[] = [
  'original_kelp',
  'block',
  'candy',
  'tangled_kelp',
  'matrix',
  'lava',
  'sunken_atlantis',
];

export interface ColumnThemePalette {
  theme: ColumnThemeType;
  name: string;
  borderColor: string;
  bodyGradient: [string, string, string, string];
  accentPrimary: string;
  accentSecondary: string;
  accentGlow: string;
  capGradient: [string, string, string, string];
  capRim: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

/**
 * Returns the column theme for a given reef level.
 * Changes every 2 reefs through the 7 requested themes:
 * 1-2: original kelp-pipe columns
 * 3-4: block columns
 * 5-6: candy columns
 * 7-8: tangled kelp columns
 * 9-10: matrix-style columns
 * 11-12: lava columns
 * 13-14: sunken Atlantis
 * (cycles back to original kelp at 15-16, etc.)
 */
export function getColumnThemeForReef(reefLevel: number): ColumnThemeType {
  const normalized = Math.max(1, Math.floor(reefLevel));
  const index = Math.floor((normalized - 1) / 2) % COLUMN_THEMES.length;
  return COLUMN_THEMES[index];
}

export function getColumnThemeName(reefLevel: number): string {
  const theme = getColumnThemeForReef(reefLevel);
  switch (theme) {
    case 'original_kelp':
      return 'Atlantis Ruins';
    case 'block':
    case 'minecraft':
      return 'Block Columns';
    case 'candy':
      return 'Candy Columns';
    case 'tangled_kelp':
      return 'Tangled Kelp';
    case 'matrix':
      return 'Matrix Columns';
    case 'lava':
      return 'Lava Columns';
    case 'sunken_atlantis':
      return 'Sunken Atlantis';
  }
}

/**
 * Computes a color palette for the column theme that harmonizes with the active water aesthetic.
 */
export function getColumnThemePalette(
  theme: ColumnThemeType,
  aesthetic: BackgroundAesthetic
): ColumnThemePalette {
  const waterId = aesthetic.id || '';
  const isVolcanic = waterId.includes('volcanic') || waterId.includes('magma') || waterId.includes('crimson');
  const isCrystal = waterId.includes('crystal') || waterId.includes('abyssal') || waterId.includes('twilight') || waterId.includes('neon');
  const isGold = waterId.includes('atlantis') || waterId.includes('golden') || waterId.includes('sunken');
  const isGlacial = waterId.includes('ice') || waterId.includes('glacial') || waterId.includes('frozen');

  switch (theme) {
    case 'original_kelp': {
      if (isVolcanic) {
        return {
          theme,
          name: 'Volcanic Atlantis Ruins',
          borderColor: 'rgba(239, 68, 68, 0.75)',
          bodyGradient: ['rgba(69, 26, 3, 0.52)', 'rgba(154, 52, 18, 0.58)', 'rgba(124, 45, 18, 0.42)', 'rgba(39, 14, 4, 0.62)'],
          accentPrimary: '#f97316',
          accentSecondary: '#fde047',
          accentGlow: 'rgba(249, 115, 22, 0.55)',
          capGradient: ['#451a03', '#ea580c', '#c2410c', '#1c0803'],
          capRim: '#fdba74',
          badgeBg: '#1c0803',
          badgeBorder: '#fb923c',
          badgeText: '#fff7ed',
        };
      }
      if (isCrystal) {
        return {
          theme,
          name: 'Abyssal Atlantis Ruins',
          borderColor: 'rgba(168, 85, 247, 0.75)',
          bodyGradient: ['rgba(46, 16, 101, 0.52)', 'rgba(88, 28, 135, 0.58)', 'rgba(59, 7, 100, 0.42)', 'rgba(18, 5, 36, 0.62)'],
          accentPrimary: '#c084fc',
          accentSecondary: '#38bdf8',
          accentGlow: 'rgba(192, 132, 252, 0.55)',
          capGradient: ['#2e1065', '#7e22ce', '#6b21a8', '#0f041d'],
          capRim: '#e9d5ff',
          badgeBg: '#120524',
          badgeBorder: '#a855f7',
          badgeText: '#f5f3ff',
        };
      }
      if (isGold) {
        return {
          theme,
          name: 'Golden Atlantis Ruins',
          borderColor: 'rgba(234, 179, 8, 0.75)',
          bodyGradient: ['rgba(69, 26, 3, 0.52)', 'rgba(161, 98, 7, 0.58)', 'rgba(133, 77, 14, 0.42)', 'rgba(28, 19, 3, 0.62)'],
          accentPrimary: '#eab308',
          accentSecondary: '#fef08a',
          accentGlow: 'rgba(234, 179, 8, 0.55)',
          capGradient: ['#451a03', '#ca8a04', '#a16207', '#170f02'],
          capRim: '#fef08a',
          badgeBg: '#1c1303',
          badgeBorder: '#eab308',
          badgeText: '#fefce8',
        };
      }
      if (isGlacial) {
        return {
          theme,
          name: 'Glacial Atlantis Ruins',
          borderColor: 'rgba(56, 189, 248, 0.75)',
          bodyGradient: ['rgba(14, 79, 99, 0.52)', 'rgba(8, 145, 178, 0.58)', 'rgba(14, 116, 144, 0.42)', 'rgba(4, 31, 48, 0.62)'],
          accentPrimary: '#38bdf8',
          accentSecondary: '#bae6fd',
          accentGlow: 'rgba(56, 189, 248, 0.55)',
          capGradient: ['#0e4f63', '#06b6d4', '#0891b2', '#031724'],
          capRim: '#bae6fd',
          badgeBg: '#031724',
          badgeBorder: '#38bdf8',
          badgeText: '#f0f9ff',
        };
      }
      // Standard Lush Coral Reef Mystic Atlantean Ruins (semi-transparent aquamarine & orichalcum gold)
      return {
        theme,
        name: 'Atlantis Ruins',
        borderColor: 'rgba(34, 211, 238, 0.8)',
        bodyGradient: [
          'rgba(4, 30, 48, 0.52)',
          'rgba(12, 74, 96, 0.58)',
          'rgba(8, 145, 178, 0.38)',
          'rgba(3, 20, 34, 0.65)',
        ],
        accentPrimary: '#22d3ee', // Radiant cyan crystal
        accentSecondary: '#fbbf24', // Orichalcum gold
        accentGlow: 'rgba(34, 211, 238, 0.65)',
        capGradient: ['#032b43', '#0284c7', '#0369a1', '#082f49'],
        capRim: '#38bdf8',
        badgeBg: '#032b43',
        badgeBorder: '#38bdf8',
        badgeText: '#f0fdf4',
      };
    }

    case 'block':
    case 'minecraft': {
      if (isVolcanic) {
        return {
          theme,
          name: 'Nether Magma Blocks',
          borderColor: '#1f0707',
          bodyGradient: ['#450a0a', '#7f1d1d', '#991b1b', '#180404'],
          accentPrimary: '#f97316',
          accentSecondary: '#fbbf24',
          accentGlow: 'rgba(249, 115, 22, 0.6)',
          capGradient: ['#450a0a', '#b91c1c', '#7f1d1d', '#130303'],
          capRim: '#fca5a5',
          badgeBg: '#180404',
          badgeBorder: '#f87171',
          badgeText: '#fff1f2',
        };
      }
      if (isCrystal) {
        return {
          theme,
          name: 'Crying Obsidian Blocks',
          borderColor: '#0f051d',
          bodyGradient: ['#1e1035', '#3b0764', '#2e1065', '#090214'],
          accentPrimary: '#c084fc',
          accentSecondary: '#38bdf8',
          accentGlow: 'rgba(192, 132, 252, 0.6)',
          capGradient: ['#1e1035', '#581c87', '#3b0764', '#06010e'],
          capRim: '#d8b4fe',
          badgeBg: '#090214',
          badgeBorder: '#c084fc',
          badgeText: '#faf5ff',
        };
      }
      if (isGold) {
        return {
          theme,
          name: 'Gilded Ruins Blocks',
          borderColor: '#1c1305',
          bodyGradient: ['#3a2408', '#78350f', '#92400e', '#140c03'],
          accentPrimary: '#f59e0b',
          accentSecondary: '#fde047',
          accentGlow: 'rgba(245, 158, 11, 0.6)',
          capGradient: ['#3a2408', '#b45309', '#78350f', '#0f0802'],
          capRim: '#fde68a',
          badgeBg: '#140c03',
          badgeBorder: '#f59e0b',
          badgeText: '#fffbeb',
        };
      }
      if (isGlacial) {
        return {
          theme,
          name: 'Packed Ice Blocks',
          borderColor: '#052338',
          bodyGradient: ['#074866', '#0284c7', '#0369a1', '#031929'],
          accentPrimary: '#38bdf8',
          accentSecondary: '#e0f2fe',
          accentGlow: 'rgba(56, 189, 248, 0.6)',
          capGradient: ['#074866', '#38bdf8', '#0284c7', '#02121e'],
          capRim: '#e0f2fe',
          badgeBg: '#031929',
          badgeBorder: '#38bdf8',
          badgeText: '#f0f9ff',
        };
      }
      // Prismarine Ocean Monument Block (Standard ocean)
      return {
        theme,
        name: 'Prismarine Blocks',
        borderColor: '#042826',
        bodyGradient: ['#0f514b', '#0d9488', '#115e59', '#031f1d'],
        accentPrimary: '#2dd4bf',
        accentSecondary: '#99f6e4',
        accentGlow: 'rgba(45, 212, 191, 0.55)',
        capGradient: ['#0f514b', '#14b8a6', '#0d9488', '#021715'],
        capRim: '#99f6e4',
        badgeBg: '#031f1d',
        badgeBorder: '#2dd4bf',
        badgeText: '#f0fdfa',
      };
    }

    case 'candy': {
      if (isVolcanic) {
        return {
          theme,
          name: 'Cinnamon Swirl Candy',
          borderColor: '#3f0d0d',
          bodyGradient: ['#7f1d1d', '#dc2626', '#b91c1c', '#290606'],
          accentPrimary: '#fef08a', // Sugar vanilla
          accentSecondary: '#f97316',
          accentGlow: 'rgba(239, 68, 68, 0.5)',
          capGradient: ['#7f1d1d', '#ef4444', '#b91c1c', '#1f0404'],
          capRim: '#fef08a',
          badgeBg: '#290606',
          badgeBorder: '#ef4444',
          badgeText: '#fff1f2',
        };
      }
      if (isCrystal) {
        return {
          theme,
          name: 'Wildberry Sparkle Candy',
          borderColor: '#260a38',
          bodyGradient: ['#581c87', '#a855f7', '#7e22ce', '#190526'],
          accentPrimary: '#fdf4ff',
          accentSecondary: '#f472b6',
          accentGlow: 'rgba(192, 132, 252, 0.5)',
          capGradient: ['#581c87', '#c084fc', '#9333ea', '#13031d'],
          capRim: '#fdf4ff',
          badgeBg: '#190526',
          badgeBorder: '#c084fc',
          badgeText: '#faf5ff',
        };
      }
      if (isGold) {
        return {
          theme,
          name: 'Caramel Honeycomb Candy',
          borderColor: '#2b1b05',
          bodyGradient: ['#78350f', '#d97706', '#b45309', '#1a1002'],
          accentPrimary: '#fef9c3',
          accentSecondary: '#f59e0b',
          accentGlow: 'rgba(245, 158, 11, 0.5)',
          capGradient: ['#78350f', '#f59e0b', '#d97706', '#120b01'],
          capRim: '#fef9c3',
          badgeBg: '#1a1002',
          badgeBorder: '#f59e0b',
          badgeText: '#fffbeb',
        };
      }
      if (isGlacial) {
        return {
          theme,
          name: 'Blueberry Frost Candy',
          borderColor: '#06263f',
          bodyGradient: ['#0369a1', '#0ea5e9', '#0284c7', '#031728'],
          accentPrimary: '#f0f9ff',
          accentSecondary: '#38bdf8',
          accentGlow: 'rgba(56, 189, 248, 0.5)',
          capGradient: ['#0369a1', '#38bdf8', '#0ea5e9', '#021220'],
          capRim: '#f0f9ff',
          badgeBg: '#031728',
          badgeBorder: '#38bdf8',
          badgeText: '#f0f9ff',
        };
      }
      // Mint & Peppermint Ocean Swirl (Standard)
      return {
        theme,
        name: 'Peppermint Ocean Candy',
        borderColor: '#032c2c',
        bodyGradient: ['#0f766e', '#14b8a6', '#0d9488', '#021d1d'],
        accentPrimary: '#ffffff',
        accentSecondary: '#2dd4bf',
        accentGlow: 'rgba(45, 212, 191, 0.55)',
        capGradient: ['#0f766e', '#2dd4bf', '#14b8a6', '#011515'],
        capRim: '#ffffff',
        badgeBg: '#021d1d',
        badgeBorder: '#2dd4bf',
        badgeText: '#f0fdfa',
      };
    }

    case 'tangled_kelp': {
      if (isVolcanic) {
        return {
          theme,
          name: 'Magma Roots',
          borderColor: '#240a04',
          bodyGradient: ['#3f1807', '#7c2d12', '#582109', '#170602'],
          accentPrimary: '#f97316',
          accentSecondary: '#eab308',
          accentGlow: 'rgba(249, 115, 22, 0.4)',
          capGradient: ['#3f1807', '#9a3412', '#7c2d12', '#120401'],
          capRim: '#fed7aa',
          badgeBg: '#170602',
          badgeBorder: '#f97316',
          badgeText: '#fff7ed',
        };
      }
      if (isCrystal) {
        return {
          theme,
          name: 'Twisted Abyssal Tendrils',
          borderColor: '#15082b',
          bodyGradient: ['#280f55', '#581c87', '#3b0764', '#0e051c'],
          accentPrimary: '#c084fc',
          accentSecondary: '#38bdf8',
          accentGlow: 'rgba(192, 132, 252, 0.4)',
          capGradient: ['#280f55', '#7e22ce', '#581c87', '#0a0315'],
          capRim: '#e9d5ff',
          badgeBg: '#0e051c',
          badgeBorder: '#a855f7',
          badgeText: '#faf5ff',
        };
      }
      if (isGold) {
        return {
          theme,
          name: 'Braided Sunken Vines',
          borderColor: '#261905',
          bodyGradient: ['#422508', '#854d0e', '#623608', '#160e02'],
          accentPrimary: '#eab308',
          accentSecondary: '#fef08a',
          accentGlow: 'rgba(234, 179, 8, 0.4)',
          capGradient: ['#422508', '#a16207', '#854d0e', '#110a01'],
          capRim: '#fef08a',
          badgeBg: '#160e02',
          badgeBorder: '#eab308',
          badgeText: '#fefce8',
        };
      }
      // Wild Ocean Kelp Braid (Standard)
      return {
        theme,
        name: 'Tangled Kelp Vines',
        borderColor: '#02241d',
        bodyGradient: ['#064e3b', '#059669', '#047857', '#011914'],
        accentPrimary: '#34d399',
        accentSecondary: '#fbbf24',
        accentGlow: 'rgba(52, 211, 153, 0.4)',
        capGradient: ['#064e3b', '#10b981', '#059669', '#01130f'],
        capRim: '#a7f3d0',
        badgeBg: '#011914',
        badgeBorder: '#34d399',
        badgeText: '#f0fdf4',
      };
    }

    case 'matrix': {
      if (isVolcanic) {
        return {
          theme,
          name: 'Cyber Heat Stream',
          borderColor: '#1e0505',
          bodyGradient: ['#120303', '#240707', '#180404', '#090101'],
          accentPrimary: '#f97316',
          accentSecondary: '#ef4444',
          accentGlow: 'rgba(249, 115, 22, 0.85)',
          capGradient: ['#180404', '#ef4444', '#7f1d1d', '#090101'],
          capRim: '#fdba74',
          badgeBg: '#090101',
          badgeBorder: '#f97316',
          badgeText: '#fff7ed',
        };
      }
      if (isCrystal) {
        return {
          theme,
          name: 'Cyber Violet Matrix',
          borderColor: '#100320',
          bodyGradient: ['#0b0216', '#1a0633', '#110321', '#07010f'],
          accentPrimary: '#c084fc',
          accentSecondary: '#f472b6',
          accentGlow: 'rgba(192, 132, 252, 0.85)',
          capGradient: ['#110321', '#a855f7', '#581c87', '#07010f'],
          capRim: '#f0abfc',
          badgeBg: '#07010f',
          badgeBorder: '#c084fc',
          badgeText: '#faf5ff',
        };
      }
      if (isGold) {
        return {
          theme,
          name: 'Solar Amber Terminal',
          borderColor: '#1a1002',
          bodyGradient: ['#0f0a01', '#231603', '#160e02', '#090500'],
          accentPrimary: '#eab308',
          accentSecondary: '#fde047',
          accentGlow: 'rgba(234, 179, 8, 0.85)',
          capGradient: ['#160e02', '#f59e0b', '#854d0e', '#090500'],
          capRim: '#fef08a',
          badgeBg: '#090500',
          badgeBorder: '#eab308',
          badgeText: '#fefce8',
        };
      }
      if (isGlacial) {
        return {
          theme,
          name: 'Cryo Ice Terminal',
          borderColor: '#021827',
          bodyGradient: ['#020e17', '#052238', '#031726', '#010a10'],
          accentPrimary: '#38bdf8',
          accentSecondary: '#e0f2fe',
          accentGlow: 'rgba(56, 189, 248, 0.85)',
          capGradient: ['#031726', '#0ea5e9', '#0369a1', '#010a10'],
          capRim: '#bae6fd',
          badgeBg: '#010a10',
          badgeBorder: '#38bdf8',
          badgeText: '#f0f9ff',
        };
      }
      // Ocean Cyan Cyber Terminal (Standard)
      return {
        theme,
        name: 'Ocean Cyan Matrix',
        borderColor: '#02181c',
        bodyGradient: ['#021013', '#04252a', '#031a1e', '#010a0c'],
        accentPrimary: '#06b6d4',
        accentSecondary: '#22d3ee',
        accentGlow: 'rgba(6, 182, 212, 0.85)',
        capGradient: ['#031a1e', '#06b6d4', '#0e7490', '#010a0c'],
        capRim: '#67e8f9',
        badgeBg: '#010a0c',
        badgeBorder: '#22d3ee',
        badgeText: '#ecfeff',
      };
    }

    case 'lava': {
      if (isCrystal) {
        return {
          theme,
          name: 'Amethyst Plasma Fissures',
          borderColor: '#130420',
          bodyGradient: ['#1e0b30', '#3b1259', '#270c3e', '#0d0217'],
          accentPrimary: '#c084fc',
          accentSecondary: '#fdf4ff',
          accentGlow: 'rgba(192, 132, 252, 0.85)',
          capGradient: ['#270c3e', '#9333ea', '#581c87', '#0d0217'],
          capRim: '#f5d0fe',
          badgeBg: '#0d0217',
          badgeBorder: '#c084fc',
          badgeText: '#faf5ff',
        };
      }
      if (isGold) {
        return {
          theme,
          name: 'Molten Gold Basalt',
          borderColor: '#1d1203',
          bodyGradient: ['#2b1804', '#4e2d08', '#381f05', '#130b01'],
          accentPrimary: '#f59e0b',
          accentSecondary: '#fef08a',
          accentGlow: 'rgba(245, 158, 11, 0.85)',
          capGradient: ['#381f05', '#d97706', '#92400e', '#130b01'],
          capRim: '#fef08a',
          badgeBg: '#130b01',
          badgeBorder: '#f59e0b',
          badgeText: '#fffbeb',
        };
      }
      if (isGlacial) {
        return {
          theme,
          name: 'Frostfire Cryo-Lava',
          borderColor: '#031724',
          bodyGradient: ['#062338', '#0c4266', '#082f49', '#02111a'],
          accentPrimary: '#38bdf8',
          accentSecondary: '#ffffff',
          accentGlow: 'rgba(56, 189, 248, 0.85)',
          capGradient: ['#082f49', '#0284c7', '#0369a1', '#02111a'],
          capRim: '#e0f2fe',
          badgeBg: '#02111a',
          badgeBorder: '#38bdf8',
          badgeText: '#f0f9ff',
        };
      }
      // Scorching Hydrothermal & Volcanic Lava (Standard)
      return {
        theme,
        name: 'Molten Lava Basalt',
        borderColor: '#1f0707',
        bodyGradient: ['#290e0e', '#451a1a', '#331313', '#160505'],
        accentPrimary: '#f97316',
        accentSecondary: '#fef08a',
        accentGlow: 'rgba(249, 115, 22, 0.85)',
        capGradient: ['#331313', '#ea580c', '#991b1b', '#160505'],
        capRim: '#fed7aa',
        badgeBg: '#160505',
        badgeBorder: '#f97316',
        badgeText: '#fff7ed',
      };
    }

    case 'sunken_atlantis': {
      if (isVolcanic) {
        return {
          theme,
          name: 'Molten Atlantean Ruins',
          borderColor: '#1f1008',
          bodyGradient: ['#2e1b10', '#4a2c1b', '#3b2113', '#1c0d06'],
          accentPrimary: '#f59e0b',
          accentSecondary: '#fde047',
          accentGlow: 'rgba(245, 158, 11, 0.7)',
          capGradient: ['#3b2113', '#d97706', '#92400e', '#170a04'],
          capRim: '#fef08a',
          badgeBg: '#170a04',
          badgeBorder: '#f59e0b',
          badgeText: '#fffbeb',
        };
      }
      if (isCrystal) {
        return {
          theme,
          name: 'Amethyst Atlantean Spire',
          borderColor: '#130924',
          bodyGradient: ['#1e1438', '#34235e', '#27184b', '#0e061c'],
          accentPrimary: '#c084fc',
          accentSecondary: '#38bdf8',
          accentGlow: 'rgba(192, 132, 252, 0.7)',
          capGradient: ['#27184b', '#7e22ce', '#581c87', '#0a0414'],
          capRim: '#e9d5ff',
          badgeBg: '#0a0414',
          badgeBorder: '#c084fc',
          badgeText: '#faf5ff',
        };
      }
      if (isGold) {
        return {
          theme,
          name: 'Imperial Gilded Atlantis',
          borderColor: '#261c07',
          bodyGradient: ['#422e0e', '#7c571c', '#5e4013', '#1d1303'],
          accentPrimary: '#eab308',
          accentSecondary: '#fef08a',
          accentGlow: 'rgba(234, 179, 8, 0.8)',
          capGradient: ['#5e4013', '#ca8a04', '#a16207', '#170f02'],
          capRim: '#fef9c3',
          badgeBg: '#170f02',
          badgeBorder: '#eab308',
          badgeText: '#fefce8',
        };
      }
      if (isGlacial) {
        return {
          theme,
          name: 'Glacial Atlantean Monolith',
          borderColor: '#062338',
          bodyGradient: ['#0a3754', '#155d8a', '#0f486d', '#031c2e'],
          accentPrimary: '#38bdf8',
          accentSecondary: '#e0f2fe',
          accentGlow: 'rgba(56, 189, 248, 0.75)',
          capGradient: ['#0f486d', '#0284c7', '#0369a1', '#021624'],
          capRim: '#bae6fd',
          badgeBg: '#021624',
          badgeBorder: '#38bdf8',
          badgeText: '#f0f9ff',
        };
      }
      // Classical Sunken Atlantean Fluted Marble (Standard Ocean)
      return {
        theme,
        name: 'Sunken Atlantis Columns',
        borderColor: '#062828',
        bodyGradient: ['#0f3d3d', '#1a5c5c', '#134747', '#041f1f'],
        accentPrimary: '#f59e0b',
        accentSecondary: '#2dd4bf',
        accentGlow: 'rgba(45, 212, 191, 0.65)',
        capGradient: ['#134747', '#2a7a7a', '#1a5c5c', '#031919'],
        capRim: '#fef08a',
        badgeBg: '#041f1f',
        badgeBorder: '#f59e0b',
        badgeText: '#fefce8',
      };
    }
  }
}
