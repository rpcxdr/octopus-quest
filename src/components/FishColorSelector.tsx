import React from 'react';
import { Lock } from 'lucide-react';
import { BirdSkin, FishType } from '../types';
import { BIRD_SKINS, AVAILABLE_SKIN_KEYS, DEFAULT_FISH_SKINS } from '../utils/physics';

export interface FishColorSelectorProps {
  fishType: FishType;
  fishName?: string;
  selectedSkin?: BirdSkin;
  onSelectSkin?: (skin: BirdSkin, fishType: FishType) => void;
  canChangeColor: boolean;
  unlockHint?: string | null;
  className?: string;
}

/**
 * Shared color selection UX component for any fish in the game.
 * - When color changing is unlocked, renders high-contrast selectable color swatches.
 * - When locked, displays an elegant hint (e.g. rune requirement) or reserved spacing.
 */
export const FishColorSelector: React.FC<FishColorSelectorProps> = ({
  fishType,
  fishName = 'Fish',
  selectedSkin,
  onSelectSkin,
  canChangeColor,
  unlockHint,
  className = '',
}) => {
  const currentSkinKey = selectedSkin || DEFAULT_FISH_SKINS[fishType] || 'coral';

  if (!canChangeColor) {
    if (unlockHint) {
      return (
        <div
          id={`fish-color-locked-${fishType}`}
          className={`w-full flex items-center justify-center gap-1.5 mt-2 pt-1.5 border-t border-white/5 animate-fade-in ${className}`}
        >
          <Lock className="w-2.5 h-2.5 text-amber-400/90 shrink-0" />
          <span className="text-[8.5px] font-bold text-amber-300/90 tracking-wide">
            {unlockHint}
          </span>
        </div>
      );
    }
    return (
      <div
        className="w-full h-7 mt-2 pt-1.5 pointer-events-none"
        aria-hidden="true"
      />
    );
  }

  if (!onSelectSkin) {
    return null;
  }

  return (
    <div
      id={`fish-color-selector-${fishType}`}
      className={`w-full flex items-center justify-center gap-1.5 mt-2 pt-1.5 border-t border-white/5 animate-fade-in ${className}`}
    >
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
        {fishName} Shade:
      </span>
      {AVAILABLE_SKIN_KEYS.map((skinKey) => {
        const skin = BIRD_SKINS[skinKey];
        const isSelected =
          currentSkinKey === skinKey ||
          (skinKey === 'mimic' && currentSkinKey === 'classic');

        return (
          <button
            key={skinKey}
            id={`skin-select-${fishType}-${skinKey}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectSkin(skinKey, fishType);
            }}
            className={`w-4 h-4 rounded-full border transition cursor-pointer relative ${
              isSelected
                ? 'border-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.7)] ring-1 ring-white/50'
                : 'border-black/50 opacity-60 hover:opacity-100 hover:scale-110'
            }`}
            style={{ backgroundColor: skin.bodyColor }}
            title={`${skin.name} (${fishName})`}
          />
        );
      })}
    </div>
  );
};
