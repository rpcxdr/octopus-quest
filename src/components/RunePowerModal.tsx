import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BadgeDefinition, BadgeProgress } from '../utils/badges';
import { RunePowerUnlockedPanel } from './RunePowerUnlockedPanel';

export interface RunePowerModalProps {
  isOpen: boolean;
  badge: BadgeDefinition | null;
  isUnlocked: boolean;
  progress?: BadgeProgress;
  onClose: () => void;
}

export const RunePowerModal: React.FC<RunePowerModalProps> = ({
  isOpen,
  badge,
  isUnlocked,
  progress,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !badge) return null;

  return (
    <AnimatePresence>
      <div
        id="rune-power-modal-backdrop"
        style={{ transform: 'translateZ(0)' }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 transform-gpu will-change-transform"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          className="w-full max-w-sm relative z-10 pointer-events-auto transform-gpu will-change-transform"
          onClick={(e) => e.stopPropagation()}
        >
          <RunePowerUnlockedPanel
            badge={badge}
            isUnlocked={isUnlocked}
            progress={progress}
            onClose={onClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
