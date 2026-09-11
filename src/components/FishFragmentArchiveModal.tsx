import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, Compass } from 'lucide-react';
import { AllReefFragments, FishType } from '../types';
import { countTotalFragments } from '../utils/fragments';
import { ReefFragmentRecordList } from './ReefFragmentRecordList';

interface FishFragmentArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalFragmentsByFish?: Record<FishType, number>;
  allReefFragments?: AllReefFragments;
  unlockedReef?: number;
  onSelectReefAndClose?: (reefLevel: number) => void;
}

export const FishFragmentArchiveModal: React.FC<FishFragmentArchiveModalProps> = ({
  isOpen,
  onClose,
  totalFragmentsByFish = {},
  allReefFragments = {},
  unlockedReef = 1,
  onSelectReefAndClose,
}) => {
  if (!isOpen) return null;

  const totalCollected = countTotalFragments(totalFragmentsByFish);

  // Find all reefs that have retained fragments
  const reefsWithFragments = Object.entries(allReefFragments)
    .filter(([_, counts]) => countTotalFragments(counts as Record<string, number>) > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]));

  return (
    <AnimatePresence>
      <div
        id="fish-fragment-archive-modal"
        className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          className="w-full max-w-md bg-slate-950/95 border border-cyan-500/30 rounded-3xl shadow-2xl p-5 text-slate-100 flex flex-col relative ring-1 ring-white/10 max-h-[90vh] overflow-hidden"
        >
          {/* Header matching Reef Levels button */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
                Reef Levels: <span className="font-black text-cyan-300 font-game">{unlockedReef}/50</span> unlocked.
              </h3>
            </div>

            <button
              id="close-fragment-archive-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto space-y-3.5 pr-1 py-3 custom-scrollbar">
            {/* Reef Retention Summary Section: Always shown with all 50 levels */}
            <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/10 shadow-inner">
              <div className="max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                <ReefFragmentRecordList
                  allReefFragments={allReefFragments}
                  unlockedReef={unlockedReef}
                  onSelectReef={onSelectReefAndClose}
                />
              </div>
            </div>

            {/* Summary Stat Banner (placed under the level listing panel) */}
            <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 rounded-2xl p-3.5 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-[9.5px] font-black uppercase tracking-[0.2em] text-amber-400">
                  Cumulative Fragments Found
                </div>
                <div className="text-3xl font-black font-game mt-0.5 text-white drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
                  {totalCollected}
                </div>
                <div className="text-[9.5px] text-slate-400 mt-0.5">
                  Across {reefsWithFragments.length} explored reefs
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-2xl">
                ✨
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end">
            <button
              id="back-fragment-archive-btn"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-md active:scale-95"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Back</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
