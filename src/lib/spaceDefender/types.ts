import type { ParticleSystem } from './particles'

export type IntroPhase =
  | 'idle'
  | 'flip'
  | 'planetReveal'
  | 'shipFlyIn'
  | 'playing'
  | 'gameOver'
  | 'exiting'

export interface Vec2 {
  x: number
  y: number
}

export interface PortraitRect {
  top: number
  left: number
  width: number
  height: number
}

export interface Bullet {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

export type EnemyKind = 'rejectionEmail' | 'ghost'

/** Card width = radius * WIDTH_MULT; height = radius * HEIGHT_MULT */
export const REJECTION_EMAIL_WIDTH_MULT = 3.0
export const REJECTION_EMAIL_HEIGHT_MULT = 2.2

/** Ghost body half-extents relative to enemy.radius */
export const GHOST_HALF_WIDTH_MULT = 0.9
export const GHOST_HALF_HEIGHT_MULT = 0.725

export function enemyHitRadius(enemy: Pick<Enemy, 'kind' | 'radius'>): number {
  if (enemy.kind === 'rejectionEmail') {
    const w = enemy.radius * REJECTION_EMAIL_WIDTH_MULT
    const h = enemy.radius * REJECTION_EMAIL_HEIGHT_MULT
    return Math.hypot(w / 2, h / 2)
  }
  const halfW = enemy.radius * GHOST_HALF_WIDTH_MULT
  const halfH = enemy.radius * GHOST_HALF_HEIGHT_MULT
  return Math.hypot(halfW, halfH)
}

export interface Enemy {
  id: number
  kind: EnemyKind
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  hp: number
  wobblePhase: number
}

export interface GameConfig {
  width: number
  height: number
  planetRadius: number
  planetX: number
  planetY: number
  shipOrbitRadius: number
  maxPlanetHp: number
  photoUrl: string
}

export interface GameSnapshot {
  score: number
  wave: number
  planetHp: number
  maxPlanetHp: number
  shipAngle: number
  enemiesRemaining: number
  isGameOver: boolean
}

export interface LeaderboardEntry {
  id: string
  player_name: string
  score: number
  wave: number
  created_at: string
}

export interface SubmitScoreInput {
  name: string
  score: number
  wave: number
}

export type GamePhase = 'intro' | 'playing' | 'game-over'

export interface GameState {
  width: number
  height: number
  planetX: number
  planetY: number
  planetRadius: number
  shipOrbitRadius: number
  maxPlanetHp: number
  score: number
  wave: number
  planetHp: number
  phase: GamePhase
  cursor: Vec2
  shipAngle: number
  bullets: Bullet[]
  enemies: Enemy[]
  enemiesToSpawn: number
  spawnTimer: number
  waveClearTimer: number
  shieldPulse: number
  hitFlash: number
  screenShake: number
  isGameOver: boolean
  lastShot: number
  particles: ParticleSystem
}

export function getPlanetDiameter(viewportWidth: number): number {
  if (viewportWidth < 640) return 110
  if (viewportWidth < 1024) return 160
  return 210
}
