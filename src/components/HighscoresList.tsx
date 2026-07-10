import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, RefreshCw, Star, Trash2, ArrowLeft } from 'lucide-react';
import { HighScore } from '../types';
import { playCollectSound } from '../lib/audio';

interface HighscoresListProps {
  key?: React.Key;
  onBack: () => void;
}

export default function HighscoresList({ onBack }: HighscoresListProps) {
  const [highscores, setHighscores] = useState<HighScore[]>([]);

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = () => {
    const raw = localStorage.getItem('cosmic_highscores');
    if (raw) {
      try {
        setHighscores(JSON.parse(raw));
      } catch (e) {
        // Fallback to defaults
        populateDefaults();
      }
    } else {
      populateDefaults();
    }
  };

  const populateDefaults = () => {
    const defaults: HighScore[] = [
      { name: 'STAR_COMMANDER', score: 5200, difficulty: 'hard', date: '2026-07-01' },
      { name: 'GOLD_GUNNER', score: 3850, difficulty: 'normal', date: '2026-07-05' },
      { name: 'CYBER_VIPER', score: 2400, difficulty: 'normal', date: '2026-07-08' },
      { name: 'NEO_CADET', score: 1250, difficulty: 'easy', date: '2026-07-09' },
      { name: 'VOID_RUNNER', score: 800, difficulty: 'easy', date: '2026-07-09' }
    ];
    localStorage.setItem('cosmic_highscores', JSON.stringify(defaults));
    setHighscores(defaults);
  };

  const handleClearScores = () => {
    if (confirm('คุณต้องการรีเซ็ตประวัติคะแนนสูงสุดทั้งหมดหรือไม่? / Do you want to clear all high scores?')) {
      localStorage.removeItem('cosmic_highscores');
      populateDefaults();
      playCollectSound();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="relative z-10 w-full max-w-lg bg-black/40 border border-[#38bdf8]/20 rounded-xl p-6 md:p-8 backdrop-blur-md"
    >
      {/* Decorative Gold & Blue corner brackets matching Elegant Dark */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#fbbf24] rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#38bdf8] rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#38bdf8] rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#fbbf24] rounded-br-lg" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#38bdf8]/20">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          <h2 className="font-display text-xl font-black tracking-widest text-[#38bdf8] uppercase italic">
            LEADERBOARD
          </h2>
        </div>
        <button
          id="btn-highscores-back-header"
          onClick={() => { playCollectSound(); onBack(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#38bdf8]/30 hover:border-[#38bdf8] hover:bg-[#38bdf8]/10 hover:text-white transition text-slate-300 text-xs uppercase tracking-widest font-mono bg-black/40 skew-x-[-12deg]"
        >
          <span className="inline-block skew-x-[12deg] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </span>
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-3 font-mono">
        <div className="flex justify-between text-xxs text-slate-500 uppercase tracking-widest px-3">
          <span>Rank & Commander</span>
          <div className="flex gap-8">
            <span>Diff</span>
            <span className="w-16 text-right">Score</span>
          </div>
        </div>

        <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1 custom-scrollbar">
          {highscores
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => {
              const isTopThree = index < 3;
              const placeColors = [
                'border-[#fbbf24] bg-[#fbbf24]/10 text-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.15)]', // Gold
                'border-slate-300 bg-slate-300/10 text-slate-200', // Silver
                'border-amber-700 bg-amber-700/10 text-amber-600', // Bronze
              ];
              return (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded-lg border-2 text-xs ${
                    isTopThree 
                      ? placeColors[index] 
                      : 'border-[#38bdf8]/10 bg-black/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {index === 0 && <Star className="w-3.5 h-3.5 text-[#fbbf24] fill-[#fbbf24] shrink-0" />}
                    {index === 1 && <Star className="w-3.5 h-3.5 text-slate-300 fill-slate-300 shrink-0" />}
                    {index === 2 && <Star className="w-3.5 h-3.5 text-amber-700 fill-amber-700 shrink-0" />}
                    {index > 2 && <span className="w-3.5 text-center text-slate-500 font-bold shrink-0">{index + 1}</span>}
                    
                    <span className="font-bold tracking-wide uppercase truncate max-w-[150px]">{entry.name}</span>
                  </div>

                  <div className="flex items-center gap-8 font-bold">
                    <span className={`text-[10px] uppercase tracking-widest font-black ${
                      entry.difficulty === 'hard' 
                        ? 'text-red-400' 
                        : entry.difficulty === 'normal' 
                          ? 'text-[#38bdf8]' 
                          : 'text-emerald-400'
                    }`}>
                      {entry.difficulty}
                    </span>
                    <span className="w-16 text-right font-black tracking-widest text-sm text-[#38bdf8]">
                      {entry.score}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 pt-4 border-t border-[#38bdf8]/20 flex justify-between items-center">
        <button
          id="btn-clear-scores"
          onClick={handleClearScores}
          className="flex items-center gap-1.5 px-3 py-2 text-xxs text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 rounded-lg uppercase tracking-widest transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear All Scores
        </button>

        <button
          id="btn-highscores-ok"
          onClick={() => { playCollectSound(); onBack(); }}
          className="px-6 py-2 bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-black font-display font-black text-xs uppercase tracking-widest skew-x-[-12deg] shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:scale-105 transition cursor-pointer"
        >
          <span className="inline-block skew-x-[12deg]">
            Menu
          </span>
        </button>
      </div>
    </motion.div>
  );
}
