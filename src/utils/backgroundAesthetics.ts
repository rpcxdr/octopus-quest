export interface BackgroundAesthetic {
  id: string;
  name: string;
  subtitle: string;
  badgeEmoji: string;

  // 1. Water Column Gradient (5 stops from surface down to seabed)
  waterGradient: [string, string, string, string, string];

  // 2. God Rays / Underwater Light Beams
  rayColors: {
    top: string;
    mid: string;
    bottom: string;
  };
  rayAlpha: number;
  rayCount: number;

  // 3. Water Surface Styling
  surface: {
    topColor: string;
    midColor: string;
    rippleStroke: string;
  };

  // 4. Distant Silhouettes
  silhouette: {
    color: string;
    type: 'kelp' | 'spires' | 'coral_fans' | 'crystal_pillars' | 'vent_chimneys' | 'ancient_pillars';
  };

  // 5. Ambient Floating Particles / Plankton / Motes
  particles: {
    type: 'bubbles' | 'biolum_motes' | 'golden_dust' | 'crimson_embers' | 'ice_crystals' | 'neon_spores' | 'pearl_bubbles';
    color: string;
    glowColor?: string;
    count: number;
  };

  // 6. Seabed & Caustics Adaptation
  seabed: {
    sandGradient: [string, string, string];
    rippleCrest: string;
    rippleTrough: string;
    causticColor: string;
    grassColors: [string, string, string];
  };

  // 7. Kelp Pillar Adaptation (harmonizes pipes with the ambient water)
  pipeTint?: {
    stalkMain: string;
    stalkLight: string;
    stalkDark: string;
    rimLight: string;
  };
}

export const REEF_AESTHETICS: BackgroundAesthetic[] = [
  // 1. Reefs 1-3: Sunlit Azure Shallows
  {
    id: 'azure_shallows',
    name: 'Sunlit Azure Shallows',
    subtitle: 'Crystal clear turquoise waters drenched in bright sunlight',
    badgeEmoji: '☀️',
    waterGradient: ['#0284c7', '#0369a1', '#075985', '#0c4a6e', '#082f49'],
    rayColors: {
      top: 'rgba(224, 242, 254, 0.28)',
      mid: 'rgba(56, 189, 248, 0.16)',
      bottom: 'rgba(56, 189, 248, 0)',
    },
    rayAlpha: 0.14,
    rayCount: 5,
    surface: {
      topColor: 'rgba(255, 255, 255, 0.45)',
      midColor: 'rgba(186, 230, 253, 0.25)',
      rippleStroke: 'rgba(255, 255, 255, 0.5)',
    },
    silhouette: {
      color: 'rgba(8, 47, 73, 0.45)',
      type: 'kelp',
    },
    particles: {
      type: 'bubbles',
      color: 'rgba(255, 255, 255, 0.45)',
      count: 14,
    },
    seabed: {
      sandGradient: ['#0d9488', '#0f766e', '#042f2e'],
      rippleCrest: 'rgba(45, 212, 191, 0.18)',
      rippleTrough: 'rgba(2, 26, 21, 0.35)',
      causticColor: 'rgba(56, 189, 248, 0.06)',
      grassColors: ['#15803d', '#22c55e', '#4ade80'],
    },
  },

  // 2. Reefs 4-6: Emerald Lagoon
  {
    id: 'emerald_lagoon',
    name: 'Emerald Lagoon',
    subtitle: 'Lush tropical atoll waters with golden sunbeams and sea fans',
    badgeEmoji: '🌴',
    waterGradient: ['#059669', '#047857', '#065f46', '#064e3b', '#022c22'],
    rayColors: {
      top: 'rgba(254, 240, 138, 0.26)',
      mid: 'rgba(52, 211, 153, 0.18)',
      bottom: 'rgba(16, 185, 129, 0)',
    },
    rayAlpha: 0.16,
    rayCount: 6,
    surface: {
      topColor: 'rgba(254, 249, 195, 0.5)',
      midColor: 'rgba(110, 231, 183, 0.3)',
      rippleStroke: 'rgba(254, 240, 138, 0.6)',
    },
    silhouette: {
      color: 'rgba(2, 44, 34, 0.52)',
      type: 'coral_fans',
    },
    particles: {
      type: 'golden_dust',
      color: 'rgba(253, 224, 71, 0.55)',
      glowColor: 'rgba(52, 211, 153, 0.4)',
      count: 16,
    },
    seabed: {
      sandGradient: ['#10b981', '#047857', '#022c22'],
      rippleCrest: 'rgba(167, 243, 208, 0.22)',
      rippleTrough: 'rgba(1, 30, 20, 0.4)',
      causticColor: 'rgba(253, 224, 71, 0.08)',
      grassColors: ['#166534', '#15803d', '#86efac'],
    },
  },

  // 3. Reefs 7-9: Amethyst Twilight Trench
  {
    id: 'amethyst_twilight',
    name: 'Amethyst Twilight',
    subtitle: 'Mystical purple abyss with glowing violet bioluminescence',
    badgeEmoji: '🔮',
    waterGradient: ['#7c3aed', '#6d28d9', '#581c87', '#3b0764', '#1a0530'],
    rayColors: {
      top: 'rgba(245, 208, 254, 0.25)',
      mid: 'rgba(192, 132, 252, 0.18)',
      bottom: 'rgba(147, 51, 234, 0)',
    },
    rayAlpha: 0.16,
    rayCount: 5,
    surface: {
      topColor: 'rgba(250, 232, 255, 0.45)',
      midColor: 'rgba(216, 180, 254, 0.25)',
      rippleStroke: 'rgba(240, 171, 252, 0.55)',
    },
    silhouette: {
      color: 'rgba(30, 8, 54, 0.55)',
      type: 'spires',
    },
    particles: {
      type: 'biolum_motes',
      color: 'rgba(216, 180, 254, 0.7)',
      glowColor: 'rgba(168, 85, 247, 0.5)',
      count: 15,
    },
    seabed: {
      sandGradient: ['#6b21a8', '#4c1d95', '#1a0530'],
      rippleCrest: 'rgba(233, 213, 255, 0.2)',
      rippleTrough: 'rgba(15, 2, 28, 0.45)',
      causticColor: 'rgba(192, 132, 252, 0.08)',
      grassColors: ['#4c1d95', '#7e22ce', '#c084fc'],
    },
  },

  // 4. Reefs 10-12: Golden Sunken Atlantis
  {
    id: 'golden_atlantis',
    name: 'Golden Sunken Atlantis',
    subtitle: 'Ancient underwater civilization flooded in rich bronze and amber sunlight',
    badgeEmoji: '🏛️',
    waterGradient: ['#d97706', '#b45309', '#78350f', '#451a03', '#1c0f06'],
    rayColors: {
      top: 'rgba(254, 243, 199, 0.32)',
      mid: 'rgba(251, 191, 36, 0.2)',
      bottom: 'rgba(217, 119, 6, 0)',
    },
    rayAlpha: 0.18,
    rayCount: 6,
    surface: {
      topColor: 'rgba(254, 240, 138, 0.55)',
      midColor: 'rgba(252, 211, 77, 0.3)',
      rippleStroke: 'rgba(254, 243, 199, 0.65)',
    },
    silhouette: {
      color: 'rgba(28, 15, 6, 0.6)',
      type: 'ancient_pillars',
    },
    particles: {
      type: 'golden_dust',
      color: 'rgba(253, 224, 71, 0.75)',
      glowColor: 'rgba(245, 158, 11, 0.6)',
      count: 18,
    },
    seabed: {
      sandGradient: ['#b45309', '#78350f', '#1c0f06'],
      rippleCrest: 'rgba(253, 230, 138, 0.25)',
      rippleTrough: 'rgba(20, 9, 3, 0.5)',
      causticColor: 'rgba(251, 191, 36, 0.1)',
      grassColors: ['#854d0e', '#a16207', '#fde047'],
    },
  },

  // 5. Reefs 13-15: Bioluminescent Abyssal Bloom
  {
    id: 'abyssal_bloom',
    name: 'Bioluminescent Bloom',
    subtitle: 'Deep midnight ocean pulsating with electric cyan living light',
    badgeEmoji: '💠',
    waterGradient: ['#06b6d4', '#0891b2', '#0e7490', '#164e63', '#061720'],
    rayColors: {
      top: 'rgba(207, 250, 254, 0.3)',
      mid: 'rgba(34, 211, 238, 0.22)',
      bottom: 'rgba(6, 182, 212, 0)',
    },
    rayAlpha: 0.18,
    rayCount: 5,
    surface: {
      topColor: 'rgba(207, 250, 254, 0.5)',
      midColor: 'rgba(103, 232, 249, 0.25)',
      rippleStroke: 'rgba(34, 211, 238, 0.6)',
    },
    silhouette: {
      color: 'rgba(6, 23, 32, 0.65)',
      type: 'kelp',
    },
    particles: {
      type: 'biolum_motes',
      color: 'rgba(103, 232, 249, 0.85)',
      glowColor: 'rgba(6, 182, 212, 0.6)',
      count: 20,
    },
    seabed: {
      sandGradient: ['#0e7490', '#155e75', '#041c24'],
      rippleCrest: 'rgba(165, 243, 252, 0.22)',
      rippleTrough: 'rgba(2, 14, 18, 0.5)',
      causticColor: 'rgba(34, 211, 238, 0.09)',
      grassColors: ['#0f766e', '#14b8a6', '#5eead4'],
    },
  },

  // 6. Reefs 16-18: Crimson Hydrothermal Vents
  {
    id: 'crimson_vents',
    name: 'Crimson Thermal Vents',
    subtitle: 'Volcanic geothermal depths with smoky ruby glow and floating embers',
    badgeEmoji: '🌋',
    waterGradient: ['#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#290505'],
    rayColors: {
      top: 'rgba(254, 202, 202, 0.24)',
      mid: 'rgba(248, 113, 113, 0.18)',
      bottom: 'rgba(220, 38, 38, 0)',
    },
    rayAlpha: 0.15,
    rayCount: 5,
    surface: {
      topColor: 'rgba(254, 226, 226, 0.45)',
      midColor: 'rgba(252, 165, 165, 0.25)',
      rippleStroke: 'rgba(248, 113, 113, 0.5)',
    },
    silhouette: {
      color: 'rgba(41, 5, 5, 0.65)',
      type: 'vent_chimneys',
    },
    particles: {
      type: 'crimson_embers',
      color: 'rgba(251, 146, 60, 0.85)',
      glowColor: 'rgba(239, 68, 68, 0.6)',
      count: 18,
    },
    seabed: {
      sandGradient: ['#7f1d1d', '#5a1313', '#1e0303'],
      rippleCrest: 'rgba(254, 202, 202, 0.18)',
      rippleTrough: 'rgba(18, 3, 3, 0.55)',
      causticColor: 'rgba(248, 113, 113, 0.08)',
      grassColors: ['#78350f', '#b45309', '#f97316'],
    },
  },

  // 7. Reefs 19-21: Glacial Arctic Fjord
  {
    id: 'arctic_fjord',
    name: 'Glacial Arctic Fjord',
    subtitle: 'Sub-zero polar waters with crystalline white rays and drifting frost',
    badgeEmoji: '🧊',
    waterGradient: ['#38bdf8', '#0284c7', '#0369a1', '#0f172a', '#020617'],
    rayColors: {
      top: 'rgba(255, 255, 255, 0.35)',
      mid: 'rgba(186, 230, 253, 0.22)',
      bottom: 'rgba(56, 189, 248, 0)',
    },
    rayAlpha: 0.2,
    rayCount: 6,
    surface: {
      topColor: 'rgba(255, 255, 255, 0.6)',
      midColor: 'rgba(224, 242, 254, 0.35)',
      rippleStroke: 'rgba(255, 255, 255, 0.75)',
    },
    silhouette: {
      color: 'rgba(2, 6, 23, 0.6)',
      type: 'crystal_pillars',
    },
    particles: {
      type: 'ice_crystals',
      color: 'rgba(240, 249, 255, 0.8)',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      count: 16,
    },
    seabed: {
      sandGradient: ['#0369a1', '#075985', '#020617'],
      rippleCrest: 'rgba(224, 242, 254, 0.28)',
      rippleTrough: 'rgba(1, 4, 15, 0.5)',
      causticColor: 'rgba(224, 242, 254, 0.1)',
      grassColors: ['#0369a1', '#0284c7', '#7dd3fc'],
    },
  },

  // 8. Reefs 22-24: Coral Sunset Lagoon
  {
    id: 'sunset_lagoon',
    name: 'Coral Sunset Lagoon',
    subtitle: 'Golden-hour sunset reflecting rose and peach hues into purple ocean depths',
    badgeEmoji: '🌅',
    waterGradient: ['#f43f5e', '#e11d48', '#be123c', '#4c0519', '#1a0208'],
    rayColors: {
      top: 'rgba(254, 205, 211, 0.32)',
      mid: 'rgba(251, 113, 133, 0.2)',
      bottom: 'rgba(244, 63, 94, 0)',
    },
    rayAlpha: 0.17,
    rayCount: 5,
    surface: {
      topColor: 'rgba(254, 226, 226, 0.55)',
      midColor: 'rgba(253, 164, 175, 0.3)',
      rippleStroke: 'rgba(254, 205, 211, 0.65)',
    },
    silhouette: {
      color: 'rgba(26, 2, 8, 0.65)',
      type: 'coral_fans',
    },
    particles: {
      type: 'bubbles',
      color: 'rgba(254, 205, 211, 0.65)',
      count: 15,
    },
    seabed: {
      sandGradient: ['#9f1239', '#881337', '#1a0208'],
      rippleCrest: 'rgba(254, 205, 211, 0.22)',
      rippleTrough: 'rgba(18, 1, 6, 0.55)',
      causticColor: 'rgba(251, 113, 133, 0.08)',
      grassColors: ['#9f1239', '#e11d48', '#fda4af'],
    },
  },

  // 9. Reefs 25-27: Toxic Neon Kelp Cavern
  {
    id: 'neon_cavern',
    name: 'Toxic Neon Cavern',
    subtitle: 'Radioactive green subterranean waters illuminated by eerie alien spore pods',
    badgeEmoji: '☢️',
    waterGradient: ['#84cc16', '#65a30d', '#4d7c0f', '#365314', '#111d04'],
    rayColors: {
      top: 'rgba(236, 252, 203, 0.28)',
      mid: 'rgba(163, 230, 53, 0.2)',
      bottom: 'rgba(132, 204, 22, 0)',
    },
    rayAlpha: 0.16,
    rayCount: 5,
    surface: {
      topColor: 'rgba(247, 254, 231, 0.5)',
      midColor: 'rgba(190, 242, 100, 0.3)',
      rippleStroke: 'rgba(217, 249, 157, 0.6)',
    },
    silhouette: {
      color: 'rgba(17, 29, 4, 0.65)',
      type: 'kelp',
    },
    particles: {
      type: 'neon_spores',
      color: 'rgba(163, 230, 53, 0.85)',
      glowColor: 'rgba(132, 204, 22, 0.6)',
      count: 18,
    },
    seabed: {
      sandGradient: ['#4d7c0f', '#3f6212', '#111d04'],
      rippleCrest: 'rgba(217, 249, 157, 0.24)',
      rippleTrough: 'rgba(10, 18, 2, 0.55)',
      causticColor: 'rgba(163, 230, 53, 0.09)',
      grassColors: ['#3f6212', '#65a30d', '#bef264'],
    },
  },

  // 10. Reefs 28-30: Midnight Abyssal Trench
  {
    id: 'midnight_trench',
    name: 'Midnight Trench',
    subtitle: 'The pitch-black oceanic abyss where only spectral lantern motes drift',
    badgeEmoji: '🌌',
    waterGradient: ['#1e1b4b', '#1e1b4b', '#0f172a', '#080d1a', '#01030a'],
    rayColors: {
      top: 'rgba(199, 210, 254, 0.16)',
      mid: 'rgba(99, 102, 241, 0.1)',
      bottom: 'rgba(49, 46, 129, 0)',
    },
    rayAlpha: 0.09,
    rayCount: 4,
    surface: {
      topColor: 'rgba(224, 231, 255, 0.35)',
      midColor: 'rgba(129, 140, 248, 0.2)',
      rippleStroke: 'rgba(165, 180, 252, 0.45)',
    },
    silhouette: {
      color: 'rgba(1, 3, 10, 0.75)',
      type: 'spires',
    },
    particles: {
      type: 'biolum_motes',
      color: 'rgba(129, 140, 248, 0.9)',
      glowColor: 'rgba(99, 102, 241, 0.65)',
      count: 14,
    },
    seabed: {
      sandGradient: ['#1e1b4b', '#0f172a', '#01030a'],
      rippleCrest: 'rgba(165, 180, 252, 0.16)',
      rippleTrough: 'rgba(0, 1, 5, 0.65)',
      causticColor: 'rgba(129, 140, 248, 0.05)',
      grassColors: ['#1e1b4b', '#312e81', '#6366f1'],
    },
  },

  // 11. Reefs 31-33: Sapphire Crystal Reef
  {
    id: 'sapphire_crystal',
    name: 'Sapphire Crystal Reef',
    subtitle: 'Deep royal blue water glowing with natural sapphire crystal spires',
    badgeEmoji: '💎',
    waterGradient: ['#2563eb', '#1d4ed8', '#1e40af', '#172554', '#070c20'],
    rayColors: {
      top: 'rgba(219, 234, 254, 0.3)',
      mid: 'rgba(96, 165, 250, 0.2)',
      bottom: 'rgba(37, 99, 235, 0)',
    },
    rayAlpha: 0.18,
    rayCount: 6,
    surface: {
      topColor: 'rgba(239, 246, 255, 0.55)',
      midColor: 'rgba(147, 197, 253, 0.3)',
      rippleStroke: 'rgba(96, 165, 250, 0.65)',
    },
    silhouette: {
      color: 'rgba(7, 12, 32, 0.65)',
      type: 'crystal_pillars',
    },
    particles: {
      type: 'golden_dust',
      color: 'rgba(191, 219, 254, 0.85)',
      glowColor: 'rgba(59, 130, 246, 0.5)',
      count: 18,
    },
    seabed: {
      sandGradient: ['#1e40af', '#1e3a8a', '#070c20'],
      rippleCrest: 'rgba(191, 219, 254, 0.24)',
      rippleTrough: 'rgba(4, 7, 20, 0.55)',
      causticColor: 'rgba(96, 165, 250, 0.08)',
      grassColors: ['#1d4ed8', '#2563eb', '#93c5fd'],
    },
  },

  // 12. Reefs 34-36: Molten Magma Shelf
  {
    id: 'magma_shelf',
    name: 'Molten Magma Shelf',
    subtitle: 'Blazing submarine fire with intense geothermal glow and burning magma sparks',
    badgeEmoji: '🔥',
    waterGradient: ['#ea580c', '#c2410c', '#9a3412', '#431407', '#170501'],
    rayColors: {
      top: 'rgba(255, 237, 213, 0.3)',
      mid: 'rgba(251, 146, 60, 0.22)',
      bottom: 'rgba(234, 88, 12, 0)',
    },
    rayAlpha: 0.17,
    rayCount: 5,
    surface: {
      topColor: 'rgba(255, 247, 237, 0.55)',
      midColor: 'rgba(253, 186, 116, 0.3)',
      rippleStroke: 'rgba(251, 146, 60, 0.65)',
    },
    silhouette: {
      color: 'rgba(23, 5, 1, 0.7)',
      type: 'vent_chimneys',
    },
    particles: {
      type: 'crimson_embers',
      color: 'rgba(253, 186, 116, 0.9)',
      glowColor: 'rgba(234, 88, 12, 0.7)',
      count: 22,
    },
    seabed: {
      sandGradient: ['#9a3412', '#7c2d12', '#170501'],
      rippleCrest: 'rgba(254, 215, 170, 0.22)',
      rippleTrough: 'rgba(12, 2, 0, 0.6)',
      causticColor: 'rgba(251, 146, 60, 0.09)',
      grassColors: ['#9a3412', '#c2410c', '#fdba74'],
    },
  },

  // 13. Reefs 37-39: Moonlit Coral Atoll
  {
    id: 'moonlit_atoll',
    name: 'Moonlit Coral Atoll',
    subtitle: 'Silvery night waters reflecting cool moonlight through dark sea-glass tides',
    badgeEmoji: '🌙',
    waterGradient: ['#0f766e', '#115e59', '#134e4a', '#042f2e', '#011313'],
    rayColors: {
      top: 'rgba(204, 251, 241, 0.26)',
      mid: 'rgba(94, 234, 212, 0.16)',
      bottom: 'rgba(20, 184, 166, 0)',
    },
    rayAlpha: 0.14,
    rayCount: 5,
    surface: {
      topColor: 'rgba(240, 253, 250, 0.5)',
      midColor: 'rgba(153, 246, 228, 0.25)',
      rippleStroke: 'rgba(94, 234, 212, 0.55)',
    },
    silhouette: {
      color: 'rgba(1, 19, 19, 0.65)',
      type: 'coral_fans',
    },
    particles: {
      type: 'bubbles',
      color: 'rgba(204, 251, 241, 0.6)',
      count: 14,
    },
    seabed: {
      sandGradient: ['#134e4a', '#0f3c39', '#011313'],
      rippleCrest: 'rgba(153, 246, 228, 0.2)',
      rippleTrough: 'rgba(0, 10, 10, 0.55)',
      causticColor: 'rgba(94, 234, 212, 0.07)',
      grassColors: ['#115e59', '#0d9488', '#5eead4'],
    },
  },

  // 14. Reefs 40-42: Prismatic Aurora Abyss
  {
    id: 'aurora_abyss',
    name: 'Prismatic Aurora Abyss',
    subtitle: 'Shifting underwater northern lights creating kaleidoscopic spectral rays',
    badgeEmoji: '✨',
    waterGradient: ['#8b5cf6', '#6366f1', '#3b82f6', '#1e1b4b', '#09081e'],
    rayColors: {
      top: 'rgba(238, 242, 255, 0.32)',
      mid: 'rgba(167, 139, 250, 0.22)',
      bottom: 'rgba(99, 102, 241, 0)',
    },
    rayAlpha: 0.18,
    rayCount: 6,
    surface: {
      topColor: 'rgba(245, 243, 255, 0.55)',
      midColor: 'rgba(196, 181, 253, 0.3)',
      rippleStroke: 'rgba(167, 139, 250, 0.65)',
    },
    silhouette: {
      color: 'rgba(9, 8, 30, 0.65)',
      type: 'spires',
    },
    particles: {
      type: 'biolum_motes',
      color: 'rgba(196, 181, 253, 0.85)',
      glowColor: 'rgba(139, 92, 246, 0.6)',
      count: 20,
    },
    seabed: {
      sandGradient: ['#3b82f6', '#312e81', '#09081e'],
      rippleCrest: 'rgba(196, 181, 253, 0.24)',
      rippleTrough: 'rgba(5, 4, 18, 0.55)',
      causticColor: 'rgba(167, 139, 250, 0.09)',
      grassColors: ['#4338ca', '#6366f1', '#a78bfa'],
    },
  },

  // 15. Reefs 43-45: Sunken Primeval Forest
  {
    id: 'primeval_forest',
    name: 'Sunken Primeval Forest',
    subtitle: 'Dense ancient submerged rainforest shrouded in deep viridian canopy light',
    badgeEmoji: '🌲',
    waterGradient: ['#15803d', '#166534', '#14532d', '#052e16', '#011207'],
    rayColors: {
      top: 'rgba(220, 252, 231, 0.28)',
      mid: 'rgba(74, 222, 128, 0.18)',
      bottom: 'rgba(22, 101, 52, 0)',
    },
    rayAlpha: 0.16,
    rayCount: 6,
    surface: {
      topColor: 'rgba(240, 253, 244, 0.5)',
      midColor: 'rgba(134, 239, 172, 0.28)',
      rippleStroke: 'rgba(74, 222, 128, 0.6)',
    },
    silhouette: {
      color: 'rgba(1, 18, 7, 0.68)',
      type: 'kelp',
    },
    particles: {
      type: 'neon_spores',
      color: 'rgba(134, 239, 172, 0.8)',
      glowColor: 'rgba(34, 197, 94, 0.55)',
      count: 18,
    },
    seabed: {
      sandGradient: ['#14532d', '#0f3d20', '#011207'],
      rippleCrest: 'rgba(187, 247, 208, 0.22)',
      rippleTrough: 'rgba(1, 10, 4, 0.55)',
      causticColor: 'rgba(74, 222, 128, 0.08)',
      grassColors: ['#166534', '#15803d', '#4ade80'],
    },
  },

  // 16. Reefs 46-48: Celestial Void Trench
  {
    id: 'celestial_void',
    name: 'Celestial Void Trench',
    subtitle: 'Deep oceanic void where stellar cosmic dust glows like distant constellations',
    badgeEmoji: '🌠',
    waterGradient: ['#4c1d95', '#3b0764', '#1e1b4b', '#0f172a', '#02010d'],
    rayColors: {
      top: 'rgba(245, 208, 254, 0.28)',
      mid: 'rgba(216, 180, 254, 0.18)',
      bottom: 'rgba(126, 34, 206, 0)',
    },
    rayAlpha: 0.15,
    rayCount: 5,
    surface: {
      topColor: 'rgba(250, 232, 255, 0.5)',
      midColor: 'rgba(216, 180, 254, 0.25)',
      rippleStroke: 'rgba(232, 121, 249, 0.6)',
    },
    silhouette: {
      color: 'rgba(2, 1, 13, 0.75)',
      type: 'spires',
    },
    particles: {
      type: 'biolum_motes',
      color: 'rgba(245, 208, 254, 0.9)',
      glowColor: 'rgba(192, 132, 252, 0.65)',
      count: 22,
    },
    seabed: {
      sandGradient: ['#3b0764', '#1e1b4b', '#02010d'],
      rippleCrest: 'rgba(245, 208, 254, 0.2)',
      rippleTrough: 'rgba(1, 0, 7, 0.65)',
      causticColor: 'rgba(216, 180, 254, 0.07)',
      grassColors: ['#581c87', '#7e22ce', '#e879f9'],
    },
  },

  // 17. Reefs 49-50: Crown Abyssal Sanctuary
  {
    id: 'crown_sanctuary',
    name: 'Crown Abyssal Sanctuary',
    subtitle: 'The supreme sacred reef bathed in brilliant pearlescent teal and divine platinum light',
    badgeEmoji: '👑',
    waterGradient: ['#0284c7', '#0d9488', '#0f766e', '#134e4a', '#021817'],
    rayColors: {
      top: 'rgba(255, 255, 255, 0.4)',
      mid: 'rgba(153, 246, 228, 0.26)',
      bottom: 'rgba(45, 212, 191, 0)',
    },
    rayAlpha: 0.22,
    rayCount: 7,
    surface: {
      topColor: 'rgba(255, 255, 255, 0.65)',
      midColor: 'rgba(204, 251, 241, 0.35)',
      rippleStroke: 'rgba(255, 255, 255, 0.85)',
    },
    silhouette: {
      color: 'rgba(2, 24, 23, 0.7)',
      type: 'ancient_pillars',
    },
    particles: {
      type: 'pearl_bubbles',
      color: 'rgba(255, 255, 255, 0.85)',
      glowColor: 'rgba(94, 234, 212, 0.6)',
      count: 24,
    },
    seabed: {
      sandGradient: ['#0d9488', '#0f766e', '#021817'],
      rippleCrest: 'rgba(204, 251, 241, 0.3)',
      rippleTrough: 'rgba(1, 15, 14, 0.55)',
      causticColor: 'rgba(255, 255, 255, 0.12)',
      grassColors: ['#0f766e', '#14b8a6', '#99f6e4'],
    },
  },
];

/**
 * Returns the BackgroundAesthetic corresponding to the given reef level (1..50).
 * Rotates aesthetic every three reefs:
 * Reefs 1-3   -> REEF_AESTHETICS[0]
 * Reefs 4-6   -> REEF_AESTHETICS[1]
 * Reefs 7-9   -> REEF_AESTHETICS[2]
 * ...
 * Reefs 49-50 -> REEF_AESTHETICS[16]
 */
export function getAestheticForReef(reefLevel: number): BackgroundAesthetic {
  const safeLevel = Math.max(1, Math.floor(reefLevel));
  // Every 3 reefs: index = floor((level - 1) / 3)
  const index = Math.floor((safeLevel - 1) / 3);
  return REEF_AESTHETICS[Math.min(index, REEF_AESTHETICS.length - 1)];
}

export interface ReefLevelStyle {
  background: string;
  borderColor: string;
  boxShadow?: string;
  isUnlocked: boolean;
}

/**
 * Returns the unified background, border, and shadow styling for a Reef level,
 * adapting based on whether the level is unlocked or locked.
 * Used consistently across the Fragment Detail level list and Reef Levels buttons.
 */
export function getReefLevelStyle(reefLevel: number, isUnlocked: boolean): ReefLevelStyle {
  if (!isUnlocked) {
    return {
      background: '#1f1f1f', // Zero saturation grey
      borderColor: '#303030', // Zero saturation grey border
      boxShadow: 'none',
      isUnlocked: false,
    };
  }

  const aesthetic = getAestheticForReef(reefLevel);
  const [c0, c1, c2, c3] = aesthetic.waterGradient;

  return {
    background: `linear-gradient(135deg, ${c0}dd 0%, ${c1}e2 50%, ${c2}ee 100%)`,
    borderColor: `${c0}70`,
    boxShadow: `0 2px 8px -2px ${c3}80`,
    isUnlocked: true,
  };
}
