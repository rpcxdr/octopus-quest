import { FishType, Particle, BirdState } from '../types';
import { getFishThemeColor, getFishDisplayName } from './fish';
import { SoundController } from './audio';
import { drawBird } from './renderer';
import { BIRD_SKINS, DEFAULT_FISH_SKINS } from './physics';
import { drawFishBadgeCanvas } from './fishBadgeRenderer';

export interface SplashDroplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface SplashStarBurst {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpd: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FishLevelUpSequence {
  active: boolean;
  fishType: FishType;
  newFishLevel: number;
  levelsGained: number;
  expectedTotalFragments: number;
  delayTimer: number; // Plays after record break juice initial impact
  timer: number;
  duration: number; // ~2.6s
  hasAudioPlayed: boolean;
  x: number;
  y: number;
  scale: number;
  alpha: number;
  plusOneScale: number;
  droplets: SplashDroplet[];
  splashRings: { radius: number; maxRadius: number; alpha: number; thickness: number; color: string }[];
  starBursts: SplashStarBurst[];
}

export interface AnticipationBubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface AnticipationSpotState {
  active: boolean;
  fishType: FishType;
  slotIndex: number;
  pulseTimer: number;   // Timer cycling from 0 to pulsePeriod
  pulsePeriod: number;  // Seconds per cycle (~0.85s, or ~0.425s when doubled)
  isDoubleSpeed?: boolean; // Doubled pulse speed when next fragment increases fish level
  isLevelUpNext?: boolean; // When next fragment increases fish level
  bubbles: AnticipationBubble[];
}

export interface FlyingFragmentAnim {
  id: number;
  fishType: FishType;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetSlotIndex: number;
  progress: number; // 0 to 1
  duration: number; // seconds
  hasLanded: boolean;
  isBeyondRecord: boolean; // Special juicy event when collecting beyond prior record!
  levelGainedData?: {
    newFishLevel: number;
    levelsGained: number;
    expectedTotalFragments: number;
  } | null;
  canAnticipateRecordBreak?: boolean; // Fourth iteration: create extra pulsing bubbling spot upon landing
  nextFragmentIncreasesLevel?: boolean; // Fourth iteration: next fragment increases fish level for that type
}

export interface LandingThumpRing {
  id: number;
  x: number;
  y: number;
  color: string;
  radius: number;
  maxRadius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface ScreenRippleWave {
  id: number;
  originX: number;
  originY: number;
  color: string;
  radius: number;
  maxRadius: number;
  alpha: number;
  life: number;
  maxLife: number;
  thickness: number;
}

export interface ScreenBloomFlash {
  originX: number;
  originY: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface NewRecordBanner {
  text: string;
  subtext?: string;
  fishType: FishType;
  x: number;
  y: number;
  scale: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FragmentRecordJuiceState {
  active: boolean;
  fishType: FishType;
  record: number;           // Total slots = X + Y
  unghostedCount: number;   // Top X slots unghosted initially, increments as fragments land
  currentTargetSlot: number;
  alpha: number;            // 0 to 1 fade opacity
  displayTimer: number;     // seconds to hold visible after landing before fading out
  flyingFragments: FlyingFragmentAnim[];
  thumpRings: LandingThumpRing[];
  screenRipples: ScreenRippleWave[];
  screenBloom: ScreenBloomFlash | null;
  newRecordBanner: NewRecordBanner | null;
  slotBounces: Record<number, number>; // slotIndex -> scale (e.g. 1.68 -> 1.0)
  beyondRecordSlots: number[];         // Slots that achieved a new record beyond prior record
  fishLevelSequence: FishLevelUpSequence | null; // Third iteration: zoomed in fish & giant "+1" splash
  anticipationSpot: AnticipationSpotState | null; // Fourth iteration: pulsing bubbling spot for record breaker
}

export function createRecordJuiceState(): FragmentRecordJuiceState {
  return {
    active: false,
    fishType: 'clownfish',
    record: 0,
    unghostedCount: 0,
    currentTargetSlot: 0,
    alpha: 0,
    displayTimer: 0,
    flyingFragments: [],
    thumpRings: [],
    screenRipples: [],
    screenBloom: null,
    newRecordBanner: null,
    slotBounces: {},
    beyondRecordSlots: [],
    fishLevelSequence: null,
    anticipationSpot: null,
  };
}

// Fixed canvas geometry for the upper-right record column
export const RECORD_COLUMN_CONFIG = {
  centerX: 328,
  topSlotY: 86,
  slotRadius: 12.5,
  slotSpacing: 31,
  podWidth: 34,
};

/**
 * Calculates target coordinates for slot `slotIndex` in the upper right column.
 */
export function getRecordSlotCoords(slotIndex: number): { x: number; y: number } {
  return {
    x: RECORD_COLUMN_CONFIG.centerX,
    y: RECORD_COLUMN_CONFIG.topSlotY + slotIndex * RECORD_COLUMN_CONFIG.slotSpacing,
  };
}

/**
 * Triggers the record column display and launches the flying fragment animation.
 *
 * User specification:
 * - When a player collects a fragment, display for a moment:
 *   a column of fragments in the upper right equaling the record for that fish on this level so far.
 * - If the player has collected X fragments of the fish type so far (not including the one just collected),
 *   the top/uppermost X fragments appear normal/unghosted.
 * - If the player has Y fragments to collect before reaching their past record, display Y ghosted fragments.
 * - Thus X + Y = the current record.
 * - Animate the collected fragment from (startX, startY) into the position of the ghosted fragment
 *   just under the top X unghosted fragment (slot index X).
 *
 * Second Iteration Special Juicy Event:
 * - When you have collected a fragment beyond the prior record:
 *   make it extra juicy when the fragment hits its spot in the column with an effect that ripples
 *   across the whole screen and a more intense sound effect!
 */
export function triggerFragmentRecordJuice(
  state: FragmentRecordJuiceState,
  fishType: FishType,
  startX: number,
  startY: number,
  fragmentsCollectedSoFar: number, // X: not including the fragment just collected
  reefRecord: number,              // past record on this reef for this fish
  baseTotalFragments: number = 0,  // stored total fragments for this fish across all reefs before this run
  hasRemainingInLevel: boolean = false // Whether more fragments remain in the level
): void {
  const X = Math.max(0, Math.floor(fragmentsCollectedSoFar));
  const pastRecord = Math.max(0, Math.floor(reefRecord || 0));

  // Determine total record slots (X + Y)
  // If reefRecord > X, Y = reefRecord - X (ghosted slots to reach past record)
  // If reefRecord <= X (no prior record, or breaking/extending record), show slot for the new fragment: record = X + 1
  const targetRecord = pastRecord > X ? pastRecord : X + 1;
  const targetSlotIndex = X;

  // Number of fragments on this reef in this run including the newly collected fragment
  const fragsNow = X + 1;

  // Beyond record detection:
  // Breaking the prior record occurs whenever the fragments collected in this run (fragsNow)
  // strictly exceed the prior reef record (pastRecord), even if the prior record was zero!
  // (e.g. if prior reef record is 0, collecting the 1st fragment [fragsNow = 1] sets a new record 1 > 0).
  const isBeyondRecord = fragsNow > pastRecord;

  // Fourth Iteration Enhancements:
  // (1) Always trigger anticipation if your record will be even greater (fragsNow >= pastRecord)
  // (2) If the next fragment will be the one that will increase your fish level for that fragment's fish type,
  //     double the pulse speed and overlay a pulsing "+1" in the pulsing ghosted spot.
  const canAnticipateRecordBreak = fragsNow >= pastRecord && hasRemainingInLevel;

  // Check whether collecting the NEXT fragment will increase this fish type's level:
  // When fragsNow >= pastRecord, the next fragment (fragsNow + 1) strictly breaks or extends the record.
  // The delta added to this fish type's total fragments across all reefs will be (fragsNow + 1) - pastRecord.
  const nextFrags = fragsNow + 1;
  const nextDelta = nextFrags - pastRecord;
  const nextExpectedTotal = baseTotalFragments + nextDelta;
  const currentExpectedTotal = baseTotalFragments + Math.max(0, fragsNow - pastRecord);
  const nextFragmentIncreasesLevel =
    canAnticipateRecordBreak &&
    Math.floor(nextExpectedTotal / 10) > Math.floor(currentExpectedTotal / 10);

  // If a previous anticipation spot was active for this fish type and is now captured by this fragment:
  if (state.anticipationSpot && state.anticipationSpot.active && state.anticipationSpot.fishType === fishType) {
    state.anticipationSpot.active = false;
  }

  // Calculate if a new fish level of that type would be achieved if the player successfully completes the level:
  // Corner cases per user specification:
  // Only play this when the expected fragments equal the exact amount needed to increase a fish by a level!
  // (e.g. if record broken by 1, and fish was 49, expected 50: play juice. If broken by 2, expected 51: don't play.
  //  If broken by 11, and fish was 49, expected 60: play juice again!)
  let levelGainedData: {
    newFishLevel: number;
    levelsGained: number;
    expectedTotalFragments: number;
  } | null = null;

  if (isBeyondRecord) {
    const delta = fragsNow - pastRecord;
    const expectedTotal = baseTotalFragments + delta;
    const isExactNewLevelThreshold = (expectedTotal % 10 === 0) && (expectedTotal > baseTotalFragments);

    if (isExactNewLevelThreshold) {
      const baseLevel = Math.floor(baseTotalFragments / 10);
      const newLevel = Math.floor(expectedTotal / 10);
      const levelsGained = newLevel - baseLevel;
      levelGainedData = {
        newFishLevel: newLevel,
        levelsGained,
        expectedTotalFragments: expectedTotal,
      };
    }
  }

  state.active = true;
  state.fishType = fishType;
  state.record = targetRecord;
  state.unghostedCount = X;
  state.currentTargetSlot = targetSlotIndex;
  state.alpha = Math.max(state.alpha, 0.05);
  state.displayTimer = levelGainedData ? 3.4 : (isBeyondRecord ? 2.4 : 1.8);

  const targetCoords = getRecordSlotCoords(targetSlotIndex);

  state.flyingFragments.push({
    id: Math.random(),
    fishType,
    startX,
    startY,
    targetX: targetCoords.x,
    targetY: targetCoords.y,
    targetSlotIndex,
    progress: 0,
    duration: isBeyondRecord ? 0.58 : 0.52, // Slightly more dramatic flight for record breakers
    hasLanded: false,
    isBeyondRecord,
    levelGainedData,
    canAnticipateRecordBreak,
    nextFragmentIncreasesLevel,
  });
}

/**
 * Updates flying fragments, thump rings, screen ripples, screen bloom, slot bounces, and column fade timers.
 */
export function updateRecordJuice(
  state: FragmentRecordJuiceState,
  dt: number,
  sound: SoundController,
  particlesList?: Particle[],
  onScreenShake?: (duration: number) => void,
  checkHasRemaining?: (fishType: FishType) => boolean
): void {
  if (!state.active) return;

  // Smooth fade-in
  if (state.alpha < 1 && state.displayTimer > 0) {
    state.alpha = Math.min(1, state.alpha + dt * 4);
  }

  // Update flying fragments
  const remainingFlying: FlyingFragmentAnim[] = [];

  for (const anim of state.flyingFragments) {
    anim.progress += dt / anim.duration;

    // Spawn micro-trail bubbles & sparkles during flight
    if (particlesList && anim.progress < 1) {
      const ease = 1 - Math.pow(1 - anim.progress, 3);
      const curX = anim.startX + (anim.targetX - anim.startX) * ease;
      const arc = (anim.isBeyondRecord ? -48 : -38) * Math.sin(Math.PI * anim.progress);
      const curY = anim.startY + (anim.targetY - anim.startY) * ease + arc;

      const spawnRate = anim.isBeyondRecord ? 0.75 : 0.45;
      if (Math.random() < spawnRate) {
        const themeColor = getFishThemeColor(anim.fishType);
        const isGold = anim.isBeyondRecord && Math.random() > 0.5;
        particlesList.push({
          id: Math.random(),
          x: curX + (Math.random() - 0.5) * (anim.isBeyondRecord ? 9 : 6),
          y: curY + (Math.random() - 0.5) * (anim.isBeyondRecord ? 9 : 6),
          vx: (Math.random() - 0.5) * (anim.isBeyondRecord ? 30 : 20),
          vy: (Math.random() - 0.5) * (anim.isBeyondRecord ? 30 : 20),
          size: anim.isBeyondRecord ? 2.5 + Math.random() * 3.5 : 2 + Math.random() * 2.5,
          color: isGold ? '#FCD34D' : Math.random() > 0.4 ? themeColor : '#FFFFFF',
          alpha: 0.95,
          maxLife: 0.4,
          life: 0.4,
          isBubble: Math.random() > 0.4,
        });
      }
    }

    if (anim.progress >= 1) {
      if (!anim.hasLanded) {
        anim.hasLanded = true;
        const themeColor = getFishThemeColor(anim.fishType);

        if (anim.isBeyondRecord) {
          // ==========================================
          // SPECIAL JUICY BEYOND-RECORD LANDING EVENT!
          // ==========================================

          // 1. Extra intense, multi-layered triumphant sound effect!
          sound.playRecordBreakThump();

          // 2. Physical screen micro-shake recoil!
          if (onScreenShake) {
            onScreenShake(0.24);
          }

          // 3. Docking slot becomes unghosted & registered as beyond record
          state.unghostedCount = Math.max(state.unghostedCount, anim.targetSlotIndex + 1);
          if (!state.beyondRecordSlots.includes(anim.targetSlotIndex)) {
            state.beyondRecordSlots.push(anim.targetSlotIndex);
          }

          // 4. Massive slot bounce scale punch (1.68x!)
          state.slotBounces[anim.targetSlotIndex] = 1.68;

          // 5. Screen-wide expanding ripple waves (rippling across the whole 360x640 screen!)
          state.screenRipples.push({
            id: Math.random(),
            originX: anim.targetX,
            originY: anim.targetY,
            color: themeColor,
            radius: 8,
            maxRadius: 740, // Sweeps all the way from upper-right to opposite bottom-left corner
            alpha: 1.0,
            life: 0.95,
            maxLife: 0.95,
            thickness: 16,
          });

          // Secondary trailing harmonic ripple wave
          state.screenRipples.push({
            id: Math.random(),
            originX: anim.targetX,
            originY: anim.targetY,
            color: '#FFFFFF',
            radius: 4,
            maxRadius: 690,
            alpha: 0.75,
            life: 0.82,
            maxLife: 0.82,
            thickness: 10,
          });

          // 6. Whole-screen ambient bloom flash
          state.screenBloom = {
            originX: anim.targetX,
            originY: anim.targetY,
            color: themeColor,
            alpha: 0.52,
            life: 0.46,
            maxLife: 0.46,
          };

          // 7. Pop-in "NEW RECORD!" banner badge next to the column
          state.newRecordBanner = {
            text: 'NEW RECORD!',
            subtext: `+1 ${anim.fishType.toUpperCase()}`,
            fishType: anim.fishType,
            x: anim.targetX - 78,
            y: Math.max(55, anim.targetY - 14),
            scale: 0.35,
            alpha: 1.0,
            life: 2.2,
            maxLife: 2.2,
          };

          // 8. Intense local socket shockwave rings
          state.thumpRings.push({
            id: Math.random(),
            x: anim.targetX,
            y: anim.targetY,
            color: '#FCD34D', // Gold
            radius: 8,
            maxRadius: 46,
            alpha: 1.0,
            life: 0.45,
            maxLife: 0.45,
          });
          state.thumpRings.push({
            id: Math.random(),
            x: anim.targetX,
            y: anim.targetY,
            color: themeColor,
            radius: 6,
            maxRadius: 36,
            alpha: 1.0,
            life: 0.38,
            maxLife: 0.38,
          });

          // 9. Majestic sparkle burst & star torrent (28+ radiant particles!)
          if (particlesList) {
            for (let i = 0; i < 28; i++) {
              const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.4;
              const spd = 50 + Math.random() * 95;
              const isGold = i % 3 === 0;
              particlesList.push({
                id: Math.random(),
                x: anim.targetX,
                y: anim.targetY,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: 3.0 + Math.random() * 3.5,
                color: isGold ? '#FCD34D' : i % 2 === 0 ? themeColor : '#FFFFFF',
                alpha: 1,
                maxLife: 0.55,
                life: 0.55,
                isBubble: Math.random() > 0.45,
              });
            }
          }

          // 10. Generous hold timer to celebrate the achievement
          state.displayTimer = 2.4;

          // 11. Third Iteration: If a new fish level of that type would be achieved if player completes level,
          // play extra juicy sequence featuring zoomed-in fish and giant "+1" juice splash!
          if (anim.levelGainedData) {
            state.fishLevelSequence = {
              active: true,
              fishType: anim.fishType,
              newFishLevel: anim.levelGainedData.newFishLevel,
              levelsGained: anim.levelGainedData.levelsGained,
              expectedTotalFragments: anim.levelGainedData.expectedTotalFragments,
              delayTimer: 0.35, // After the new record juice plays its initial impact
              timer: 0,
              duration: 2.6,
              hasAudioPlayed: false,
              x: 180,
              y: 185,
              scale: 0,
              alpha: 0,
              plusOneScale: 0,
              droplets: [],
              splashRings: [],
              starBursts: [],
            };
            state.displayTimer = 3.5;
          }
        } else {
          // ==========================================
          // STANDARD FRAGMENT DOCKING
          // ==========================================

          // 1. Satisfying tactile UX thump sound
          sound.playFragmentThump();

          // 2. Docking slot becomes unghosted
          state.unghostedCount = Math.max(state.unghostedCount, anim.targetSlotIndex + 1);

          // 3. Standard slot scale bounce
          state.slotBounces[anim.targetSlotIndex] = 1.38;

          // 4. Expanding shockwave ring at slot
          state.thumpRings.push({
            id: Math.random(),
            x: anim.targetX,
            y: anim.targetY,
            color: themeColor,
            radius: 6,
            maxRadius: 28,
            alpha: 0.95,
            life: 0.35,
            maxLife: 0.35,
          });

          // 5. Impact sparkle burst
          if (particlesList) {
            for (let i = 0; i < 12; i++) {
              const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3;
              const spd = 40 + Math.random() * 55;
              particlesList.push({
                id: Math.random(),
                x: anim.targetX,
                y: anim.targetY,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: 2.5 + Math.random() * 2.5,
                color: i % 2 === 0 ? themeColor : '#FFFFFF',
                alpha: 1,
                maxLife: 0.4,
                life: 0.4,
                isBubble: Math.random() > 0.5,
              });
            }
          }
        }

        // Fourth Iteration:
        // (1) Always trigger this if your record will be even greater (fragsNow >= pastRecord)
        // (2) If the next fragment will be the one that will increase your fish level for that fragment's fish type,
        //     double the pulse speed and overlay a pulsing "+1" in the pulsing ghosted spot.
        if (anim.canAnticipateRecordBreak && (!checkHasRemaining || checkHasRemaining(anim.fishType))) {
          const nextSlotIndex = anim.targetSlotIndex + 1;
          const isLevelUpNext = !!anim.nextFragmentIncreasesLevel;
          const pulsePeriod = isLevelUpNext ? 0.425 : 0.85; // Double pulse speed if next fragment increases fish level!
          state.anticipationSpot = {
            active: true,
            fishType: anim.fishType,
            slotIndex: nextSlotIndex,
            pulseTimer: 0,
            pulsePeriod,
            isDoubleSpeed: isLevelUpNext,
            isLevelUpNext,
            bubbles: [],
          };
          state.record = Math.max(state.record, nextSlotIndex + 1); // Expand column by 1 extra slot to accommodate anticipation spot
          state.displayTimer = 9999;        // Hold visible until captured or passed
          state.alpha = 1.0;

          // Trigger synchronized pulsing sound effect immediately on appearance!
          sound.playAnticipationPulse(isLevelUpNext);
        } else if (!anim.isBeyondRecord) {
          // Reset hold timer to display the column for a moment after landing
          state.displayTimer = 1.75;
        }
      }
    } else {
      remainingFlying.push(anim);
    }
  }

  state.flyingFragments = remainingFlying;

  // Decay slot scale bounces
  for (const key of Object.keys(state.slotBounces)) {
    const idx = Number(key);
    const cur = state.slotBounces[idx];
    if (cur > 1.0) {
      state.slotBounces[idx] = Math.max(1.0, cur - dt * 2.4);
    }
  }

  // Update thump shockwave rings
  state.thumpRings = state.thumpRings
    .map((r) => {
      const life = r.life - dt;
      const progress = 1 - Math.max(0, life) / r.maxLife;
      return {
        ...r,
        life,
        radius: 6 + (r.maxRadius - 6) * progress,
        alpha: 0.95 * (1 - progress),
      };
    })
    .filter((r) => r.life > 0);

  // Update screen ripple waves (rippling across whole screen!)
  state.screenRipples = state.screenRipples
    .map((ripple) => {
      const life = ripple.life - dt;
      const progress = 1 - Math.max(0, life) / ripple.maxLife;
      // Exponential expanding wave speed
      const easeProgress = Math.sqrt(progress);
      return {
        ...ripple,
        life,
        radius: 8 + (ripple.maxRadius - 8) * easeProgress,
        alpha: (1 - progress) * (progress < 0.1 ? progress / 0.1 : 1),
        thickness: Math.max(3, ripple.thickness * (1 - progress * 0.5)),
      };
    })
    .filter((r) => r.life > 0);

  // Update screen bloom flash
  if (state.screenBloom) {
    state.screenBloom.life -= dt;
    const progress = 1 - Math.max(0, state.screenBloom.life) / state.screenBloom.maxLife;
    state.screenBloom.alpha = 0.52 * Math.max(0, 1 - progress);
    if (state.screenBloom.life <= 0) {
      state.screenBloom = null;
    }
  }

  // Update "NEW RECORD!" banner
  if (state.newRecordBanner) {
    state.newRecordBanner.life -= dt;
    // Bouncy pop-in scale
    if (state.newRecordBanner.scale < 1.0) {
      state.newRecordBanner.scale = Math.min(1.0, state.newRecordBanner.scale + dt * 5.5);
    }
    // Fade out near end of life
    if (state.newRecordBanner.life < 0.4) {
      state.newRecordBanner.alpha = Math.max(0, state.newRecordBanner.life / 0.4);
    }
    if (state.newRecordBanner.life <= 0) {
      state.newRecordBanner = null;
    }
  }

  // Update Fish Level Up Celebration Sequence
  if (state.fishLevelSequence && state.fishLevelSequence.active) {
    const seq = state.fishLevelSequence;
    if (seq.delayTimer > 0) {
      seq.delayTimer -= dt;
      if (seq.delayTimer <= 0 && !seq.hasAudioPlayed) {
        seq.hasAudioPlayed = true;

        // Audio: Continue harmonic progression upward from iteration two record-breaking juice!
        sound.playFishLevelUpSplash();

        // Celebratory physical screen recoil
        if (onScreenShake) {
          onScreenShake(0.26);
        }

        // Spawn giant "+1" juice splash droplets & starbursts around (seq.x + 54, seq.y + 4)
        const splashOriginX = seq.x + 54;
        const splashOriginY = seq.y + 4;
        const themeColor = getFishThemeColor(seq.fishType);

        // 1. Water splash droplets with parabolic gravity trajectory
        for (let d = 0; d < 32; d++) {
          const ang = (Math.PI * 2 * d) / 32 + (Math.random() - 0.5) * 0.35;
          const spd = 65 + Math.random() * 125;
          const isGold = d % 3 === 0;
          seq.droplets.push({
            x: splashOriginX + (Math.random() - 0.5) * 14,
            y: splashOriginY + (Math.random() - 0.5) * 14,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 35, // slight upward bias
            radius: 2.2 + Math.random() * 3.6,
            color: isGold ? '#FCD34D' : (d % 2 === 0 ? '#38BDF8' : '#FFFFFF'),
            alpha: 1.0,
            life: 0.7,
            maxLife: 0.7,
          });
        }

        // 2. Spinning golden star bursts
        for (let s = 0; s < 18; s++) {
          const ang = (Math.PI * 2 * s) / 18;
          const spd = 50 + Math.random() * 85;
          seq.starBursts.push({
            x: splashOriginX,
            y: splashOriginY,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            rot: Math.random() * Math.PI,
            rotSpd: (Math.random() - 0.5) * 14,
            size: 3.5 + Math.random() * 4.5,
            color: s % 2 === 0 ? '#FCD34D' : '#FFFBEB',
            alpha: 1.0,
            life: 0.6,
            maxLife: 0.6,
          });
        }

        // 3. Concentric splash shockwave rings
        seq.splashRings.push({
          radius: 8,
          maxRadius: 80,
          alpha: 1.0,
          thickness: 4.5,
          color: '#38BDF8',
        });
        seq.splashRings.push({
          radius: 4,
          maxRadius: 65,
          alpha: 0.9,
          thickness: 3.0,
          color: '#FCD34D',
        });
      }
    } else {
      seq.timer += dt;

      // Elastic pop-in scale for the main badge
      const popT = Math.min(1, seq.timer / 0.28);
      const overshoot = Math.sin(popT * Math.PI * 0.75) * 1.15;
      seq.scale = popT < 1 ? overshoot : Math.max(1.0, seq.scale - dt * 1.5);

      // Giant "+1" juice splash punch scale (overshoots to 1.45 then settles)
      const plusT = Math.min(1, seq.timer / 0.22);
      const plusOvershoot = Math.sin(plusT * Math.PI * 0.75) * 1.45;
      seq.plusOneScale = plusT < 1 ? plusOvershoot : Math.max(1.0, seq.plusOneScale - dt * 2.0);

      // Fade in quickly, hold, then fade out during last 0.5s
      if (seq.timer < 0.2) {
        seq.alpha = seq.timer / 0.2;
      } else if (seq.timer > seq.duration - 0.5) {
        seq.alpha = Math.max(0, (seq.duration - seq.timer) / 0.5);
      } else {
        seq.alpha = 1.0;
      }

      // Update splash droplets (gravity + velocity)
      seq.droplets = seq.droplets
        .map((d) => ({
          ...d,
          x: d.x + d.vx * dt,
          y: d.y + d.vy * dt,
          vy: d.vy + 200 * dt, // gravity
          life: d.life - dt,
          alpha: Math.max(0, (d.life - dt) / d.maxLife),
        }))
        .filter((d) => d.life > 0);

      // Update starbursts
      seq.starBursts = seq.starBursts
        .map((s) => ({
          ...s,
          x: s.x + s.vx * dt,
          y: s.y + s.vy * dt,
          rot: s.rot + s.rotSpd * dt,
          life: s.life - dt,
          alpha: Math.max(0, (s.life - dt) / s.maxLife),
        }))
        .filter((s) => s.life > 0);

      // Update splash rings
      seq.splashRings = seq.splashRings
        .map((r) => ({
          ...r,
          radius: r.radius + (r.maxRadius - r.radius) * dt * 4.5,
          alpha: Math.max(0, r.alpha - dt * 2.2),
        }))
        .filter((r) => r.alpha > 0.02);

      if (seq.timer >= seq.duration) {
        seq.active = false;
        state.fishLevelSequence = null;
      }
    }
  }

  // =========================================================================
  // FOURTH ITERATION: UPDATE ANTICIPATION SPOT (PULSING & BUBBLING FOR RECORD BREAKER)
  // =========================================================================
  if (state.anticipationSpot && state.anticipationSpot.active) {
    const spot = state.anticipationSpot;

    // Check ending condition: "or the final fragment has been passed (thus no chance for that spot to be filled.)"
    if (checkHasRemaining && !checkHasRemaining(spot.fishType)) {
      spot.active = false;
      // Revert column back to normal earned slot count
      state.record = Math.max(
        state.unghostedCount,
        state.beyondRecordSlots.length ? Math.max(...state.beyondRecordSlots) + 1 : state.record - 1
      );
      state.displayTimer = 1.8; // Allow graceful fade-out
    } else {
      // Keep column prominently visible while anticipating
      state.alpha = Math.max(state.alpha, 1.0);
      state.displayTimer = 9999;

      // Synchronized pulsing timer & sound effect (supporting doubled pulse speed)
      spot.pulseTimer += dt;
      if (spot.pulseTimer >= spot.pulsePeriod) {
        spot.pulseTimer -= spot.pulsePeriod;
        sound.playAnticipationPulse(spot.isDoubleSpeed);
      }

      // Spawn buoyant rising bubbles from the anticipation socket (flurry rate increased on double speed)
      const coords = getRecordSlotCoords(spot.slotIndex);
      const bubbleRate = spot.isDoubleSpeed ? dt * 13.5 : dt * 7.5;
      if (Math.random() < bubbleRate) {
        spot.bubbles.push({
          id: Math.random(),
          x: coords.x + (Math.random() - 0.5) * 14,
          y: coords.y + 4 + Math.random() * 4,
          vx: (Math.random() - 0.5) * (spot.isDoubleSpeed ? 14 : 10),
          vy: -(spot.isDoubleSpeed ? 22 + Math.random() * 26 : 18 + Math.random() * 22),
          radius: 1.4 + Math.random() * (spot.isLevelUpNext ? 2.6 : 2.2),
          alpha: 0.9,
          life: 0.75 + Math.random() * 0.4,
          maxLife: 0.75 + Math.random() * 0.4,
        });
      }

      // Update bubbles
      for (let b = spot.bubbles.length - 1; b >= 0; b--) {
        const bub = spot.bubbles[b];
        bub.life -= dt;
        bub.x += bub.vx * dt + Math.sin(bub.life * 12) * 0.35;
        bub.y += bub.vy * dt;
        bub.alpha = Math.max(0, bub.life / bub.maxLife);
        if (bub.life <= 0) {
          spot.bubbles.splice(b, 1);
        }
      }
    }
  }

  // When all flying fragments have landed, tick down the hold timer then fade out
  if (state.flyingFragments.length === 0) {
    if (state.fishLevelSequence && state.fishLevelSequence.active) {
      state.displayTimer = Math.max(state.displayTimer, 0.6);
    } else if (state.anticipationSpot && state.anticipationSpot.active) {
      // Keep visible while anticipation is active!
      state.displayTimer = 9999;
      state.alpha = Math.max(state.alpha, 1.0);
    } else if (state.displayTimer > 0) {
      state.displayTimer -= dt;
    } else {
      state.alpha -= dt * 2.2;
      if (state.alpha <= 0) {
        state.alpha = 0;
        state.active = false;
        state.beyondRecordSlots = [];
      }
    }
  }
}

export interface RecordColumnDrawOptions {
  centerX: number;
  topSlotY: number;
  slotRadius: number;
  slotSpacing: number;
  podWidth: number;
  fishType: FishType;
  record: number;
  unghostedCount: number;
  beyondRecordSlots?: number[];
  slotBounces?: Record<number, number>;
  alpha?: number;
  time?: number;
  headerLabel?: string;
  isAnticipationSpotActive?: boolean;
  anticipationSpot?: AnticipationSpotState | null;
  currentTargetSlot?: number;
}

/**
 * Renders an authentic Record Column capsule pod with stacked record slots.
 * Shared between the in-game HUD and the post-reef Reef Cleared modal.
 */
export function drawRecordColumnPod(
  ctx: CanvasRenderingContext2D,
  options: RecordColumnDrawOptions
): void {
  const {
    centerX,
    topSlotY,
    slotRadius,
    slotSpacing,
    podWidth,
    fishType,
    record,
    unghostedCount,
    beyondRecordSlots = [],
    slotBounces = {},
    alpha = 1.0,
    time = 0,
    headerLabel = 'RECORD',
    isAnticipationSpotActive = false,
    anticipationSpot = null,
    currentTargetSlot = -1,
  } = options;

  if (record <= 0 || alpha <= 0) return;

  const themeColor = getFishThemeColor(fishType);

  ctx.save();
  ctx.globalAlpha = alpha;

  // 1. COLUMN CAPSULE POD BACKGROUND
  const podHeight = (record - 1) * slotSpacing + slotRadius * 2 + 22;
  const podLeft = centerX - podWidth / 2;
  const podTop = topSlotY - slotRadius - 13;
  const podRadius = 16;

  // Outer ambient glow
  const colGlow = ctx.createRadialGradient(
    centerX,
    podTop + podHeight * 0.4,
    10,
    centerX,
    podTop + podHeight * 0.4,
    podHeight * 0.85
  );
  colGlow.addColorStop(0, `${themeColor}28`);
  colGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = colGlow;
  ctx.fillRect(podLeft - 12, podTop - 8, podWidth + 24, podHeight + 16);

  // Pod capsule body
  ctx.beginPath();
  ctx.roundRect(podLeft, podTop, podWidth, podHeight, podRadius);
  ctx.fillStyle = 'rgba(8, 14, 28, 0.90)';
  ctx.fill();

  // Pod border with subtle shimmer
  ctx.strokeStyle = beyondRecordSlots.length > 0
    ? '#FCD34Daa'
    : (isAnticipationSpotActive ? '#FCD34D88' : `${themeColor}66`);
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Top header label: "RECORD"
  ctx.font = 'bold 7.5px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = beyondRecordSlots.length > 0 ? '#FCD34D' : '#94A3B8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(headerLabel, centerX, podTop + 4);

  // 2. SLOTS (Top X unghosted, remaining Y ghosted)
  for (let i = 0; i < record; i++) {
    const slotY = topSlotY + i * slotSpacing;
    const isUnghosted = i < unghostedCount;
    const isBeyondRecordSlot = beyondRecordSlots.includes(i);
    const bounce = slotBounces[i] || 1.0;

    ctx.save();
    ctx.translate(centerX, slotY);
    if (bounce !== 1.0) {
      ctx.scale(bounce, bounce);
    }

    if (isUnghosted) {
      // --- NORMAL / UNGHOSTED FRAGMENT ---
      const activeColor = isBeyondRecordSlot ? '#FCD34D' : themeColor;

      // Soft radial outer theme glow
      const glow = ctx.createRadialGradient(
        0,
        0,
        slotRadius * 0.3,
        0,
        0,
        slotRadius * (isBeyondRecordSlot ? 2.4 : 1.8)
      );
      glow.addColorStop(0, isBeyondRecordSlot ? 'rgba(252, 211, 77, 0.65)' : `${themeColor}55`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, slotRadius * (isBeyondRecordSlot ? 2.4 : 1.8), 0, Math.PI * 2);
      ctx.fill();

      // Beyond-record special sunburst corona / star rays!
      if (isBeyondRecordSlot) {
        ctx.save();
        const starRot = time * 0.003 + i * 0.5;
        ctx.rotate(starRot);
        ctx.strokeStyle = 'rgba(252, 211, 77, 0.75)';
        ctx.lineWidth = 1.4;
        const numRays = 8;
        for (let r = 0; r < numRays; r++) {
          const ang = (Math.PI * 2 * r) / numRays;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * (slotRadius + 1), Math.sin(ang) * (slotRadius + 1));
          ctx.lineTo(Math.cos(ang) * (slotRadius + 5), Math.sin(ang) * (slotRadius + 5));
          ctx.stroke();
        }
        ctx.restore();
      }

      // Rotating diamond facet ring
      const rot = (time * 0.002 + i * 1.2) % (Math.PI * 2);
      ctx.save();
      ctx.rotate(rot);
      ctx.strokeStyle = isBeyondRecordSlot ? '#FCD34D' : `${themeColor}99`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const d = slotRadius * 1.22;
      ctx.moveTo(0, -d);
      ctx.lineTo(d, 0);
      ctx.lineTo(0, d);
      ctx.lineTo(-d, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Crystal medallion body
      const bodyGrad = ctx.createRadialGradient(
        -slotRadius * 0.3,
        -slotRadius * 0.3,
        2,
        0,
        0,
        slotRadius
      );
      bodyGrad.addColorStop(0, '#FFFFFF');
      bodyGrad.addColorStop(0.35, activeColor);
      bodyGrad.addColorStop(0.85, '#0F172A');
      bodyGrad.addColorStop(1, '#020617');

      ctx.beginPath();
      ctx.arc(0, 0, slotRadius, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Crisp iridescent border (Gold if beyond record, white otherwise)
      ctx.strokeStyle = isBeyondRecordSlot ? '#FFFBEB' : '#FFFFFF';
      ctx.lineWidth = isBeyondRecordSlot ? 1.8 : 1.4;
      ctx.stroke();

      // Inner theme accent rim
      ctx.beginPath();
      ctx.arc(0, 0, slotRadius - 2, 0, Math.PI * 2);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Full-color centered fish sprite
      drawFishBadgeCanvas(ctx, fishType, 0, 0, slotRadius * 1.35);

      // Specular glint
      ctx.beginPath();
      ctx.ellipse(
        -slotRadius * 0.36,
        -slotRadius * 0.36,
        slotRadius * 0.28,
        slotRadius * 0.14,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();
    } else {
      // --- GHOSTED FRAGMENT ---
      const isAnticipationSpot =
        anticipationSpot &&
        anticipationSpot.active &&
        i === anticipationSpot.slotIndex;
      const isTargetSlot = i === currentTargetSlot;

      if (isAnticipationSpot) {
        // Heartbeat pulsing ghosted spot
        const spot = anticipationSpot;
        const pulseRatio = spot.pulseTimer / spot.pulsePeriod;
        const pulseSin = Math.sin(pulseRatio * Math.PI);
        const pulseScale = 1.0 + pulseSin * (spot.isDoubleSpeed ? 0.28 : 0.22);

        ctx.scale(pulseScale, pulseScale);

        const auraRadius = slotRadius * (spot.isLevelUpNext ? 2.2 + pulseSin * 1.0 : 1.8 + pulseSin * 0.8);
        const auraGrad = ctx.createRadialGradient(
          0,
          0,
          slotRadius * 0.3,
          0,
          0,
          auraRadius
        );
        if (spot.isLevelUpNext) {
          auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
          auraGrad.addColorStop(0.45, `${themeColor}aa`);
          auraGrad.addColorStop(0.75, 'rgba(252, 211, 77, 0.45)');
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          auraGrad.addColorStop(0, `${themeColor}77`);
          auraGrad.addColorStop(0.5, 'rgba(252, 211, 77, 0.45)');
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, slotRadius, 0, Math.PI * 2);
        ctx.fillStyle = spot.isLevelUpNext ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.82)';
        ctx.fill();

        ctx.save();
        ctx.setLineDash([4, 3]);
        ctx.lineDashOffset = -time * (spot.isDoubleSpeed ? 0.038 : 0.018);
        ctx.strokeStyle = spot.isLevelUpNext ? '#FEF08A' : '#FCD34D';
        ctx.lineWidth = (spot.isLevelUpNext ? 2.0 : 1.6) + pulseSin * 0.5;
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(0, 0, slotRadius - 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${spot.isLevelUpNext ? 0.55 + pulseSin * 0.4 : 0.35 + pulseSin * 0.4})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        ctx.save();
        ctx.globalAlpha = alpha * (spot.isLevelUpNext ? 0.28 : (0.55 + pulseSin * 0.35));
        drawFishBadgeCanvas(ctx, fishType, 0, 0, slotRadius * 1.35);
        ctx.restore();

        if (spot.isLevelUpNext) {
          ctx.save();
          const plusScale = 1.0 + pulseSin * 0.25;
          ctx.scale(plusScale, plusScale);
          ctx.font = '900 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 8 + pulseSin * 6;
          ctx.strokeStyle = '#78350F';
          ctx.lineWidth = 3.2;
          ctx.strokeText('+1', 0, 0.5);
          ctx.fillStyle = '#FEF08A';
          ctx.fillText('+1', 0, 0.5);
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(2.8, -4.5, 1.2 + pulseSin * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.save();
        const starAngle = -Math.PI / 4 + (spot.isDoubleSpeed ? time * 0.005 : 0);
        const starDist = slotRadius + 2.5;
        ctx.translate(Math.cos(starAngle) * starDist, Math.sin(starAngle) * starDist);
        ctx.fillStyle = spot.isLevelUpNext ? '#FEF08A' : '#FCD34D';
        ctx.beginPath();
        ctx.arc(0, 0, (spot.isLevelUpNext ? 2.8 : 2.2) + pulseSin * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Standard ghosted slot
        ctx.beginPath();
        ctx.arc(0, 0, slotRadius, 0, Math.PI * 2);
        ctx.fillStyle = isTargetSlot ? 'rgba(15, 23, 42, 0.72)' : 'rgba(15, 23, 42, 0.45)';
        ctx.fill();

        ctx.setLineDash([3, 2.5]);
        ctx.strokeStyle = isTargetSlot ? `${themeColor}bb` : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(0, 0, slotRadius - 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.save();
        ctx.globalAlpha = alpha * (isTargetSlot ? 0.48 : 0.25);
        drawFishBadgeCanvas(ctx, fishType, 0, 0, slotRadius * 1.3);
        ctx.restore();

        if (isTargetSlot) {
          const pulse = 1 + Math.sin(time * 0.008) * 0.08;
          ctx.beginPath();
          ctx.arc(0, 0, slotRadius * pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `${themeColor}77`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws the whole-screen ripple effects, ambient bloom flash, record column, ghosted/unghosted slots,
 * new record banner, and in-flight animated fragments.
 */
export function drawRecordJuice(
  ctx: CanvasRenderingContext2D,
  state: FragmentRecordJuiceState,
  time: number
): void {
  if (!state.active || state.alpha <= 0 || state.record <= 0) return;

  const { record, fishType, unghostedCount, alpha, slotBounces, beyondRecordSlots } = state;
  const themeColor = getFishThemeColor(fishType);

  const { centerX, topSlotY, slotRadius, slotSpacing, podWidth } = RECORD_COLUMN_CONFIG;

  ctx.save();

  // =========================================================================
  // 1. FULL-SCREEN BLOOM FLASH (Instantaneous radiant wash on impact)
  // =========================================================================
  if (state.screenBloom && state.screenBloom.alpha > 0.01) {
    ctx.save();
    const bAlpha = state.screenBloom.alpha * alpha;
    const bloomGrad = ctx.createRadialGradient(
      state.screenBloom.originX,
      state.screenBloom.originY,
      10,
      state.screenBloom.originX,
      state.screenBloom.originY,
      520
    );
    bloomGrad.addColorStop(0, `rgba(255, 255, 255, ${bAlpha * 0.75})`);
    bloomGrad.addColorStop(0.2, `${themeColor}${Math.floor(bAlpha * 0.6 * 255).toString(16).padStart(2, '0')}`);
    bloomGrad.addColorStop(0.7, `${themeColor}11`);
    bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = bloomGrad;
    ctx.fillRect(0, 0, 360, 640);
    ctx.restore();
  }

  // =========================================================================
  // 2. FULL-SCREEN EXPANDING RIPPLE WAVES (Rippling across the whole screen!)
  // =========================================================================
  if (state.screenRipples.length > 0) {
    ctx.save();
    for (const ripple of state.screenRipples) {
      const rAlpha = ripple.alpha * alpha;
      if (rAlpha <= 0.01) continue;

      // Outer refractive ambient wash band
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const washGrad = ctx.createRadialGradient(
        ripple.originX,
        ripple.originY,
        Math.max(0, ripple.radius - ripple.thickness * 2.2),
        ripple.originX,
        ripple.originY,
        ripple.radius + ripple.thickness * 1.5
      );
      washGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      washGrad.addColorStop(0.4, `${ripple.color}${Math.floor(rAlpha * 0.35 * 255).toString(16).padStart(2, '0')}`);
      washGrad.addColorStop(0.65, `rgba(255, 255, 255, ${rAlpha * 0.45})`);
      washGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = washGrad;
      ctx.beginPath();
      ctx.arc(ripple.originX, ripple.originY, ripple.radius + ripple.thickness * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Sharp primary shockwave ring
      ctx.save();
      ctx.globalAlpha = rAlpha * 0.9;
      ctx.beginPath();
      ctx.arc(ripple.originX, ripple.originY, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = ripple.color;
      ctx.lineWidth = ripple.thickness * 0.6;
      ctx.stroke();

      // Inner white high-frequency crest
      ctx.beginPath();
      ctx.arc(ripple.originX, ripple.originY, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = Math.max(1.2, ripple.thickness * 0.22);
      ctx.stroke();

      // Secondary subtle harmonic echo ring
      if (ripple.radius > 32) {
        ctx.beginPath();
        ctx.arc(ripple.originX, ripple.originY, ripple.radius - 28, 0, Math.PI * 2);
        ctx.strokeStyle = `${ripple.color}55`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  ctx.globalAlpha = alpha;

  // =========================================================================
  // 3. COLUMN CAPSULE POD & RECORD SLOTS (Extracted for shared use in modals)
  // =========================================================================
  drawRecordColumnPod(ctx, {
    centerX,
    topSlotY,
    slotRadius,
    slotSpacing,
    podWidth,
    fishType,
    record,
    unghostedCount,
    beyondRecordSlots,
    slotBounces,
    alpha,
    time,
    headerLabel: 'RECORD',
    isAnticipationSpotActive: Boolean(state.anticipationSpot?.active),
    anticipationSpot: state.anticipationSpot,
    currentTargetSlot: state.currentTargetSlot,
  });

  // Draw buoyant bubbling particles rising from the anticipation spot
  if (state.anticipationSpot && state.anticipationSpot.active && state.anticipationSpot.bubbles.length > 0) {
    for (const bub of state.anticipationSpot.bubbles) {
      ctx.save();
      ctx.globalAlpha = alpha * bub.alpha;
      ctx.beginPath();
      ctx.arc(bub.x, bub.y, bub.radius, 0, Math.PI * 2);
      ctx.fillStyle = state.anticipationSpot?.isLevelUpNext
        ? (bub.id % 2 === 0 ? 'rgba(254, 240, 138, 0.78)' : 'rgba(186, 230, 253, 0.72)')
        : 'rgba(186, 230, 253, 0.65)';
      ctx.fill();
      ctx.strokeStyle = state.anticipationSpot?.isLevelUpNext ? 'rgba(254, 240, 138, 0.92)' : 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Specular shine dot
      ctx.beginPath();
      ctx.arc(bub.x - bub.radius * 0.35, bub.y - bub.radius * 0.35, bub.radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
      ctx.restore();
    }
  }

  // =========================================================================
  // 5. "NEW RECORD" GLOWING BANNER BADGE
  // =========================================================================
  if (state.newRecordBanner && state.newRecordBanner.alpha > 0.01) {
    const banner = state.newRecordBanner;
    ctx.save();
    ctx.globalAlpha = alpha * banner.alpha;
    ctx.translate(banner.x, banner.y);
    ctx.scale(banner.scale, banner.scale);

    const badgeText = '★ NEW RECORD ★';
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    const metrics = ctx.measureText(badgeText);

    const ascent = metrics.actualBoundingBoxAscent ?? 7;
    const descent = metrics.actualBoundingBoxDescent ?? 0;

    // Pill badge background with balanced padding so stars are not crammed into rounded corners
    const textWidth = metrics.width;
    const bW = Math.max(94, Math.ceil(textWidth + 20));
    const bH = 24;
    const bR = bH / 2; // 12px pill radius

    ctx.beginPath();
    ctx.roundRect(-bW / 2, -bH / 2, bW, bH, bR);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fill();

    // Golden accent border
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#FCD34D';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing badge text - centered horizontally at x = 0 and optically centered vertically
    ctx.fillStyle = '#FCD34D';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    const opticalY = (ascent - descent) / 2;
    ctx.fillText(badgeText, 0, opticalY);

    ctx.restore();
  }

  // =========================================================================
  // 6. THUMP IMPACT RINGS (Local socket shockwaves)
  // =========================================================================
  for (const ring of state.thumpRings) {
    ctx.save();
    ctx.globalAlpha = alpha * ring.alpha;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius * 0.65, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // 7. IN-FLIGHT FLYING FRAGMENTS
  // =========================================================================
  for (const anim of state.flyingFragments) {
    const t = Math.min(1, anim.progress);
    // Smooth cubic ease-out
    const ease = 1 - Math.pow(1 - t, 3);
    const curX = anim.startX + (anim.targetX - anim.startX) * ease;
    const arcHeight = anim.isBeyondRecord ? -48 : -40;
    const arc = arcHeight * Math.sin(Math.PI * t);
    const curY = anim.startY + (anim.targetY - anim.startY) * ease + arc;

    // Slight launch pop scale
    const flightScale = (anim.isBeyondRecord ? 1.25 : 1.15) - 0.15 * ease;

    ctx.save();
    ctx.translate(curX, curY);
    ctx.scale(flightScale, flightScale);

    // Glowing flight aura (Golden & Theme if beyond record!)
    const flyGlow = ctx.createRadialGradient(
      0,
      0,
      slotRadius * 0.4,
      0,
      0,
      slotRadius * (anim.isBeyondRecord ? 2.8 : 2.2)
    );
    flyGlow.addColorStop(0, anim.isBeyondRecord ? 'rgba(252, 211, 77, 0.85)' : `${themeColor}88`);
    flyGlow.addColorStop(0.6, `${themeColor}44`);
    flyGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = flyGlow;
    ctx.beginPath();
    ctx.arc(0, 0, slotRadius * (anim.isBeyondRecord ? 2.8 : 2.2), 0, Math.PI * 2);
    ctx.fill();

    // Rotating facet ring
    ctx.save();
    ctx.rotate((time * (anim.isBeyondRecord ? 0.008 : 0.005) + anim.id) % (Math.PI * 2));
    ctx.strokeStyle = anim.isBeyondRecord ? '#FCD34D' : '#FFFFFF';
    ctx.lineWidth = anim.isBeyondRecord ? 1.6 : 1.3;
    ctx.beginPath();
    const d = slotRadius * 1.25;
    ctx.moveTo(0, -d);
    ctx.lineTo(d, 0);
    ctx.lineTo(0, d);
    ctx.lineTo(-d, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Main vibrant crystal body
    const bodyGrad = ctx.createRadialGradient(
      -slotRadius * 0.3,
      -slotRadius * 0.3,
      2,
      0,
      0,
      slotRadius
    );
    bodyGrad.addColorStop(0, '#FFFFFF');
    bodyGrad.addColorStop(0.35, anim.isBeyondRecord ? '#FCD34D' : themeColor);
    bodyGrad.addColorStop(0.85, '#0F172A');
    bodyGrad.addColorStop(1, '#020617');

    ctx.beginPath();
    ctx.arc(0, 0, slotRadius, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // White iridescent border
    ctx.strokeStyle = anim.isBeyondRecord ? '#FFFBEB' : '#FFFFFF';
    ctx.lineWidth = anim.isBeyondRecord ? 2.2 : 1.8;
    ctx.stroke();

    // Centered fish sprite
    drawFishBadgeCanvas(ctx, fishType, 0, 0, (slotRadius || 11) * 1.35);

    // Specular shine glint
    ctx.beginPath();
    ctx.ellipse(
      -slotRadius * 0.36,
      -slotRadius * 0.36,
      slotRadius * 0.3,
      slotRadius * 0.15,
      -Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();

    ctx.restore();
  }

  // Note: Fish Level Up Celebration Sequence (zoomed in fish & giant "+1" juice splash)
  // is rendered via drawFishLevelJuice in front of background but behind column obstacles!

  ctx.restore();
}

/**
 * Draws the giant fish level gained celebration sequence (zoomed-in fish & giant "+1" juice splash).
 * Rendered in front of the background, but behind column obstacles (pipes),
 * ensuring it never obscures gameplay or pipe navigation.
 */
export function drawFishLevelJuice(
  ctx: CanvasRenderingContext2D,
  state: FragmentRecordJuiceState,
  time: number
): void {
  if (
    !state.fishLevelSequence ||
    !state.fishLevelSequence.active ||
    state.fishLevelSequence.delayTimer > 0
  ) {
    return;
  }
  ctx.save();
  try {
    drawFishLevelUpSequence(ctx, state.fishLevelSequence, time);
  } finally {
    ctx.restore();
  }
}

function drawSparkleStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.quadraticCurveTo(0, 0, 0, r);
  ctx.quadraticCurveTo(0, 0, -r, 0);
  ctx.quadraticCurveTo(0, 0, 0, -r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Extra juicy celebratory sequence when a new fish level is projected!
 * Features:
 * - Zoomed-in version of the fish type gained swimming vibrantly inside an oceanic crystal medallion (scale 2.6x!)
 * - Giant "+1" juice splash with 3D extruded gold typography, animated water droplets, splash rings, and sparkles
 * - Projected Fish Level badge and subtext reminding the player to complete the level to lock it in!
 */
export function drawFishLevelUpSequence(
  ctx: CanvasRenderingContext2D,
  seq: FishLevelUpSequence,
  time: number
): void {
  if (!seq.active || seq.alpha <= 0 || seq.delayTimer > 0) return;

  const cardW = 246;
  const cardH = 108;
  const cardR = 20;
  const cx = seq.x;
  const cy = seq.y;

  const themeColor = getFishThemeColor(seq.fishType);
  const fishName = getFishDisplayName(seq.fishType);

  ctx.save();
  ctx.globalAlpha = seq.alpha;
  ctx.translate(cx, cy);
  ctx.scale(seq.scale, seq.scale);

  // 1. Ambient deep oceanic glow behind the showcase card
  const glowGrad = ctx.createRadialGradient(0, 0, 25, 0, 0, 160);
  glowGrad.addColorStop(0, `${themeColor}55`);
  glowGrad.addColorStop(0.5, 'rgba(252, 211, 77, 0.22)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 160, 0, Math.PI * 2);
  ctx.fill();

  // 2. Main card body: Frosted marine slate pill
  const cardGrad = ctx.createLinearGradient(-cardW / 2, -cardH / 2, cardW / 2, cardH / 2);
  cardGrad.addColorStop(0, 'rgba(7, 16, 32, 0.95)');
  cardGrad.addColorStop(0.5, 'rgba(11, 23, 44, 0.92)');
  cardGrad.addColorStop(1, 'rgba(4, 9, 20, 0.96)');

  ctx.beginPath();
  ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, cardR);
  ctx.fillStyle = cardGrad;
  ctx.fill();

  // Shimmering golden-cyan dual-rim border
  const borderGrad = ctx.createLinearGradient(-cardW / 2, -cardH / 2, cardW / 2, cardH / 2);
  borderGrad.addColorStop(0, '#FCD34D');
  borderGrad.addColorStop(0.35, '#FFFFFF');
  borderGrad.addColorStop(0.7, themeColor);
  borderGrad.addColorStop(1, '#FCD34D');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Specular highlight line along the upper interior edge
  ctx.beginPath();
  ctx.moveTo(-cardW / 2 + 24, -cardH / 2 + 2);
  ctx.lineTo(cardW / 2 - 24, -cardH / 2 + 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // 3. Top Ribbon Badge inside card
  ctx.font = '900 8.5px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FCD34D';
  ctx.shadowColor = 'rgba(252, 211, 77, 0.8)';
  ctx.shadowBlur = 6;
  ctx.fillText('★ NEW FISH LEVEL UNLOCKED IF COMPLETED! ★', 0, -38);
  ctx.shadowBlur = 0;

  // 4. Left Section: Zoomed-in Fish Medallion
  const fishX = -60;
  const fishY = 10;

  // Rotating sunburst rays behind fish
  ctx.save();
  ctx.translate(fishX, fishY);
  ctx.rotate((time * 0.0015) % (Math.PI * 2));
  ctx.strokeStyle = `${themeColor}66`;
  ctx.lineWidth = 1.4;
  for (let r = 0; r < 8; r++) {
    ctx.beginPath();
    ctx.moveTo(34, 0);
    ctx.lineTo(43, 0);
    ctx.stroke();
    ctx.rotate(Math.PI / 4);
  }
  ctx.restore();

  // Bubble backing
  const bubbleGrad = ctx.createRadialGradient(fishX - 8, fishY - 8, 4, fishX, fishY, 35);
  bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  bubbleGrad.addColorStop(0.5, 'rgba(15, 30, 55, 0.7)');
  bubbleGrad.addColorStop(0.9, 'rgba(8, 16, 32, 0.9)');
  bubbleGrad.addColorStop(1, themeColor);
  ctx.beginPath();
  ctx.arc(fishX, fishY, 35, 0, Math.PI * 2);
  ctx.fillStyle = bubbleGrad;
  ctx.fill();

  // Bubble rim
  ctx.strokeStyle = '#FCD34D';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Authentic zoomed-in fish character sprite!
  ctx.save();
  ctx.beginPath();
  ctx.arc(fishX, fishY, 33.5, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(fishX, fishY);
  ctx.scale(2.6, 2.6);
  const mockBird: BirdState = {
    x: 0,
    y: 0,
    width: 28,
    height: 28,
    velocity: Math.sin(time * 0.006) * 12,
    rotation: Math.sin(time * 0.004) * 0.06,
    wingFrame: Math.abs(Math.floor((time / 140) % 3)),
    wingTimer: 0,
    alive: true,
  };
  const skinKey = DEFAULT_FISH_SKINS[seq.fishType] || 'coral';
  drawBird(ctx, mockBird, BIRD_SKINS[skinKey] || BIRD_SKINS.coral, time, seq.fishType);
  ctx.restore();

  // Specular glint on bubble
  ctx.beginPath();
  ctx.ellipse(fishX - 14, fishY - 14, 9, 4.5, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fill();

  // 5. Right Section: Giant "+1" Juice Splash
  const splashX = 54;
  const splashY = 4;

  // Concentric splash wave rings
  for (const ring of seq.splashRings) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(splashX, splashY, ring.radius, 0, Math.PI * 2);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.thickness;
    ctx.globalAlpha = seq.alpha * ring.alpha;
    ctx.stroke();
    ctx.restore();
  }

  // Water droplets
  for (const d of seq.droplets) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(d.x - cx, d.y - cy, d.radius, 0, Math.PI * 2);
    ctx.fillStyle = d.color;
    ctx.globalAlpha = seq.alpha * d.alpha;
    ctx.shadowColor = d.color;
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.restore();
  }

  // Starbursts
  for (const s of seq.starBursts) {
    ctx.save();
    ctx.translate(s.x - cx, s.y - cy);
    ctx.rotate(s.rot);
    ctx.globalAlpha = seq.alpha * s.alpha;
    drawSparkleStar(ctx, 0, 0, s.size, s.color);
    ctx.restore();
  }

  // Giant "+1" typography
  ctx.save();
  ctx.translate(splashX, splashY - 8);
  ctx.scale(seq.plusOneScale, seq.plusOneScale);
  ctx.rotate(Math.sin(time * 0.003) * 0.03 - 0.015);

  const plusText = seq.levelsGained > 1 ? `+${seq.levelsGained}` : '+1';

  ctx.font = '900 44px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 3D Extrusion shadow
  ctx.fillStyle = '#78350F';
  ctx.fillText(plusText, 0, 4.5);

  // Vibrant golden gradient
  const plusGrad = ctx.createLinearGradient(0, -22, 0, 22);
  plusGrad.addColorStop(0, '#FFFFFF');
  plusGrad.addColorStop(0.25, '#FFFBEB');
  plusGrad.addColorStop(0.55, '#FDE047');
  plusGrad.addColorStop(0.85, '#F59E0B');
  plusGrad.addColorStop(1, '#D97706');
  ctx.fillStyle = plusGrad;
  ctx.fillText(plusText, 0, 0);

  // Thick white edge stroke
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.4;
  ctx.strokeText(plusText, 0, 0);

  // Diamond sparkle glint at top-left of '+'
  drawSparkleStar(ctx, -14, -14, 5.5, '#FFFFFF');
  ctx.restore();

  // Fish Level Pill & Subtitle
  const pillW = 114;
  const pillH = 17;
  const pillX = splashX - pillW / 2;
  const pillY = 19;

  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 8.5);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fill();
  ctx.strokeStyle = '#FCD34D99';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.font = 'bold 9.5px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FCD34D';
  ctx.fillText(`${fishName.toUpperCase()} LV. ${seq.newFishLevel}`, splashX, pillY + pillH / 2);

  // Subtitle notice
  ctx.font = 'italic 7px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#BAE6FD';
  ctx.fillText('(IF LEVEL COMPLETED)', splashX, 44);

  ctx.restore();
}
