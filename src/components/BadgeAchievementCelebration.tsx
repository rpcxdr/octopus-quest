import React from 'react';
import { BadgeDefinition } from '../utils/badges';
import { RunePowerUnlockedPanel } from './RunePowerUnlockedPanel';

export { RunePowerUnlockedPanel } from './RunePowerUnlockedPanel';
export type { RunePowerUnlockedPanelProps } from './RunePowerUnlockedPanel';

export interface BadgeAchievementCelebrationProps {
  badges: BadgeDefinition[];
  isGameOver?: boolean;
}

export const BadgeAchievementCelebration: React.FC<BadgeAchievementCelebrationProps> = ({
  badges,
  isGameOver = false,
}) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3 my-2 text-center relative z-10">
      {badges.map((badge, idx) => (
        <RunePowerUnlockedPanel
          key={badge.id}
          badge={badge}
          delayIndex={idx}
          isGameOver={isGameOver}
        />
      ))}
    </div>
  );
};
