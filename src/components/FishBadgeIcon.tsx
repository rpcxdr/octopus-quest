import React, { useState, useEffect } from 'react';
import { FishType } from '../types';
import { getFishBadgeDataUrl } from '../utils/fishBadgeRenderer';

export interface FishBadgeIconProps {
  fishType: FishType;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  title?: string;
}

/**
 * Drop-in replacement for fish emoji characters.
 * Renders the high-definition canvas bird sprite from renderer.ts at emoji scale.
 * Preserves standard inline text alignment and spacing.
 */
export const FishBadgeIcon: React.FC<FishBadgeIconProps> = ({
  fishType,
  size = '1.15em',
  className = '',
  style = {},
  alt,
  title,
}) => {
  const [dataUrl, setDataUrl] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      return getFishBadgeDataUrl(fishType);
    }
    return '';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const url = getFishBadgeDataUrl(fishType);
      setDataUrl(url);
    }
  }, [fishType]);

  const sizeStyle = typeof size === 'number' ? `${size}px` : size;

  if (!dataUrl) {
    return (
      <span
        style={{
          display: 'inline-block',
          width: sizeStyle,
          height: sizeStyle,
          verticalAlign: '-0.15em',
          ...style,
        }}
        className={`shrink-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt || `${fishType} badge`}
      title={title}
      draggable={false}
      className={`inline-block shrink-0 object-contain select-none pointer-events-none ${className}`}
      style={{
        width: sizeStyle,
        height: sizeStyle,
        verticalAlign: '-0.15em',
        ...style,
      }}
    />
  );
};
