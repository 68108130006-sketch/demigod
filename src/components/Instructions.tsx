import React from 'react';
import { motion } from 'motion/react';
import { 
  Keyboard, 
  Sparkles, 
  Heart, 
  ShieldAlert, 
  Sword, 
  Trophy, 
  ShieldCheck, 
  ArrowRight, 
  Coins 
} from 'lucide-react';
import { ControlsConfig } from '../types';
import { playCollectSound } from '../lib/audio';

interface InstructionsProps {
  key?: React.Key;
  controls: ControlsConfig;
  onBack: () => void;
}

export default function Instructions({ controls, onBack }: InstructionsProps) {
  const formatKey = (code: string) => {
    if (code.startsWith('Key')) return code.substring(3);
    if (code.startsWith('Digit')) return code.substring(5);
    if (code === 'Space') return 'Spacebar';
    if (code === 'ArrowUp') return '↑';
    if (code === 'ArrowDown') return '↓';
    if (code === 'ArrowLeft') return '←';
    if (code === 'ArrowRight') return '→';
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
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#38bdf8]/20">
        <div className="flex items-center gap-2.5">
          <Keyboard className="w-7 h-7 text-[#fbbf24]" />
          <h2 className="font-display text-2xl font-black tracking-widest text-[#38bdf8] uppercase italic">
            TACTICAL BRIEFING
          </h2>
        </div>
        <button
          id="btn-instructions-back"
          onClick={() => { playCollectSound(); onBack(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#38bdf8]/30 hover:border-[#38bdf8] hover:bg-[#38bdf8]/10 hover:text-white transition text-slate-300 text-xs uppercase tracking-widest font-mono bg-black/40 skew-x-[-12deg]"
        >
          <span className="inline-block skew-x-[12deg]">Close</span>
        </button>
      </div>

      <div className="space-y-6 max-h-[58vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Subtitle / Objective */}
        <div className="bg-black/40 p-4 border border-[#38bdf8]/20 rounded-xl">
          <p className="font-display font-black text-xs text-[#fbbf24] uppercase tracking-widest mb-1.5 flex items-center gap-2">
            <span className="w-1 h-3.5 bg-[#fbbf24]"></span>
            System Objective / เป้าหมายภารกิจ
          </p>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            ควบคุมยานรบติดปืนพลาสม่าระดับสูงเพื่อปกป้องกาแล็กซี หลบหลีกกระสุนศัตรู และยิงทำลายผู้รุกรานเพื่อเก็บคะแนนสูงสุดสะสม
            ระวังสัญญาณเตือนภัยสำหรับบอสยักษ์พลาสม่าที่จะปรากฏตัวเป็นระยะ!
          </p>
        </div>

        {/* 1. Control Bindings Grid */}
        <div className="space-y-3">
          <h3 className="text-[#fbbf24] text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-[#fbbf24]"></span>
            Navigation & Fire / แผงควบคุมยานรบ
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { label: 'Up / ขึ้น', key: controls.up },
              { label: 'Down / ลง', key: controls.down },
              { label: 'Left / ซ้าย', key: controls.left },
              { label: 'Right / ขวา', key: controls.right },
              { label: 'Shoot / ยิง', key: controls.shoot },
            ].map((item, index) => (
              <div key={index} className="bg-black/40 border-2 border-[#38bdf8]/20 p-3 rounded-lg text-center flex flex-col justify-between items-center gap-1.5">
                <span className="text-xxs text-slate-400 font-mono uppercase font-black tracking-widest leading-none">{item.label}</span>
                <kbd className="px-2.5 py-1.5 bg-black/40 text-[#38bdf8] text-xs font-mono font-black border-2 border-[#38bdf8] rounded shadow-[0_0_8px_rgba(56,189,248,0.15)] uppercase">
                  {formatKey(item.key)}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Upgrade Items / Collectibles */}
        <div className="space-y-3">
          <h3 className="text-[#fbbf24] text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-[#fbbf24]"></span>
            Power-Ups & Loot / ไอเทมเพิ่มพลัง
          </h3>
          <div className="space-y-2">
            {/* Weapon Up */}
            <div className="flex items-center gap-4 bg-black/40 hover:bg-[#38bdf8]/5 p-3 border border-[#38bdf8]/10 rounded-xl transition">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center shrink-0">
                <Sword className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-xs text-cyan-300 tracking-wider">WEAPON CORE (เพิ่มพลังอาวุธ)</span>
                  <span className="text-xxs bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-1.5 py-0.2 rounded font-mono font-bold">CYAN</span>
                </div>
                <p className="text-slate-400 text-xxs font-mono">
                  อัปเกรดระบบปืนเลเซอร์จากยิงเดี่ยว เป็นยิงคู่ ยิงกระจาย 3 ทิศทาง จนถึงพลาสม่าบีมทองคำทำลายล้างสูงสุด
                </p>
              </div>
            </div>

            {/* Shield Charger */}
            <div className="flex items-center gap-4 bg-black/40 hover:bg-[#38bdf8]/5 p-3 border border-[#38bdf8]/10 rounded-xl transition">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border-2 border-sky-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-sky-400 drop-shadow-[0_0_4px_rgba(14,165,233,0.6)]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-xs text-sky-300 tracking-wider">SHIELD FORCE (เพิ่มเกราะ)</span>
                  <span className="text-xxs bg-sky-500/10 border border-sky-500/20 text-sky-400 px-1.5 py-0.2 rounded font-mono font-bold">BLUE</span>
                </div>
                <p className="text-slate-400 text-xxs font-mono">
                  ฟื้นฟูเกราะพลังงานของยานรบจนเต็ม และได้รับโหมดอมตะชั่วคราวเป็นเวลา 3 วินาที (ป้องกันการโจมตีได้ทุกกรณี)
                </p>
              </div>
            </div>

            {/* Gold Star */}
            <div className="flex items-center gap-4 bg-black/40 hover:bg-[#38bdf8]/5 p-3 border border-[#38bdf8]/10 rounded-xl transition">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border-2 border-[#fbbf24] flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 text-[#fbbf24] drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-xs text-[#fbbf24] tracking-wider">GOLD STARS (ดาวทองคำ)</span>
                  <span className="text-xxs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-mono font-bold">GOLD</span>
                </div>
                <p className="text-slate-400 text-xxs font-mono">
                  ได้รับคะแนนโบนัสสะสมทันที +150 แต้มต่อดวง ดาวทองจะตกจากศัตรูพิเศษหรือบอสหลังจากถูกยิงทำลาย
                </p>
              </div>
            </div>

            {/* Life Regenerator */}
            <div className="flex items-center gap-4 bg-black/40 hover:bg-[#38bdf8]/5 p-3 border border-[#38bdf8]/10 rounded-xl transition">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-xs text-emerald-300 tracking-wider">NANO CORE LIFE (เพิ่มชีวิต)</span>
                  <span className="text-xxs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">GREEN</span>
                </div>
                <p className="text-slate-400 text-xxs font-mono">
                  เพิ่มพลังชีวิต (Life) ของยานรบขึ้น 1 หน่วย ช่วยให้ทำคะแนนแข่งขันสถิติสูงสุดได้นานขึ้นในรอบนั้นๆ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Tactical Advice */}
        <div className="bg-black/40 p-4 border border-[#38bdf8]/20 rounded-xl space-y-2">
          <h3 className="text-[#fbbf24] text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-[#fbbf24]"></span>
            Tactical Combat Guide / เคล็ดลับการรบกู้จักรวาล
          </h3>
          <ul className="list-disc pl-4 text-slate-400 text-xxs leading-relaxed font-mono space-y-1.5">
            <li>พยายามเคลื่อนที่หลบกระสุนพลาสม่าสีแดงของศัตรูตลอดเวลา อย่าหยุดนิ่งเด็ดขาด!</li>
            <li>การทำลายศัตรูสเกาต์ บอมเบอร์ และซีเกอร์ที่พุ่งเข้าชน ยานจะได้รับแต้มคะแนนที่สูงขึ้น</li>
            <li>เมื่อบอสพลาสม่าสีทองขนาดใหญ่บุกเข้ามา ให้ระวังปืนใหญ่เลเซอร์บลาสหลักที่มีดาเมจทะลุเกราะ</li>
            <li>ตัวเกมรองรับการสลับเป็นปุ่มจอยสติ๊กจำลองบนหน้าจอได้ในหน้า Options สำหรับการควบคุมด้วยเมาส์</li>
          </ul>
        </div>
      </div>

      {/* Footer Back */}
      <div className="mt-6 pt-4 border-t border-[#38bdf8]/20 flex justify-end">
        <button
          id="btn-instructions-ok"
          type="button"
          onClick={() => { playCollectSound(); onBack(); }}
          className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-black font-display font-black text-xs uppercase tracking-widest skew-x-[-12deg] shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:scale-105 transition cursor-pointer"
        >
          <span className="inline-block skew-x-[12deg]">
            Acknowledge & Return
          </span>
        </button>
      </div>
    </motion.div>
  );
}
