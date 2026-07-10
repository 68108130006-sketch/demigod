/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameSettings, ViewState } from './types';
import MainMenu from './components/MainMenu';
import OptionsMenu from './components/OptionsMenu';
import Instructions from './components/Instructions';
import HighscoresList from './components/HighscoresList';
import GameScreen from './components/GameScreen';
import { setAudioVolume, initAudio, playCollectSound } from './lib/audio';

// Default settings fallback
const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'normal',
  sfxVolume: 0.5,
  showOnScreenButtons: false,
  controls: {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    shoot: 'Space',
  }
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>('menu');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  // Initialize and load saved settings on mount
  useEffect(() => {
    initAudio();
    
    const saved = localStorage.getItem('cosmic_settings');
    if (saved) {
      try {
        const parsed: GameSettings = JSON.parse(saved);
        // Ensure all keys are populated properly to avoid old-cache issues
        const validatedSettings: GameSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          controls: {
            ...DEFAULT_SETTINGS.controls,
            ...(parsed.controls || {})
          }
        };
        setSettings(validatedSettings);
        setAudioVolume(validatedSettings.sfxVolume);
      } catch (e) {
        // Fallback
        setSettings(DEFAULT_SETTINGS);
        setAudioVolume(DEFAULT_SETTINGS.sfxVolume);
      }
    } else {
      // First time save
      localStorage.setItem('cosmic_settings', JSON.stringify(DEFAULT_SETTINGS));
      setAudioVolume(DEFAULT_SETTINGS.sfxVolume);
    }
  }, []);

  // Save new options settings
  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('cosmic_settings', JSON.stringify(newSettings));
    setAudioVolume(newSettings.sfxVolume);
  };

  // Helper trigger to wake up AudioContext (Browsers block audio until gesture interaction)
  const handleUserInteract = () => {
    initAudio();
  };

  return (
    <div 
      onClick={handleUserInteract}
      onKeyDown={handleUserInteract}
      className="relative w-screen h-screen bg-[#020617] text-slate-100 flex items-center justify-center overflow-hidden font-sans select-none"
    >
      {/* Elegant Dark Dotted Grid Background style */}
      <div className="absolute inset-0 dotted-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-[#1e1b4b] opacity-60 pointer-events-none" />

      {/* 1. Global Ambient Parallax Starfield Background (Active only when not playing) */}
      <AnimatePresence>
        {activeView !== 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Ambient nebulas glows from the Elegant Dark palette */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#38bdf8]/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#fbbf24]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retro scanline cyber grille */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-15 z-40" />

      {/* 2. Main Game Routing Switcher with gorgeous page transition effects */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {activeView === 'menu' && (
            <MainMenu 
              key="menu"
              onStartGame={() => setActiveView('playing')}
              onOpenOptions={() => setActiveView('options')}
              onOpenInstructions={() => setActiveView('instructions')}
              onOpenHighscores={() => setActiveView('highscores')}
            />
          )}

          {activeView === 'options' && (
            <OptionsMenu 
              key="options"
              settings={settings}
              onSave={handleSaveSettings}
              onBack={() => setActiveView('menu')}
            />
          )}

          {activeView === 'instructions' && (
            <Instructions 
              key="instructions"
              controls={settings.controls}
              onBack={() => setActiveView('menu')}
            />
          )}

          {activeView === 'highscores' && (
            <HighscoresList 
              key="highscores"
              onBack={() => setActiveView('menu')}
            />
          )}

          {activeView === 'playing' && (
            <div key="playing" className="absolute inset-0 w-full h-full z-20">
              <GameScreen 
                settings={settings}
                onQuit={() => setActiveView('menu')}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
