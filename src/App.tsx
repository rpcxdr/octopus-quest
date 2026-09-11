/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FlappyGame } from './components/FlappyGame';
import { Smartphone } from 'lucide-react';

export default function App() {
  return (
    <main
      id="flappy-app-root"
      className="w-screen h-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-4 text-slate-100 select-none relative font-sans"
    >
      {/* Immersive UI: Deep Ocean Atmospheric Glows */}
      <div className="absolute top-12 left-[10%] w-72 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-36 right-[15%] w-96 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 left-[20%] w-80 h-36 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Game Center Stage */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0 z-10">
        <FlappyGame />
      </div>

      {/* Immersive UI: Desktop & Touch Control Hints */}
      <footer className="hidden sm:flex items-center justify-center pt-2 pb-1 z-20">
        <div className="px-6 py-2 bg-slate-950/80 border border-cyan-500/20 rounded-full shadow-2xl flex items-center space-x-5 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-cyan-500 flex items-center justify-center border-b-4 border-cyan-700 text-white font-black text-xs">
              <span className="font-mono text-[11px]">␣</span>
            </div>
            <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
              Space to Swim
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full border-2 border-cyan-400/40 flex items-center justify-center text-cyan-200">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
              Touch / Tap Screen
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[11px] font-mono text-slate-300">P</kbd>
            <span>Pause</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[11px] font-mono text-slate-300 ml-1">M</kbd>
            <span>Mute</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

