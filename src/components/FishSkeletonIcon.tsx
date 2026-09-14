import React from 'react';

export interface FishSkeletonIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

/**
 * FishSkeletonIcon
 * High-definition marine fish skeleton icon designed on a 24x24 grid,
 * matching Lucide icon proportions and stroke aesthetics.
 */
export const FishSkeletonIcon: React.FC<FishSkeletonIconProps> = ({
  size,
  className = '',
  strokeWidth = 2,
  ...props
}) => {
  const width = size ?? props.width;
  const height = size ?? props.height;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={width}
      height={height}
      className={className}
      {...props}
    >
      {/* Central Spine */}
      <line x1="3.5" y1="12" x2="16.5" y2="12" />

      {/* Caudal Tail Fin Skeleton */}
      <path d="M 1.5 6.5 L 3.5 12 L 1.5 17.5" />
      <path d="M 1.5 6.5 Q 3.2 12 1.5 17.5" />
      <line x1="3.5" y1="12" x2="2.2" y2="12" />

      {/* Rib 4 (Posterior / Smallest) */}
      <path d="M 5.0 9.5 L 5.8 12 L 5.0 14.5" />

      {/* Rib 3 (Mid-rear) */}
      <path d="M 7.4 8 L 8.5 12 L 7.4 16" />

      {/* Rib 2 (Mid-front) */}
      <path d="M 10.2 6.8 L 11.5 12 L 10.2 17.2" />

      {/* Rib 1 (Anterior / Longest) */}
      <path d="M 13.2 5.5 L 14.5 12 L 13.2 18.5" />

      {/* Fish Skull (Cranium & Open Jaw) */}
      <path d="M 16 6.8 C 18.2 6.5, 21 8, 22.5 11 L 19.2 12.5 L 21.8 14.2 C 20.2 16.2, 18 17.2, 16 17.2 C 14.8 14.5, 14.8 9.5, 16 6.8 Z" />

      {/* Cranial Eye Socket */}
      <circle cx="18.5" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
};
