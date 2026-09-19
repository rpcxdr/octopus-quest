import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  BirdSkin,
  BirdState,
  Cloud,
  FishType,
  FishUnlockTier,
  GameDifficulty,
  GameState,
  GameStats,
  Particle,
  Pipe,
  ReefProgress,
  ReefColumnTemplate,
  FloatingFragment,
  FishFragmentCounts,
  AllReefFragments,
  BadgeId,
} from '../types';
import {
  BIRD_SKINS,
  DEFAULT_FISH_SKINS,
  DEFAULT_PHYSICS,
  getPhysicsForDifficulty,
  getSpeedIncreasePercent,
  createInitialBird,
  createFlapPuff,
  createHydroDashWakeParticles,
  createImpactParticles,
  updateBirdPhysics,
  checkCollisions,
  updateParticles,
} from '../utils/physics';
import {
  BaseFishBehavior,
  FishBehaviorFactory,
  FishAbilityState,
} from '../utils/fishAbilities';
import {
  createInitialClouds,
  drawBackground,
  drawPipes,
  drawGround,
  drawBird,
  drawParticles,
  drawInGameScore,
} from '../utils/renderer';
import { sound } from '../utils/audio';
import {
  loadGameStats,
  saveGameStats,
  recordCompletedReefStats,
  clearGameStats,
  loadReefProgress,
  saveReefSelection,
  resetReefProgress,
  completeReefLevel,
  checkAndUpdateHighScore,
  loadSelectedFish,
  saveSelectedFish,
  resetSelectedFish,
  loadFishSkins,
  saveFishSkins,
  loadGameDifficulty,
  saveGameDifficulty,
  createEmptyFragmentCounts,
  loadReefFragments,
  recordReefFragments,
  getReefMaxFragments,
  getTotalFragmentsByFish,
  getTotalFragmentsForFish,
} from '../utils/storage';
import {
  generateReefColumns,
  COLUMNS_PER_REEF,
  TOTAL_REEF_LEVELS,
  getReefZoneName,
} from '../utils/reef';
import { getColumnThemeName } from '../utils/columnThemes';
import {
  getBestReefScore,
  getFishLevel,
  isFishUnlocked,
  checkNewlyUnlockedFish,
  getFishThemeColor,
} from '../utils/fish';
import {
  generateReefFloatingFragments,
  drawFloatingFragment,
  createFragmentCollectParticles,
} from '../utils/fragments';
import {
  createRecordJuiceState,
  triggerFragmentRecordJuice,
  updateRecordJuice,
  drawRecordJuice,
  drawFishLevelJuice,
  FragmentRecordJuiceState,
} from '../utils/fragmentRecordJuice';
import { drawReefIntroTitle } from '../utils/reefIntroRenderer';
import { getBaseFragments, BADGES, BadgeDefinition, isBadgeUnlocked } from '../utils/badges';
import { StartScreenOverlay } from './StartScreenOverlay';
import { ScoreBoardModal } from './ScoreBoardModal';
import { StatsModal } from './StatsModal';
import { ReefClearedModal } from './ReefClearedModal';
import { FishBadgeIcon } from './FishBadgeIcon';
import { drawFishBadgeCanvas } from '../utils/fishBadgeRenderer';
import { Pause, Play, Volume2, VolumeX, Home, RotateCcw, Waves, Trophy } from 'lucide-react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/**
 * Checks whether there are more uncollected fragments of the specified fishType
 * remaining in the current reef level ahead of the player bird.
 */
function checkHasRemainingFragmentsInLevel(
  floatingFragments: FloatingFragment[],
  birdX: number,
  fishType: FishType,
  activeFish: FishType
): boolean {
  // Fragment collection affinity rule:
  // Octopus collects all fragment types; other fish only collect fragments for their own fish type.
  const canCollectType = activeFish === 'octopus' || fishType === activeFish;
  if (!canCollectType) return false;

  return floatingFragments.some((frag) => {
    if (frag.collected) return false;
    if (frag.fishType !== fishType) return false;
    // Unspawned fragments are ahead in future gaps
    if (!frag.spawned) return true;
    // Spawned fragments must still be ahead of the bird (with slight margin)
    return frag.x >= birdX - 14;
  });
}

export const FlappyGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // React states for UI overlays
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [reefColumn, setReefColumn] = useState<number>(0);
  const [stats, setStats] = useState<GameStats>(loadGameStats());
  const [reefProgress, setReefProgress] = useState<ReefProgress>(loadReefProgress());
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [selectedSkin, setSelectedSkin] = useState<BirdSkin>('coral');
  const [fishSkins, setFishSkins] = useState<Record<FishType, BirdSkin>>(() => loadFishSkins());
  const [selectedFish, setSelectedFish] = useState<FishType>(loadSelectedFish());
  const [difficulty, setDifficulty] = useState<GameDifficulty>(() => loadGameDifficulty());
  const [newlyUnlockedFish, setNewlyUnlockedFish] = useState<FishUnlockTier | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [allReefFragments, setAllReefFragments] = useState<AllReefFragments>(() => loadReefFragments());
  const totalFragmentsByFish = getTotalFragmentsByFish(allReefFragments);
  const [currentAttemptFragments, setCurrentAttemptFragments] = useState<FishFragmentCounts>(() =>
    createEmptyFragmentCounts()
  );
  const [priorReefMaxFragments, setPriorReefMaxFragments] = useState<FishFragmentCounts>(() =>
    createEmptyFragmentCounts()
  );
  const [priorTotalFragments, setPriorTotalFragments] = useState<FishFragmentCounts | null>(null);
  const [clearedAtlantisGate, setClearedAtlantisGate] = useState<boolean>(false);
  const [clearedGulfStream, setClearedGulfStream] = useState<boolean>(false);
  const [clearedReefLevel, setClearedReefLevel] = useState<number>(() => loadReefProgress().currentReef || 1);
  const [lastClearTime, setLastClearTime] = useState<number | undefined>(undefined);
  const [currentFastStreak, setCurrentFastStreak] = useState<number>(() => loadReefProgress().currentFastReefsInRow || 0);
  const [virtualHeight, setVirtualHeight] = useState<number>(DEFAULT_PHYSICS.virtualHeight);

  const initialFish = loadSelectedFish();
  const initialDifficulty = loadGameDifficulty();
  const initialFragmentsMap = loadReefFragments();
  const initialTotalFrags = getTotalFragmentsByFish(initialFragmentsMap);
  const initialFishLevel = getFishLevel(initialTotalFrags[initialFish] || 0);
  const initialOctopusLevel = getFishLevel(initialTotalFrags['octopus'] || 0);
  const initialStats = loadGameStats();
  const initialProgress = loadReefProgress();
  const initialBaseFragments = getBaseFragments(initialStats.totalScore, initialProgress, initialStats, initialTotalFrags);
  const initialFragmentCount = initialFish === 'octopus' ? initialBaseFragments + initialOctopusLevel : initialBaseFragments;

  // Track badges unlocked before level starts to detect new achievements earned during the run
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<BadgeDefinition[]>([]);
  const badgesBeforeLevelRef = useRef<BadgeId[]>(
    BADGES.filter((b) => isBadgeUnlocked(b.id, initialStats.totalScore, initialProgress, initialStats, initialTotalFrags)).map((b) => b.id)
  );

  // Keep badgesBeforeLevelRef in sync while player is idle on the home screen
  useEffect(() => {
    if (gameState === 'IDLE') {
      badgesBeforeLevelRef.current = BADGES.filter((b) =>
        isBadgeUnlocked(b.id, stats.totalScore, reefProgress, stats, totalFragmentsByFish)
      ).map((b) => b.id);
    }
  }, [gameState, stats.totalScore, reefProgress, stats, totalFragmentsByFish]);

  const [abilitySnapshot, setAbilitySnapshot] = useState<FishAbilityState>(() =>
    FishBehaviorFactory.create(initialFish, initialFishLevel).getAbilityState()
  );

  // Mutable Game Loop State in Refs for 60fps+ stutter-free performance
  const initialReef = loadReefProgress().currentReef;
  const stateRef = useRef<{
    gameState: GameState;
    isPaused: boolean;
    difficulty: GameDifficulty;
    score: number;
    reefScore: number;
    flapsCount: number;
    runTotalFlaps: number;
    reefsClearedInRun: number;
    runStartReef: number;
    scoreBankedToTotal: number;
    flapsBankedToTotal: number;
    hasIncrementedGamesPlayed: boolean;
    reefElapsedTime: number;
    bird: BirdState;
    pipes: Pipe[];
    particles: Particle[];
    clouds: Cloud[];
    groundScroll: number;
    lastTime: number;
    idleTimer: number;
    nextPipeId: number;
    flashAlpha: number;
    shakeTimer: number;
    selectedSkin: BirdSkin;
    fishSkins: Record<FishType, BirdSkin>;
    selectedFish: FishType;
    currentReef: number;
    columnsSpawned: number;
    reefColumns: ReefColumnTemplate[];
    fishBehavior: BaseFishBehavior;
    floatingFragments: FloatingFragment[];
    currentAttemptFragments: FishFragmentCounts;
    pickupEffects: Array<{
      id: number;
      text: string;
      fishType?: FishType;
      emoji?: string;
      color: string;
      x: number;
      y: number;
      alpha: number;
      life: number;
    }>;
    recordJuiceState: FragmentRecordJuiceState;
    reefClearedTime: number;
    virtualHeight: number;
  }>({
    gameState: 'IDLE',
    isPaused: false,
    difficulty: initialDifficulty,
    score: 0,
    reefScore: 0,
    flapsCount: 0,
    runTotalFlaps: 0,
    reefsClearedInRun: 0,
    runStartReef: initialReef,
    scoreBankedToTotal: 0,
    flapsBankedToTotal: 0,
    hasIncrementedGamesPlayed: false,
    reefElapsedTime: 0,
    virtualHeight: DEFAULT_PHYSICS.virtualHeight,
    bird: createInitialBird(DEFAULT_PHYSICS.virtualWidth, DEFAULT_PHYSICS.virtualHeight),
    pipes: [],
    particles: [],
    clouds: createInitialClouds(),
    groundScroll: 0,
    lastTime: 0,
    idleTimer: 0,
    nextPipeId: 1,
    flashAlpha: 0,
    shakeTimer: 0,
    selectedSkin: 'coral',
    fishSkins: loadFishSkins(),
    selectedFish: initialFish,
    currentReef: initialReef,
    columnsSpawned: 0,
    reefColumns: generateReefColumns(
      initialReef,
      getPhysicsForDifficulty(initialDifficulty, initialReef),
      initialDifficulty
    ),
    fishBehavior: FishBehaviorFactory.create(initialFish, initialFishLevel),
    floatingFragments: generateReefFloatingFragments(
      DEFAULT_PHYSICS.virtualHeight,
      DEFAULT_PHYSICS.groundHeight,
      Date.now(),
      initialFragmentCount,
      initialFish
    ),
    currentAttemptFragments: createEmptyFragmentCounts(),
    pickupEffects: [],
    recordJuiceState: createRecordJuiceState(),
    reefClearedTime: 0,
  });

  // Synchronize refs with state
  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    stateRef.current.isPaused = isPaused;
  }, [isPaused]);

  useEffect(() => {
    stateRef.current.difficulty = difficulty;
  }, [difficulty]);

  useEffect(() => {
    stateRef.current.selectedSkin = selectedSkin;
  }, [selectedSkin]);

  useEffect(() => {
    stateRef.current.fishSkins = fishSkins;
  }, [fishSkins]);

  const handleSelectFishSkin = useCallback((skin: BirdSkin, targetFish?: FishType) => {
    const fType = targetFish || stateRef.current.selectedFish;
    setFishSkins((prev) => {
      const next = { ...prev, [fType]: skin };
      saveFishSkins(next);
      return next;
    });
    setSelectedSkin(skin);
  }, []);

  useEffect(() => {
    stateRef.current.selectedFish = selectedFish;
  }, [selectedFish]);

  // Ensure selected fish is unlocked under fragment-level rules; update behavior on fragment changes
  useEffect(() => {
    const frags = getTotalFragmentsByFish(allReefFragments);
    const currentFishLevel = getFishLevel(frags[selectedFish] || 0);
    const s = stateRef.current;
    if (!isFishUnlocked(selectedFish, currentFishLevel)) {
      setSelectedFish('octopus');
      saveSelectedFish('octopus');
      s.selectedFish = 'octopus';
      const octLevel = getFishLevel(frags['octopus'] || 0);
      s.fishBehavior = FishBehaviorFactory.create('octopus', octLevel);
      s.fishBehavior.reset();
      setAbilitySnapshot(s.fishBehavior.getAbilityState());
    } else {
      s.fishBehavior = FishBehaviorFactory.create(selectedFish, currentFishLevel);
      setAbilitySnapshot(s.fishBehavior.getAbilityState());
    }
  }, [allReefFragments, selectedFish]);

  // Responsive viewport scaling: dynamically adjust virtualHeight so background and ground fill the entire phone frame
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const computedHeight = Math.max(
          560,
          Math.round(DEFAULT_PHYSICS.virtualWidth * (rect.height / rect.width))
        );
        if (Math.abs(computedHeight - stateRef.current.virtualHeight) >= 2) {
          setVirtualHeight(computedHeight);
          stateRef.current.virtualHeight = computedHeight;
          const s = stateRef.current;
          const config = getPhysicsForDifficulty(s.difficulty, s.currentReef, computedHeight);
          if (s.gameState === 'IDLE') {
            s.bird.y = (computedHeight - DEFAULT_PHYSICS.groundHeight) * 0.48;
            s.reefColumns = generateReefColumns(s.currentReef, config, s.difficulty);
            const frags = getTotalFragmentsByFish(allReefFragments);
            const octLevel = getFishLevel(frags['octopus'] || 0);
            const baseFrags = getBaseFragments(stats.totalScore, reefProgress, stats, frags);
            const fragCount = s.selectedFish === 'octopus' ? baseFrags + octLevel : baseFrags;
            s.floatingFragments = generateReefFloatingFragments(
              computedHeight,
              config.groundHeight,
              Date.now(),
              fragCount,
              s.selectedFish
            );
          }
        }
      }
    };

    updateDimensions();

    const ro = new ResizeObserver(() => {
      updateDimensions();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  }, [allReefFragments, stats.totalScore, reefProgress]);

  const getConfig = useCallback(
    (diff?: GameDifficulty, reef?: number) => {
      const s = stateRef.current;
      return getPhysicsForDifficulty(
        diff || s.difficulty,
        reef !== undefined ? reef : s.currentReef,
        s.virtualHeight || virtualHeight
      );
    },
    [virtualHeight]
  );

  // Handle difficulty selection: easy (+20% gap), medium (default), hard (+20% speed)
  const handleSelectDifficulty = useCallback((newDiff: GameDifficulty) => {
    setDifficulty(newDiff);
    saveGameDifficulty(newDiff);
    const s = stateRef.current;
    s.difficulty = newDiff;
    const config = getConfig(newDiff, s.currentReef);
    s.reefColumns = generateReefColumns(s.currentReef, config, newDiff);
    sound.playSwoosh();
  }, [getConfig]);

  // Handle choosing a fish character
  const handleSelectFish = useCallback((fish: FishType) => {
    setSelectedFish(fish);
    const s = stateRef.current;
    s.selectedFish = fish;
    const frags = getTotalFragmentsByFish(allReefFragments);
    const fishLevel = getFishLevel(frags[fish] || 0);
    s.fishBehavior = FishBehaviorFactory.create(fish, fishLevel);
    s.fishBehavior.reset();
    setAbilitySnapshot(s.fishBehavior.getAbilityState());
    saveSelectedFish(fish);

    // If game is in start/idle state, update floating fragments (Octopus level increases fragments)
    if (s.gameState === 'IDLE') {
      const config = getConfig(s.difficulty, s.currentReef);
      const octLevel = getFishLevel(frags['octopus'] || 0);
      const baseFrags = getBaseFragments(stats.totalScore, reefProgress, stats, frags);
      const fragCount = fish === 'octopus' ? baseFrags + octLevel : baseFrags;
      s.floatingFragments = generateReefFloatingFragments(
        config.virtualHeight,
        config.groundHeight,
        Date.now(),
        fragCount,
        fish
      );
    }
  }, [allReefFragments, stats.totalScore, reefProgress, getConfig]);

  // Sync Shell Rune unlock effect (unlocks first 5 reef levels) with reefProgress state
  useEffect(() => {
    if (stats.totalScore >= 20 && reefProgress.unlockedReef < 5) {
      const freshProgress = loadReefProgress();
      setReefProgress(freshProgress);
    }
  }, [stats.totalScore, reefProgress.unlockedReef]);

  // Handle choosing / switching to a specific reef (1-50)
  const handleSelectReef = useCallback((reefNumber: number) => {
    const s = stateRef.current;
    if (s.score > 0) {
      checkAndUpdateHighScore(s.score, s.reefsClearedInRun);
    }

    const updated = saveReefSelection(reefNumber);
    setReefProgress(updated);
    setNewlyUnlockedFish(null);
    setPriorTotalFragments(null);
    setPriorReefMaxFragments(null);

    const safeReef = updated.currentReef;
    s.currentReef = safeReef;
    badgesBeforeLevelRef.current = BADGES.filter((b) =>
      isBadgeUnlocked(b.id, stats.totalScore, updated, stats, totalFragmentsByFish)
    ).map((b) => b.id);
    setNewlyUnlockedBadges([]);
    const config = getConfig(s.difficulty, safeReef);
    s.reefColumns = generateReefColumns(safeReef, config, s.difficulty);
    s.columnsSpawned = 0;
    s.pipes = [];
    s.particles = [];
    s.score = 0;
    s.reefScore = 0;
    s.flapsCount = 0;
    s.runTotalFlaps = 0;
    s.reefsClearedInRun = 0;
    s.runStartReef = safeReef;
    s.scoreBankedToTotal = 0;
    s.flapsBankedToTotal = 0;
    s.hasIncrementedGamesPlayed = false;
    s.flashAlpha = 0;
    s.shakeTimer = 0;
    s.bird = createInitialBird(config.virtualWidth, config.virtualHeight);
    s.fishBehavior.reset();

    const frags = getTotalFragmentsByFish(allReefFragments);
    const octLevel = getFishLevel(frags['octopus'] || 0);
    const baseFrags = getBaseFragments(stats.totalScore, updated, stats, frags);
    const fragCount = s.selectedFish === 'octopus' ? baseFrags + octLevel : baseFrags;
    s.floatingFragments = generateReefFloatingFragments(
      config.virtualHeight,
      config.groundHeight,
      Date.now(),
      fragCount,
      s.selectedFish
    );
    s.currentAttemptFragments = createEmptyFragmentCounts();
    s.pickupEffects = [];
    s.recordJuiceState = createRecordJuiceState();
    s.gameState = 'IDLE';
    s.isPaused = false;

    setScore(0);
    setReefColumn(0);
    setCurrentAttemptFragments(createEmptyFragmentCounts());
    setIsNewHighScore(false);
    setIsPaused(false);
    setAbilitySnapshot(s.fishBehavior.getAbilityState());
    badgesBeforeLevelRef.current = BADGES.filter((b) =>
      isBadgeUnlocked(b.id, stats.totalScore, updated, stats, totalFragmentsByFish)
    ).map((b) => b.id);
    setNewlyUnlockedBadges([]);
    setGameState('IDLE');
  }, [allReefFragments, stats.totalScore]);

  // Handle jumping to next reef while preserving survival run score and immediately starting swim
  const handleContinueRunToNextReef = useCallback(() => {
    const s = stateRef.current;
    const nextReef = Math.min(TOTAL_REEF_LEVELS, s.currentReef + 1);

    const updated = saveReefSelection(nextReef);
    setReefProgress(updated);
    setNewlyUnlockedFish(null);
    setPriorTotalFragments(null);
    setPriorReefMaxFragments(null);

    // Keep cumulative s.score and s.runTotalFlaps intact!
    const safeNext = updated.currentReef;
    s.currentReef = safeNext;
    const currentStats = loadGameStats();
    badgesBeforeLevelRef.current = BADGES.filter((b) =>
      isBadgeUnlocked(b.id, currentStats.totalScore, updated, currentStats, totalFragmentsByFish)
    ).map((b) => b.id);
    setNewlyUnlockedBadges([]);
    const config = getConfig(s.difficulty, safeNext);
    s.reefColumns = generateReefColumns(safeNext, config, s.difficulty);
    s.columnsSpawned = 0;
    s.pipes = [];
    s.particles = [];
    s.reefScore = 0;
    s.flapsCount = 0;
    s.flashAlpha = 0;
    s.shakeTimer = 0;
    s.nextPipeId = 1;
    s.bird = createInitialBird(config.virtualWidth, config.virtualHeight);
    s.fishBehavior.reset();

    const frags = getTotalFragmentsByFish(allReefFragments);
    const octLevel = getFishLevel(frags['octopus'] || 0);
    const baseFrags = getBaseFragments(currentStats.totalScore, updated, currentStats, frags);
    const fragCount = s.selectedFish === 'octopus' ? baseFrags + octLevel : baseFrags;
    s.floatingFragments = generateReefFloatingFragments(
      config.virtualHeight,
      config.groundHeight,
      Date.now(),
      fragCount,
      s.selectedFish
    );
    s.currentAttemptFragments = createEmptyFragmentCounts();
    s.pickupEffects = [];
    s.recordJuiceState = createRecordJuiceState();
    s.gameState = 'PLAYING';
    s.isPaused = false;
    s.reefElapsedTime = 0;

    // Trigger initial flap so the swimmer enters the new reef actively swimming (except Seahorse which starts going straight)
    if (s.selectedFish !== 'seahorse') {
      const flapRes = s.fishBehavior.onFlap(s.bird, config);
      if (flapRes.velocity !== undefined) s.bird.velocity = flapRes.velocity;
      if (flapRes.rotation !== undefined) s.bird.rotation = flapRes.rotation;
      s.flapsCount += 1;
      s.runTotalFlaps += 1;
      sound.playFlap();
      if (s.selectedFish === 'singray') {
        s.particles.push(...createHydroDashWakeParticles(s.bird));
      } else {
        s.particles.push(...createFlapPuff(s.bird));
      }
    } else {
      s.bird.velocity = 0;
      s.bird.rotation = 0;
      s.fishBehavior.reset();
    }

    setReefColumn(0);
    setCurrentAttemptFragments(createEmptyFragmentCounts());
    setIsPaused(false);
    setAbilitySnapshot(s.fishBehavior.getAbilityState());
    setGameState('PLAYING');
  }, [allReefFragments, stats.totalScore]);

  // Handle jump/flap action
  const handleFlap = useCallback(() => {
    const s = stateRef.current;
    if (s.isPaused) return;
    const config = getConfig(s.difficulty, s.currentReef);

    if (s.gameState === 'IDLE') {
      // Ensure columns match the exact active virtualHeight and groundHeight
      const expectedPlayable = config.virtualHeight - config.groundHeight;
      if (
        !s.reefColumns ||
        s.reefColumns.length === 0 ||
        s.reefColumns[0].topHeight + s.reefColumns[0].gap + s.reefColumns[0].bottomHeight !== expectedPlayable
      ) {
        s.reefColumns = generateReefColumns(s.currentReef, config, s.difficulty);
      }

      // If no floating fragments spawned yet, generate for this attempt
      if (s.floatingFragments === undefined) {
        const frags = getTotalFragmentsByFish(allReefFragments);
        const octLevel = getFishLevel(frags['octopus'] || 0);
        const baseFrags = getBaseFragments(stats.totalScore, reefProgress, stats, frags);
        const fragCount = s.selectedFish === 'octopus' ? baseFrags + octLevel : baseFrags;
        s.floatingFragments = generateReefFloatingFragments(
          config.virtualHeight,
          config.groundHeight,
          Date.now(),
          fragCount,
          s.selectedFish
        );
      }
      // Transition from start/ready to playing
      badgesBeforeLevelRef.current = BADGES.filter((b) =>
        isBadgeUnlocked(b.id, stats.totalScore, reefProgress, stats, totalFragmentsByFish)
      ).map((b) => b.id);
      setNewlyUnlockedBadges([]);
      s.gameState = 'PLAYING';
      setGameState('PLAYING');
      setNewlyUnlockedFish(null);
      s.reefElapsedTime = 0;

      if (s.selectedFish !== 'seahorse') {
        const flapRes = s.fishBehavior.onFlap(s.bird, config);
        if (flapRes.velocity !== undefined) s.bird.velocity = flapRes.velocity;
        if (flapRes.rotation !== undefined) s.bird.rotation = flapRes.rotation;
        s.flapsCount += 1;
        s.runTotalFlaps += 1;
        sound.playFlap();
        if (s.selectedFish === 'singray') {
          s.particles.push(...createHydroDashWakeParticles(s.bird));
        } else {
          s.particles.push(...createFlapPuff(s.bird));
        }
      } else {
        // Seahorse starts out going straight without an initial tap
        s.bird.velocity = 0;
        s.bird.rotation = 0;
        s.fishBehavior.reset();
      }
      setAbilitySnapshot(s.fishBehavior.getAbilityState());
    } else if (s.gameState === 'PLAYING') {
      // Delegate flap physics & ability activation to active fish behavior
      const flapRes = s.fishBehavior.onFlap(s.bird, config);
      if (flapRes.velocity !== undefined) s.bird.velocity = flapRes.velocity;
      if (flapRes.rotation !== undefined) s.bird.rotation = flapRes.rotation;
      s.flapsCount += 1;
      s.runTotalFlaps += 1;
      sound.playFlap();
      if (s.selectedFish === 'singray') {
        s.particles.push(...createHydroDashWakeParticles(s.bird));
      } else {
        s.particles.push(...createFlapPuff(s.bird));
      }
      setAbilitySnapshot(s.fishBehavior.getAbilityState());
    }
  }, [allReefFragments, stats.totalScore, reefProgress]);

  // Handle game restart / retry current reef
  const handleRestart = useCallback(() => {
    const s = stateRef.current;
    if (s.score > s.scoreBankedToTotal) {
      const { stats: updatedStats } = saveGameStats(
        s.score,
        s.runTotalFlaps,
        s.reefsClearedInRun,
        s.scoreBankedToTotal,
        s.flapsBankedToTotal,
        s.hasIncrementedGamesPlayed
      );
      setStats(updatedStats);
    } else if (s.score > 0) {
      checkAndUpdateHighScore(s.score, s.reefsClearedInRun);
    }

    const config = getConfig(s.difficulty, s.currentReef);
    s.bird = createInitialBird(config.virtualWidth, config.virtualHeight);
    s.pipes = [];
    s.particles = [];
    s.score = 0;
    s.reefScore = 0;
    s.flapsCount = 0;
    s.runTotalFlaps = 0;
    s.reefsClearedInRun = 0;
    s.runStartReef = s.currentReef;
    s.scoreBankedToTotal = 0;
    s.flapsBankedToTotal = 0;
    s.hasIncrementedGamesPlayed = false;
    s.reefElapsedTime = 0;
    s.flashAlpha = 0;
    s.shakeTimer = 0;
    s.nextPipeId = 1;
    s.columnsSpawned = 0;
    s.reefColumns = generateReefColumns(s.currentReef, config, s.difficulty);
    s.fishBehavior.reset();

    const frags = getTotalFragmentsByFish(allReefFragments);
    const octLevel = getFishLevel(frags['octopus'] || 0);
    const baseFrags = getBaseFragments(stats.totalScore, reefProgress, stats, frags);
    const fragCount = s.selectedFish === 'octopus' ? baseFrags + octLevel : baseFrags;
    s.floatingFragments = generateReefFloatingFragments(
      config.virtualHeight,
      config.groundHeight,
      Date.now(),
      fragCount,
      s.selectedFish
    );
    s.currentAttemptFragments = createEmptyFragmentCounts();
    s.pickupEffects = [];
    s.recordJuiceState = createRecordJuiceState();
    s.gameState = 'IDLE';
    s.isPaused = false;

    setScore(0);
    setReefColumn(0);
    setCurrentAttemptFragments(createEmptyFragmentCounts());
    setIsNewHighScore(false);
    setIsPaused(false);
    setNewlyUnlockedFish(null);
    setPriorTotalFragments(null);
    setPriorReefMaxFragments(null);
    setClearedAtlantisGate(false);
    setClearedGulfStream(false);
    setLastClearTime(undefined);
    setCurrentFastStreak(0);
    setAbilitySnapshot(s.fishBehavior.getAbilityState());
    setGameState('IDLE');
  }, [allReefFragments, getConfig, totalFragmentsByFish, stats.totalScore, reefProgress, stats]);

  // Handle immediately replaying the current reef without returning to the home screen
  const handleReplayLevel = useCallback(() => {
    const s = stateRef.current;
    if (s.score > s.scoreBankedToTotal) {
      const { stats: updatedStats } = saveGameStats(
        s.score,
        s.runTotalFlaps,
        s.reefsClearedInRun,
        s.scoreBankedToTotal,
        s.flapsBankedToTotal,
        s.hasIncrementedGamesPlayed
      );
      setStats(updatedStats);
    } else if (s.score > 0) {
      checkAndUpdateHighScore(s.score, s.reefsClearedInRun);
    }

    const config = getConfig(s.difficulty, s.currentReef);
    s.bird = createInitialBird(config.virtualWidth, config.virtualHeight);
    s.pipes = [];
    s.particles = [];
    s.score = 0;
    s.reefScore = 0;
    s.flapsCount = 0;
    s.runTotalFlaps = 0;
    s.reefsClearedInRun = 0;
    s.runStartReef = s.currentReef;
    s.scoreBankedToTotal = 0;
    s.flapsBankedToTotal = 0;
    s.hasIncrementedGamesPlayed = false;
    s.reefElapsedTime = 0;
    s.flashAlpha = 0;
    s.shakeTimer = 0;
    s.nextPipeId = 1;
    s.columnsSpawned = 0;
    s.reefColumns = generateReefColumns(s.currentReef, config, s.difficulty);
    s.fishBehavior.reset();

    const frags = getTotalFragmentsByFish(allReefFragments);
    const octLevel = getFishLevel(frags['octopus'] || 0);
    const baseFrags = getBaseFragments(stats.totalScore, reefProgress, stats, frags);
    const fragCount = s.selectedFish === 'octopus' ? baseFrags + octLevel : baseFrags;
    s.floatingFragments = generateReefFloatingFragments(
      config.virtualHeight,
      config.groundHeight,
      Date.now(),
      fragCount,
      s.selectedFish
    );
    s.currentAttemptFragments = createEmptyFragmentCounts();
    s.pickupEffects = [];
    s.recordJuiceState = createRecordJuiceState();

    s.gameState = 'PLAYING';
    s.isPaused = false;
    s.reefElapsedTime = 0;

    // Trigger initial flap so the swimmer enters the replayed reef actively swimming (except Seahorse which starts going straight)
    if (s.selectedFish !== 'seahorse') {
      const flapRes = s.fishBehavior.onFlap(s.bird, config);
      if (flapRes.velocity !== undefined) s.bird.velocity = flapRes.velocity;
      if (flapRes.rotation !== undefined) s.bird.rotation = flapRes.rotation;
      s.flapsCount += 1;
      s.runTotalFlaps += 1;
      sound.playFlap();
      if (s.selectedFish === 'singray') {
        s.particles.push(...createHydroDashWakeParticles(s.bird));
      } else {
        s.particles.push(...createFlapPuff(s.bird));
      }
    } else {
      s.bird.velocity = 0;
      s.bird.rotation = 0;
      s.fishBehavior.reset();
    }

    setScore(0);
    setReefColumn(0);
    setCurrentAttemptFragments(createEmptyFragmentCounts());
    setIsNewHighScore(false);
    setIsPaused(false);
    setNewlyUnlockedFish(null);
    setPriorTotalFragments(null);
    setPriorReefMaxFragments(null);
    setClearedAtlantisGate(false);
    setClearedGulfStream(false);
    setLastClearTime(undefined);
    setCurrentFastStreak(0);
    badgesBeforeLevelRef.current = BADGES.filter((b) =>
      isBadgeUnlocked(b.id, stats.totalScore, reefProgress, stats, totalFragmentsByFish)
    ).map((b) => b.id);
    setNewlyUnlockedBadges([]);
    setAbilitySnapshot(s.fishBehavior.getAbilityState());
    setGameState('PLAYING');
  }, [allReefFragments, stats.totalScore, reefProgress]);

  // Handle exiting to menu specifically from Reef Cleared modal:
  // advances home screen reef selection to next unlocked reef so the player is ready for it
  const handleExitToMenuFromCleared = useCallback(() => {
    const s = stateRef.current;
    const nextReef = Math.min(TOTAL_REEF_LEVELS, s.currentReef + 1);
    const updated = saveReefSelection(nextReef);
    setReefProgress(updated);
    s.currentReef = updated.currentReef;
    handleRestart();
  }, [handleRestart]);

  // Trigger touch ripple on screen
  const addRipple = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev.slice(-4), { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 450);
  };

  // Pointer / Touch down handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('#home-next-rune-goal') ||
      target.closest('#stats-modal') ||
      target.closest('#game-over-modal') ||
      target.closest('#reef-cleared-modal') ||
      target.closest('#pause-screen-overlay')
    ) {
      return;
    }

    e.preventDefault();
    addRipple(e.clientX, e.clientY);

    const s = stateRef.current;
    if (s.gameState === 'IDLE' || s.gameState === 'PLAYING') {
      handleFlap();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showStatsModal) {
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        const s = stateRef.current;
        if (s.isPaused) {
          s.isPaused = false;
          setIsPaused(false);
          return;
        }
        if (s.gameState === 'GAMEOVER') {
          handleReplayLevel();
        } else if (s.gameState === 'REEF_CLEARED') {
          // Ignore space bar for 0.5 seconds so player won't accidentally close modal too soon
          if (Date.now() - (s.reefClearedTime || 0) < 500) {
            return;
          }
          // If cleared, space advances to next reef or replays
          if (s.currentReef < TOTAL_REEF_LEVELS) {
            handleContinueRunToNextReef();
          } else {
            handleReplayLevel();
          }
        } else {
          handleFlap();
        }
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        if (stateRef.current.gameState === 'PLAYING') {
          setIsPaused((prev) => !prev);
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        const muted = sound.toggleMute();
        setIsMuted(muted);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleFlap,
    handleRestart,
    handleReplayLevel,
    handleSelectReef,
    handleContinueRunToNextReef,
    showStatsModal,
  ]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    let animFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stateRef.current.lastTime = performance.now();

    const loop = (time: number) => {
      const s = stateRef.current;
      const config = getConfig(s.difficulty, s.currentReef);
      const rawDt = (time - s.lastTime) / 1000;
      s.lastTime = time;

      // Delta time clamping to prevent giant leaps on tab switch
      const dt = Math.min(0.04, Math.max(0.001, rawDt));

      // 1. UPDATE PHYSICS & STATE
      if (!s.isPaused) {
        // Floating bubbles/currents move in all states
        for (const cloud of s.clouds) {
          cloud.x -= cloud.speed * dt;
          if (cloud.x < -100) {
            cloud.x = config.virtualWidth + 60;
            cloud.y = 50 + Math.random() * 140;
          }
        }

        // Particle updates in all states
        s.particles = updateParticles(s.particles, dt);

        if (s.flashAlpha > 0) {
          s.flashAlpha = Math.max(0, s.flashAlpha - dt * 2.8);
        }

        if (s.shakeTimer > 0) {
          s.shakeTimer = Math.max(0, s.shakeTimer - dt);
        }

        if (s.gameState === 'IDLE') {
          // Bobbing octopus waiting at start
          s.idleTimer += dt;
          s.bird.y =
            (config.virtualHeight - config.groundHeight) * 0.48 +
            Math.sin(s.idleTimer * 4.5) * 6;
          s.bird.velocity = 0;
          s.bird.rotation = 0;
          s.bird.wingTimer += dt;
          if (s.bird.wingTimer > 0.1) {
            s.bird.wingTimer = 0;
            s.bird.wingFrame = (s.bird.wingFrame + 1) % 3;
          }

          // Ambient seabed conveyor (smooth idle drift)
          s.groundScroll = (s.groundScroll + config.pipeSpeed * 0.6 * dt) % 360000;
        } else if (s.gameState === 'PLAYING') {
          // Track elapsed time for fast reef completion badges
          s.reefElapsedTime += dt;

          // Physics update delegated to fish behavior Strategy
          const { bird: updatedBird, forwardSpeedMultiplier } = s.fishBehavior.updatePhysics(
            s.bird,
            dt,
            config,
            true
          );
          s.bird = updatedBird;

          const effectivePipeSpeed = config.pipeSpeed * forwardSpeedMultiplier;

          // Seabed movement
          s.groundScroll = (s.groundScroll + effectivePipeSpeed * dt) % 360000;

          // Deterministic Reef Column Spawning (10 columns total)
          const lastPipe = s.pipes[s.pipes.length - 1];
          if (
            s.columnsSpawned < COLUMNS_PER_REEF &&
            (!lastPipe || lastPipe.x <= config.virtualWidth - config.pipeSpacing)
          ) {
            const startX = lastPipe
              ? lastPipe.x + config.pipeSpacing
              : config.virtualWidth + 60;
            const colTemplate = s.reefColumns[s.columnsSpawned];
            const playableHeight = config.virtualHeight - config.groundHeight;
            const bottomHeight = Math.max(
              0,
              playableHeight - colTemplate.topHeight - colTemplate.gap
            );
            const newPipe: Pipe = {
              id: s.nextPipeId++,
              x: startX,
              topHeight: colTemplate.topHeight,
              bottomHeight,
              gap: colTemplate.gap,
              passed: false,
              width: colTemplate.width,
              columnNumber: colTemplate.columnNumber,
            };
            s.pipes.push(newPipe);
            s.columnsSpawned++;

            // Position floating fragment between columns if scheduled for this gap
            for (const frag of s.floatingFragments) {
              if (!frag.spawned && frag.columnGapIndex === colTemplate.columnNumber) {
                frag.spawned = true;
                const gapWidth = config.pipeSpacing - colTemplate.width;
                const fraction = typeof frag.gapFraction === 'number' ? frag.gapFraction : 0.5;
                frag.x = startX + colTemplate.width + gapWidth * fraction;
                frag.currentY = frag.baseY;
              }
            }
          }

          // Move floating fragments & check fragment collection
          for (const frag of s.floatingFragments) {
            if (frag.spawned && !frag.collected) {
              frag.x -= effectivePipeSpeed * dt;
              frag.currentY = frag.baseY + Math.sin(time * 0.0035 + frag.bobPhase) * 6;

              // Check collection collision with bird / swimmer
              const dx = s.bird.x - frag.x;
              const dy = s.bird.y - frag.currentY;
              const dist = Math.hypot(dx, dy);

              // Fragment collection affinity rule:
              // Octopus collects all fragment types; other fish only collect fragments for their own fish type.
              const canCollect = s.selectedFish === 'octopus' || frag.fishType === s.selectedFish;

              if (dist < 14 + frag.radius && canCollect) {
                frag.collected = true;
                const fragsBefore = s.currentAttemptFragments[frag.fishType] || 0;
                s.currentAttemptFragments[frag.fishType] = fragsBefore + 1;
                setCurrentAttemptFragments({ ...s.currentAttemptFragments });

                sound.playFragmentCollect();

                // Particle burst in fish character color
                s.particles.push(
                  ...createFragmentCollectParticles(frag.x, frag.currentY, frag.fishType)
                );

                const themeColor = getFishThemeColor(frag.fishType);

                s.pickupEffects.push({
                  id: Math.random(),
                  text: '+1',
                  fishType: frag.fishType,
                  color: themeColor,
                  x: frag.x,
                  y: frag.currentY - 14,
                  alpha: 1,
                  life: 1.2,
                });

                // Trigger record visualization juice:
                // Upper-right column of fragments equaling the record for that fish on this level so far,
                // top X unghosted, Y ghosted, and animate collected fragment into slot X with satisfying thump
                const pastReefRecord = getReefMaxFragments(s.currentReef)[frag.fishType] || 0;
                const baseTotalFragments = getTotalFragmentsForFish(frag.fishType);
                const hasRemainingInLevel = checkHasRemainingFragmentsInLevel(
                  s.floatingFragments,
                  s.bird.x,
                  frag.fishType,
                  s.selectedFish
                );
                triggerFragmentRecordJuice(
                  s.recordJuiceState,
                  frag.fishType,
                  frag.x,
                  frag.currentY,
                  fragsBefore,
                  pastReefRecord,
                  baseTotalFragments,
                  hasRemainingInLevel
                );
              }
            }
          }

          // Clean up off-screen floating fragments
          for (const frag of s.floatingFragments) {
            if (frag.spawned && frag.x < -60) {
              frag.collected = true;
            }
          }

          // Update floating pickup notification texts
          s.pickupEffects = s.pickupEffects
            .map((eff) => ({
              ...eff,
              y: eff.y - 28 * dt,
              life: eff.life - dt,
              alpha: Math.max(0, eff.life / 1.2),
            }))
            .filter((eff) => eff.life > 0);

          // Move pipes & Score / Column passing tracking
          for (const pipe of s.pipes) {
            pipe.x -= effectivePipeSpeed * dt;

            // Check if passed bird for column clearance point
            if (!pipe.passed && pipe.x + pipe.width < s.bird.x) {
              pipe.passed = true;
              s.score += 1;
              s.reefScore += 1;
              setScore(s.score);
              setReefColumn(s.reefScore);
              sound.playScore();

              // Check if all 10 columns of this Reef have been successfully cleared!
              if (s.reefScore >= COLUMNS_PER_REEF) {
                const clearedLevel = s.currentReef;
                setClearedReefLevel(clearedLevel);
                s.gameState = 'REEF_CLEARED';
                s.reefClearedTime = Date.now();
                setGameState('REEF_CLEARED');
                sound.playLevelClear();

                s.reefsClearedInRun += 1;

                const prevBestScore = getBestReefScore(stats, reefProgress);

                // Check if all 50 reefs in order were cleared without dying
                const isFullRunWithoutDying =
                  s.runStartReef === 1 &&
                  clearedLevel === TOTAL_REEF_LEVELS &&
                  s.reefsClearedInRun >= TOTAL_REEF_LEVELS;

                const clearTime = s.reefElapsedTime;
                setLastClearTime(clearTime);

                // Save reef completion
                const {
                  progress: updatedReefProgress,
                  currentFastStreak: newFastStreak,
                  atlantisGateUnlockedNow,
                  gulfStreamUnlockedNow,
                  tidesongUnlockedNow,
                } = completeReefLevel(
                  clearedLevel,
                  s.flapsCount,
                  isFullRunWithoutDying,
                  clearTime
                );
                setReefProgress(updatedReefProgress);
                setCurrentFastStreak(newFastStreak);
                if (atlantisGateUnlockedNow) {
                  setClearedAtlantisGate(true);
                }
                if (gulfStreamUnlockedNow) {
                  setClearedGulfStream(true);
                }

                // Retain and record max fragments for this completed reef
                const priorStoredFragments = loadReefFragments();
                const priorReefRecord = {
                  ...(priorStoredFragments[clearedLevel] || getReefMaxFragments(clearedLevel))
                };
                setPriorReefMaxFragments(priorReefRecord);
                const prevFragsOnClear = getTotalFragmentsByFish(priorStoredFragments);
                setPriorTotalFragments(prevFragsOnClear);
                const { updated: updatedFragments } = recordReefFragments(
                  clearedLevel,
                  s.currentAttemptFragments
                );
                setAllReefFragments(updatedFragments);
                const newFragsOnClear = getTotalFragmentsByFish(updatedFragments);

                // Add all columns passed in this completed reef level into total score!
                const columnsToBank = Math.max(0, s.score - s.scoreBankedToTotal);
                const flapsToBank = Math.max(0, s.runTotalFlaps - s.flapsBankedToTotal);
                const { stats: updatedStats, isNewHighScore: isNewHigh } = recordCompletedReefStats(
                  columnsToBank,
                  flapsToBank,
                  s.score,
                  s.reefsClearedInRun,
                  !s.hasIncrementedGamesPlayed
                );
                s.scoreBankedToTotal = s.score;
                s.flapsBankedToTotal = s.runTotalFlaps;
                s.hasIncrementedGamesPlayed = true;
                setStats(updatedStats);
                if (isNewHigh) {
                  setIsNewHighScore(true);
                }

                // Check if new fish unlocked based on fragment level >= 1
                const newlyUnlocked = checkNewlyUnlockedFish(prevFragsOnClear, newFragsOnClear);
                if (newlyUnlocked) {
                  setNewlyUnlockedFish(newlyUnlocked);
                } else {
                  setNewlyUnlockedFish(null);
                }

                // Check if any new badges were unlocked during this level run
                const priorBadges = badgesBeforeLevelRef.current;
                const earnedBadges = BADGES.filter((b) => {
                  const unlockedNow =
                    isBadgeUnlocked(b.id, updatedStats.totalScore, updatedReefProgress, updatedStats, newFragsOnClear) ||
                    (b.id === 'atlantis_gate' && atlantisGateUnlockedNow) ||
                    (b.id === 'gulf_stream' && gulfStreamUnlockedNow) ||
                    (b.id === 'tidesong' && tidesongUnlockedNow);
                  return unlockedNow && !priorBadges.includes(b.id);
                });
                setNewlyUnlockedBadges(earnedBadges);
                if (earnedBadges.length > 0) {
                  sound.playFishLevelUpSplash();
                }

                // Celebration particles
                s.particles.push(...createImpactParticles(s.bird.x, s.bird.y));
                break;
              }
            }
          }

          // Remove off-screen pipes
          s.pipes = s.pipes.filter((p) => p.x + p.width > -30);

          // Check collisions with kelp or seabed with fish special power absorption
          const collision = checkCollisions(s.bird, s.pipes, config);
          if (collision.collidedWithPipe || collision.hitGround) {
            const resolution = s.fishBehavior.onCollision(
              s.bird,
              collision.collidedWithPipe ? 'pipe' : 'ground',
              config
            );

            if (resolution.absorbed) {
              // Survival Shield absorbed the hit!
              s.flashAlpha = 0.35;
              s.shakeTimer = 0.18;
              s.particles.push(...createImpactParticles(s.bird.x, s.bird.y));
              if (resolution.knockbackY) {
                s.bird.velocity = resolution.knockbackY;
                s.bird.y += resolution.knockbackY * 0.05;
              }
            } else {
              sound.playHit();
              s.flashAlpha = 0.85;
              s.shakeTimer = 0.3;
              s.particles.push(...createImpactParticles(s.bird.x, s.bird.y));

              // Note: Attempt fragments are NOT banked if dying before completing the reef level.
              // Max fragments for this reef level remain whatever was previously cleared.

              // Player died! Finalize the run and save stats
              const { stats: updatedStats, isNewHighScore: isNewHigh } =
                saveGameStats(
                  s.score,
                  s.runTotalFlaps,
                  s.reefsClearedInRun,
                  s.scoreBankedToTotal,
                  s.flapsBankedToTotal,
                  s.hasIncrementedGamesPlayed
                );
              s.scoreBankedToTotal = s.score;
              s.flapsBankedToTotal = s.runTotalFlaps;
              s.hasIncrementedGamesPlayed = true;
              setCurrentFastStreak(0);
              setClearedAtlantisGate(false);
              setClearedGulfStream(false);
              setStats(updatedStats);
              setIsNewHighScore(isNewHigh);

              // Check if any new badges were unlocked before dying on this level run (e.g. total score milestone)
              const priorBadges = badgesBeforeLevelRef.current;
              const earnedBadges = BADGES.filter((b) => {
                const unlockedNow = isBadgeUnlocked(b.id, updatedStats.totalScore, reefProgress, updatedStats, totalFragmentsByFish);
                return unlockedNow && !priorBadges.includes(b.id);
              });
              setNewlyUnlockedBadges(earnedBadges);
              if (earnedBadges.length > 0) {
                sound.playFishLevelUpSplash();
              }

              if (isNewHigh && s.score > 0) {
                sound.playHighScore();
              }

              if (collision.hitGround) {
                s.gameState = 'GAMEOVER';
                setGameState('GAMEOVER');
              } else {
                s.bird.alive = false;
                s.gameState = 'DYING';
                setGameState('DYING');
              }
            }
          }

          // Sync ability state to HUD periodically
          if (Math.floor(time / 80) !== Math.floor((time - dt * 1000) / 80)) {
            setAbilitySnapshot(s.fishBehavior.getAbilityState());
          }
        } else if (s.gameState === 'DYING') {
          // Bird sinking down after hit
          const { bird: sinkingBird } = s.fishBehavior.updatePhysics(s.bird, dt, config, false);
          s.bird = sinkingBird;
          const collision = checkCollisions(s.bird, s.pipes, config);
          if (collision.hitGround) {
            sound.playDie();
            s.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
          }
        } else if (s.gameState === 'REEF_CLEARED') {
          // Serene victory swim: fish bobs peacefully forward
          s.idleTimer += dt;
          s.bird.y =
            (config.virtualHeight - config.groundHeight) * 0.45 +
            Math.sin(s.idleTimer * 3.5) * 8;
          s.bird.velocity = 0;
          s.bird.rotation = Math.sin(s.idleTimer * 2) * 0.08;
          s.bird.wingTimer += dt;
          if (s.bird.wingTimer > 0.12) {
            s.bird.wingTimer = 0;
            s.bird.wingFrame = (s.bird.wingFrame + 1) % 3;
          }

          // Off-screen remaining kelp glides past slowly
          for (const pipe of s.pipes) {
            pipe.x -= config.pipeSpeed * 0.5 * dt;
          }
          s.pipes = s.pipes.filter((p) => p.x + p.width > -30);
          s.groundScroll = (s.groundScroll + config.pipeSpeed * 0.4 * dt) % 360000;
        }

        // Update Fragment Record visualization juice (flying fragments, UX thumps, full-screen ripples, column fades, record anticipation)
        updateRecordJuice(
          s.recordJuiceState,
          dt,
          sound,
          s.particles,
          (shakeDuration) => {
            s.shakeTimer = Math.max(s.shakeTimer, shakeDuration);
          },
          (fishType) =>
            checkHasRemainingFragmentsInLevel(
              s.floatingFragments,
              s.bird.x,
              fishType,
              s.selectedFish
            )
        );
      }

      // 2. RENDER STAGE
      // Hard reset canvas transform and alpha to guarantee pristine coordinate space
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1.0;
      ctx.save();
      try {
        // Screen Shake effect
        if (s.shakeTimer > 0) {
          const shakeMag = (s.shakeTimer / 0.3) * 7;
          const ox = (Math.random() - 0.5) * shakeMag;
          const oy = (Math.random() - 0.5) * shakeMag;
          ctx.translate(ox, oy);
        }

        // Underwater background with dynamic light rays, silhouettes & caustics per reef aesthetic
        drawBackground(
          ctx,
          config.virtualWidth,
          config.virtualHeight,
          config.groundHeight,
          s.clouds,
          s.groundScroll,
          time,
          s.currentReef
        );

        // Giant fish level gained juice (rendered in front of background, but behind column obstacles)
        drawFishLevelJuice(ctx, s.recordJuiceState, time);

        // Reef Number & Theme Description intro overlay (first 2 seconds of play, behind column obstacles)
        drawReefIntroTitle(
          ctx,
          s.currentReef,
          s.reefElapsedTime,
          config,
          s.gameState
        );

        // Themed Pillars (with column numbers, rotating every 2 reefs)
        drawPipes(ctx, s.pipes, config, time, s.currentReef);

        // Seabed conveyor matching biome aesthetic
        drawGround(
          ctx,
          config.virtualWidth,
          config.virtualHeight,
          config.groundHeight,
          s.groundScroll,
          time,
          s.currentReef
        );

        // Floating Fish Fragments
        for (const frag of s.floatingFragments) {
          drawFloatingFragment(ctx, frag, time, s.selectedFish);
        }

        // Floating Fragment Pickup Notification Texts
        for (const eff of s.pickupEffects) {
          ctx.save();
          ctx.globalAlpha = eff.alpha;
          ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
          ctx.textBaseline = 'middle';
          const textMetrics = ctx.measureText(eff.text);
          const iconSize = 13;

          if (eff.fishType) {
            const totalWidth = iconSize + 4 + textMetrics.width;
            const startX = eff.x - totalWidth / 2;

            drawFishBadgeCanvas(ctx, eff.fishType, startX + iconSize / 2, eff.y, iconSize);

            ctx.textAlign = 'left';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = eff.color;
            ctx.fillText(eff.text, startX + iconSize + 4, eff.y);
          } else {
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = eff.color;
            ctx.fillText(eff.text, eff.x, eff.y);
          }
          ctx.restore();
        }

        // Flap & Crash Particles
        drawParticles(ctx, s.particles);

        // Upper-right Fragment Record column and animated flying fragment juice
        drawRecordJuice(ctx, s.recordJuiceState, time);

        // Flappy Aquatic Character Sprite (Octopus, Puffer Fish, Clown Fish, Sting Ray, Seahorse)
        const activeFish = s.selectedFish;
        const skinId = s.fishSkins?.[activeFish] || DEFAULT_FISH_SKINS[activeFish] || s.selectedSkin || 'coral';
        const skinConfig = BIRD_SKINS[skinId] || BIRD_SKINS.coral;
        drawBird(
          ctx,
          s.bird,
          skinConfig,
          time,
          s.selectedFish,
          s.fishBehavior.getAbilityState()
        );

        // In-Game Large Score Counter
        if (s.gameState === 'PLAYING') {
          drawInGameScore(ctx, s.score, config.virtualWidth);
        }

        // Flash on collision
        if (s.flashAlpha > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${s.flashAlpha})`;
          ctx.fillRect(0, 0, config.virtualWidth, config.virtualHeight);
        }
      } finally {
        ctx.restore();
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleClearStats = () => {
    const freshStats = clearGameStats();
    const freshReefProgress = resetReefProgress();
    resetSelectedFish();

    setStats(freshStats);
    setReefProgress(freshReefProgress);
    setIsNewHighScore(false);
    setNewlyUnlockedFish(null);

    // Reset swimmer to octopus (default unlocked fish)
    setSelectedFish('octopus');

    // Reset game engine state to Reef 1
    const s = stateRef.current;
    const config = getConfig(s.difficulty, 1);
    s.currentReef = 1;
    s.reefColumns = generateReefColumns(1, config, s.difficulty);
    s.columnsSpawned = 0;
    s.pipes = [];
    s.particles = [];
    s.score = 0;
    s.reefScore = 0;
    s.flapsCount = 0;
    s.runTotalFlaps = 0;
    s.reefsClearedInRun = 0;
    s.runStartReef = 1;
    s.scoreBankedToTotal = 0;
    s.flapsBankedToTotal = 0;
    s.hasIncrementedGamesPlayed = false;
    s.flashAlpha = 0;
    s.shakeTimer = 0;
    s.bird = createInitialBird(config.virtualWidth, config.virtualHeight);
    s.selectedFish = 'octopus';
    s.fishBehavior = FishBehaviorFactory.create('octopus', 0);
    s.fishBehavior.reset();
    const baseFrags = getBaseFragments(0, freshReefProgress, freshStats, createEmptyFragmentCounts());
    s.floatingFragments = generateReefFloatingFragments(
      config.virtualHeight,
      config.groundHeight,
      Date.now(),
      baseFrags,
      'octopus'
    );
    s.currentAttemptFragments = createEmptyFragmentCounts();
    s.pickupEffects = [];
    s.recordJuiceState = createRecordJuiceState();
    s.gameState = 'IDLE';
    s.isPaused = false;

    setScore(0);
    setReefColumn(0);
    setAllReefFragments({});
    setCurrentAttemptFragments(createEmptyFragmentCounts());
    setIsPaused(false);
    setAbilitySnapshot(s.fishBehavior.getAbilityState());
    setGameState('IDLE');
  };

  return (
    <div
      id="flappy-game-wrapper"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative w-full h-full max-w-[440px] max-h-[820px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-[#031d38] select-none touch-none cursor-pointer ring-1 ring-white/15"
      style={{ touchAction: 'none' }}
    >
      {/* High-DPI Canvas */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        width={DEFAULT_PHYSICS.virtualWidth}
        height={virtualHeight}
        className="w-full h-full block"
      />

      {/* Touch Visual Ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full pointer-events-none border-2 border-cyan-400/80 animate-ping"
          style={{
            left: r.x - 20,
            top: r.y - 20,
            width: 40,
            height: 40,
          }}
        />
      ))}

      {/* In-Game Top Floating Score & Reef Progress HUD */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-4 pt-1 px-1 flex flex-col gap-2 z-15 pointer-events-none">
          <div className="w-full flex items-center justify-between gap-2 shrink-0">
            {/* (1) Pause Button: same upper left position as stats button on home screen */}
            <button
              id="in-game-pause-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused((p) => !p);
              }}
              className="w-9 h-9 shrink-0 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-white/10 text-white flex items-center justify-center shadow-lg backdrop-blur-xl transition cursor-pointer active:scale-95 pointer-events-auto"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
              ) : (
                <Pause className="w-4 h-4 text-white" />
              )}
            </button>

            {/* (2) Combined Graphical HUD Panel: Reef Number, Visual Column Minimap Progress Counter, and Best Counter */}
            <div
              id="hud-combined-panel"
              className="flex-1 max-w-[340px] sm:max-w-md mx-auto bg-slate-950/80 backdrop-blur-xl border border-cyan-500/25 rounded-full px-2.5 sm:px-3 h-9 shadow-2xl pointer-events-auto flex items-center justify-between gap-1.5 sm:gap-2.5 min-w-0"
            >
              {/* Reef Number (Graphical) */}
              <div
                className="flex items-center gap-1 shrink-0 cursor-default"
                title={`Reef ${reefProgress.currentReef}: ${getReefZoneName(reefProgress.currentReef)} - ${getColumnThemeName(reefProgress.currentReef)}`}
              >
                <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-game font-black text-xs text-cyan-300 whitespace-nowrap">
                  Reef {reefProgress.currentReef}
                </span>
              </div>

              {/* Vertical subtle divider */}
              <div className="w-px h-3.5 bg-white/15 shrink-0" />

              {/* Visual Column Minimap (Graphical Pearl Dots) */}
              <div
                className="flex items-center shrink min-w-0"
                title={`Column ${reefColumn} of 10`}
              >
                <div className="flex items-center gap-1">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const isCleared = idx < reefColumn;
                    const isCurrent = idx === reefColumn;
                    return (
                      <div
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shrink-0 ${
                          isCleared
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)] scale-105'
                            : isCurrent
                            ? 'bg-cyan-300 ring-1.5 ring-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse'
                            : 'bg-white/15 border border-white/10'
                        }`}
                        title={`Column ${idx + 1}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Vertical subtle divider */}
              <div className="w-px h-3.5 bg-white/15 shrink-0" />

              {/* Best Counter (Graphical) */}
              <div
                className="flex items-center gap-1 shrink-0 cursor-default"
                title={`Run: ${score} | High Score: ${Math.max(stats.highScore || 0, score)}`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30 shrink-0" />
                <span className="font-game font-black text-xs text-amber-300 leading-none">
                  {score}
                </span>
                <span className="text-[9px] font-sans text-amber-400/60 leading-none">
                  /{Math.max(stats.highScore || 0, score)}
                </span>
              </div>
            </div>

            {/* (3) Mute Button: in the same position it is on the home screen */}
            <button
              id="in-game-mute-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleMute();
              }}
              className="w-9 h-9 shrink-0 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-white/10 text-slate-200 flex items-center justify-center shadow-lg backdrop-blur-xl transition cursor-pointer active:scale-95 pointer-events-auto"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pause Screen Overlay */}
      {isPaused && (
        <div
          id="pause-screen-overlay"
          className="absolute inset-0 z-25 bg-slate-950/85 backdrop-blur-xl flex flex-col items-center justify-center text-white p-6 pointer-events-auto"
        >
          <div className="w-full max-w-xs bg-slate-900/90 border border-cyan-500/20 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
            <h2 className="text-2xl font-black font-game uppercase tracking-widest text-cyan-400 mb-1">
              Game Paused
            </h2>
            <p className="text-xs text-cyan-200/80 mb-2">
              Reef {reefProgress.currentReef}: {getReefZoneName(reefProgress.currentReef)} &bull; {getColumnThemeName(reefProgress.currentReef)}
            </p>
            <div className="mb-4">
              <span
                className={`text-[9px] font-black font-sans uppercase px-2 py-0.5 rounded-full border ${
                  difficulty === 'easy'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : difficulty === 'hard'
                    ? 'bg-orange-950/80 text-orange-300 border-orange-500/40'
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {difficulty} mode &bull; Speed: +{getSpeedIncreasePercent(difficulty, reefProgress.currentReef)}%
              </span>
            </div>
            <div className="w-full flex flex-col gap-2.5">
              <button
                id="resume-game-btn"
                onClick={() => setIsPaused(false)}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 border-b-4 border-cyan-800 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2 text-base shadow-xl cursor-pointer active:scale-98"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume Swim</span>
              </button>

              <button
                id="pause-restart-btn"
                onClick={() => {
                  setIsPaused(false);
                  handleReplayLevel();
                }}
                className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2 text-xs tracking-wider cursor-pointer shadow-md active:scale-95"
                title="Replay Current Reef Level"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Replay</span>
              </button>

              <button
                id="pause-home-btn"
                onClick={() => {
                  setIsPaused(false);
                  handleRestart();
                }}
                className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2 text-xs tracking-wider cursor-pointer shadow-md active:scale-95"
                title="Return to Home Screen"
              >
                <Home className="w-3.5 h-3.5 text-cyan-400" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Screen Overlay */}
      {gameState === 'IDLE' && (
        <StartScreenOverlay
          stats={stats}
          selectedSkin={fishSkins[selectedFish] || DEFAULT_FISH_SKINS[selectedFish] || selectedSkin || 'coral'}
          fishSkins={fishSkins}
          selectedFish={selectedFish}
          difficulty={difficulty}
          isMuted={isMuted}
          reefProgress={reefProgress}
          currentReefMaxFragments={getReefMaxFragments(reefProgress.currentReef)}
          totalFragmentsByFish={getTotalFragmentsByFish()}
          onSelectDifficulty={handleSelectDifficulty}
          onSelectSkin={handleSelectFishSkin}
          onSelectFish={handleSelectFish}
          onToggleMute={handleToggleMute}
          onOpenStats={() => setShowStatsModal(true)}
          onSelectReef={handleSelectReef}
          onStartGame={handleFlap}
        />
      )}

      {/* Game Over Score Board Modal */}
      {gameState === 'GAMEOVER' && (
        <ScoreBoardModal
          score={score}
          reefsClearedInRun={stateRef.current.reefsClearedInRun}
          reefLevel={stateRef.current.currentReef || reefProgress.currentReef}
          reefColumn={reefColumn}
          highScore={stats.highScore}
          isNewHighScore={isNewHighScore}
          totalScore={stats.totalScore}
          timeSeconds={stateRef.current.reefElapsedTime}
          reefProgress={reefProgress}
          stats={stats}
          difficulty={difficulty}
          attemptFragments={currentAttemptFragments}
          reefMaxFragments={getReefMaxFragments(stateRef.current.currentReef || reefProgress.currentReef)}
          totalFragmentsByFish={getTotalFragmentsByFish(allReefFragments)}
          priorTotalFragmentsByFish={priorTotalFragments || undefined}
          newlyUnlockedBadges={newlyUnlockedBadges}
          onRestart={handleReplayLevel}
          onOpenStats={() => setShowStatsModal(true)}
          onGoHome={handleRestart}
        />
      )}

      {/* Reef Cleared Modal (Level Passed!) */}
      {gameState === 'REEF_CLEARED' && (
        <ReefClearedModal
          isOpen={true}
          reefLevel={clearedReefLevel}
          difficulty={difficulty}
          flapsThisRun={stateRef.current.flapsCount}
          runTotalColumns={stateRef.current.score}
          reefsClearedInRun={stateRef.current.reefsClearedInRun}
          highScore={stats.highScore}
          isNewHighScore={isNewHighScore}
          bestFlaps={
            reefProgress.clearedReefs[clearedReefLevel]?.bestFlaps ??
            (reefProgress.clearedReefs[clearedReefLevel] as any)?.fewestFlaps
          }
          unlockedFish={newlyUnlockedFish}
          selectedFish={selectedFish}
          attemptFragments={currentAttemptFragments}
          priorReefMaxFragments={priorReefMaxFragments}
          reefMaxFragments={getReefMaxFragments(clearedReefLevel)}
          totalFragmentsByFish={getTotalFragmentsByFish(allReefFragments)}
          priorTotalFragmentsByFish={priorTotalFragments || undefined}
          isAtlantisGateUnlocked={clearedAtlantisGate}
          isGulfStreamUnlocked={clearedGulfStream}
          clearTimeSeconds={lastClearTime}
          currentFastStreak={currentFastStreak}
          newlyUnlockedBadges={newlyUnlockedBadges}
          onEquipFish={handleSelectFish}
          onNextReef={handleContinueRunToNextReef}
          onReplayReef={handleReplayLevel}
          onOpenStats={() => {
            setShowStatsModal(true);
          }}
          onExitToMenu={handleExitToMenuFromCleared}
        />
      )}

      {/* Detailed Stats & Achievements Modal */}
      {showStatsModal && (
        <StatsModal
          stats={stats}
          reefProgress={reefProgress}
          allReefFragments={allReefFragments}
          totalFragmentsByFish={getTotalFragmentsByFish()}
          selectedFish={selectedFish}
          onSelectFish={handleSelectFish}
          selectedSkin={fishSkins[selectedFish] || DEFAULT_FISH_SKINS[selectedFish] || selectedSkin || 'coral'}
          fishSkins={fishSkins}
          onSelectSkin={handleSelectFishSkin}
          onSelectReef={(level) => {
            handleSelectReef(level);
            setShowStatsModal(false);
          }}
          onClose={() => setShowStatsModal(false)}
          onClearStats={handleClearStats}
        />
      )}
    </div>
  );
};
