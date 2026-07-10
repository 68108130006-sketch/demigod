import React from 'react';
import { motion } from 'motion/react';
import { Play, Settings, Keyboard, Trophy, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
import { playCollectSound } from '../lib/audio';

interface MainMenuProps {
  key?: React.Key;
  onStartGame: () => void;
  onOpenOptions: () => void;
  onOpenInstructions: () => void;
  onOpenHighscores: () => void;
}

export default function MainMenu({ 
  onStartGame, 
  onOpenOptions, 
  onOpenInstructions, 
  onOpenHighscores 
}: MainMenuProps) {

  const handleMenuClick = (action: () => void) => {
    playCollectSound();
    action();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 w-full max-w-lg flex flex-col items-center px-4"
    >
      {/* Dynamic Cyber Gimmick - Logo wrapper with blinking golden borders and sky-blue backglows */}
      <div className="relative mb-6 flex flex-col items-center">
        {/* Sky-blue neon back glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#38bdf8]/20 via-[#fbbf24]/10 to-[#38bdf8]/20 blur-3xl rounded-full" />
        
        {/* Animated Bracket Borders */}
        <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[#fbbf24]" />
        <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-[#38bdf8]" />
        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-[#38bdf8]" />
        <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-[#fbbf24]" />

        {/* User Required Logo */}
        <motion.div
          animate={{ 
            y: [0, -6, 0],
            filter: [
              'drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))',
              'drop-shadow(0 0 22px rgba(251, 191, 36, 0.6))',
              'drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))'
            ]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative max-w-full z-10 p-2"
        >
          <img 
            src="https://res.cloudinary.com/dsucg33fv/image/upload/v1782709347/logo_i8827v.png" 
            alt="Cosmic Strike Logo" 
            className="h-28 sm:h-36 object-contain pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      {/* Sub-header slogan and info */}
      <div className="text-center mb-10 z-10 space-y-1">
        <h1 className="font-display font-black text-2xl md:text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#fbbf24] to-[#38bdf8] uppercase italic">
          Cosmic Strike
        </h1>
        <p className="text-[10px] md:text-xs font-mono text-[#38bdf8] tracking-widest uppercase opacity-90">
          Tactical Galaxy Interface // ระบบยิงศัตรูพลาสม่า
        </p>
      </div>

      {/* Menu Buttons Block */}
      <div className="w-full space-y-4">
        {/* Play Game - Main Golden CTA */}
        <button
          id="btn-menu-play"
          onClick={() => handleMenuClick(onStartGame)}
          className="w-full relative group overflow-hidden py-4 px-6 bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-black font-display font-black tracking-widest text-sm uppercase skew-x-[-12deg] shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] transition-all duration-300 hover:scale-[1.03] flex items-center justify-center gap-3 cursor-pointer"
        >
          <span className="inline-block skew-x-[12deg] flex items-center gap-2">
            <Play className="w-5 h-5 fill-black stroke-black" />
            <span>PLAY GAME / เข้าเล่นเกม</span>
          </span>
        </button>

        {/* Adjust Controls Options - Sky Cyber style */}
        <button
          id="btn-menu-options"
          onClick={() => handleMenuClick(onOpenOptions)}
          className="w-full py-3.5 px-6 bg-black/40 border-2 border-[#38bdf8]/40 hover:border-[#38bdf8] hover:bg-[#38bdf8]/10 text-[#38bdf8] hover:text-white transition-all duration-200 flex items-center justify-between font-display text-xs font-bold tracking-widest uppercase skew-x-[-12deg] group cursor-pointer"
        >
          <span className="inline-block skew-x-[12deg] flex items-center justify-between w-full">
            <span className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-[#38bdf8] group-hover:rotate-45 transition-transform" />
              <span>Options / ปรับค่าการบังคับ</span>
            </span>
            <span className="text-xxs font-mono text-[#fbbf24]/80 group-hover:translate-x-1 transition-transform">Configure &raquo;</span>
          </span>
        </button>

        {/* Mission Briefing - Sky Cyan style */}
        <button
          id="btn-menu-instructions"
          onClick={() => handleMenuClick(onOpenInstructions)}
          className="w-full py-3.5 px-6 bg-black/40 border-2 border-[#38bdf8]/40 hover:border-[#38bdf8] hover:bg-[#38bdf8]/10 text-[#38bdf8] hover:text-white transition-all duration-200 flex items-center justify-between font-display text-xs font-bold tracking-widest uppercase skew-x-[-12deg] group cursor-pointer"
        >
          <span className="inline-block skew-x-[12deg] flex items-center justify-between w-full">
            <span className="flex items-center gap-3">
              <Keyboard className="w-4 h-4 text-[#38bdf8]" />
              <span>Mission Brief / วิธีเล่นเกม</span>
            </span>
            <span className="text-xxs font-mono text-[#fbbf24]/80 group-hover:translate-x-1 transition-transform">Controls &raquo;</span>
          </span>
        </button>

        {/* Leaderboard / Highscores - Gold Outline style */}
        <button
          id="btn-menu-highscores"
          onClick={() => handleMenuClick(onOpenHighscores)}
          className="w-full py-3.5 px-6 bg-black/40 border-2 border-[#38bdf8]/20 hover:border-[#38bdf8] hover:bg-[#38bdf8]/10 text-slate-300 hover:text-white transition-all duration-200 flex items-center justify-between font-display text-xs font-bold tracking-widest uppercase skew-x-[-12deg] group cursor-pointer"
        >
          <span className="inline-block skew-x-[12deg] flex items-center justify-between w-full">
            <span className="flex items-center gap-3">
              <Trophy className="w-4 h-4 text-[#fbbf24]" />
              <span>Leaderboard / คะแนนสูงสุด</span>
            </span>
            <span className="text-xxs font-mono text-[#fbbf24]/80 group-hover:translate-x-1 transition-transform">Hall of Fame &raquo;</span>
          </span>
        </button>
      </div>

      {/* Footer system details */}
      <div className="mt-12 text-center text-xxs font-mono text-slate-500 tracking-wider">
        <p className="uppercase">Tactical Combat Interface // SECURE CONNECTION ESTABLISHED</p>
        <p className="mt-1 text-slate-600 font-sans">
          Support Web Audio &middot; Keyboard Control &middot; Onscreen D-pad
        </p>
      </div>
    </motion.div>
  );
}
