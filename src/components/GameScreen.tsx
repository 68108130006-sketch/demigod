import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Shield, 
  Pause, 
  Play, 
  RotateCcw, 
  Home, 
  Volume2, 
  VolumeX, 
  Award, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Zap 
} from 'lucide-react';
import { GameSettings, HighScore, ControlsConfig, Particle, Bullet, Enemy, PowerUp } from '../types';
import { 
  playLaserSound, 
  playEnemyShootSound, 
  playExplosionSound, 
  playCollectSound, 
  playHurtSound, 
  playShieldSound, 
  playBossAlertSound 
} from '../lib/audio';

interface GameScreenProps {
  settings: GameSettings;
  onQuit: () => void;
}

export default function GameScreen({ settings, onQuit }: GameScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game UI/overlay States
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [shield, setShield] = useState(100);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [bossActive, setBossActive] = useState(false);
  const [bossHp, setBossHp] = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(100);
  
  // Local volume state helper
  const [isMuted, setIsMuted] = useState(settings.sfxVolume === 0);

  // Refs for real-time game loop properties (to avoid React re-render lags in canvas 60fps)
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const shieldRef = useRef(100);
  const weaponLevelRef = useRef(1);
  const activeKeys = useRef<Set<string>>(new Set());

  // Game arrays
  const bullets = useRef<Bullet[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const particles = useRef<Particle[]>([]);
  const powerUps = useRef<PowerUp[]>([]);
  const floatingTexts = useRef<Array<{ x: number; y: number; text: string; timer: number; color: string }>>([]);

  // Starfield background
  const stars = useRef<Array<{ x: number; y: number; speed: number; size: number; color: string }>>([]);

  // Player ship coordinates and physics
  const playerX = useRef(200);
  const playerY = useRef(500);
  const playerSpeed = 5.5;
  const playerSize = 22;
  const invulnFrames = useRef(0); // Player temporary invulnerability
  const shootCooldown = useRef(0);
  
  // Game ticker stats
  const enemyIdCounter = useRef(0);
  const spawnTimer = useRef(0);
  const currentBossRef = useRef<Enemy | null>(null);
  const screenShake = useRef(0);
  const nextBossScore = useRef(1000);

  // Width and height of canvas
  const [canvasDim, setCanvasDim] = useState({ width: 600, height: 700 });

  // Load High Scores threshold
  useEffect(() => {
    // Initialise stars once
    const tempStars = [];
    for (let i = 0; i < 60; i++) {
      tempStars.push({
        x: Math.random() * 600,
        y: Math.random() * 700,
        speed: Math.random() * 2.5 + 0.5,
        size: Math.random() * 2 + 0.5,
        color: Math.random() > 0.4 ? '#38bdf8' : (Math.random() > 0.5 ? '#facc15' : '#ffffff') // Sky-blue, gold, white stars
      });
    }
    stars.current = tempStars;

    // Detect high score threshold
    scoreRef.current = 0;
    livesRef.current = 3;
    shieldRef.current = 100;
    weaponLevelRef.current = 1;
  }, []);

  // Sync canvas size to container on load & resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const boundedW = Math.max(320, Math.min(width, 700));
        const boundedH = Math.max(480, height);
        setCanvasDim({ width: boundedW, height: boundedH });

        // Redistribute stars on width/height adjustment
        stars.current.forEach(star => {
          star.x = Math.random() * boundedW;
          star.y = Math.random() * boundedH;
        });

        // Set player start position centrally
        playerX.current = boundedW / 2;
        playerY.current = boundedH - 120;
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setIsPaused(prev => !prev);
        return;
      }
      activeKeys.current.add(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameUpdate = () => {
      if (isPaused || isGameOver) return;

      // Handle Screen Shake dissipation
      if (screenShake.current > 0) {
        screenShake.current -= 0.5;
      }

      // Handle Invulnerability Frame dissipation
      if (invulnFrames.current > 0) {
        invulnFrames.current--;
      }

      // 1. Move Player
      let dx = 0;
      let dy = 0;

      // Check key codes based on user's options bindings
      if (activeKeys.current.has(settings.controls.up) || activeKeys.current.has('ArrowUp')) dy -= playerSpeed;
      if (activeKeys.current.has(settings.controls.down) || activeKeys.current.has('ArrowDown')) dy += playerSpeed;
      if (activeKeys.current.has(settings.controls.left) || activeKeys.current.has('ArrowLeft')) dx -= playerSpeed;
      if (activeKeys.current.has(settings.controls.right) || activeKeys.current.has('ArrowRight')) dx += playerSpeed;

      // Restrict player movement within boundary bounds
      playerX.current = Math.max(playerSize, Math.min(canvasDim.width - playerSize, playerX.current + dx));
      playerY.current = Math.max(playerSize, Math.min(canvasDim.height - playerSize, playerY.current + dy));

      // 2. Weapon Shooting mechanics
      if (shootCooldown.current > 0) {
        shootCooldown.current--;
      }

      const isPressingShoot = activeKeys.current.has(settings.controls.shoot);
      
      // Auto shoot or button pressed shoot
      if (shootCooldown.current === 0 && (isPressingShoot || settings.showOnScreenButtons)) {
        // Determine weapon fire layout based on weapon level
        const currentLvl = weaponLevelRef.current;
        const baseDmg = settings.difficulty === 'hard' ? 8 : settings.difficulty === 'easy' ? 15 : 10;
        
        playLaserSound();

        if (currentLvl === 1) {
          // Single laser central shot
          bullets.current.push({
            x: playerX.current,
            y: playerY.current - playerSize,
            vx: 0,
            vy: -10,
            damage: baseDmg,
            isPlayer: true,
            color: '#0ea5e9', // Cyber Blue
            size: 4
          });
          shootCooldown.current = 14;
        } else if (currentLvl === 2) {
          // Dual laser guns
          bullets.current.push({
            x: playerX.current - 8,
            y: playerY.current - playerSize,
            vx: 0,
            vy: -11,
            damage: baseDmg * 0.8,
            isPlayer: true,
            color: '#06b6d4', // Cyan
            size: 4
          });
          bullets.current.push({
            x: playerX.current + 8,
            y: playerY.current - playerSize,
            vx: 0,
            vy: -11,
            damage: baseDmg * 0.8,
            isPlayer: true,
            color: '#06b6d4',
            size: 4
          });
          shootCooldown.current = 12;
        } else if (currentLvl === 3) {
          // Triple Wide Spread
          bullets.current.push({
            x: playerX.current,
            y: playerY.current - playerSize,
            vx: 0,
            vy: -12,
            damage: baseDmg,
            isPlayer: true,
            color: '#38bdf8', // Neon Sky Blue
            size: 4
          });
          bullets.current.push({
            x: playerX.current - 12,
            y: playerY.current - playerSize + 6,
            vx: -3,
            vy: -11,
            damage: baseDmg * 0.7,
            isPlayer: true,
            color: '#38bdf8',
            size: 3.5
          });
          bullets.current.push({
            x: playerX.current + 12,
            y: playerY.current - playerSize + 6,
            vx: 3,
            vy: -11,
            damage: baseDmg * 0.7,
            isPlayer: true,
            color: '#38bdf8',
            size: 3.5
          });
          shootCooldown.current = 13;
        } else {
          // Level 4+: Ultimate Golden Plasma Beam
          bullets.current.push({
            x: playerX.current,
            y: playerY.current - playerSize,
            vx: 0,
            vy: -14,
            damage: baseDmg * 1.5,
            isPlayer: true,
            color: '#eab308', // Radiant Gold
            size: 6
          });
          bullets.current.push({
            x: playerX.current - 16,
            y: playerY.current - 10,
            vx: -2.2,
            vy: -12,
            damage: baseDmg * 0.6,
            isPlayer: true,
            color: '#eab308',
            size: 3
          });
          bullets.current.push({
            x: playerX.current + 16,
            y: playerY.current - 10,
            vx: 2.2,
            vy: -12,
            damage: baseDmg * 0.6,
            isPlayer: true,
            color: '#eab308',
            size: 3
          });
          shootCooldown.current = 9;
        }
      }

      // 3. Move background stars
      stars.current.forEach(star => {
        star.y += star.speed;
        if (star.y > canvasDim.height) {
          star.y = 0;
          star.x = Math.random() * canvasDim.width;
        }
      });

      // 4. Update Bullets physics
      bullets.current.forEach((bullet, index) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Remove off-screen bullets
        if (bullet.y < -10 || bullet.y > canvasDim.height + 10 || bullet.x < -10 || bullet.x > canvasDim.width + 10) {
          bullets.current.splice(index, 1);
        }
      });

      // 5. Spawn Enemies Wave system
      spawnTimer.current++;
      const currentDifficultyMod = settings.difficulty === 'easy' ? 90 : settings.difficulty === 'hard' ? 45 : 65;
      
      // Determine if a Boss needs to spawn
      if (scoreRef.current >= nextBossScore.current && !currentBossRef.current) {
        setBossActive(true);
        playBossAlertSound();
        const bossHpMax = 200 + (scoreRef.current / 1000) * 150;
        setBossMaxHp(bossHpMax);
        setBossHp(bossHpMax);

        const spawnBoss: Enemy = {
          id: enemyIdCounter.current++,
          x: canvasDim.width / 2,
          y: -80,
          vx: 1.5,
          vy: 1.0, // Descend
          width: 80,
          height: 48,
          hp: bossHpMax,
          maxHp: bossHpMax,
          scoreValue: 500,
          type: 'boss',
          shootCooldown: 0,
          color: '#eab308', // Shiny Gold Armor Boss
          lastShotTime: 0
        };

        enemies.current.push(spawnBoss);
        currentBossRef.current = spawnBoss;
        nextBossScore.current += 1000; // Next Boss threshold
      }

      // Standard enemy wave spawning
      if (spawnTimer.current > currentDifficultyMod && !currentBossRef.current) {
        spawnTimer.current = 0;
        const enemyRnd = Math.random();
        
        let type: 'scout' | 'bomber' | 'seeker' = 'scout';
        let width = 24;
        let height = 24;
        let hp = 15;
        let scoreVal = 50;
        let color = '#ef4444'; // Red scout
        let vx = (Math.random() - 0.5) * 2;
        let vy = Math.random() * 2 + 1.2;

        if (enemyRnd > 0.82) {
          // Seeker (Fast homing interceptor)
          type = 'seeker';
          width = 20;
          height = 20;
          hp = 10;
          scoreVal = 100;
          color = '#f59e0b'; // Gold seeker
          vx = 0;
          vy = Math.random() * 1.5 + 3.0; // Fast
        } else if (enemyRnd > 0.55) {
          // Bomber (Slow tank ship)
          type = 'bomber';
          width = 38;
          height = 30;
          hp = 45;
          scoreVal = 150;
          color = '#ec4899'; // Purple/Pink bomber
          vx = (Math.random() - 0.5) * 1.0;
          vy = Math.random() * 0.8 + 0.8;
        }

        // Apply Difficulty Multipliers to Enemy Stats
        if (settings.difficulty === 'hard') {
          hp *= 1.35;
          vy *= 1.25;
        } else if (settings.difficulty === 'easy') {
          hp *= 0.7;
          vy *= 0.8;
        }

        enemies.current.push({
          id: enemyIdCounter.current++,
          x: Math.random() * (canvasDim.width - 40) + 20,
          y: -40,
          vx,
          vy,
          width,
          height,
          hp,
          maxHp: hp,
          scoreValue: scoreVal,
          type,
          shootCooldown: Math.random() * 100 + 40,
          color,
          lastShotTime: 0
        });
      }

      // 6. Update Enemies and AI
      enemies.current.forEach((enemy, index) => {
        // AI Movement rules
        if (enemy.type === 'boss') {
          // Boss stays at top center mostly
          if (enemy.y < 90) {
            enemy.y += enemy.vy;
          } else {
            enemy.y = 90;
            enemy.x += enemy.vx;
            // Bound movement back and forth
            if (enemy.x > canvasDim.width - 50 || enemy.x < 50) {
              enemy.vx *= -1;
            }
          }

          // Spiral/ring attacks
          enemy.shootCooldown--;
          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = settings.difficulty === 'hard' ? 45 : settings.difficulty === 'easy' ? 95 : 70;
            playEnemyShootSound();

            // Fire 3 bullets in fan pattern
            const angleStep = 0.35;
            for (let i = -1; i <= 1; i++) {
              bullets.current.push({
                x: enemy.x,
                y: enemy.y + 24,
                vx: Math.sin(i * angleStep) * 4.5,
                vy: Math.cos(i * angleStep) * 4.5 + 1.5,
                damage: 20,
                isPlayer: false,
                color: '#f43f5e', // Dangerous Red Rose
                size: 5
              });
            }

            // Occasional secondary rapid laser tracking
            if (Math.random() > 0.4) {
              const dxToPlayer = playerX.current - enemy.x;
              const dyToPlayer = playerY.current - enemy.y;
              const dist = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);
              const vxHoming = (dxToPlayer / dist) * 6;
              const vyHoming = (dyToPlayer / dist) * 6;

              bullets.current.push({
                x: enemy.x,
                y: enemy.y + 24,
                vx: vxHoming,
                vy: vyHoming,
                damage: 15,
                isPlayer: false,
                color: '#eab308', // Fast golden bullets
                size: 4
              });
            }
          }
        } else {
          // Standard enemy movement
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Seeker slightly follows player horizontal coordinate
          if (enemy.type === 'seeker') {
            const homingForce = 0.045;
            if (enemy.x < playerX.current) {
              enemy.vx += homingForce;
            } else {
              enemy.vx -= homingForce;
            }
            // Limit horizontal velocity
            enemy.vx = Math.max(-2, Math.min(2, enemy.vx));
          }

          // Boundary warp/bounce for standard enemies
          if (enemy.x < enemy.width / 2 || enemy.x > canvasDim.width - enemy.width / 2) {
            enemy.vx *= -1;
          }

          // Enemy shooting mechanics
          enemy.shootCooldown--;
          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = Math.random() * 150 + 100;
            
            // Scouts shoot down, bombers shoot aiming double bullets
            if (enemy.type === 'bomber') {
              playEnemyShootSound();
              bullets.current.push({
                x: enemy.x - 8,
                y: enemy.y + 12,
                vx: -0.5,
                vy: 4.5,
                damage: 10,
                isPlayer: false,
                color: '#d946ef', // Magenta
                size: 4.5
              });
              bullets.current.push({
                x: enemy.x + 8,
                y: enemy.y + 12,
                vx: 0.5,
                vy: 4.5,
                damage: 10,
                isPlayer: false,
                color: '#d946ef',
                size: 4.5
              });
            } else if (enemy.type === 'scout' && Math.random() > 0.3) {
              playEnemyShootSound();
              bullets.current.push({
                x: enemy.x,
                y: enemy.y + 12,
                vx: 0,
                vy: 4.0,
                damage: 8,
                isPlayer: false,
                color: '#ef4444', // Red
                size: 3.5
              });
            }
          }
        }

        // Handle off-screen enemies
        if (enemy.y > canvasDim.height + 40) {
          enemies.current.splice(index, 1);
          // If we lost a boss due to viewport off-screen (highly unlikely but safeguard), clear ref
          if (enemy.type === 'boss') {
            currentBossRef.current = null;
            setBossActive(false);
          }
        }
      });

      // 7. Update Power-ups movement
      powerUps.current.forEach((item, index) => {
        item.y += item.vy;
        if (item.y > canvasDim.height + 20) {
          powerUps.current.splice(index, 1);
        }
      });

      // 8. Collisions Checking (Bullet vs Entities)
      bullets.current.forEach((bullet, bIdx) => {
        if (bullet.isPlayer) {
          // Player lasers vs Enemies
          enemies.current.forEach((enemy, eIdx) => {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            // Rough bounding circle box collision
            if (dist < (enemy.width / 2 + bullet.size)) {
              // Destroy bullet
              bullets.current.splice(bIdx, 1);
              
              // Apply damage
              enemy.hp -= bullet.damage;
              
              // Spawn tiny impact sparks
              for (let i = 0; i < 4; i++) {
                particles.current.push({
                  x: bullet.x,
                  y: bullet.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4 - 1,
                  color: bullet.color,
                  size: Math.random() * 2 + 1,
                  life: 0,
                  maxLife: Math.random() * 12 + 8
                });
              }

              // Update Boss UI HP
              if (enemy.type === 'boss') {
                setBossHp(Math.max(0, enemy.hp));
              }

              // Check enemy death
              if (enemy.hp <= 0) {
                // Remove enemy
                enemies.current.splice(eIdx, 1);
                
                // Add Score
                scoreRef.current += enemy.scoreValue;
                setScore(scoreRef.current);

                // Add Floating Score Indicator
                floatingTexts.current.push({
                  x: enemy.x,
                  y: enemy.y,
                  text: `+${enemy.scoreValue}`,
                  timer: 35,
                  color: enemy.type === 'boss' ? '#fbbf24' : '#38bdf8'
                });

                // Spawn big explosion particle cluster
                playExplosionSound(enemy.type === 'boss');
                const particleCount = enemy.type === 'boss' ? 45 : (enemy.type === 'bomber' ? 22 : 12);
                
                for (let i = 0; i < particleCount; i++) {
                  const angle = Math.random() * Math.PI * 2;
                  const speed = Math.random() * (enemy.type === 'boss' ? 6 : 4.5) + 1;
                  particles.current.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: enemy.color,
                    size: Math.random() * (enemy.type === 'boss' ? 4 : 3) + 1,
                    life: 0,
                    maxLife: Math.random() * (enemy.type === 'boss' ? 45 : 30) + 15
                  });
                }

                // Random Power Up drop logic
                const dropRand = Math.random();
                if (enemy.type === 'boss') {
                  currentBossRef.current = null;
                  setBossActive(false);
                  screenShake.current = 15;

                  // Guaranteed drops for boss
                  powerUps.current.push({
                    x: enemy.x - 20,
                    y: enemy.y,
                    vy: 1.5,
                    type: 'weapon',
                    size: 14,
                    color: '#06b6d4'
                  });
                  powerUps.current.push({
                    x: enemy.x,
                    y: enemy.y,
                    vy: 1.5,
                    type: 'gold_star',
                    size: 14,
                    color: '#fbbf24'
                  });
                  powerUps.current.push({
                    x: enemy.x + 20,
                    y: enemy.y,
                    vy: 1.5,
                    type: 'shield',
                    size: 14,
                    color: '#0ea5e9'
                  });
                } else {
                  // Standard drops based on luck
                  const rateThreshold = enemy.type === 'bomber' ? 0.65 : 0.93; // 35% bomber drop, 7% scout/seeker
                  if (dropRand > rateThreshold) {
                    const itemTypeRnd = Math.random();
                    let type: 'shield' | 'weapon' | 'heal' | 'gold_star' = 'gold_star';
                    let col = '#fbbf24'; // Gold Star
                    
                    if (itemTypeRnd < 0.25) {
                      type = 'shield';
                      col = '#0ea5e9'; // Blue shield
                    } else if (itemTypeRnd < 0.50) {
                      type = 'weapon';
                      col = '#06b6d4'; // Cyan weapon upgrade
                    } else if (itemTypeRnd < 0.65) {
                      type = 'heal';
                      col = '#10b981'; // Green health nano
                    }

                    powerUps.current.push({
                      x: enemy.x,
                      y: enemy.y,
                      vy: 1.4,
                      type,
                      size: 11,
                      color: col
                    });
                  }
                }
              }
            }
          });
        } else {
          // Enemy lasers vs Player Ship
          const dist = Math.hypot(bullet.x - playerX.current, bullet.y - playerY.current);
          if (dist < (playerSize * 0.75 + bullet.size)) {
            // Bullet destroyed
            bullets.current.splice(bIdx, 1);
            
            // Damage check
            applyPlayerDamage(bullet.damage);
          }
        }
      });

      // 9. Enemy Ship crashing directly into Player ship
      enemies.current.forEach((enemy, index) => {
        const dist = Math.hypot(enemy.x - playerX.current, enemy.y - playerY.current);
        if (dist < (enemy.width * 0.45 + playerSize * 0.75)) {
          // Crash explosion
          playExplosionSound(false);
          enemies.current.splice(index, 1);
          
          if (enemy.type === 'boss') {
            currentBossRef.current = null;
            setBossActive(false);
          }

          // Major Damage to player
          applyPlayerDamage(enemy.type === 'boss' ? 50 : 35);
          
          // Explode particles
          for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.current.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * 4,
              vy: Math.sin(angle) * 4,
              color: enemy.color,
              size: Math.random() * 3 + 1,
              life: 0,
              maxLife: Math.random() * 20 + 10
            });
          }
        }
      });

      // 10. Player collecting Power-ups
      powerUps.current.forEach((item, index) => {
        const dist = Math.hypot(item.x - playerX.current, item.y - playerY.current);
        if (dist < (playerSize + item.size)) {
          powerUps.current.splice(index, 1);
          playCollectSound();

          if (item.type === 'shield') {
            shieldRef.current = 100;
            setShield(100);
            playShieldSound();
            floatingTexts.current.push({
              x: playerX.current,
              y: playerY.current - 20,
              text: 'SHIELD FULL!',
              timer: 45,
              color: '#0ea5e9'
            });
          } else if (item.type === 'weapon') {
            const nextLvl = Math.min(4, weaponLevelRef.current + 1);
            weaponLevelRef.current = nextLvl;
            setWeaponLevel(nextLvl);
            floatingTexts.current.push({
              x: playerX.current,
              y: playerY.current - 20,
              text: nextLvl === 4 ? 'MAX POWER PLASMA!' : 'WEAPON UPGRADED!',
              timer: 50,
              color: nextLvl === 4 ? '#eab308' : '#06b6d4'
            });
          } else if (item.type === 'heal') {
            const nextLvs = Math.min(5, livesRef.current + 1);
            livesRef.current = nextLvs;
            setLives(nextLvs);
            floatingTexts.current.push({
              x: playerX.current,
              y: playerY.current - 20,
              text: '+1 CORE LIFE!',
              timer: 45,
              color: '#10b981'
            });
          } else if (item.type === 'gold_star') {
            scoreRef.current += 150;
            setScore(scoreRef.current);
            floatingTexts.current.push({
              x: playerX.current,
              y: playerY.current - 20,
              text: '+150 GOLD STAR!',
              timer: 45,
              color: '#fbbf24'
            });
          }
        }
      });

      // 11. Update Explosive Particles physics
      particles.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life >= p.maxLife) {
          particles.current.splice(index, 1);
        }
      });

      // 12. Update Floating Text animations
      floatingTexts.current.forEach((t, index) => {
        t.y -= 0.6; // float up gently
        t.timer--;
        if (t.timer <= 0) {
          floatingTexts.current.splice(index, 1);
        }
      });


      // --- CANVAS DRAW ROUTINES ---
      ctx.clearRect(0, 0, canvasDim.width, canvasDim.height);

      // Handle Screen Shake transformations
      ctx.save();
      if (screenShake.current > 0) {
        const dxShake = (Math.random() - 0.5) * screenShake.current;
        const dyShake = (Math.random() - 0.5) * screenShake.current;
        ctx.translate(dxShake, dyShake);
      }

      // 1. Draw Starfield Parallax Backdrop
      stars.current.forEach(star => {
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Floating Power-ups
      powerUps.current.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        if (item.type === 'gold_star') {
          // Draw standard 5-point vector star
          const spikes = 5;
          const outerR = item.size;
          const innerR = item.size / 2.2;
          let rot = Math.PI / 2 * 3;
          let x = item.x;
          let y = item.y;
          const step = Math.PI / spikes;

          ctx.moveTo(item.x, item.y - outerR);
          for (let i = 0; i < spikes; i++) {
            x = item.x + Math.cos(rot) * outerR;
            y = item.y + Math.sin(rot) * outerR;
            ctx.lineTo(x, y);
            rot += step;

            x = item.x + Math.cos(rot) * innerR;
            y = item.y + Math.sin(rot) * innerR;
            ctx.lineTo(x, y);
            rot += step;
          }
        } else if (item.type === 'weapon') {
          // Draw high tech lightning bolt
          ctx.moveTo(item.x, item.y - item.size);
          ctx.lineTo(item.x + item.size * 0.6, item.y - item.size * 0.2);
          ctx.lineTo(item.x + item.size * 0.2, item.y);
          ctx.lineTo(item.x + item.size * 0.5, item.y + item.size);
          ctx.lineTo(item.x - item.size * 0.6, item.y + item.size * 0.2);
          ctx.lineTo(item.x - item.size * 0.1, item.y);
        } else if (item.type === 'shield') {
          // Draw cyber shield hexagon
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = item.x + Math.cos(angle) * item.size;
            const py = item.y + Math.sin(angle) * item.size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        } else {
          // Heal: cross
          ctx.rect(item.x - 3, item.y - item.size, 6, item.size * 2);
          ctx.rect(item.x - item.size, item.y - 3, item.size * 2, 6);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // 3. Draw Bullets
      bullets.current.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = b.isPlayer ? 8 : 4;
        
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Draw Enemies
      enemies.current.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = enemy.type === 'boss' ? 15 : 6;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        if (enemy.type === 'boss') {
          // Heavy Boss Space Cruiser: giant cyber golden plate wing
          ctx.beginPath();
          ctx.moveTo(-enemy.width / 2, -enemy.height / 3);
          ctx.lineTo(-enemy.width / 3, -enemy.height / 2);
          ctx.lineTo(enemy.width / 3, -enemy.height / 2);
          ctx.lineTo(enemy.width / 2, -enemy.height / 3);
          ctx.lineTo(enemy.width * 0.4, enemy.height * 0.3);
          ctx.lineTo(enemy.width * 0.15, enemy.height * 0.5);
          ctx.lineTo(0, enemy.height * 0.35); // laser chamber
          ctx.lineTo(-enemy.width * 0.15, enemy.height * 0.5);
          ctx.lineTo(-enemy.width * 0.4, enemy.height * 0.3);
          ctx.closePath();
          ctx.fill();

          // Internal engine shield lights
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(-22, -10, 5, 0, Math.PI * 2);
          ctx.arc(22, -10, 5, 0, Math.PI * 2);
          ctx.fill();

          // Golden energy bar plate on wings
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-enemy.width * 0.35, -5, 8, 16);
          ctx.fillRect(enemy.width * 0.3, -5, 8, 16);
        } else if (enemy.type === 'bomber') {
          // Slow armor cruiser (wedge shape + engine wings)
          ctx.beginPath();
          ctx.moveTo(-18, -12);
          ctx.lineTo(18, -12);
          ctx.lineTo(14, 4);
          ctx.lineTo(6, 12);
          ctx.lineTo(-6, 12);
          ctx.lineTo(-14, 4);
          ctx.closePath();
          ctx.fill();

          // Engine exhausts
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(-10, -16, 4, 4);
          ctx.fillRect(6, -16, 4, 4);
        } else if (enemy.type === 'seeker') {
          // Homing needle interceptor (yellow dart)
          ctx.beginPath();
          ctx.moveTo(0, 14);
          ctx.lineTo(-9, -10);
          ctx.lineTo(0, -5);
          ctx.lineTo(9, -10);
          ctx.closePath();
          ctx.fill();
        } else {
          // Scout drone: small red batwing
          ctx.beginPath();
          ctx.moveTo(0, 10);
          ctx.lineTo(-12, -8);
          ctx.lineTo(-4, -4);
          ctx.lineTo(4, -4);
          ctx.lineTo(12, -8);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
        ctx.shadowBlur = 0;
      });

      // 5. Draw Explosive Particles
      particles.current.forEach(p => {
        const opacity = 1 - (p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // restore
      });

      // 6. Draw Player Ship
      const isInvuln = invulnFrames.current > 0;
      // Flashes ship transparency if invulnerable
      if (!isInvuln || (Math.floor(invulnFrames.current / 4) % 2 === 0)) {
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = shieldRef.current > 0 ? 12 : 4;

        ctx.save();
        ctx.translate(playerX.current, playerY.current);

        // Main chassis (Sturdy metal-look futuristic ship with gold stripes)
        ctx.fillStyle = '#0f172a'; // dark metallic chassis base
        ctx.strokeStyle = '#38bdf8'; // neon light-blue borders
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(0, -playerSize); // Nose cone tip
        ctx.lineTo(-playerSize * 0.8, playerSize * 0.6); // Left wing
        ctx.lineTo(-playerSize * 0.35, playerSize * 0.3); // Inner body
        ctx.lineTo(0, playerSize * 0.5); // Center exhaust slot
        ctx.lineTo(playerSize * 0.35, playerSize * 0.3);
        ctx.lineTo(playerSize * 0.8, playerSize * 0.6); // Right wing
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Elegant Gold Winglet stripes to reflect logo theme
        ctx.fillStyle = '#fbbf24'; // Gold
        ctx.beginPath();
        ctx.moveTo(-playerSize * 0.6, playerSize * 0.3);
        ctx.lineTo(-playerSize * 0.75, playerSize * 0.55);
        ctx.lineTo(-playerSize * 0.55, playerSize * 0.45);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(playerSize * 0.6, playerSize * 0.3);
        ctx.lineTo(playerSize * 0.75, playerSize * 0.55);
        ctx.lineTo(playerSize * 0.55, playerSize * 0.45);
        ctx.closePath();
        ctx.fill();

        // Neon Blue Jet Thruster flame
        const flicker = Math.random() * 8 + 6;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-6, playerSize * 0.4);
        ctx.lineTo(0, playerSize * 0.4 + flicker);
        ctx.lineTo(6, playerSize * 0.4);
        ctx.closePath();
        ctx.fill();

        // Active Energy Shield Bubble (Cyan Sphere) if shield is healthy
        if (shieldRef.current > 0) {
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.12 + (shieldRef.current / 220)})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, -3, playerSize * 1.35, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
        ctx.shadowBlur = 0;
      }

      // 7. Draw Floating Texts (Scores, item gains)
      floatingTexts.current.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
      });

      ctx.restore(); // restore screen shake trans

      // Trigger next animation iteration
      animationFrameId = requestAnimationFrame(gameUpdate);
    };

    animationFrameId = requestAnimationFrame(gameUpdate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [canvasDim, isPaused, isGameOver, settings]);

  // Handle Player receiving damage
  const applyPlayerDamage = (dmgAmount: number) => {
    if (invulnFrames.current > 0 || isGameOver) return;

    // Apply first to shield
    if (shieldRef.current > 0) {
      shieldRef.current = Math.max(0, shieldRef.current - dmgAmount);
      setShield(shieldRef.current);
      playHurtSound();
      
      // Flash screen shake
      screenShake.current = 6;

      if (shieldRef.current === 0) {
        floatingTexts.current.push({
          x: playerX.current,
          y: playerY.current - 25,
          text: 'SHIELDS DOWN! HULL CRITICAL!',
          timer: 50,
          color: '#ef4444'
        });
      }
    } else {
      // Shield is empty, damages core lives
      const nextLives = Math.max(0, livesRef.current - 1);
      livesRef.current = nextLives;
      setLives(nextLives);
      playExplosionSound(true);

      // Major camera shake
      screenShake.current = 14;

      // Drop weapon level back as penalty
      const penalisedWeapon = Math.max(1, weaponLevelRef.current - 1);
      weaponLevelRef.current = penalisedWeapon;
      setWeaponLevel(penalisedWeapon);

      if (nextLives === 0) {
        // Trigger Game Over
        setIsGameOver(true);
        checkIsNewHighScore(scoreRef.current);
      } else {
        // Set temporary invulnerability frame
        invulnFrames.current = 100; // ~1.6 seconds of blink
        
        // Auto charge shield back to 35% as safeguard
        shieldRef.current = 40;
        setShield(40);

        floatingTexts.current.push({
          x: playerX.current,
          y: playerY.current - 25,
          text: 'VESSEL CRASHED! LIFE DEPLETED!',
          timer: 55,
          color: '#f43f5e'
        });
      }
    }
  };

  // Check if score counts as high score
  const checkIsNewHighScore = (finalScore: number) => {
    const raw = localStorage.getItem('cosmic_highscores');
    if (raw) {
      try {
        const scores: HighScore[] = JSON.parse(raw);
        // Is it higher than the minimum high score? Or list has less than 5 entries
        const sorted = scores.sort((a, b) => b.score - a.score);
        if (sorted.length < 5 || finalScore > sorted[sorted.length - 1].score) {
          setIsNewHighScore(true);
        }
      } catch (e) {
        setIsNewHighScore(true);
      }
    } else {
      setIsNewHighScore(true);
    }
  };

  // Submit highscore
  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    const nameStr = playerName.trim() ? playerName.trim().toUpperCase().substring(0, 12) : 'CADET_PILOT';
    
    const newEntry: HighScore = {
      name: nameStr,
      score: score,
      difficulty: settings.difficulty,
      date: new Date().toISOString().split('T')[0]
    };

    let scores: HighScore[] = [];
    const raw = localStorage.getItem('cosmic_highscores');
    if (raw) {
      try {
        scores = JSON.parse(raw);
      } catch (e) {
        scores = [];
      }
    }

    scores.push(newEntry);
    // Sort and slice top 8
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 8);

    localStorage.setItem('cosmic_highscores', JSON.stringify(scores));
    playCollectSound();
    onQuit();
  };

  const handleRestart = () => {
    // Reset state values
    setScore(0);
    setLives(3);
    setShield(100);
    setWeaponLevel(1);
    setIsGameOver(false);
    setIsNewHighScore(false);
    setPlayerName('');
    setBossActive(false);

    scoreRef.current = 0;
    livesRef.current = 3;
    shieldRef.current = 100;
    weaponLevelRef.current = 1;
    bullets.current = [];
    enemies.current = [];
    particles.current = [];
    powerUps.current = [];
    floatingTexts.current = [];
    currentBossRef.current = null;
    nextBossScore.current = 1000;
    spawnTimer.current = 0;
    invulnFrames.current = 0;

    playerX.current = canvasDim.width / 2;
    playerY.current = canvasDim.height - 120;
    
    setIsPaused(false);
    playCollectSound();
  };

  // On-screen Virtual D-Pad Key registration helpers for Touch & Click devices
  const handleVirtualPress = (action: string) => {
    activeKeys.current.add(action);
  };

  const handleVirtualRelease = (action: string) => {
    activeKeys.current.delete(action);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 font-sans">
      
      {/* 1. HUD / TOP ACTION BAR */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-3 bg-gradient-to-b from-[#020617] via-[#020617]/85 to-transparent flex flex-col gap-2">
        <div className="flex items-center justify-between">
          
          {/* Left HUD: Score & Weapon */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-none">Score // แต้ม</span>
            <span className="text-xl font-mono font-black text-[#fbbf24] tracking-wider drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]">
              {String(score).padStart(6, '0')}
            </span>
          </div>

          {/* Weapon state pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-black/40 border border-[#38bdf8]/20 rounded-full text-xxs font-mono text-[#38bdf8]">
            <Zap className="w-3 h-3 text-[#fbbf24] fill-[#fbbf24]" />
            <span>WEAPON:</span>
            <span className="font-black text-slate-200">
              {weaponLevel === 1 && 'LASER SINGLE'}
              {weaponLevel === 2 && 'CYAN DUAL-GUN'}
              {weaponLevel === 3 && 'TRI-SPREAD PULSE'}
              {weaponLevel >= 4 && 'PLASMA GOLD BEAM'}
            </span>
          </div>

          {/* Right HUD: Lives & Pauses */}
          <div className="flex items-center gap-4">
            
            {/* Lives Indicators */}
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 border border-[#38bdf8]/20 rounded-xl">
              <span className="text-xxs text-slate-500 font-mono font-bold leading-none uppercase">Life:</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Heart 
                    key={idx}
                    className={`w-3.5 h-3.5 transition-all ${
                      idx < lives 
                        ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_4px_rgba(244,63,94,0.6)] scale-100' 
                        : 'text-slate-800 scale-90'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Pause trigger */}
            <button
              id="btn-hud-pause"
              onClick={() => { playCollectSound(); setIsPaused(true); }}
              className="p-2 border border-[#38bdf8]/30 hover:border-[#38bdf8] bg-black/40 text-[#38bdf8] rounded-xl transition cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. SHIELD PROGRESS GRID */}
        <div className="flex items-center gap-2 px-1">
          <Shield className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
          <div className="relative w-full h-2 bg-[#020617] rounded-full border border-[#38bdf8]/10 overflow-hidden">
            <div 
              className={`h-full transition-all duration-150 ease-out rounded-full bg-gradient-to-r ${
                shield > 35 
                  ? 'from-[#38bdf8] via-[#0ea5e9] to-cyan-400' 
                  : 'from-rose-500 via-red-500 to-amber-500'
              }`}
              style={{ width: `${shield}%` }}
            />
          </div>
          <span className="text-xxs font-mono font-bold text-[#38bdf8] min-w-8 text-right">{shield}%</span>
        </div>

        {/* 3. BOSS WARNING HORN AND HEALTH BAR */}
        <AnimatePresence>
          {bossActive && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-1 flex flex-col gap-1 text-center bg-red-950/25 border border-red-500/25 p-2 rounded-xl"
            >
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-red-400 font-mono font-bold tracking-widest animate-pulse uppercase flex items-center gap-1">
                  &times; WARNING: GIGANTIC ENEMY INTERCEPTOR APPROACHING &times;
                </span>
                <span className="text-xxs font-mono text-red-500 font-black">{bossHp} / {bossMaxHp} HP</span>
              </div>
              <div className="relative w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-red-900/30">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-400 transition-all duration-75"
                  style={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* --- CORE GRAPHICS VIEWPORT CANVAS CONTAINER --- */}
      <div 
        ref={containerRef}
        className="w-full h-full relative flex items-center justify-center bg-slate-950 overflow-hidden"
      >
        <canvas 
          ref={canvasRef}
          width={canvasDim.width}
          height={canvasDim.height}
          className="bg-slate-950 block max-h-full border-x border-sky-950/20"
        />

        {/* Retro scanlines overlay style to match nostalgic gaming vibe */}
        <div className="absolute inset-0 scanlines pointer-events-none opacity-45" />
      </div>


      {/* 4. ON-SCREEN MOBILE / TOUCH CONTROLS PANEL */}
      {settings.showOnScreenButtons && (
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-between items-end px-6 pointer-events-none select-none">
          
          {/* Bottom Left: Virtual Navigation Joystick */}
          <div className="flex flex-col items-center gap-1.5 bg-black/45 p-3 rounded-xl border border-[#38bdf8]/20 backdrop-blur-sm pointer-events-auto select-none">
            
            {/* Top row */}
            <button
              id="vpad-up"
              onTouchStart={() => handleVirtualPress('ArrowUp')}
              onTouchEnd={() => handleVirtualRelease('ArrowUp')}
              onMouseDown={() => handleVirtualPress('ArrowUp')}
              onMouseUp={() => handleVirtualRelease('ArrowUp')}
              className="w-11 h-11 rounded-lg bg-black/40 hover:bg-[#38bdf8]/10 active:bg-[#38bdf8] border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] select-none active:scale-95 transition-all"
            >
              <ChevronUp className="w-6 h-6" />
            </button>

            {/* Left and Right row */}
            <div className="flex gap-4">
              <button
                id="vpad-left"
                onTouchStart={() => handleVirtualPress('ArrowLeft')}
                onTouchEnd={() => handleVirtualRelease('ArrowLeft')}
                onMouseDown={() => handleVirtualPress('ArrowLeft')}
                onMouseUp={() => handleVirtualRelease('ArrowLeft')}
                className="w-11 h-11 rounded-lg bg-black/40 hover:bg-[#38bdf8]/10 active:bg-[#38bdf8] border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] select-none active:scale-95 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              {/* Dummy central gap marker */}
              <div className="w-11 h-11 rounded-lg border border-[#38bdf8]/10 bg-black/20 flex items-center justify-center text-xxs font-mono text-slate-500 font-bold">
                PAD
              </div>

              <button
                id="vpad-right"
                onTouchStart={() => handleVirtualPress('ArrowRight')}
                onTouchEnd={() => handleVirtualRelease('ArrowRight')}
                onMouseDown={() => handleVirtualPress('ArrowRight')}
                onMouseUp={() => handleVirtualRelease('ArrowRight')}
                className="w-11 h-11 rounded-lg bg-black/40 hover:bg-[#38bdf8]/10 active:bg-[#38bdf8] border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] select-none active:scale-95 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom row */}
            <button
              id="vpad-down"
              onTouchStart={() => handleVirtualPress('ArrowDown')}
              onTouchEnd={() => handleVirtualRelease('ArrowDown')}
              onMouseDown={() => handleVirtualPress('ArrowDown')}
              onMouseUp={() => handleVirtualRelease('ArrowDown')}
              className="w-11 h-11 rounded-lg bg-black/40 hover:bg-[#38bdf8]/10 active:bg-[#38bdf8] border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] select-none active:scale-95 transition-all"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Right: Gigantic Fire/Shoot Button */}
          <div className="pointer-events-auto select-none">
            <button
              id="vpad-fire"
              onTouchStart={() => handleVirtualPress(settings.controls.shoot)}
              onTouchEnd={() => handleVirtualRelease(settings.controls.shoot)}
              onMouseDown={() => handleVirtualPress(settings.controls.shoot)}
              onMouseUp={() => handleVirtualRelease(settings.controls.shoot)}
              className="w-22 h-22 rounded-full bg-gradient-to-r from-[#fbbf24] via-[#facc15] to-[#d97706] text-black border-4 border-black font-display font-black tracking-widest uppercase flex flex-col items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.45)] hover:scale-105 active:scale-90 transition-all select-none cursor-pointer"
            >
              <span className="text-xs leading-none">FIRE</span>
              <span className="text-[8px] leading-none text-black/80">ยิงศัตรู</span>
            </button>
          </div>

        </div>
      )}


      {/* 5. INTERACTIVE PAUSE OVERLAY */}
      <AnimatePresence>
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="relative bg-black/40 border border-[#38bdf8]/20 max-w-sm w-full rounded-xl p-6 md:p-8 space-y-6 backdrop-blur-md"
            >
              {/* Decorative brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#fbbf24] rounded-tl-md" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#38bdf8] rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#38bdf8] rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#fbbf24] rounded-br-md" />

              <div className="space-y-1">
                <h3 className="font-display font-black text-2xl uppercase tracking-widest text-[#38bdf8] italic">
                  SYSTEM PAUSED
                </h3>
                <p className="text-xxs text-slate-500 font-mono tracking-widest uppercase">
                  BATTLE STAGE TEMPORARILY SUSPENDED
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  id="btn-pause-resume"
                  onClick={() => { playCollectSound(); setIsPaused(false); }}
                  className="w-full py-3 bg-gradient-to-r from-[#fbbf24] to-[#d97706] hover:scale-102 text-black font-display font-black text-xs uppercase tracking-widest skew-x-[-12deg] transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(251,191,36,0.25)]"
                >
                  <span className="inline-block skew-x-[12deg] flex items-center gap-2">
                    <Play className="w-4 h-4 fill-black stroke-black" />
                    <span>Resume Mission / เล่นต่อ</span>
                  </span>
                </button>

                <button
                  id="btn-pause-restart"
                  onClick={handleRestart}
                  className="w-full py-3 bg-black/40 hover:bg-[#38bdf8]/10 border border-[#38bdf8]/30 hover:border-[#38bdf8] text-slate-300 font-display font-black text-xs uppercase tracking-widest skew-x-[-12deg] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="inline-block skew-x-[12deg] flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-[#38bdf8]" />
                    <span>Restart Area / เริ่มต้นใหม่</span>
                  </span>
                </button>

                <button
                  id="btn-pause-quit"
                  onClick={() => { playCollectSound(); onQuit(); }}
                  className="w-full py-3 bg-black/40 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500 text-slate-300 font-display font-black text-xs uppercase tracking-widest skew-x-[-12deg] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="inline-block skew-x-[12deg] flex items-center gap-2">
                    <Home className="w-4 h-4 text-red-400" />
                    <span>Retreat to Menu / กลับหน้าเมนู</span>
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* 6. GAME OVER OVERLAY & HIGHSCORE REGISTRATION */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative bg-black/40 border border-red-500/30 max-w-md w-full rounded-xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] backdrop-blur-md"
            >
              {/* Decorative brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#fbbf24] rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#38bdf8] rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500 rounded-br-lg" />

              <div className="space-y-1">
                <span className="text-[10px] text-red-500 font-mono font-black tracking-widest uppercase">
                  HULL DESTROYED // ระบบยานเสียหายวิกฤต
                </span>
                <h3 className="font-display font-black text-3.5xl text-red-500 tracking-wider uppercase italic">
                  GAME OVER
                </h3>
              </div>

              {/* Score summary panel */}
              <div className="bg-black/40 border border-[#38bdf8]/15 rounded-xl p-4 space-y-2">
                <p className="text-xxs text-slate-500 font-mono uppercase tracking-widest">
                  Commander Terminal Log
                </p>
                <div className="flex justify-between items-center border-t border-[#38bdf8]/10 pt-2 font-mono">
                  <span className="text-xs text-slate-400">FINAL SCORE:</span>
                  <span className="text-2xl font-black text-[#fbbf24] tracking-widest">
                    {score}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xxs font-mono">
                  <span className="text-slate-500">DIFFICULTY LEVEL:</span>
                  <span className="text-[#38bdf8] font-black uppercase">{settings.difficulty}</span>
                </div>
              </div>

              {/* Submit High Score Form */}
              {isNewHighScore ? (
                <form onSubmit={handleSaveScore} className="space-y-3.5 bg-[#fbbf24]/5 border border-[#fbbf24]/20 p-4 rounded-xl text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-5 h-5 text-[#fbbf24] animate-bounce" />
                    <span className="font-display text-xs font-black text-[#fbbf24] uppercase tracking-widest">
                      New Leaderboard Record! / บันทึกคะแนนใหม่
                    </span>
                  </div>
                  
                  <p className="text-slate-400 text-xxs font-mono leading-relaxed mb-2">
                    คะแนนของท่านติดอันดับสูงสุดในระบบ กรุณากรอกรหัส Commander (สูงสุด 12 ตัวอักษร) เพื่อบันทึก:
                  </p>

                  <div className="flex gap-2">
                    <input
                      id="input-player-name"
                      type="text"
                      maxLength={12}
                      placeholder="ENTER CALLSIGN"
                      required
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                      className="w-full bg-black/60 border border-[#fbbf24]/30 rounded-lg px-3 py-2 text-sm text-[#fbbf24] focus:outline-none focus:border-[#fbbf24] font-mono tracking-widest uppercase"
                    />
                    <button
                      id="btn-submit-highscore"
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-black font-display font-black text-xs uppercase tracking-widest rounded-lg transition shrink-0 cursor-pointer shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                    >
                      Save Score
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-slate-500 text-xxs font-mono leading-relaxed bg-black/40 p-3 rounded-xl border border-[#38bdf8]/10">
                  Cadet, your combat score was recorded. Keep training to infiltrate the top 5 elite leaderboards next time!
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  id="btn-gameover-quit"
                  onClick={() => { playCollectSound(); onQuit(); }}
                  className="w-full py-3 bg-black/40 hover:bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-slate-400 hover:text-slate-200 font-display font-black text-xs uppercase tracking-widest skew-x-[-12deg] transition cursor-pointer"
                >
                  <span className="inline-block skew-x-[12deg]">
                    Main Menu / หน้าหลัก
                  </span>
                </button>
                <button
                  id="btn-gameover-restart"
                  onClick={handleRestart}
                  className="w-full py-3 bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-black font-display font-black text-xs uppercase tracking-widest skew-x-[-12deg] hover:scale-102 transition cursor-pointer shadow-[0_0_15px_rgba(251,191,36,0.25)]"
                >
                  <span className="inline-block skew-x-[12deg]">
                    Try Again / เล่นอีกครั้ง
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
