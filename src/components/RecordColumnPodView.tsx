import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { FishFragmentCounts, FishType } from '../types';
import { drawRecordColumnPod } from '../utils/fragmentRecordJuice';
import { getFishLevel, computeFishLevelProgression } from '../utils/fish';
import { REEF_FISH_ORDER } from './ReefFragmentRecordList';
import { FishBadgeIcon } from './FishBadgeIcon';

export interface RecordColumnPodCanvasProps {
  fishType: FishType;
  collected: number;
  priorRecord: number;
  beyondRecordSlots?: number;
  hasNewFishLevel?: boolean;
  currentLevel?: number;
}

/**
 * High-DPI canvas rendering an authentic in-game Record Column capsule pod
 * with live animated diamond facet rotations, beyond-record sunburst rays, and entrance bounce.
 */
export const RecordColumnPodCanvas: React.FC<RecordColumnPodCanvasProps> = ({
  fishType,
  collected,
  priorRecord,
  beyondRecordSlots: beyondRecordSlotsProp,
  hasNewFishLevel,
  currentLevel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isBeyondRecord = collected > priorRecord;
  const record = isBeyondRecord ? collected : Math.max(1, priorRecord);
  const unghostedCount = collected;
  const beyondRecordSlotIndices = isBeyondRecord
    ? Array.from({ length: collected - priorRecord }, (_, idx) => priorRecord + idx)
    : [];
  const beyondRecordCount = beyondRecordSlotsProp !== undefined
    ? beyondRecordSlotsProp
    : (isBeyondRecord ? collected - priorRecord : 0);

  const slotSpacing = 30;
  const slotRadius = 12.5;
  const podWidth = 34;

  const podHeight = (record - 1) * slotSpacing + slotRadius * 2 + 22;
  const canvasWidth = 68;
  const canvasHeight = Math.ceil(podHeight + 24);
  const centerX = canvasWidth / 2;
  const topSlotY = 12 + slotRadius + 13;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const startTime = performance.now();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);

    const render = (time: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      // Entrance bounce calculation for filled slots:
      const elapsed = (time - startTime) / 1000;
      const slotBounces: Record<number, number> = {};
      for (let i = 0; i < unghostedCount; i++) {
        const slotDelay = i * 0.08;
        if (elapsed < slotDelay) {
          slotBounces[i] = 0.01;
        } else {
          const t = Math.min(1, (elapsed - slotDelay) / 0.35);
          if (t < 1) {
            const spring = 1 + 0.4 * Math.sin((1 - t) * Math.PI * 2.5) * Math.pow(1 - t, 2);
            slotBounces[i] = spring;
          } else {
            slotBounces[i] = 1.0;
          }
        }
      }

      drawRecordColumnPod(ctx, {
        centerX,
        topSlotY,
        slotRadius,
        slotSpacing,
        podWidth,
        fishType,
        record,
        unghostedCount,
        beyondRecordSlots: beyondRecordSlotIndices,
        slotBounces,
        alpha: 1.0,
        time,
        headerLabel: 'RECORD',
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [fishType, collected, priorRecord, record, unghostedCount, beyondRecordSlotIndices.join(',')]);

  return (
    <div
      className="relative flex flex-col items-center justify-start w-full overflow-visible transform-gpu"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Column pod canvas with floating centered level-up reward overlay */}
      <div className="relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          style={{ width: canvasWidth, height: canvasHeight, transform: 'translateZ(0)' }}
          className="block drop-shadow-[0_4px_14px_rgba(0,0,0,0.55)] transform-gpu"
        />

        {/* If new fish level achieved: floating, centered in both x and y, over the column of that fish type */}
        {hasNewFishLevel && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 18 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.22, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.3,
                ease: 'easeInOut',
              }}
              className="relative flex items-center justify-center"
            >
              <FishBadgeIcon
                fishType={fishType}
                size={110}
                className="drop-shadow-[0_0_32px_rgba(250,204,21,0.95)] filter"
              />
              <span
                className="absolute -top-3 -right-4 font-game font-black text-2xl sm:text-3xl text-yellow-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] bg-slate-950/95 px-3 py-1 rounded-full border-2 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.95)] leading-none select-none tracking-tight"
              >
                +1
              </span>
            </motion.div>
            {currentLevel !== undefined && (
              <span className="font-game font-black text-xs sm:text-sm uppercase tracking-wider text-yellow-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] bg-slate-950/95 px-3 py-1 rounded-md mt-1 select-none border border-yellow-400/50 whitespace-nowrap shadow-lg">
                Level {currentLevel}!
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* If broken record: place a "+X" under the column where X is the number of Beyond-Record Slots */}
      {beyondRecordCount > 0 && (
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: -4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className="flex flex-col items-center mt-2"
        >
          <span
            className="font-game font-black text-sm sm:text-base text-yellow-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] tracking-wider select-none"
            title={`+${beyondRecordCount} Beyond-Record Slots`}
          >
            +{beyondRecordCount}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export interface ReefClearedRecordColumnsProps {
  attemptFragments?: FishFragmentCounts;
  priorReefMaxFragments?: FishFragmentCounts;
  reefMaxFragments?: FishFragmentCounts;
  totalFragmentsByFish?: Record<FishType, number>;
  priorTotalFragmentsByFish?: Record<FishType, number>;
  isGameOver?: boolean;
}

/**
 * Container rendering in-game Record Columns from left to right for each fish type collected in this run.
 * Divides the record achievements area evenly into N parts (with no visible frame),
 * centering each column within its fraction.
 */
export const ReefClearedRecordColumns: React.FC<ReefClearedRecordColumnsProps> = ({
  attemptFragments,
  priorReefMaxFragments,
  reefMaxFragments,
  totalFragmentsByFish,
  priorTotalFragmentsByFish,
  isGameOver = false,
}) => {
  // Only display columns for fish types collected in this attempt
  const collectedFish = REEF_FISH_ORDER.filter((fish) => {
    const count = attemptFragments?.[fish] || 0;
    return count > 0;
  });

  if (collectedFish.length === 0) {
    return null;
  }

  return (
    <div
      className="w-full my-3 relative overflow-visible"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${collectedFish.length}, minmax(0, 1fr))`,
      }}
    >
      {collectedFish.map((fish) => {
        const collected = attemptFragments?.[fish] || 0;
        // Determine prior record:
        // Use priorReefMaxFragments if provided, else fall back to reefMaxFragments
        const priorRecord = priorReefMaxFragments
          ? Number(priorReefMaxFragments[fish]) || 0
          : Number(reefMaxFragments?.[fish]) || 0;

        // Compute level progression using the shared calculation logic:
        const { beyondRecordSlots, achievedLevel, hasNewFishLevel } = computeFishLevelProgression({
          collected,
          priorRecord,
          totalFragments: totalFragmentsByFish?.[fish] ?? 0,
          priorTotalFragments: priorTotalFragmentsByFish?.[fish],
          isGameOver,
        });

        return (
          <div key={fish} className="flex flex-col items-center justify-start w-full relative overflow-visible">
            <RecordColumnPodCanvas
              fishType={fish}
              collected={collected}
              priorRecord={priorRecord}
              beyondRecordSlots={beyondRecordSlots}
              hasNewFishLevel={hasNewFishLevel}
              currentLevel={achievedLevel}
            />
          </div>
        );
      })}
    </div>
  );
};
