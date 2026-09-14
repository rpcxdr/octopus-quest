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
  countTotalFragments,
} from '../utils/fragments';
import {
  createRecordJuiceState,
  triggerFragmentRecordJuice,
  updateRecordJuice,
  drawRecordJuice,
  drawFishLevelJuice,
  FragmentRecordJuiceState,
} from '../utils/fragmentRecordJuice';
import { getBaseFragments } from '../utils/badges';
import { StartScreenOverlay } from './StartScreenOverlay';
import { ScoreBoardModal } from './ScoreBoardModal';
import { StatsModal } from './StatsModal';
import { ReefClearedModal } from './ReefClearedModal';
import { FishBadgeIcon } from './FishBadgeIcon';
import { drawFishBadgeCanvas } from '../utils/fishBadgeRenderer';
import { Pause, Play, Volume2, VolumeX, Waves, Trophy, ArrowRight, Home } from 'lucide-react';

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
  const [isContinuingRun, setIsContinuingRun] = useState<boolean>(false);
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
  const [currentAttemptFragments, setCurrentAttemptFragments] = useState<FishFragmentCounts>(() =>
    createEmptyFragmentCounts()
  );
  const [priorReefMaxFragments, setPriorReefMaxFragments] = useState<FishFragmentCounts>(() =>
    createEmptyFragmentCounts()
  );
  const [priorTotalFragments, setPriorTotalFragments] = useState<FishFragmentCounts | null>(null);
  const [clearedAtlantisGate, setClearedAtlantisGate] = useState<boolean>(false);
  const [clearedGulfStream, setClearedGulfStream] = useState<boolean>(false);
  const [lastClearTime, setLastClearTime] = useState<number | undefined>(undefined);
  const [currentFastStreak, setCurrentFastStreak] = useState<number>(() => loadReefProgress().currentFastReefsInRow || 0);

  const initialFish = loadSelectedFish();
  const initialDifficulty = loadGameDifficulty();
  const initialFragmentsMap = loadReefFragments();
  const initialTotalFrags = getTotalFragmentsByFish(initialFragmentsMap);
  const initialFishLevel = getFishLevel(initialTotalFrags[initialFish] || 0);
  const initialOctopusLevel = getFishLevel(initialTotalFrags['octopus'] || 0);
  const initialStats = loadGameStats();
  const initialProgress = loadReefProgress();
  const initialBaseFragments = getBaseFragments(initialStats.totalScore, initialProgress, initialStats);
  const initialFragmentCount = initialFish === 'octopus' ? initialBaseFragments + initialOctopusLevel : initialBaseFragments;

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

  // Handle difficulty selection: easy (+20% gap), medium (default), hard (+20% speed)
  const handleSelectDifficulty = useCallback((newDiff: GameDifficulty) => {
    setDifficulty(newDiff);
    saveGameDifficulty(newDiff);
    const s = stateRef.current;
    s.difficulty = newDiff;
    const config = getPhysicsForDifficulty(newDiff, s.currentReef);
    s.reefColumns = generateReefColumns(s.currentReef, config, newDiff);
    sound.playSwoosh();
  }, []);

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
      const config = getPhysicsForDifficulty(s.difficulty, s.currentReef);
      const octLevel = getFishLevel(frags['octopus'] || 0);
      const baseFrags = getBaseFragments(stats.totalScore, reefProgress);
      const fragCount = fish === 'octopus' ? baseFrags + octLevel : baseFrags;
      s.floatingFragments = generateReefFloatingFragments(
        config.virtualHeight,
        config.groundHeight,
        Date.now(),
        fragCount,
        fish
      );
    }
  }, [allReefFragments, stats.totalScore, reefProgress]);

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
    const config = getPhysicsForDifficulty(s.difficulty, safeReef);
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
    const baseFrags = getBaseFragments(stats.totalScore, updated, stats);
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
    setIsContinuingRun(false);
    setIsNewHighScore(false);
    setIsPaused(false);
    setAbilitySnapshot(s.fishBehavior.getAbilityState());
    setGameState('IDLE');
  }, [allReefFragments, stats.totalScore]);

  // Handle jumping to next reef while preserving survival run score
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
    const config = getPhysicsForDifficulty(s.difficulty, safeNext);
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
    const baseFrags = getBaseFragments(stats.totalScore + s.score, updated, stats);
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
    s.reefElapsedTime = 0;

    setReefColumn(0);
    setCurrentAttemptFragments(createEmptyFragmentCounts());
    setIsContinuingRun(true);
    setIsPaused(false);
    setAbilitySnapshot(s.fishBehavior.getAbilityState());
    setGameState('IDLE');
  }, [allReefFragments]);

  // Handle jump/flap action
  const handleFlap = useCallback(() => {
    const s = stateRef.current;
    if (s.isPaused) return;
    const config = getPhysicsForDifficulty(s.difficulty, s.currentReef);

    if (s.gameState === 'IDLE') {
      // If no floating fragments spawned yet, generate for this attempt
      if (s.floatingFragments === undefined) {
        const frags = getTotalFragmentsByFish(allReefFragments);
        const octLevel = getFishLevel(frags['octopus'] || 0);
        const baseFrags = getBaseFragments(stats.totalScore + s.score, reefProgress, stats);
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
      s.gameState = 'PLAYING';
      setGameState('PLAYING');
      setNewlyUnlockedFish(null);
      setIsContinuingRun(false);
      s.reefElapsedTime = 0;
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

    const config = getPhysicsForDifficulty(s.difficulty, s.currentReef);
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
    const baseFrags = getBaseFragments(stats.totalScore, reefProgress, stats);
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
    setIsContinuingRun(false);
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
  }, [allReefFragments]);

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

    const config = getPhysicsForDifficulty(s.difficulty, s.currentReef);
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
    const baseFrags = getBaseFragments(stats.totalScore, reefProgress, stats);
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

    // Immediately start playing and apply initial flap
    s.gameState = 'PLAYING';
    s.isPaused = false;
    s.reefElapsedTime = 0;
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

    setScore(0);
    setReefColumn(0);
    setCurrentAttemptFragments(createEmptyFragmentCounts());
    setIsContinuingRun(false);
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
    setGameState('PLAYING');
  }, [allReefFragments, stats.totalScore, reefProgress]);

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
      const config = getPhysicsForDifficulty(s.difficulty, s.currentReef);
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
            const newPipe: Pipe = {
              id: s.nextPipeId++,
              x: startX,
              topHeight: colTemplate.topHeight,
              bottomHeight: colTemplate.bottomHeight,
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
                s.gameState = 'REEF_CLEARED';
                s.reefClearedTime = Date.now();
                setGameState('REEF_CLEARED');
                sound.playLevelClear();

                s.reefsClearedInRun += 1;

                const prevBestScore = getBestReefScore(stats, reefProgress);

                // Check if all 50 reefs in order were cleared without dying
                const isFullRunWithoutDying =
                  s.runStartReef === 1 &&
                  s.currentReef === TOTAL_REEF_LEVELS &&
                  s.reefsClearedInRun >= TOTAL_REEF_LEVELS;

                const clearTime = s.reefElapsedTime;
                setLastClearTime(clearTime);

                // Save reef completion
                const {
                  progress: updatedReefProgress,
                  currentFastStreak: newFastStreak,
                  atlantisGateUnlockedNow,
                  gulfStreamUnlockedNow,
                } = completeReefLevel(
                  s.currentReef,
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
                  ...(priorStoredFragments[s.currentReef] || getReefMaxFragments(s.currentReef))
                };
                setPriorReefMaxFragments(priorReefRecord);
                const prevFragsOnClear = getTotalFragmentsByFish(priorStoredFragments);
                setPriorTotalFragments(prevFragsOnClear);
                const { updated: updatedFragments } = recordReefFragments(
                  s.currentReef,
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
    const config = getPhysicsForDifficulty(s.difficulty, 1);
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
    const baseFrags = getBaseFragments(0, freshReefProgress, freshStats);
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
    setIsContinuingRun(false);
    setIsPaused(false);
    setAbilitySnapshot(s.fishBehavior.getAbilityState());
    setGameState('IDLE');
  };

  return (
    <div
      id="flappy-game-wrapper"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative w-full h-full max-w-[440px] max-h-[820px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-slate-950 select-none touch-none cursor-pointer ring-1 ring-white/15"
      style={{ touchAction: 'none' }}
    >
      {/* High-DPI Canvas */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        width={DEFAULT_PHYSICS.virtualWidth}
        height={DEFAULT_PHYSICS.virtualHeight}
        className="w-full h-full block object-contain"
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
      {(gameState === 'PLAYING' || (gameState === 'IDLE' && isContinuingRun)) && (
        <div className="absolute top-3 inset-x-3 flex flex-col gap-2 z-15 pointer-events-none">
          <div className="flex items-start justify-between">
            {/* Reef Level & Column Progress Card */}
            <div className="bg-slate-950/80 backdrop-blur-xl border border-cyan-500/25 rounded-2xl px-3 py-1.5 shadow-2xl pointer-events-auto">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Waves className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black tracking-wider uppercase font-game">
                    Reef {reefProgress.currentReef}
                  </span>
                </div>
                <span
                  id="hud-difficulty-badge"
                  className={`text-[8px] font-black font-sans uppercase px-1.5 py-0.5 rounded-full border ${
                    difficulty === 'easy'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : difficulty === 'hard'
                      ? 'bg-orange-950/80 text-orange-300 border-orange-500/40'
                      : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                  }`}
                  title={`Reef ${reefProgress.currentReef}: +${getSpeedIncreasePercent(difficulty, reefProgress.currentReef)}% speed (${difficulty} mode)`}
                >
                  {difficulty} &bull; +{getSpeedIncreasePercent(difficulty, reefProgress.currentReef)}% spd
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-200 mt-0.5">
                Column <span className="text-cyan-300 font-game">{reefColumn}</span>
                <span className="text-slate-400 font-sans"> / 10</span>
                {score > reefColumn && (
                  <span className="text-[10px] text-amber-300 font-normal ml-1.5">
                    (Run: <span className="font-game font-bold">{score}</span>)
                  </span>
                )}
              </div>
            </div>

            {/* Center Controls (Mute & Pause) */}
            <div className="flex items-center gap-1.5 pt-0.5 pointer-events-auto">
              <button
                id="in-game-mute-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMute();
                }}
                className="w-8 h-8 rounded-full bg-slate-950/75 hover:bg-slate-900 border border-white/10 text-white flex items-center justify-center backdrop-blur-xl transition cursor-pointer shadow-lg active:scale-95"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>

              <button
                id="in-game-pause-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((p) => !p);
                }}
                className="w-8 h-8 rounded-full bg-slate-950/75 hover:bg-slate-900 border border-white/10 text-white flex items-center justify-center backdrop-blur-xl transition cursor-pointer shadow-lg active:scale-95"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
                  <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>

            {/* Zone Name & High Score Badge */}
            <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-1.5 shadow-2xl text-right pointer-events-auto max-w-[140px]">
              <span className="text-[9px] text-cyan-400 font-black tracking-wide uppercase truncate block" title={getReefZoneName(reefProgress.currentReef)}>
                {getReefZoneName(reefProgress.currentReef)}
              </span>
              <span className="text-[8px] text-teal-300/80 font-bold tracking-tight uppercase truncate block" title={getColumnThemeName(reefProgress.currentReef)}>
                {getColumnThemeName(reefProgress.currentReef)}
              </span>
              <div
                id="hud-best-score"
                className="text-xs font-bold text-amber-300 drop-shadow-md font-sans leading-tight mt-0.5 flex items-center justify-end gap-1"
              >
                <Trophy className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Best: {stats.highScore}</span>
              </div>
            </div>
          </div>

          {/* 10-Column Progress Bar / Pearl dots */}
          <div className="flex items-center justify-center gap-1 px-4 py-1 bg-slate-950/60 backdrop-blur-md rounded-full border border-cyan-500/20 max-w-xs mx-auto shadow-md">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isCleared = idx < reefColumn;
              const isCurrent = idx === reefColumn;
              return (
                <div
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    isCleared
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] scale-110'
                      : isCurrent
                      ? 'bg-cyan-300 ring-2 ring-cyan-400/60 animate-pulse'
                      : 'bg-white/15 border border-white/10'
                  }`}
                  title={`Column ${idx + 1}`}
                />
              );
            })}
          </div>

          {/* Active Reef Fragments Collector Pill (shown once first fragment is collected) */}
          {countTotalFragments(currentAttemptFragments) > 0 && (
            <div className="flex items-center justify-center pointer-events-auto">
              <div
                id="hud-reef-fragments"
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-cyan-500/30 bg-slate-950/70 text-cyan-200 flex items-center gap-2 shadow-md backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
                title="Fragments collected in this Reef attempt"
              >
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  {(Object.entries(currentAttemptFragments) as [FishType, number][])
                    .filter(([_, count]) => count > 0)
                    .map(([fish, count]) => (
                      <span key={fish} className="text-amber-300 font-bold inline-flex items-center gap-1">
                        <FishBadgeIcon fishType={fish} size={13} />
                        <span>{count}</span>
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Character Special Power Active Status Pill */}
          {selectedFish !== 'octopus' && (
            <div className="flex items-center justify-center pointer-events-auto">
              {selectedFish === 'pufferfish' && (
                <div
                  id="hud-ability-pufferfish"
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all ${
                    abilitySnapshot.shieldState === 'active'
                      ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 ring-2 ring-cyan-400/40 animate-pulse'
                      : abilitySnapshot.shieldState === 'ready'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900/70 text-slate-400 border-white/10 opacity-70'
                  }`}
                >
                  <FishBadgeIcon fishType="pufferfish" size={14} />
                  <span>Shield:</span>
                  <span className="font-mono">
                    {abilitySnapshot.shieldState === 'active'
                      ? `${abilitySnapshot.shieldTimeRemaining.toFixed(1)}s`
                      : abilitySnapshot.shieldState === 'ready'
                      ? 'READY'
                      : 'DEPLETED'}
                  </span>
                </div>
              )}
              {selectedFish === 'clownfish' && (
                <div
                  id="hud-ability-clownfish"
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-orange-500/40 bg-orange-500/20 text-orange-200 flex items-center gap-1.5 shadow-md backdrop-blur-md"
                >
                  <FishBadgeIcon fishType="clownfish" size={14} />
                  <span>Ascent Multiplier:</span>
                  <span className="text-orange-300 font-mono">
                    {abilitySnapshot.clownfishUpwardTaps && abilitySnapshot.clownfishUpwardTaps > 0
                      ? `${abilitySnapshot.clownfishUpwardTaps}x Tap (${Math.round((abilitySnapshot.clownfishGravityMultiplier ?? 1) * 100)}%)`
                      : 'TAP UP'}
                  </span>
                </div>
              )}
              {selectedFish === 'singray' && (
                <div
                  id="hud-ability-singray"
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all ${
                    abilitySnapshot.isDashing
                      ? 'bg-sky-500/30 text-sky-200 border-sky-400 ring-2 ring-sky-400/40 animate-pulse'
                      : 'bg-sky-950/40 text-sky-300 border-sky-500/30'
                  }`}
                >
                  <FishBadgeIcon fishType="singray" size={14} />
                  <span>Hydro Dash:</span>
                  <span className="font-mono">
                    {abilitySnapshot.isDashing ? '⚡ +10% SPD ACTIVE' : 'PRESS SPACE'}
                  </span>
                </div>
              )}
              {selectedFish === 'seahorse' && (
                <div
                  id="hud-ability-seahorse"
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-purple-500/40 bg-purple-500/20 text-purple-200 flex items-center gap-1.5 shadow-md backdrop-blur-md"
                >
                  <FishBadgeIcon fishType="seahorse" size={14} />
                  <span>Wave Switch:</span>
                  <span
                    className={`font-black font-mono px-1.5 py-0.5 rounded ${
                      abilitySnapshot.seahorseNextDirection === 'up'
                        ? 'text-emerald-300 bg-emerald-950/60'
                        : 'text-amber-300 bg-amber-950/60'
                    }`}
                  >
                    {abilitySnapshot.seahorseNextDirection === 'up' ? '▲ UP' : '▼ DOWN'}
                  </span>
                </div>
              )}
            </div>
          )}
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
                {difficulty} mode &bull; Speed: +{getSpeedIncreasePercent(difficulty, reefProgress.currentReef)}% {difficulty === 'easy' ? '(+20% Gap)' : ''}
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
                id="pause-home-btn"
                onClick={() => {
                  setIsPaused(false);
                  handleRestart();
                }}
                className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-md active:scale-95"
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
      {gameState === 'IDLE' && !isContinuingRun && (
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

      {/* Ready for Next Reef Banner (when continuing survival run streak across levels) */}
      {gameState === 'IDLE' && isContinuingRun && (
        <div
          id="ready-next-reef-banner"
          className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20 pointer-events-auto bg-slate-950/65 backdrop-blur-md select-none"
          onClick={handleFlap}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-slate-950/95 border border-cyan-400/40 rounded-3xl p-5 text-center shadow-2xl max-w-sm w-full flex flex-col items-center ring-1 ring-cyan-400/20"
          >
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-400 mb-1">
              <Waves className="w-4 h-4" />
              <span>Next Reef Ready</span>
            </div>
            <h2 className="text-2xl font-black font-game text-white tracking-wider">
              Reef {reefProgress.currentReef}
            </h2>
            <div className="text-xs text-cyan-200/80 mb-2">
              {getReefZoneName(reefProgress.currentReef)} &bull; {getColumnThemeName(reefProgress.currentReef)}
            </div>
            <div className="mb-3">
              <span
                className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                  difficulty === 'easy'
                    ? 'text-emerald-300 border-emerald-500/40 bg-emerald-950/80'
                    : difficulty === 'hard'
                    ? 'text-orange-300 border-orange-500/40 bg-orange-950/80'
                    : 'text-cyan-300 border-cyan-500/40 bg-cyan-950/80'
                }`}
              >
                {difficulty} &bull; +{getSpeedIncreasePercent(difficulty, reefProgress.currentReef)}% speed
              </span>
            </div>

            <div className="w-full bg-gradient-to-r from-amber-500/20 via-teal-500/15 to-cyan-500/20 border border-amber-400/40 rounded-2xl p-2.5 mb-4 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                  Survival Streak
                </span>
                <span className="text-xs text-slate-300">Keep it alive!</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-game text-amber-300">
                  {score}
                </span>
                <span className="text-[10px] text-amber-200/80 block -mt-1">
                  columns
                </span>
              </div>
            </div>

            {/* Action buttons matching Reef Cleared modal */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                id="tap-to-swim-next-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlap();
                }}
                className="w-full py-3.5 sm:py-4 px-5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/25 transition active:scale-98 cursor-pointer text-base sm:text-lg"
              >
                <span>Keep Swimming!</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                id="exit-to-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestart();
                }}
                className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-md active:scale-95"
                title="Return to Home Screen"
              >
                <Home className="w-3.5 h-3.5 text-cyan-400" />
                <span>Home</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Game Over Score Board Modal */}
      {gameState === 'GAMEOVER' && (
        <ScoreBoardModal
          score={score}
          reefLevel={reefProgress.currentReef}
          reefColumn={reefColumn}
          highScore={stats.highScore}
          isNewHighScore={isNewHighScore}
          totalScore={stats.totalScore}
          reefProgress={reefProgress}
          stats={stats}
          difficulty={difficulty}
          attemptFragments={currentAttemptFragments}
          reefMaxFragments={getReefMaxFragments(reefProgress.currentReef)}
          totalFragmentsByFish={getTotalFragmentsByFish(allReefFragments)}
          priorTotalFragmentsByFish={priorTotalFragments || undefined}
          onRestart={handleReplayLevel}
          onOpenStats={() => setShowStatsModal(true)}
          onGoHome={handleRestart}
        />
      )}

      {/* Reef Cleared Modal (Level Passed!) */}
      {gameState === 'REEF_CLEARED' && (
        <ReefClearedModal
          isOpen={true}
          reefLevel={reefProgress.currentReef}
          difficulty={difficulty}
          flapsThisRun={stateRef.current.flapsCount}
          runTotalColumns={stateRef.current.score}
          bestFlaps={reefProgress.clearedReefs[reefProgress.currentReef]?.fewestFlaps}
          unlockedFish={newlyUnlockedFish}
          selectedFish={selectedFish}
          attemptFragments={currentAttemptFragments}
          priorReefMaxFragments={priorReefMaxFragments}
          reefMaxFragments={getReefMaxFragments(reefProgress.currentReef)}
          totalFragmentsByFish={getTotalFragmentsByFish(allReefFragments)}
          priorTotalFragmentsByFish={priorTotalFragments || undefined}
          isAtlantisGateUnlocked={Boolean(
            reefProgress.atlantisGateUnlocked ||
            stats.atlantisGateUnlocked ||
            clearedAtlantisGate ||
            (stateRef.current.runStartReef === 1 &&
              stateRef.current.currentReef === TOTAL_REEF_LEVELS &&
              stateRef.current.reefsClearedInRun >= TOTAL_REEF_LEVELS)
          )}
          isGulfStreamUnlocked={Boolean(
            reefProgress.gulfStreamUnlocked ||
            stats.gulfStreamUnlocked ||
            clearedGulfStream ||
            (reefProgress.currentFastReefsInRow && reefProgress.currentFastReefsInRow >= 10) ||
            currentFastStreak >= 10
          )}
          clearTimeSeconds={lastClearTime}
          currentFastStreak={currentFastStreak}
          onEquipFish={handleSelectFish}
          onNextReef={handleContinueRunToNextReef}
          onReplayReef={handleReplayLevel}
          onOpenStats={() => {
            setShowStatsModal(true);
          }}
          onExitToMenu={handleRestart}
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
