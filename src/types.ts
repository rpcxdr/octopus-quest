export type GameState = 'IDLE' | 'PLAYING' | 'DYING' | 'GAMEOVER' | 'REEF_CLEARED';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export type FishType = 'octopus' | 'pufferfish' | 'clownfish' | 'singray' | 'seahorse';

export type FishFragmentCounts = Record<FishType, number>;
export type AllReefFragments = Record<number, FishFragmentCounts>;

export interface FloatingFragment {
  id: number;
  fishType: FishType;
  columnGapIndex: number; // 1 to 9 (gap between column columnGapIndex and columnGapIndex + 1)
  gapFraction?: number;   // Horizontal position within gap (e.g. 0.33, 0.5, 0.67) when multiple fragments share gap
  baseY: number;
  currentY: number;
  x: number;
  radius: number;
  spawned: boolean;
  collected: boolean;
  bobPhase: number;
}

export interface FishUnlockTier {
  id: FishType;
  name: string;
  unlockLevel: number; // Octopus is 0, all other fish are 1
  description: string;
  badgeEmoji: string;
  themeColor: string;
  accentColor: string;
  specialPowerTitle?: string;
  specialPowerDesc?: string;
  fragmentsToCollect?: number;
  achievedLevel?: number;
}

export type BirdSkin = 'coral' | 'azure' | 'amethyst' | 'mimic' | 'classic' | 'ruby' | 'midnight';

export type FishSkinsMap = Record<FishType, BirdSkin>;

export interface BirdSkinConfig {
  id: BirdSkin;
  name: string;
  bodyColor: string;
  bellyColor: string;
  wingColor: string; // tentacle color
  accentColor: string; // suction cup and cheek blush
  spotColor?: string;
}

export interface BirdState {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;
  rotation: number;
  wingFrame: number; // 0: tentacle propulsion puff, 1: stream, 2: curl glide
  wingTimer: number;
  alive: boolean;
}

export interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
  width: number;
  gap?: number;
  columnNumber?: number; // 1 to 10
}

export interface ReefColumnTemplate {
  columnNumber: number; // 1 to 10
  topHeight: number;
  gap: number;
  bottomHeight: number;
  width: number;
}

export interface ReefProgress {
  unlockedReef: number; // 1 to 50
  currentReef: number;  // 1 to 50
  clearedReefs: Record<number, { cleared: boolean; bestFlaps?: number; clearedAt?: string }>;
  gulfStreamUnlocked?: boolean;
  atlantisGateUnlocked?: boolean;
  currentFastReefsInRow?: number;
  bestFastReefsInRow?: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
  rotation?: number;
  isBubble?: boolean;
}

export interface UnderwaterBubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wobbleSpeed: number;
  wobbleOffset: number;
  opacity: number;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
}

export interface GameStats {
  highScore: number;
  gamesPlayed: number;
  totalScore: number;
  totalFlaps: number;
  lastScore: number;
  bestReefsAchieved?: number;
  dateSet?: string;
  gulfStreamUnlocked?: boolean;
  atlantisGateUnlocked?: boolean;
  currentFastReefsInRow?: number;
  bestFastReefsInRow?: number;
}

export type BadgeId = 'coral' | 'shell' | 'nautilus' | 'diamond' | 'gulf_stream' | 'atlantis_gate';

export interface GameBadge {
  id: BadgeId;
  name: string;
  emoji: string;
  requirement: string;
  effect: string;
  bonusFragments: number;
  unlocked: boolean;
}

export type MedalType = 'none' | 'coral' | 'shell' | 'nautilus' | 'diamond' | 'gulf_stream' | 'atlantis_gate' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface PhysicsConfig {
  gravity: number;        // pixels / sec^2
  jumpVelocity: number;   // pixels / sec
  maxFallSpeed: number;   // pixels / sec
  pipeSpeed: number;      // pixels / sec
  pipeGap: number;        // vertical space between pipes
  pipeSpacing: number;    // horizontal distance between pipes
  groundHeight: number;   // height of ground from bottom
  virtualWidth: number;
  virtualHeight: number;
}
