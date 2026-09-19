import { BirdState, Pipe, Particle, PhysicsConfig, BirdSkinConfig, BirdSkin, FishType, GameDifficulty } from '../types';

export const AVAILABLE_SKIN_KEYS: BirdSkin[] = ['coral', 'azure', 'amethyst', 'mimic'];

export const DEFAULT_FISH_SKINS: Record<FishType, BirdSkin> = {
  octopus: 'coral',
  singray: 'azure',
  pufferfish: 'mimic',
  clownfish: 'coral',
  seahorse: 'amethyst',
};

export const BIRD_SKINS: Record<BirdSkin, BirdSkinConfig> = {
  coral: {
    id: 'coral',
    name: 'Coral Bloom',
    bodyColor: '#FB7185',    // vibrant coral rose
    bellyColor: '#FFE4E6',   // soft peach pink
    wingColor: '#F43F5E',    // tentacle rose
    accentColor: '#FDA4AF',  // suction cups
    spotColor: '#E11D48',
  },
  azure: {
    id: 'azure',
    name: 'Tidal Cyan',
    bodyColor: '#06B6D4',    // bright seafoam cyan
    bellyColor: '#CFFAFE',   // light aqua
    wingColor: '#0891B2',    // deep cyan tentacles
    accentColor: '#67E8F9',  // glowing suction cups
    spotColor: '#0E7490',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Abyss Violet',
    bodyColor: '#A855F7',    // deep sea violet
    bellyColor: '#F3E8FF',   // pastel lavender
    wingColor: '#9333EA',    // mystic purple
    accentColor: '#D8B4FE',  // lilac suction cups
    spotColor: '#7E22CE',
  },
  mimic: {
    id: 'mimic',
    name: 'Golden Mimic',
    bodyColor: '#FACC15',    // bright sunny canary yellow
    bellyColor: '#FEFCE8',   // light creamy pale yellow belly
    wingColor: '#EAB308',    // vibrant golden yellow fins
    accentColor: '#FEF08A',  // glowing luminous yellow highlight
    spotColor: '#CA8A04',    // golden quill spines & freckles
  },
  // Legacy aliases to preserve saved local preferences smoothly
  classic: {
    id: 'mimic',
    name: 'Golden Mimic',
    bodyColor: '#FACC15',
    bellyColor: '#FEFCE8',
    wingColor: '#EAB308',
    accentColor: '#FEF08A',
    spotColor: '#CA8A04',
  },
  ruby: {
    id: 'coral',
    name: 'Coral Bloom',
    bodyColor: '#FB7185',
    bellyColor: '#FFE4E6',
    wingColor: '#F43F5E',
    accentColor: '#FDA4AF',
    spotColor: '#E11D48',
  },
  midnight: {
    id: 'amethyst',
    name: 'Abyss Violet',
    bodyColor: '#A855F7',
    bellyColor: '#F3E8FF',
    wingColor: '#9333EA',
    accentColor: '#D8B4FE',
    spotColor: '#7E22CE',
  },
};

export const DEFAULT_PHYSICS: PhysicsConfig = {
  gravity: 920,           // px / sec^2 (buoyant underwater gravity)
  jumpVelocity: -340,     // px / sec (swift tentacle pulse)
  maxFallSpeed: 490,      // px / sec
  pipeSpeed: 155,         // px / sec
  pipeGap: 136,           // comfortable gap between top & bottom kelp towers
  pipeSpacing: 210,       // distance between successive kelp pillars
  groundHeight: 110,      // seabed height from bottom
  virtualWidth: 360,
  virtualHeight: 640,
};

/**
 * Calculates the total percentage increase in speed based on:
 * 1. Advancing Reef level (1..50):
 *    - Level 1: +1% increase
 *    - Level 50: +50% increase
 *    - Linearly interpolated between: level percent = levelNumber %
 * 2. Difficulty mode:
 *    - Easy: +0% speed addition (+20% wider column gap)
 *    - Medium: +0% speed addition (standard column gap)
 *    - Hard: +20% speed addition
 *
 * Resulting total increases:
 * - Easy: Level 1 is 1% increase, Level 50 is 50% increase
 * - Medium: Level 1 is 1% increase, Level 50 is 50% increase
 * - Hard: Level 1 is 21% increase (1% + 20%), Level 50 is 70% increase (50% + 20%)
 */
export function getSpeedIncreasePercent(difficulty?: GameDifficulty | string, reefLevel: number = 1): number {
  const safeLevel = Math.max(1, Math.min(50, Math.floor(reefLevel || 1)));
  const levelSpeedPercent = safeLevel;
  const difficultySpeedPercent = difficulty === 'hard' ? 20 : 0;
  return levelSpeedPercent + difficultySpeedPercent;
}

/**
 * Returns physics settings calibrated for the chosen difficulty mode and reef level:
 * - Easy: Column gap is 20% wider, speed scales from +1% (Level 1) to +50% (Level 50)
 * - Medium (Default): Standard column gap, speed scales from +1% (Level 1) to +50% (Level 50)
 * - Hard: Standard column gap, speed scales from +21% (Level 1) to +70% (Level 50)
 */
export function getPhysicsForDifficulty(
  difficulty?: GameDifficulty | string,
  reefLevel: number = 1,
  customVirtualHeight?: number
): PhysicsConfig {
  const isEasy = difficulty === 'easy';
  const totalPercent = getSpeedIncreasePercent(difficulty, reefLevel);
  const speedMultiplier = 1 + totalPercent / 100;
  const virtualHeight = customVirtualHeight || DEFAULT_PHYSICS.virtualHeight;

  return {
    ...DEFAULT_PHYSICS,
    virtualHeight,
    pipeGap: isEasy ? Math.round(DEFAULT_PHYSICS.pipeGap * 1.20) : DEFAULT_PHYSICS.pipeGap,
    pipeSpeed: Math.round(DEFAULT_PHYSICS.pipeSpeed * speedMultiplier),
  };
}

export function createInitialBird(virtualWidth: number, virtualHeight: number): BirdState {
  return {
    x: virtualWidth * 0.28,
    y: (virtualHeight - DEFAULT_PHYSICS.groundHeight) * 0.48,
    width: 32,
    height: 28,
    velocity: 0,
    rotation: 0,
    wingFrame: 0,
    wingTimer: 0,
    alive: true,
  };
}

export function updateBirdPhysics(
  bird: BirdState,
  dt: number,
  config: PhysicsConfig,
  isFlapping: boolean
): BirdState {
  let { y, velocity, rotation, wingFrame, wingTimer, alive } = bird;

  if (alive) {
    // Apply gravity
    velocity += config.gravity * dt;
    if (velocity > config.maxFallSpeed) {
      velocity = config.maxFallSpeed;
    }

    // Apply velocity to position
    y += velocity * dt;

    // Smooth rotation based on velocity
    if (velocity < 0) {
      // Flapping upward: quickly point up (-22 deg = -0.38 rad)
      const targetRot = -0.4;
      rotation = rotation + (targetRot - rotation) * Math.min(1, dt * 14);
    } else {
      // Falling downward: smoothly tip forward/down towards +75 deg (+1.3 rad)
      const targetRot = 1.35;
      const rotSpeed = velocity > 180 ? 7 : 3.5;
      rotation = rotation + (targetRot - rotation) * Math.min(1, dt * rotSpeed);
    }

    // Wing flap cycle
    wingTimer += dt;
    if (wingTimer > 0.08) {
      wingTimer = 0;
      wingFrame = (wingFrame + 1) % 3;
    }
  } else {
    // Dead falling to ground
    velocity += config.gravity * 1.3 * dt;
    if (velocity > config.maxFallSpeed * 1.2) {
      velocity = config.maxFallSpeed * 1.2;
    }
    y += velocity * dt;
    rotation = Math.min(1.57, rotation + dt * 12); // tumble to 90 deg
  }

  // Ceiling clamp
  if (y < 12) {
    y = 12;
    velocity = 0;
  }

  // Ground collision clamp
  const groundY = config.virtualHeight - config.groundHeight - bird.height / 2;
  if (y >= groundY) {
    y = groundY;
    velocity = 0;
  }

  return {
    ...bird,
    y,
    velocity,
    rotation,
    wingFrame: alive ? wingFrame : 1,
    wingTimer,
  };
}

export function checkCollisions(
  bird: BirdState,
  pipes: Pipe[],
  config: PhysicsConfig
): { collidedWithPipe: boolean; hitGround: boolean } {
  const groundY = config.virtualHeight - config.groundHeight - bird.height / 2;

  // Ground check
  if (bird.y >= groundY) {
    return { collidedWithPipe: false, hitGround: true };
  }

  // Bird collision circle (forgiving, radius ~ 11px)
  const birdCenterX = bird.x;
  const birdCenterY = bird.y;
  const birdRadius = 11;

  for (const pipe of pipes) {
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipe.width;

    // Check if bird is within horizontal range
    if (birdCenterX + birdRadius > pipeLeft && birdCenterX - birdRadius < pipeRight) {
      // Top pipe collision: from y=0 down to pipe.topHeight
      if (birdCenterY - birdRadius < pipe.topHeight) {
        return { collidedWithPipe: true, hitGround: false };
      }

      // Bottom pipe collision: from pipe.topHeight + actualGap down to ground
      const actualGap = pipe.gap !== undefined ? pipe.gap : config.pipeGap;
      const bottomPipeY = pipe.topHeight + actualGap;
      if (birdCenterY + birdRadius > bottomPipeY) {
        return { collidedWithPipe: true, hitGround: false };
      }
    }
  }

  return { collidedWithPipe: false, hitGround: false };
}

export function createPipe(id: number, startX: number, config: PhysicsConfig, lastTopHeight?: number): Pipe {
  const minTop = 60;
  const maxTop = config.virtualHeight - config.groundHeight - config.pipeGap - 60;
  
  let topHeight: number;
  if (lastTopHeight !== undefined) {
    // Keep variation within reasonable reachable jump heights
    const maxDelta = 140;
    const low = Math.max(minTop, lastTopHeight - maxDelta);
    const high = Math.min(maxTop, lastTopHeight + maxDelta);
    topHeight = Math.floor(low + Math.random() * (high - low));
  } else {
    topHeight = Math.floor(minTop + Math.random() * (maxTop - minTop));
  }

  const bottomHeight = config.virtualHeight - config.groundHeight - topHeight - config.pipeGap;

  return {
    id,
    x: startX,
    topHeight,
    bottomHeight,
    passed: false,
    width: 58,
  };
}

export function createFlapPuff(bird: BirdState): Particle[] {
  const particles: Particle[] = [];
  const count = 6;
  for (let i = 0; i < count; i++) {
    particles.push({
      id: Math.random(),
      x: bird.x - 12 + (Math.random() * 8 - 4),
      y: bird.y + 4 + (Math.random() * 8 - 4),
      vx: -(30 + Math.random() * 45),
      vy: -(25 + Math.random() * 40), // float upward (buoyancy)
      size: 2.5 + Math.random() * 3.5,
      color: 'rgba(255, 255, 255, 0.85)',
      alpha: 0.85,
      maxLife: 0.5 + Math.random() * 0.3,
      life: 0.5 + Math.random() * 0.3,
      isBubble: true,
    });
  }
  return particles;
}

/**
 * Creates high-velocity aquatic cavitation wake particles bursting directly behind
 * Sting Ray during Hydrodash space press / tap.
 */
export function createHydroDashWakeParticles(bird: BirdState): Particle[] {
  const particles: Particle[] = [];
  const count = 14;
  const colors = ['#ffffff', '#f0f9ff', '#e0f2fe', '#bae6fd', '#38bdf8', '#0284c7'];
  for (let i = 0; i < count; i++) {
    // Positioned directly behind the stingray's tail: x roughly bird.x - 26 to -38
    const offsetBack = 26 + Math.random() * 12;
    const offsetY = (Math.random() - 0.5) * 12;
    particles.push({
      id: Math.random(),
      x: bird.x - offsetBack,
      y: bird.y + offsetY,
      // Propelled backward at high velocity
      vx: -(110 + Math.random() * 150),
      vy: (Math.random() - 0.5) * 35 - 10,
      size: 2.0 + Math.random() * 3.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.95,
      maxLife: 0.4 + Math.random() * 0.3,
      life: 0.4 + Math.random() * 0.3,
      isBubble: true,
    });
  }
  return particles;
}

export function createImpactParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  const colors = ['#38BDF8', '#67E8F9', '#FFFFFF', '#FDA4AF', '#FCD34D'];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 120;
    particles.push({
      id: Math.random(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      size: 2.5 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      maxLife: 0.6 + Math.random() * 0.4,
      life: 0.6 + Math.random() * 0.4,
      isBubble: Math.random() > 0.3,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map(p => {
      // Water drag slows horizontal speed
      const drag = Math.max(0, 1 - dt * 2.5);
      const vx = p.vx * drag;
      let vy = p.vy;

      if (p.isBubble) {
        // Buoyancy accelerates bubbles upward toward ocean surface
        vy -= 120 * dt;
        if (vy < -90) vy = -90;
      } else {
        // Coral sparkle particles slowly settle down in water
        vy += 60 * dt;
      }

      return {
        ...p,
        x: p.x + vx * dt,
        y: p.y + vy * dt,
        vx,
        vy,
        life: p.life - dt,
        alpha: Math.max(0, p.life / p.maxLife),
      };
    })
    .filter(p => p.life > 0);
}
