import { BirdState, FishType, PhysicsConfig } from '../types';
import { sound } from './audio';

/**
 * Result of a flap/space action for an aquatic character.
 */
export interface FishFlapResult {
  velocity?: number;
  rotation?: number;
  spawnParticles?: boolean;
}

/**
 * Result of a collision evaluation.
 */
export interface FishCollisionResolution {
  absorbed: boolean;     // True if special power (e.g. Pufferfish shield) absorbed the hit
  shouldDie: boolean;    // False if character survives
  knockbackY?: number;  // Repositioning offset to prevent sticking inside obstacle
  reason?: string;
}

/**
 * Snapshot of character ability states for HUD and canvas rendering.
 */
export interface FishAbilityState {
  fishType: FishType;
  
  // Pufferfish Survival Shield
  shieldState: 'ready' | 'active' | 'used';
  shieldTimeRemaining: number;
  shieldMaxDuration: number;

  // Sting Ray Forward Dash
  dashTimeRemaining: number;
  isDashing: boolean;

  // Seahorse Alternating Direction
  seahorseNextDirection: 'up' | 'down';
  seahorseActiveDirection: 'up' | 'down' | null;
  seahorseSwimTimeRemaining: number;
  isSeahorseSettling: boolean;

  // Clownfish Slower Float
  isBuoyantSlower: boolean;
}

/**
 * Abstract Base Class for Fish Behaviors (Object-Oriented Design)
 * Defines the contract for all character movement, abilities, and collision responses.
 */
export abstract class BaseFishBehavior {
  public abstract readonly id: FishType;
  public abstract readonly name: string;
  public abstract readonly level: number;
  public abstract readonly powerTitle: string;
  public abstract readonly powerDescription: string;

  /**
   * Resets internal timers and one-time abilities (called on reef start, restart, or next reef).
   */
  public abstract reset(): void;

  /**
   * Invoked when the player presses space or taps the screen to swim/flap.
   */
  public abstract onFlap(bird: BirdState, config: PhysicsConfig): FishFlapResult;

  /**
   * Invoked on every physics tick (dt in seconds) during PLAYING state.
   * Returns updated bird state and forward speed multiplier.
   */
  public abstract updatePhysics(
    bird: BirdState,
    dt: number,
    config: PhysicsConfig,
    alive: boolean
  ): { bird: BirdState; forwardSpeedMultiplier: number };

  /**
   * Evaluates collision with kelp pipes or seabed/ceiling.
   */
  public abstract onCollision(
    bird: BirdState,
    collisionType: 'pipe' | 'ground',
    config: PhysicsConfig
  ): FishCollisionResolution;

  /**
   * Exports snapshot of ability status for HUD and sprite decorators.
   */
  public abstract getAbilityState(): FishAbilityState;
}

/**
 * 1. OCTOPUS BEHAVIOR
 * Special Power: For every fish level, the number of fragments floating in a reef level is increased.
 * (Base 2 + octopus level).
 */
export class OctopusBehavior extends BaseFishBehavior {
  public readonly id: FishType = 'octopus';
  public readonly name = 'Octopus';
  public readonly level: number;
  public readonly powerTitle = 'Reef Fragment Magnetism';
  public readonly powerDescription: string;

  constructor(level: number = 0) {
    super();
    this.level = Math.max(0, level);
    const totalFragments = 2 + this.level;
    this.powerDescription = `Spawns +${this.level} extra fragments in every reef level (Base 2 + Lv.${this.level} = ${totalFragments} fragments).`;
  }

  public reset(): void {
    // No state to reset
  }

  public onFlap(bird: BirdState, config: PhysicsConfig): FishFlapResult {
    return {
      velocity: config.jumpVelocity,
      rotation: -0.4,
      spawnParticles: true,
    };
  }

  public updatePhysics(
    bird: BirdState,
    dt: number,
    config: PhysicsConfig,
    alive: boolean
  ): { bird: BirdState; forwardSpeedMultiplier: number } {
    let { y, velocity, rotation, wingFrame, wingTimer } = bird;

    if (alive) {
      velocity += config.gravity * dt;
      if (velocity > config.maxFallSpeed) {
        velocity = config.maxFallSpeed;
      }
      y += velocity * dt;

      if (velocity < 0) {
        rotation = rotation + (-0.4 - rotation) * Math.min(1, dt * 14);
      } else {
        const targetRot = 1.35;
        const rotSpeed = velocity > 180 ? 7 : 3.5;
        rotation = rotation + (targetRot - rotation) * Math.min(1, dt * rotSpeed);
      }

      wingTimer += dt;
      if (wingTimer > 0.08) {
        wingTimer = 0;
        wingFrame = (wingFrame + 1) % 3;
      }
    } else {
      velocity += config.gravity * 1.3 * dt;
      y += velocity * dt;
      rotation = Math.min(1.57, rotation + dt * 12);
    }

    // Clamps
    if (y < 12) {
      y = 12;
      velocity = 0;
    }
    const groundY = config.virtualHeight - config.groundHeight - bird.height / 2;
    if (y >= groundY) {
      y = groundY;
      velocity = 0;
    }

    return {
      bird: {
        ...bird,
        y,
        velocity,
        rotation,
        wingFrame: alive ? wingFrame : 1,
        wingTimer,
      },
      forwardSpeedMultiplier: 1.0,
    };
  }

  public onCollision(
    bird: BirdState,
    collisionType: 'pipe' | 'ground',
    config: PhysicsConfig
  ): FishCollisionResolution {
    return {
      absorbed: false,
      shouldDie: true,
      reason: 'Octopus has no shield.',
    };
  }

  public getAbilityState(): FishAbilityState {
    return {
      fishType: 'octopus',
      shieldState: 'used',
      shieldTimeRemaining: 0,
      shieldMaxDuration: 0,
      dashTimeRemaining: 0,
      isDashing: false,
      seahorseNextDirection: 'up',
      seahorseActiveDirection: null,
      seahorseSwimTimeRemaining: 0,
      isSeahorseSettling: false,
      isBuoyantSlower: false,
    };
  }
}

/**
 * 2. PUFFER FISH BEHAVIOR
 * Special Power: Survival shield lasts for 0.5 seconds and increases by 0.5 seconds for each level.
 * (Level 1 = 0.5s, Level 5 = 2.5s). Single use per reef.
 */
export class PufferFishBehavior extends BaseFishBehavior {
  public readonly id: FishType = 'pufferfish';
  public readonly name = 'Puffer Fish';
  public readonly level: number;
  public readonly powerTitle = 'Survival Shield';
  public readonly powerDescription: string;

  private shieldState: 'ready' | 'active' | 'used' = 'ready';
  private shieldTimer: number = 0;
  private readonly shieldDuration: number;
  private lastHitCooldown: number = 0; // brief cooldown between successive hit reflections

  constructor(level: number = 1) {
    super();
    this.level = Math.max(1, level);
    this.shieldDuration = 0.5 * this.level;
    this.powerDescription = `Survival shield lasts ${this.shieldDuration.toFixed(1)}s (0.5s per level; Lv.${this.level} = ${this.shieldDuration.toFixed(1)}s). One use per reef.`;
  }

  public reset(): void {
    this.shieldState = 'ready';
    this.shieldTimer = 0;
    this.lastHitCooldown = 0;
  }

  public onFlap(bird: BirdState, config: PhysicsConfig): FishFlapResult {
    return {
      velocity: config.jumpVelocity,
      rotation: -0.35,
      spawnParticles: true,
    };
  }

  public updatePhysics(
    bird: BirdState,
    dt: number,
    config: PhysicsConfig,
    alive: boolean
  ): { bird: BirdState; forwardSpeedMultiplier: number } {
    let { y, velocity, rotation, wingFrame, wingTimer } = bird;

    if (this.lastHitCooldown > 0) {
      this.lastHitCooldown = Math.max(0, this.lastHitCooldown - dt);
    }

    // Shield countdown when active
    if (this.shieldState === 'active') {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
      if (this.shieldTimer <= 0) {
        this.shieldState = 'used'; // Shield expired! Cannot be used again this reef run.
        sound.playShieldPop();
      }
    }

    if (alive) {
      velocity += config.gravity * dt;
      if (velocity > config.maxFallSpeed) {
        velocity = config.maxFallSpeed;
      }
      y += velocity * dt;

      if (velocity < 0) {
        rotation = rotation + (-0.35 - rotation) * Math.min(1, dt * 14);
      } else {
        const targetRot = 1.25;
        const rotSpeed = velocity > 180 ? 6.5 : 3.5;
        rotation = rotation + (targetRot - rotation) * Math.min(1, dt * rotSpeed);
      }

      wingTimer += dt;
      if (wingTimer > 0.08) {
        wingTimer = 0;
        wingFrame = (wingFrame + 1) % 3;
      }
    } else {
      velocity += config.gravity * 1.3 * dt;
      y += velocity * dt;
      rotation = Math.min(1.57, rotation + dt * 12);
    }

    // Clamps
    if (y < 12) {
      y = 12;
      velocity = 0;
    }
    const groundY = config.virtualHeight - config.groundHeight - bird.height / 2;
    if (y >= groundY) {
      y = groundY;
      velocity = 0;
    }

    return {
      bird: {
        ...bird,
        y,
        velocity,
        rotation,
        wingFrame: alive ? wingFrame : 1,
        wingTimer,
      },
      forwardSpeedMultiplier: 1.0,
    };
  }

  public onCollision(
    bird: BirdState,
    collisionType: 'pipe' | 'ground',
    config: PhysicsConfig
  ): FishCollisionResolution {
    // 1. If shield is ready, ACTIVATE survival shield on first hit!
    if (this.shieldState === 'ready') {
      this.shieldState = 'active';
      this.shieldTimer = this.shieldDuration;
      this.lastHitCooldown = 0.4;
      sound.playShieldActivate();

      // Provide gentle clearance impulse away from obstacle
      const bounce = collisionType === 'ground' ? -180 : -110;
      return {
        absorbed: true,
        shouldDie: false,
        knockbackY: bounce,
        reason: `Survival shield activated for ${this.shieldDuration.toFixed(1)} seconds!`,
      };
    }

    // 2. If shield is already active and running (during the shield duration)
    if (this.shieldState === 'active') {
      const bounce = collisionType === 'ground' ? -150 : -60;
      return {
        absorbed: true,
        shouldDie: false,
        knockbackY: bounce,
        reason: 'Protected by active survival shield!',
      };
    }

    // 3. Shield has been used already: Cannot be used again until restart / next reef
    return {
      absorbed: false,
      shouldDie: true,
      reason: 'Survival shield already consumed for this reef.',
    };
  }

  public getAbilityState(): FishAbilityState {
    return {
      fishType: 'pufferfish',
      shieldState: this.shieldState,
      shieldTimeRemaining: this.shieldTimer,
      shieldMaxDuration: this.shieldDuration,
      dashTimeRemaining: 0,
      isDashing: false,
      seahorseNextDirection: 'up',
      seahorseActiveDirection: null,
      seahorseSwimTimeRemaining: 0,
      isSeahorseSettling: false,
      isBuoyantSlower: false,
    };
  }
}

/**
 * 3. CLOWN FISH BEHAVIOR
 * Special Power: Upward motion is reduced using:
 * upward_motion = (base_upward_motion) * (1 - 0.80 * (1 - Math.pow(7/8, fish_level)))
 * Downward motion is a fixed 10 percent slower (no change).
 * Level 1 = 10% reduction, Level 10 = ~58.98% reduction.
 */
export class ClownFishBehavior extends BaseFishBehavior {
  public readonly id: FishType = 'clownfish';
  public readonly name = 'Clown Fish';
  public readonly level: number;
  public readonly powerTitle = 'Buoyant Glide';
  public readonly powerDescription: string;

  private readonly upwardMultiplier: number;
  private readonly upwardReductionPercent: number;
  private readonly DOWNWARD_SLOW_FACTOR: number = 0.90; // Fixed 10% slower

  constructor(level: number = 1) {
    super();
    this.level = Math.max(1, level);
    // User formula: upward_motion = (base_upward_motion) * (1 - 0.80 * (1 - Math.pow(7/8, fish_level)))
    const reduction = 0.80 * (1 - Math.pow(7 / 8, this.level));
    this.upwardReductionPercent = reduction * 100;
    this.upwardMultiplier = 1 - reduction;
    this.powerDescription = `Upward motion reduced by ${this.upwardReductionPercent.toFixed(1)}%, downward motion fixed 10% slower.`;
  }

  public reset(): void {
    // No state to reset
  }

  public onFlap(bird: BirdState, config: PhysicsConfig): FishFlapResult {
    return {
      velocity: config.jumpVelocity * this.upwardMultiplier,
      rotation: -0.36,
      spawnParticles: true,
    };
  }

  public updatePhysics(
    bird: BirdState,
    dt: number,
    config: PhysicsConfig,
    alive: boolean
  ): { bird: BirdState; forwardSpeedMultiplier: number } {
    let { y, velocity, rotation, wingFrame, wingTimer } = bird;

    if (alive) {
      // Downward gravity is a fixed 10% slower (no change)
      const effectiveGravity = config.gravity * this.DOWNWARD_SLOW_FACTOR;
      const effectiveMaxFall = config.maxFallSpeed * this.DOWNWARD_SLOW_FACTOR;

      velocity += effectiveGravity * dt;
      if (velocity > effectiveMaxFall) {
        velocity = effectiveMaxFall;
      }
      y += velocity * dt;

      if (velocity < 0) {
        rotation = rotation + (-0.36 - rotation) * Math.min(1, dt * 13);
      } else {
        const targetRot = 1.2;
        const rotSpeed = velocity > 150 ? 6 : 3;
        rotation = rotation + (targetRot - rotation) * Math.min(1, dt * rotSpeed);
      }

      wingTimer += dt;
      if (wingTimer > 0.09) {
        wingTimer = 0;
        wingFrame = (wingFrame + 1) % 3;
      }
    } else {
      velocity += config.gravity * 1.2 * dt;
      y += velocity * dt;
      rotation = Math.min(1.57, rotation + dt * 12);
    }

    // Clamps
    if (y < 12) {
      y = 12;
      velocity = 0;
    }
    const groundY = config.virtualHeight - config.groundHeight - bird.height / 2;
    if (y >= groundY) {
      y = groundY;
      velocity = 0;
    }

    return {
      bird: {
        ...bird,
        y,
        velocity,
        rotation,
        wingFrame: alive ? wingFrame : 1,
        wingTimer,
      },
      forwardSpeedMultiplier: 1.0,
    };
  }

  public onCollision(
    bird: BirdState,
    collisionType: 'pipe' | 'ground',
    config: PhysicsConfig
  ): FishCollisionResolution {
    return {
      absorbed: false,
      shouldDie: true,
      reason: 'Clown fish has no shield.',
    };
  }

  public getAbilityState(): FishAbilityState {
    return {
      fishType: 'clownfish',
      shieldState: 'used',
      shieldTimeRemaining: 0,
      shieldMaxDuration: 0,
      dashTimeRemaining: 0,
      isDashing: false,
      seahorseNextDirection: 'up',
      seahorseActiveDirection: null,
      seahorseSwimTimeRemaining: 0,
      isSeahorseSettling: false,
      isBuoyantSlower: true,
    };
  }
}

/**
 * 4. STING RAY BEHAVIOR
 * Special Power: Moves 10*level percent faster forward (in the x direction) for 0.3 seconds
 * whenever the user presses space.
 * (Level 1 = 10% faster, Level 10 = 100% faster).
 */
export class SingRayBehavior extends BaseFishBehavior {
  public readonly id: FishType = 'singray';
  public readonly name = 'Sting Ray';
  public readonly level: number;
  public readonly powerTitle = 'Hydro Surge';
  public readonly powerDescription: string;

  private dashTimer: number = 0;
  private readonly DASH_DURATION: number = 0.3; // 0.3 seconds
  private readonly dashSpeedMultiplier: number;
  private readonly speedBoostPercent: number;

  constructor(level: number = 1) {
    super();
    this.level = Math.max(1, level);
    // User formula: 10 * level percent faster forward in x direction
    this.speedBoostPercent = 10 * this.level;
    this.dashSpeedMultiplier = 1 + this.speedBoostPercent / 100;
    this.powerDescription = `Moves ${this.speedBoostPercent}% faster forward (x direction) for 0.3s on space press.`;
  }

  public reset(): void {
    this.dashTimer = 0;
  }

  public onFlap(bird: BirdState, config: PhysicsConfig): FishFlapResult {
    // Trigger 0.3s forward dash
    this.dashTimer = this.DASH_DURATION;
    sound.playDash();

    return {
      velocity: config.jumpVelocity,
      rotation: -0.28,
      spawnParticles: true,
    };
  }

  public updatePhysics(
    bird: BirdState,
    dt: number,
    config: PhysicsConfig,
    alive: boolean
  ): { bird: BirdState; forwardSpeedMultiplier: number } {
    let { y, velocity, rotation, wingFrame, wingTimer } = bird;

    // Countdown forward dash timer
    let forwardSpeedMultiplier = 1.0;
    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - dt);
      forwardSpeedMultiplier = this.dashSpeedMultiplier;
    }

    if (alive) {
      velocity += config.gravity * dt;
      if (velocity > config.maxFallSpeed) {
        velocity = config.maxFallSpeed;
      }
      y += velocity * dt;

      // Sleeker hydrodynamic tilt
      if (velocity < 0) {
        rotation = rotation + (-0.28 - rotation) * Math.min(1, dt * 15);
      } else {
        const targetRot = 1.15;
        const rotSpeed = velocity > 180 ? 7 : 3.5;
        rotation = rotation + (targetRot - rotation) * Math.min(1, dt * rotSpeed);
      }

      wingTimer += dt;
      if (wingTimer > 0.08) {
        wingTimer = 0;
        wingFrame = (wingFrame + 1) % 3;
      }
    } else {
      velocity += config.gravity * 1.3 * dt;
      y += velocity * dt;
      rotation = Math.min(1.57, rotation + dt * 12);
    }

    // Clamps
    if (y < 12) {
      y = 12;
      velocity = 0;
    }
    const groundY = config.virtualHeight - config.groundHeight - bird.height / 2;
    if (y >= groundY) {
      y = groundY;
      velocity = 0;
    }

    return {
      bird: {
        ...bird,
        y,
        velocity,
        rotation,
        wingFrame: alive ? wingFrame : 1,
        wingTimer,
      },
      forwardSpeedMultiplier,
    };
  }

  public onCollision(
    bird: BirdState,
    collisionType: 'pipe' | 'ground',
    config: PhysicsConfig
  ): FishCollisionResolution {
    return {
      absorbed: false,
      shouldDie: true,
      reason: 'Sting Ray has no shield.',
    };
  }

  public getAbilityState(): FishAbilityState {
    return {
      fishType: 'singray',
      shieldState: 'used',
      shieldTimeRemaining: 0,
      shieldMaxDuration: 0,
      dashTimeRemaining: this.dashTimer,
      isDashing: this.dashTimer > 0,
      seahorseNextDirection: 'up',
      seahorseActiveDirection: null,
      seahorseSwimTimeRemaining: 0,
      isSeahorseSettling: false,
      isBuoyantSlower: false,
    };
  }
}

/**
 * 5. SEAHORSE BEHAVIOR
 * Special Power: Pressing space switches between swimming upward for 0.1*level seconds
 * and swimming downward for 0.1*level seconds (every other spacebar press) and in both cases
 * settling out to swimming straight.
 */
export class SeahorseBehavior extends BaseFishBehavior {
  public readonly id: FishType = 'seahorse';
  public readonly name = 'Seahorse';
  public readonly level: number;
  public readonly powerTitle = 'Wave Switch';
  public readonly powerDescription: string;

  private nextDirection: 'up' | 'down' = 'up';
  private activeDirection: 'up' | 'down' | null = null;
  private swimTimer: number = 0;
  private readonly activeSwimDuration: number;

  constructor(level: number = 1) {
    super();
    this.level = Math.max(1, level);
    // User formula: 0.1 * level seconds per press
    this.activeSwimDuration = 0.1 * this.level;
    this.powerDescription = `Space switches between swimming up (${this.activeSwimDuration.toFixed(1)}s) & down (${this.activeSwimDuration.toFixed(1)}s), settling straight.`;
  }

  public reset(): void {
    this.nextDirection = 'up';
    this.activeDirection = null;
    this.swimTimer = 0;
  }

  public onFlap(bird: BirdState, config: PhysicsConfig): FishFlapResult {
    // Alternate direction on every spacebar press
    const dir = this.nextDirection;
    this.activeDirection = dir;
    this.swimTimer = this.activeSwimDuration;

    // Toggle next direction for every other spacebar press
    this.nextDirection = dir === 'up' ? 'down' : 'up';
    sound.playSeahorseSwitch(dir === 'up');

    const initialVelocity = dir === 'up' ? -290 : +240;
    const initialRotation = dir === 'up' ? -0.35 : +0.28;

    return {
      velocity: initialVelocity,
      rotation: initialRotation,
      spawnParticles: true,
    };
  }

  public updatePhysics(
    bird: BirdState,
    dt: number,
    config: PhysicsConfig,
    alive: boolean
  ): { bird: BirdState; forwardSpeedMultiplier: number } {
    let { y, velocity, rotation, wingFrame, wingTimer } = bird;

    if (alive) {
      if (this.swimTimer > 0) {
        // Active 0.1 * level s propulsion phase (upward or downward)
        this.swimTimer = Math.max(0, this.swimTimer - dt);

        if (this.activeDirection === 'up') {
          velocity = -290;
          rotation = rotation + (-0.35 - rotation) * Math.min(1, dt * 16);
        } else if (this.activeDirection === 'down') {
          velocity = +240;
          rotation = rotation + (+0.28 - rotation) * Math.min(1, dt * 16);
        }
      } else {
        // "and in both cases settling out to swimming straight"
        // Damps vertical velocity toward 0 and rotation toward 0 (horizontal straight swim)
        this.activeDirection = null;

        // Exponential decay of velocity to 0 (hovering neutrally buoyant)
        velocity = velocity * Math.max(0, 1 - dt * 10);
        if (Math.abs(velocity) < 4) {
          velocity = 0;
        }

        // Smoothly settle angle to 0 (straight ahead)
        rotation = rotation + (0 - rotation) * Math.min(1, dt * 9);
      }

      y += velocity * dt;

      wingTimer += dt;
      if (wingTimer > 0.07) {
        wingTimer = 0;
        wingFrame = (wingFrame + 1) % 3;
      }
    } else {
      // Dead falling
      velocity += config.gravity * 1.3 * dt;
      y += velocity * dt;
      rotation = Math.min(1.57, rotation + dt * 12);
    }

    // Clamps
    if (y < 12) {
      y = 12;
      velocity = 0;
    }
    const groundY = config.virtualHeight - config.groundHeight - bird.height / 2;
    if (y >= groundY) {
      y = groundY;
      velocity = 0;
    }

    return {
      bird: {
        ...bird,
        y,
        velocity,
        rotation,
        wingFrame: alive ? wingFrame : 1,
        wingTimer,
      },
      forwardSpeedMultiplier: 1.0,
    };
  }

  public onCollision(
    bird: BirdState,
    collisionType: 'pipe' | 'ground',
    config: PhysicsConfig
  ): FishCollisionResolution {
    return {
      absorbed: false,
      shouldDie: true,
      reason: 'Seahorse has no shield.',
    };
  }

  public getAbilityState(): FishAbilityState {
    return {
      fishType: 'seahorse',
      shieldState: 'used',
      shieldTimeRemaining: 0,
      shieldMaxDuration: 0,
      dashTimeRemaining: 0,
      isDashing: false,
      seahorseNextDirection: this.nextDirection,
      seahorseActiveDirection: this.activeDirection,
      seahorseSwimTimeRemaining: this.swimTimer,
      isSeahorseSettling: this.swimTimer <= 0 && this.activeDirection === null,
      isBuoyantSlower: false,
    };
  }
}

/**
 * Factory for creating fish behavior instances (Factory Method Pattern).
 */
export class FishBehaviorFactory {
  public static create(fishType: FishType, fishLevel: number = 0): BaseFishBehavior {
    switch (fishType) {
      case 'pufferfish':
        return new PufferFishBehavior(fishLevel);
      case 'clownfish':
        return new ClownFishBehavior(fishLevel);
      case 'singray':
        return new SingRayBehavior(fishLevel);
      case 'seahorse':
        return new SeahorseBehavior(fishLevel);
      case 'octopus':
      default:
        return new OctopusBehavior(fishLevel);
    }
  }
}
