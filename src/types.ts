export interface ControlsConfig {
  up: string;
  down: string;
  left: string;
  right: string;
  shoot: string;
}

export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export interface GameSettings {
  difficulty: DifficultyLevel;
  sfxVolume: number;
  showOnScreenButtons: boolean; // Auto-detected or forced
  controls: ControlsConfig;
}

export interface HighScore {
  name: string;
  score: number;
  difficulty: DifficultyLevel;
  date: string;
}

export type ViewState = 'menu' | 'playing' | 'options' | 'instructions' | 'highscores';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isPlayer: boolean;
  color: string;
  size: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  type: 'scout' | 'bomber' | 'seeker' | 'boss';
  shootCooldown: number;
  color: string;
  lastShotTime: number;
}

export interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: 'shield' | 'weapon' | 'heal' | 'gold_star';
  size: number;
  color: string;
}
