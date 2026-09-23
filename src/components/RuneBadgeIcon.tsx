import React, { useState, useEffect } from 'react';
import { BadgeId } from '../types';
import { getSchoolOfFishDataUrl, getFishBadgeDataUrl } from '../utils/fishBadgeRenderer';

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
 * For 'coral_seahorse', it renders the crisp custom seahorse graphic.
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
  const [customIconUrl, setCustomIconUrl] = useState<string>(() => {
    if (typeof document === 'undefined') return '';
    if (badgeId === 'tidesong') {
      return getSchoolOfFishDataUrl();
    }
    if (badgeId === 'coral_seahorse') {
      return getFishBadgeDataUrl('seahorse');
    }
    return '';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (badgeId === 'tidesong') {
      setCustomIconUrl(getSchoolOfFishDataUrl());
    } else if (badgeId === 'coral_seahorse') {
      setCustomIconUrl(getFishBadgeDataUrl('seahorse'));
    }
  }, [badgeId]);

  const sizeStyle = typeof size === 'number' ? `${size}px` : size;

  if (badgeId === 'tidesong' || badgeId === 'coral_seahorse') {
    if (!customIconUrl) {
      return (
        <span
          className={`inline-block select-none ${className} ${grayscale ? 'grayscale opacity-50' : ''}`}
          style={{ width: sizeStyle, height: sizeStyle }}
          aria-hidden="true"
        >
          {emoji}
        </span>
      );
    }
    return (
      <img
        src={customIconUrl}
        alt={alt || (badgeId === 'coral_seahorse' ? 'Coral Seahorse' : 'Tidesong School of Fish')}
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
