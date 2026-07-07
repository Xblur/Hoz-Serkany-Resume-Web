import type { Bullet, Enemy, EnemyKind, GameConfig, GameSnapshot, GameState, Vec2 } from './types'
import { enemyHitRadius } from './types'
import { ParticleSystem } from './particles'
import { getPlanetDiameter } from './types'

export interface GameEngineCallbacks {
  onScoreChange?: (score: number) => void
  onWaveChange?: (wave: number) => void
  onPlanetHit?: () => void
  onEnemyDestroyed?: () => void
  onGameOver?: () => void
}

let nextId = 1

function pickEnemyKind(): EnemyKind {
  return Math.random() < 0.5 ? 'rejectionEmail' : 'ghost'
}

function enemyStats(kind: EnemyKind, baseSpeed: number): { radius: number; speed: number } {
  if (kind === 'rejectionEmail') {
    return { radius: 16 + Math.random() * 4, speed: baseSpeed * 1.1 }
  }
  return { radius: 14 + Math.random() * 4, speed: baseSpeed * 0.9 }
}

export class SpaceDefenderEngine {
  config: GameConfig
  bullets: Bullet[] = []
  enemies: Enemy[] = []
  particles = new ParticleSystem()

  score = 0
  wave = 1
  planetHp = 4
  shipAngle = -Math.PI / 2
  pointer: Vec2 = { x: 0, y: 0 }

  planetRotation = 0
  shieldPulse = 0
  hitFlash = 0
  screenShake = 0

  enemiesToSpawn = 0
  spawnTimer = 0
  waveClearTimer = 0
  isGameOver = false
  isPaused = false

  private callbacks: GameEngineCallbacks
  private lastShot = 0
  private gameTime = 0
  private readonly shotCooldown = 0.18

  constructor(config: GameConfig, callbacks: GameEngineCallbacks = {}) {
    this.config = config
    this.callbacks = callbacks
    this.pointer = { x: config.planetX, y: config.planetY - config.shipOrbitRadius }
    this.enemiesToSpawn = this.waveEnemyCount()
  }

  private waveEnemyCount(): number {
    return 4 + this.wave * 2
  }

  private enemySpeed(): number {
    return 55 + this.wave * 8
  }

  resize(config: Partial<GameConfig>) {
    Object.assign(this.config, config)
  }

  setPointer(x: number, y: number) {
    this.pointer = { x, y }
    const dx = x - this.config.planetX
    const dy = y - this.config.planetY
    this.shipAngle = Math.atan2(dy, dx)
  }

  getShipPosition(): Vec2 {
    const { planetX, planetY, shipOrbitRadius } = this.config
    return {
      x: planetX + Math.cos(this.shipAngle) * shipOrbitRadius,
      y: planetY + Math.sin(this.shipAngle) * shipOrbitRadius,
    }
  }

  shoot(now: number): boolean {
    if (this.isGameOver || this.isPaused) return false
    if (now - this.lastShot < this.shotCooldown) return false

    const ship = this.getShipPosition()
    const speed = 420
    const dir = { x: Math.cos(this.shipAngle), y: Math.sin(this.shipAngle) }

    this.bullets.push({
      id: nextId++,
      x: ship.x + dir.x * 16,
      y: ship.y + dir.y * 16,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: 1.2,
    })

    this.particles.spawnTrail(ship.x, ship.y, dir)
    this.lastShot = now
    return true
  }

  private spawnEnemy() {
    const { width, height, planetX, planetY } = this.config
    const edge = Math.floor(Math.random() * 4)
    let x = 0
    let y = 0

    switch (edge) {
      case 0:
        x = Math.random() * width
        y = -20
        break
      case 1:
        x = width + 20
        y = Math.random() * height
        break
      case 2:
        x = Math.random() * width
        y = height + 20
        break
      default:
        x = -20
        y = Math.random() * height
    }

    const dx = planetX - x
    const dy = planetY - y
    const dist = Math.hypot(dx, dy) || 1
    const kind = pickEnemyKind()
    const { radius, speed } = enemyStats(kind, this.enemySpeed())

    this.enemies.push({
      id: nextId++,
      kind,
      x,
      y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      radius,
      hp: 1,
      wobblePhase: Math.random() * Math.PI * 2,
    })
  }

  private damagePlanet() {
    this.planetHp -= 1
    this.hitFlash = 1
    this.shieldPulse = 1
    this.screenShake = 8
    this.particles.spawnShieldRipple(
      this.config.planetX,
      this.config.planetY,
      this.config.planetRadius,
    )
    this.callbacks.onPlanetHit?.()

    if (this.planetHp <= 0) {
      this.isGameOver = true
      this.callbacks.onGameOver?.()
    }
  }

  update(dt: number, _now: number) {
    if (this.isGameOver || this.isPaused) return

    this.gameTime += dt
    this.planetRotation += dt * 0.15
    this.shieldPulse = Math.max(0, this.shieldPulse - dt * 1.5)
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.5)
    this.screenShake = Math.max(0, this.screenShake - dt * 24)

    if (this.enemiesToSpawn > 0) {
      this.spawnTimer -= dt
      if (this.spawnTimer <= 0) {
        this.spawnEnemy()
        this.enemiesToSpawn -= 1
        this.spawnTimer = 0.35 + Math.random() * 0.25
      }
    } else if (this.enemies.length === 0 && this.waveClearTimer <= 0) {
      this.waveClearTimer = 1.5
    }

    if (this.waveClearTimer > 0) {
      this.waveClearTimer -= dt
      if (this.waveClearTimer <= 0) {
        this.wave += 1
        this.enemiesToSpawn = this.waveEnemyCount()
        this.callbacks.onWaveChange?.(this.wave)
      }
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]!
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.life -= dt
      if (
        b.life <= 0 ||
        b.x < -40 ||
        b.y < -40 ||
        b.x > this.config.width + 40 ||
        b.y > this.config.height + 40
      ) {
        this.bullets.splice(i, 1)
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]!
      enemy.x += enemy.vx * dt
      enemy.y += enemy.vy * dt

      if (enemy.kind === 'ghost') {
        enemy.y += Math.sin(this.gameTime * 4 + enemy.wobblePhase) * 18 * dt
      }

      const dx = enemy.x - this.config.planetX
      const dy = enemy.y - this.config.planetY
      const dist = Math.hypot(dx, dy)

      const hitR = enemyHitRadius(enemy)
      if (dist < this.config.planetRadius + hitR) {
        this.enemies.splice(i, 1)
        this.damagePlanet()
        continue
      }

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j]!
        const bdx = bullet.x - enemy.x
        const bdy = bullet.y - enemy.y
        if (Math.hypot(bdx, bdy) < hitR + 4) {
          this.bullets.splice(j, 1)
          this.enemies.splice(i, 1)
          this.score += 10 * this.wave
          this.particles.spawnTypedExplosion(enemy.x, enemy.y, enemy.kind)
          this.callbacks.onEnemyDestroyed?.()
          this.callbacks.onScoreChange?.(this.score)
          break
        }
      }
    }

    const ship = this.getShipPosition()
    const shipDir = { x: Math.cos(this.shipAngle), y: Math.sin(this.shipAngle) }
    if (Math.random() < 0.6) {
      this.particles.spawnTrail(ship.x, ship.y, shipDir, '#3b82f6')
    }

    this.particles.update(dt)
  }

  getSnapshot(): GameSnapshot {
    return {
      score: this.score,
      wave: this.wave,
      planetHp: this.planetHp,
      maxPlanetHp: this.config.maxPlanetHp,
      shipAngle: this.shipAngle,
      enemiesRemaining: this.enemies.length + this.enemiesToSpawn,
      isGameOver: this.isGameOver,
    }
  }

  reset() {
    this.bullets = []
    this.enemies = []
    this.particles.clear()
    this.score = 0
    this.wave = 1
    this.planetHp = this.config.maxPlanetHp
    this.isGameOver = false
    this.enemiesToSpawn = this.waveEnemyCount()
    this.spawnTimer = 0
    this.waveClearTimer = 0
    this.shieldPulse = 1
    this.hitFlash = 0
    this.screenShake = 0
    this.gameTime = 0
  }
}

export function maxPlausibleScore(wave: number): number {
  const enemiesPerWave = (w: number) => 4 + w * 2
  let total = 0
  for (let w = 1; w <= wave; w++) {
    total += enemiesPerWave(w) * (10 * w)
  }
  return total + 5000
}

export interface GameCallbacks {
  onEnemyDestroyed?: () => void
  onPlanetHit?: () => void
  onGameOver?: () => void
  onWaveComplete?: () => void
}

let entityId = 1

function waveEnemyCount(wave: number): number {
  return 4 + wave * 2
}

function enemySpeed(wave: number): number {
  return 55 + wave * 8
}

export function createGameState(width: number, height: number): GameState {
  const planetRadius = getPlanetDiameter(width) / 2
  return {
    width,
    height,
    planetX: width / 2,
    planetY: height / 2,
    planetRadius,
    shipOrbitRadius: planetRadius + 72,
    maxPlanetHp: 4,
    score: 0,
    wave: 1,
    planetHp: 4,
    phase: 'intro',
    cursor: { x: width / 2, y: height / 2 - 100 },
    shipAngle: -Math.PI / 2,
    bullets: [],
    enemies: [],
    enemiesToSpawn: 0,
    spawnTimer: 0,
    waveClearTimer: 0,
    shieldPulse: 0,
    hitFlash: 0,
    screenShake: 0,
    isGameOver: false,
    lastShot: 0,
    particles: new ParticleSystem(),
  }
}

export function resizeGameState(state: GameState, width: number, height: number) {
  const planetRadius = getPlanetDiameter(width) / 2
  state.width = width
  state.height = height
  state.planetX = width / 2
  state.planetY = height / 2
  state.planetRadius = planetRadius
  state.shipOrbitRadius = planetRadius + 72
}

export function startWave(state: GameState) {
  state.enemiesToSpawn = waveEnemyCount(state.wave)
  state.spawnTimer = 0
  state.waveClearTimer = 0
}

function getShipPosition(state: GameState): Vec2 {
  return {
    x: state.planetX + Math.cos(state.shipAngle) * state.shipOrbitRadius,
    y: state.planetY + Math.sin(state.shipAngle) * state.shipOrbitRadius,
  }
}

function spawnEnemy(state: GameState) {
  const { width, height, planetX, planetY, wave } = state
  const edge = Math.floor(Math.random() * 4)
  let x = 0
  let y = 0

  switch (edge) {
    case 0:
      x = Math.random() * width
      y = -20
      break
    case 1:
      x = width + 20
      y = Math.random() * height
      break
    case 2:
      x = Math.random() * width
      y = height + 20
      break
    default:
      x = -20
      y = Math.random() * height
  }

  const dx = planetX - x
  const dy = planetY - y
  const dist = Math.hypot(dx, dy) || 1
  const kind = pickEnemyKind()
  const { radius, speed } = enemyStats(kind, enemySpeed(wave))

  state.enemies.push({
    id: entityId++,
    kind,
    x,
    y,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    radius,
    hp: 1,
    wobblePhase: Math.random() * Math.PI * 2,
  })
}

function damagePlanet(state: GameState, callbacks: GameCallbacks) {
  state.planetHp -= 1
  state.hitFlash = 1
  state.shieldPulse = 1
  state.screenShake = 8
  state.particles.spawnShieldRipple(state.planetX, state.planetY, state.planetRadius)
  callbacks.onPlanetHit?.()

  if (state.planetHp <= 0) {
    state.isGameOver = true
    state.phase = 'game-over'
    callbacks.onGameOver?.()
  }
}

let functionalGameTime = 0

export function updateGame(
  state: GameState,
  dt: number,
  input: { cursor: Vec2; shoot: boolean; width: number; height: number },
  callbacks: GameCallbacks = {},
) {
  if (state.isGameOver || state.phase !== 'playing') return

  functionalGameTime += dt
  state.cursor = input.cursor
  const dx = input.cursor.x - state.planetX
  const dy = input.cursor.y - state.planetY
  state.shipAngle = Math.atan2(dy, dx)

  state.shieldPulse = Math.max(0, state.shieldPulse - dt * 1.5)
  state.hitFlash = Math.max(0, state.hitFlash - dt * 2.5)
  state.screenShake = Math.max(0, state.screenShake - dt * 24)

  const now = performance.now()
  if (input.shoot && now - state.lastShot >= 180) {
    const ship = getShipPosition(state)
    const dir = { x: Math.cos(state.shipAngle), y: Math.sin(state.shipAngle) }
    state.bullets.push({
      id: entityId++,
      x: ship.x + dir.x * 16,
      y: ship.y + dir.y * 16,
      vx: dir.x * 420,
      vy: dir.y * 420,
      life: 1.2,
    })
    state.particles.spawnTrail(ship.x, ship.y, dir)
    state.lastShot = now
  }

  if (state.enemiesToSpawn > 0) {
    state.spawnTimer -= dt
    if (state.spawnTimer <= 0) {
      spawnEnemy(state)
      state.enemiesToSpawn -= 1
      state.spawnTimer = 0.35 + Math.random() * 0.25
    }
  } else if (state.enemies.length === 0 && state.waveClearTimer <= 0) {
    state.waveClearTimer = 1.5
  }

  if (state.waveClearTimer > 0) {
    state.waveClearTimer -= dt
    if (state.waveClearTimer <= 0) {
      state.wave += 1
      state.enemiesToSpawn = waveEnemyCount(state.wave)
      callbacks.onWaveComplete?.()
    }
  }

  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i]!
    b.x += b.vx * dt
    b.y += b.vy * dt
    b.life -= dt
    if (
      b.life <= 0 ||
      b.x < -40 ||
      b.y < -40 ||
      b.x > state.width + 40 ||
      b.y > state.height + 40
    ) {
      state.bullets.splice(i, 1)
    }
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i]!
    enemy.x += enemy.vx * dt
    enemy.y += enemy.vy * dt

    if (enemy.kind === 'ghost') {
      enemy.y += Math.sin(functionalGameTime * 4 + enemy.wobblePhase) * 18 * dt
    }

    const edx = enemy.x - state.planetX
    const edy = enemy.y - state.planetY
    const dist = Math.hypot(edx, edy)

    const hitR = enemyHitRadius(enemy)
    if (dist < state.planetRadius + hitR) {
      state.enemies.splice(i, 1)
      damagePlanet(state, callbacks)
      continue
    }

    for (let j = state.bullets.length - 1; j >= 0; j--) {
      const bullet = state.bullets[j]!
      const bdx = bullet.x - enemy.x
      const bdy = bullet.y - enemy.y
      if (Math.hypot(bdx, bdy) < hitR + 4) {
        state.bullets.splice(j, 1)
        state.enemies.splice(i, 1)
        state.score += 10 * state.wave
        state.particles.spawnTypedExplosion(enemy.x, enemy.y, enemy.kind)
        callbacks.onEnemyDestroyed?.()
        break
      }
    }
  }

  const ship = getShipPosition(state)
  const shipDir = { x: Math.cos(state.shipAngle), y: Math.sin(state.shipAngle) }
  if (Math.random() < 0.6) {
    state.particles.spawnTrail(ship.x, ship.y, shipDir, '#3b82f6')
  }

  state.particles.update(dt)
}
