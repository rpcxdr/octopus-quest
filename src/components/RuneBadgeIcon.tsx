import React, { useState, useEffect } from 'react';
import { BadgeId } from '../types';
import { getSchoolOfFishDataUrl } from '../utils/fishBadgeRenderer';

export interface RuneBadgeIconProps {
  badgeId: BadgeId | 'none';
  emoji: string;
  size?: number | string;
  className?: string;
  grayscale?: boolean;
  alt?: string;
}

/**
 * Drop-in renderer for rune / badge icons.
 * For 'tidesong', it renders a school of fish of different types (Clownfish, Pufferfish, Seahorse, Singray, Octopus).
 * For all other runes, it renders the standard emoji.
 */
export const RuneBadgeIcon: React.FC<RuneBadgeIconProps> = ({
  badgeId,
  emoji,
  size = '1em',
  className = '',
  grayscale = false,
  alt,
}) => {
  const [schoolUrl, setSchoolUrl] = useState<string>(() => {
    if (badgeId === 'tidesong' && typeof document !== 'undefined') {
      return getSchoolOfFishDataUrl();
    }
    return '';
  });

  useEffect(() => {
    if (badgeId === 'tidesong' && typeof document !== 'undefined') {
      setSchoolUrl(getSchoolOfFishDataUrl());
    }
  }, [badgeId]);

  const sizeStyle = typeof size === 'number' ? `${size}px` : size;

  if (badgeId === 'tidesong') {
    if (!schoolUrl) {
      return (
        <span
          className={`inline-block select-none ${className} ${grayscale ? 'grayscale opacity-50' : ''}`}
          style={{ width: sizeStyle, height: sizeStyle }}
          aria-hidden="true"
        >
          🐟
        </span>
      );
    }
    return (
      <img
        src={schoolUrl}
        alt={alt || 'Tidesong School of Fish'}
        draggable={false}
        className={`inline-block shrink-0 object-contain select-none pointer-events-none ${className} ${
          grayscale ? 'grayscale opacity-50' : ''
        }`}
        style={{
          width: sizeStyle,
          height: sizeStyle,
        }}
      />
    );
  }

  return (
    <span
      className={`inline-block leading-none select-none ${className} ${
        grayscale ? 'grayscale opacity-50' : ''
      }`}
      style={{
        fontSize: sizeStyle,
      }}
    >
      {emoji}
    </span>
  );
};
