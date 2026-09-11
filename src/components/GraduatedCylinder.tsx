import React from 'react';

interface GraduatedCylinderProps {
  fragmentsInLevel: number; // 0 to 9
  color?: string; // Theme color for liquid
  level?: number;
  unlocked?: boolean;
  fishName?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * Graduated Test Tube:
 * Simplified laboratory test-tube silhouette featuring a flared rolled glass rim,
 * a clean straight glass body with 10 graduation level tick marks, and a smooth
 * rounded U-shaped bottom. Fills smoothly according to fragments collected (0-9).
 */
export const GraduatedCylinder: React.FC<GraduatedCylinderProps> = ({
  fragmentsInLevel,
  color = '#38BDF8',
  level = 1,
  unlocked = true,
  fishName = 'Fish',
  size = 'sm',
  showLabel = true,
}) => {
  // Ensure fragments count is clamped between 0 and 9
  const count = Math.max(0, Math.min(9, Math.floor(fragmentsInLevel || 0)));
  const needed = 10 - count;

  // Test tube geometry in SVG coordinates
  // Center X = 9, tube width = 9.5 (left = 4.25, right = 13.75)
  // Straight body runs from y = 4.5 down to y = 34.5
  // Rounded U-bottom sweeps from (4.25, 34.5) to (13.75, 34.5) with radius 4.75 down to apex y = 39.25
  const tubeLeft = 4.25;
  const tubeRight = 13.75;
  const tubeTop = 4.5;
  const straightBottom = 34.5;
  const bottomApex = 39.25;
  const radius = 4.75;

  // Test tube outline path (top opening -> straight left wall -> rounded bottom dome -> straight right wall)
  const tubePath = `M ${tubeLeft} ${tubeTop} L ${tubeLeft} ${straightBottom} A ${radius} ${radius} 0 0 0 ${tubeRight} ${straightBottom} L ${tubeRight} ${tubeTop} Z`;

  // 10 graduation tick marks from 1 to 10
  // Level 1 sits just at the transition of the rounded bottom (y = 35)
  // Level 10 sits near the top rim (y = 8)
  // Even 3px spacing between marks: y = 38 - m * 3
  const marks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => {
    const y = 38 - m * 3;
    const isMajor = m === 5 || m === 10;
    const tickWidth = isMajor ? 4.25 : 2.5;
    return {
      markNumber: m,
      y,
      x1: tubeRight - tickWidth,
      x2: tubeRight,
      isMajor,
    };
  });

  // Liquid surface Y: for count = 1 -> y = 35, count = 5 -> y = 23, count = 9 -> y = 11
  const liquidY = 38 - count * 3;

  // Unique ID for SVG gradients / clip paths
  const uniqueId = React.useId().replace(/:/g, '_');

  const tooltipText = unlocked
    ? `${fishName}: Level ${level} • ${count}/10 fragments (${needed} more to Lv.${level + 1})`
    : `${fishName}: Locked • ${count}/10 fragments (${needed} more to Unlock)`;

  // Scale based on size prop
  const svgWidth = size === 'lg' ? 24 : size === 'md' ? 20 : 16;
  const svgHeight = size === 'lg' ? 60 : size === 'md' ? 52 : 42;

  return (
    <div
      className="flex flex-col items-center justify-center select-none group relative cursor-help"
      title={tooltipText}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox="0 0 18 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
      >
        <defs>
          {/* Clip path strictly restricting liquid to the rounded test-tube interior */}
          <clipPath id={`test-tube-clip-${uniqueId}`}>
            <path d={tubePath} />
          </clipPath>

          {/* Liquid gradient using fish theme color */}
          <linearGradient
            id={`liquid-grad-${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
            <stop offset="12%" stopColor={color} stopOpacity={0.95} />
            <stop offset="100%" stopColor={color} stopOpacity={0.7} />
          </linearGradient>

          {/* Glass reflection gradient */}
          <linearGradient
            id={`glass-shine-${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.4} />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.15} />
          </linearGradient>
        </defs>

        {/* 1. Translucent glass tube background */}
        <path
          d={tubePath}
          fill="rgba(15, 23, 42, 0.75)"
        />

        {/* 2. Liquid fill (0 to 9 fragments) clipped within the rounded test tube */}
        {count > 0 && (
          <g clipPath={`url(#test-tube-clip-${uniqueId})`}>
            {/* Liquid body */}
            <rect
              x={3}
              y={liquidY}
              width={12}
              height={bottomApex + 2 - liquidY}
              fill={`url(#liquid-grad-${uniqueId})`}
            />

            {/* Glowing slightly concave liquid meniscus */}
            <path
              d={`M ${tubeLeft} ${liquidY} Q 9 ${liquidY + 0.6} ${tubeRight} ${liquidY}`}
              stroke="#FFFFFF"
              strokeWidth="1.1"
              strokeOpacity="0.95"
              fill="none"
            />

            {/* Micro bubbles suspended in liquid */}
            {count >= 3 && (
              <>
                <circle
                  cx={7}
                  cy={liquidY + (bottomApex - liquidY) * 0.45}
                  r="0.6"
                  fill="#FFFFFF"
                  opacity="0.65"
                />
                <circle
                  cx={10.8}
                  cy={liquidY + (bottomApex - liquidY) * 0.75}
                  r="0.5"
                  fill="#FFFFFF"
                  opacity="0.55"
                />
              </>
            )}
          </g>
        )}

        {/* 3. 10 Graduation Level Marks (Tick lines on the right side) */}
        {marks.map(({ markNumber, y, x1, x2, isMajor }) => {
          // Highlight ticks that are reached/submerged by current fragment level
          const isReached = count >= markNumber;
          return (
            <g key={markNumber}>
              {/* Subtle dark contrast shadow behind the tick */}
              <line
                x1={x1}
                y1={y + 0.5}
                x2={x2}
                y2={y + 0.5}
                stroke="rgba(0, 0, 0, 0.7)"
                strokeWidth="0.9"
              />
              {/* Main crisp tick line */}
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={isReached ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'}
                strokeWidth={isMajor ? 1.0 : 0.8}
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* 4. Test tube outer glass wall stroke */}
        <path
          d={tubePath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="0.9"
        />

        {/* 5. Specular curved vertical glass highlight shine down left wall */}
        <path
          d="M 5.6 6.5 L 5.6 34 A 3.4 3.4 0 0 0 7.8 37.4"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.8"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />

        {/* 6. Flared rolled glass rim at top */}
        <ellipse
          cx={9}
          cy={tubeTop}
          rx={5.6}
          ry={1.2}
          fill="rgba(15, 23, 42, 0.85)"
          stroke="rgba(255, 255, 255, 0.7)"
          strokeWidth="0.85"
        />
        <line
          x1={4}
          y1={tubeTop + 0.8}
          x2={14}
          y2={tubeTop + 0.8}
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="0.6"
        />
      </svg>

      {/* Numerical mark label (e.g. "7/10") */}
      {showLabel && (
        <span
          className={`text-[7px] font-black font-mono leading-none mt-0.5 tracking-tighter ${
            count > 0 ? 'text-cyan-300' : 'text-slate-500'
          }`}
        >
          {count}/10
        </span>
      )}
    </div>
  );
};

// Export alias for consistency
export const GraduatedTestTube = GraduatedCylinder;

