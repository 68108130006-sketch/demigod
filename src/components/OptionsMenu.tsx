import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Gamepad2, 
  Volume2, 
  RotateCcw, 
  Check, 
  ArrowLeft, 
  Keyboard, 
  Gauge, 
  Smartphone, 
  Info 
} from 'lucide-react';
import { GameSettings, ControlsConfig, DifficultyLevel } from '../types';
import { setAudioVolume, playCollectSound } from '../lib/audio';

interface OptionsMenuProps {
  key?: React.Key;
  settings: GameSettings;
  onSave: (newSettings: GameSettings) => void;
  onBack: () => void;
}

export default function OptionsMenu({ settings, onSave, onBack }: OptionsMenuProps) {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(settings.difficulty);
  const [sfxVolume, setSfxVolume] = useState<number>(settings.sfxVolume);
  const [showOnScreenButtons, setShowOnScreenButtons] = useState<boolean>(settings.showOnScreenButtons);
  const [controls, setControls] = useState<ControlsConfig>({ ...settings.controls });
  
  // Track which control action is currently waiting for a key press
  const [bindingAction, setBindingAction] = useState<keyof ControlsConfig | null>(null);

  // Default control configuration
  const defaultControls: ControlsConfig = {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    shoot: 'Space'
  };

  useEffect(() => {
    if (!bindingAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      // Block escape from being bound if we want to cancel, but let's allow anything
      const keyStr = e.code;
      
      setControls(prev => ({
        ...prev,
        [bindingAction]: keyStr
      }));
      setBindingAction(null);
      playCollectSound();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [bindingAction]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setSfxVolume(vol);
    setAudioVolume(vol);
  };

  const handleTestVolume = () => {
    setAudioVolume(sfxVolume);
    playCollectSound();
  };

  const handleResetControls = () => {
    setControls(defaultControls);
    playCollectSound();
  };

  const handleSave = () => {
    onSave({
      difficulty,
      sfxVolume,
      showOnScreenButtons,
      controls
    });
    playCollectSound();
    onBack();
  };

  // Convert key code to user-friendly label (e.g., ArrowUp -> ↑)
  const formatKey = (code: string) => {
    if (code.startsWith('Key')) return code.substring(3);
    if (code.startsWith('Digit')) return code.substring(5);
    if (code === 'Space') return 'Spacebar';
    if (code === 'ArrowUp') return '↑ Up';
    if (code === 'ArrowDown') return '↓ Down';
    if (code === 'ArrowLeft') return '← Left';
    if (code === 'ArrowRight') return '→ Right';
    return code;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 w-full max-w-2xl bg-black/40 border border-[#38bdf8]/20 rounded-xl p-6 md:p-8 backdrop-blur-md"
    >
      {/* Decorative Gold & Blue corner brackets matching Elegant Dark */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#fbbf24] rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#38bdf8] rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#38bdf8] rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#fbbf24] rounded-br-lg" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#38bdf8]/20">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          <h2 className="font-display text-2xl md:text-3xl font-black tracking-widest text-[#38bdf8] uppercase italic">
            TACTICAL SETTINGS
          </h2>
        </div>
        <button
          id="btn-opt-back-header"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#38bdf8]/30 hover:border-[#38bdf8] hover:bg-[#38bdf8]/10 hover:text-white transition text-slate-300 text-xs uppercase tracking-widest font-mono bg-black/40 skew-x-[-12deg]"
        >
          <span className="inline-block skew-x-[12deg] flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </span>
        </button>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Game Difficulty Section */}
        <div className="space-y-3">
          <h3 className="text-[#fbbf24] text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-[#fbbf24]"></span>
            Game Difficulty / ระดับความยาก
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'normal', 'hard'] as DifficultyLevel[]).map((level) => (
              <button
                id={`btn-difficulty-${level}`}
                key={level}
                type="button"
                onClick={() => { setDifficulty(level); playCollectSound(); }}
                className={`py-3 px-4 rounded-lg border-2 text-center transition font-display uppercase tracking-widest font-black text-xs relative overflow-hidden skew-x-[-12deg] cursor-pointer ${
                  difficulty === level
                    ? 'border-[#fbbf24] bg-[#fbbf24]/10 text-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                    : 'border-[#38bdf8]/20 bg-black/40 text-slate-400 hover:border-[#38bdf8]/60 hover:text-white'
                }`}
              >
                <span className="inline-block skew-x-[12deg]">
                  {level === 'easy' && 'Easy / ง่าย'}
                  {level === 'normal' && 'Normal / ปกติ'}
                  {level === 'hard' && 'Hard / ยาก'}
                </span>
                {difficulty === level && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#fbbf24] rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* SFX Volume Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[#fbbf24] text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-[#fbbf24]"></span>
              SFX Volume / เสียงเอฟเฟกต์
            </h3>
            <span className="font-mono text-xs text-[#38bdf8] font-bold">{Math.round(sfxVolume * 100)}%</span>
          </div>
          <div className="flex items-center gap-4 bg-black/40 p-4 border border-[#38bdf8]/20 rounded-xl">
            <input
              id="slider-sfx-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#fbbf24]"
            />
            <button
              id="btn-test-sound"
              type="button"
              onClick={handleTestVolume}
              className="px-3 py-1.5 bg-black/40 hover:bg-[#38bdf8]/10 border border-[#38bdf8]/30 hover:border-[#38bdf8] text-[#38bdf8] rounded-lg text-xs font-mono uppercase tracking-widest transition whitespace-nowrap"
            >
              Test SFX
            </button>
          </div>
        </div>

        {/* Input Interface Binding Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[#fbbf24] text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-[#fbbf24]"></span>
              Controls Mapping / การบังคับปุ่มตัวละคร
            </h3>
            <button
              id="btn-reset-controls"
              type="button"
              onClick={handleResetControls}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#fbbf24] transition uppercase font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Use Default
            </button>
          </div>

          <div className="bg-black/40 border border-[#38bdf8]/20 rounded-xl p-4 space-y-3">
            <div className="text-slate-400 text-xs leading-relaxed font-mono mb-2 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
              <span>คลิกที่ปุ่มควบคุมเพื่อกำหนดปุ่มใหม่ จากนั้นกดปุ่มใดๆ บนคีย์บอร์ดที่ท่านต้องการใช้<br />Click any control row, then press your desired key on the keyboard.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(controls) as Array<keyof ControlsConfig>).map((action) => {
                const isBindingThis = bindingAction === action;
                return (
                  <div 
                    key={action}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition ${
                      isBindingThis 
                        ? 'border-[#fbbf24] bg-[#fbbf24]/5 shadow-[0_0_8px_rgba(251,191,36,0.15)]' 
                        : 'border-[#38bdf8]/10 bg-black/40 hover:border-[#38bdf8]/30'
                    }`}
                  >
                    <span className="font-display font-medium text-xs text-slate-300 uppercase tracking-wider">
                      {action === 'up' && 'Move Up / บินขึ้น'}
                      {action === 'down' && 'Move Down / บินลง'}
                      {action === 'left' && 'Move Left / บินซ้าย'}
                      {action === 'right' && 'Move Right / บินขวา'}
                      {action === 'shoot' && 'Weapon Fire / ยิงศัตรู'}
                    </span>
                    
                    <button
                      id={`btn-bind-${action}`}
                      type="button"
                      onClick={() => setBindingAction(action)}
                      className={`min-w-28 px-3 py-1.5 text-xs font-mono font-bold rounded-md border-2 text-center transition uppercase tracking-widest ${
                        isBindingThis
                          ? 'border-[#fbbf24] bg-[#fbbf24] text-slate-950 animate-pulse font-extrabold'
                          : 'border-[#38bdf8]/30 bg-black/40 text-[#38bdf8] hover:bg-[#38bdf8]/10 hover:text-white'
                      }`}
                    >
                      {isBindingThis ? 'PRESS KEY...' : formatKey(controls[action])}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* On Screen Touch Controls (For tablets, mobile, or alternative play) */}
        <div className="space-y-3">
          <h3 className="text-[#fbbf24] text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-[#fbbf24]"></span>
            Virtual Joystick Panel / ปุ่มจำลองบนหน้าจอ
          </h3>
          <div className="flex items-center justify-between bg-black/40 p-4 border border-[#38bdf8]/20 rounded-xl">
            <div className="space-y-1 pr-4">
              <p className="font-display text-xs font-bold text-slate-300">
                Show Virtual Controller Buttons (สำหรับจอสัมผัสหรือคีย์บอร์ดเสริม)
              </p>
              <p className="text-slate-500 text-xxs font-mono leading-relaxed">
                Render directional D-pad & Fire buttons directly in the active game view.
              </p>
            </div>
            <button
              id="btn-toggle-onscreen-controls"
              type="button"
              onClick={() => {
                setShowOnScreenButtons(!showOnScreenButtons);
                playCollectSound();
              }}
              className={`w-14 h-7 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                showOnScreenButtons ? 'bg-[#fbbf24]' : 'bg-slate-800'
              }`}
            >
              <span className={`w-5 h-5 rounded-full bg-slate-950 shadow-md transform transition-transform duration-200 ease-out ${
                showOnScreenButtons ? 'translate-x-7' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

      </div>

      {/* Footer Save Button */}
      <div className="mt-8 pt-4 border-t border-[#38bdf8]/20 flex justify-end gap-4">
        <button
          id="btn-opt-cancel"
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 bg-black/40 border-2 border-white/20 hover:border-white/40 hover:text-white transition font-display font-bold text-xs text-slate-400 uppercase tracking-widest skew-x-[-12deg] cursor-pointer"
        >
          <span className="inline-block skew-x-[12deg]">Cancel</span>
        </button>
        <button
          id="btn-opt-save"
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-black font-display font-black text-xs uppercase tracking-widest skew-x-[-12deg] shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:scale-105 transition cursor-pointer"
        >
          <span className="inline-block skew-x-[12deg] flex items-center gap-1">
            <Check className="w-4 h-4" /> Save Settings
          </span>
        </button>
      </div>
    </motion.div>
  );
}
