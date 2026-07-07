import type { EnemyKind, Vec2 } from './types'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  radius: number
  color: string
}

const MAX_PARTICLES = 200

export class ParticleSystem {
  particles: Particle[] = []

  spawnTypedExplosion(x: number, y: number, kind: EnemyKind) {
    if (kind === 'rejectionEmail') {
      const colors = ['#f1f5f9', '#94a3b8', '#ef4444', '#cbd5e1']
      for (let i = 0; i < 10; i++) {
        this.spawnExplosion(x, y, colors[i % colors.length]!, 1)
      }
    } else {
      const colors = ['#f8fafc', '#c4b5fd', '#e9d5ff', '#ddd6fe']
      for (let i = 0; i < 10; i++) {
        this.spawnExplosion(x, y, colors[i % colors.length]!, 1)
      }
    }
  }

  spawnExplosion(x: number, y: number, color = '#f59e0b', count = 12) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
      const speed = 60 + Math.random() * 120
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        radius: 2 + Math.random() * 3,
        color,
      })
    }
  }

  spawnTrail(x: number, y: number, dir: Vec2, color = '#60a5fa') {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift()
    }
    this.particles.push({
      x: x - dir.x * 6,
      y: y - dir.y * 6,
      vx: -dir.x * 20 + (Math.random() - 0.5) * 10,
      vy: -dir.y * 20 + (Math.random() - 0.5) * 10,
      life: 0.25,
      maxLife: 0.25,
      radius: 2,
      color,
    })
  }

  spawnShieldRipple(x: number, y: number, radius: number) {
    for (let i = 0; i < 8; i++) {
      if (this.particles.length >= MAX_PARTICLES) break
      const angle = (Math.PI * 2 * i) / 8
      this.particles.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        vx: Math.cos(angle) * 40,
        vy: Math.sin(angle) * 40,
        life: 0.5,
        maxLife: 0.5,
        radius: 3,
        color: '#93c5fd',
      })
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.96
      p.vy *= 0.96
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  clear() {
    this.particles.length = 0
  }
}
