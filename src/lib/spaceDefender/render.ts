import type { Bullet, Enemy, GameConfig, GameState } from './types'
import {
  GHOST_HALF_HEIGHT_MULT,
  GHOST_HALF_WIDTH_MULT,
  REJECTION_EMAIL_HEIGHT_MULT,
  REJECTION_EMAIL_WIDTH_MULT,
} from './types'
import type { ParticleSystem } from './particles'

export interface Star {
  x: number
  y: number
  z: number
  size: number
}

export function createStarfield(width: number, height: number, count = 120): Star[] {
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random(),
      size: 0.5 + Math.random() * 1.5,
    })
  }
  return stars
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  width: number,
  height: number,
  time: number,
) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, width, height)

  for (const star of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + star.x)
    ctx.fillStyle = `rgba(255,255,255,${0.2 + star.z * 0.6 * twinkle})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size * (0.5 + star.z), 0, Math.PI * 2)
    ctx.fill()
  }
}

let planetImage: HTMLImageElement | null = null
let planetImageUrl = ''

function getPlanetImage(url: string): HTMLImageElement | null {
  if (planetImageUrl !== url) {
    planetImage = new Image()
    planetImage.src = url
    planetImageUrl = url
  }
  return planetImage
}

export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  config: GameConfig,
  rotation: number,
  shieldPulse: number,
  hitFlash: number,
) {
  const { planetX, planetY, planetRadius, photoUrl } = config
  const r = planetRadius

  const glow = ctx.createRadialGradient(planetX, planetY, r * 0.6, planetX, planetY, r * 2.2)
  glow.addColorStop(0, 'rgba(29, 78, 216, 0.35)')
  glow.addColorStop(0.5, 'rgba(124, 58, 237, 0.15)')
  glow.addColorStop(1, 'rgba(2, 6, 23, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(planetX, planetY, r * 2.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(planetX, planetY)
  ctx.rotate(rotation)

  ctx.strokeStyle = 'rgba(147, 197, 253, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(0, 0, r * 1.5, r * 0.35, 0.3, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.clip()

  const img = getPlanetImage(photoUrl)
  if (img?.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -r, -r, r * 2, r * 2)
  } else {
    ctx.fillStyle = '#1e3a8a'
    ctx.fillRect(-r, -r, r * 2, r * 2)
  }

  const band = ctx.createLinearGradient(-r, -r * 0.2, r, r * 0.2)
  band.addColorStop(0, 'rgba(255,255,255,0)')
  band.addColorStop(0.5, 'rgba(255,255,255,0.12)')
  band.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = band
  ctx.fillRect(-r, -r * 0.15, r * 2, r * 0.3)

  ctx.restore()

  if (shieldPulse > 0) {
    ctx.strokeStyle = `rgba(147, 197, 253, ${shieldPulse * 0.6})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(planetX, planetY, r + 8 + (1 - shieldPulse) * 12, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (hitFlash > 0) {
    ctx.fillStyle = `rgba(239, 68, 68, ${hitFlash * 0.35})`
    ctx.beginPath()
    ctx.arc(planetX, planetY, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  scale = 1,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle + Math.PI / 2)

  ctx.fillStyle = '#1d4ed8'
  ctx.beginPath()
  ctx.moveTo(0, -14 * scale)
  ctx.lineTo(8 * scale, 10 * scale)
  ctx.lineTo(0, 6 * scale)
  ctx.lineTo(-8 * scale, 10 * scale)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#60a5fa'
  ctx.beginPath()
  ctx.moveTo(-4 * scale, 10 * scale)
  ctx.lineTo(0, 18 * scale)
  ctx.lineTo(4 * scale, 10 * scale)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

function drawRejectionEmail(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const w = enemy.radius * REJECTION_EMAIL_WIDTH_MULT
  const h = enemy.radius * REJECTION_EMAIL_HEIGHT_MULT
  const x = -w / 2
  const y = -h / 2
  const pad = w * 0.08

  ctx.fillStyle = '#f8fafc'
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  roundRect(ctx, x, y, w, h, 4)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(x, y, w, h * 0.28)

  ctx.fillStyle = '#94a3b8'
  ctx.fillRect(x + pad, y + h * 0.38, w * 0.7, 2)
  ctx.fillRect(x + pad, y + h * 0.52, w * 0.5, 2)

  const label = 'Rejected'
  const maxTextWidth = w - pad * 2
  let fontSize = enemy.radius * 0.55
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `900 ${fontSize}px sans-serif`
  const measured = ctx.measureText(label).width
  if (measured > maxTextWidth) {
    fontSize *= maxTextWidth / measured
    ctx.font = `900 ${fontSize}px sans-serif`
  }

  ctx.fillStyle = '#ef4444'
  ctx.fillText(label, 0, y + h * 0.78)
}

function drawGhost(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  const bob = Math.sin(time * 4 + enemy.wobblePhase) * 2
  const r = enemy.radius
  const hw = r * GHOST_HALF_WIDTH_MULT
  const hh = r * GHOST_HALF_HEIGHT_MULT

  ctx.globalAlpha = 0.88
  ctx.fillStyle = '#f8fafc'
  ctx.beginPath()
  ctx.moveTo(0, -hh + bob)
  ctx.bezierCurveTo(hw, -hh + bob, hw, r * 0.2 + bob, r * 0.6, r * 0.5 + bob)
  ctx.lineTo(r * 0.3, r * 0.35 + bob)
  ctx.lineTo(0, r * 0.55 + bob)
  ctx.lineTo(-r * 0.3, r * 0.35 + bob)
  ctx.lineTo(-r * 0.6, r * 0.5 + bob)
  ctx.bezierCurveTo(-hw, r * 0.2 + bob, -hw, -hh + bob, 0, -hh + bob)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.ellipse(-r * 0.28, -r * 0.15 + bob, r * 0.18, r * 0.24, 0, 0, Math.PI * 2)
  ctx.ellipse(r * 0.28, -r * 0.15 + bob, r * 0.18, r * 0.24, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  ctx.save()
  ctx.translate(enemy.x, enemy.y)
  const angle = Math.atan2(enemy.vy, enemy.vx)
  ctx.rotate(angle + Math.PI / 2)

  if (enemy.kind === 'rejectionEmail') {
    drawRejectionEmail(ctx, enemy)
  } else {
    drawGhost(ctx, enemy, time)
  }

  ctx.restore()
}

export function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet) {
  ctx.save()
  ctx.strokeStyle = '#93c5fd'
  ctx.lineWidth = 3
  ctx.shadowColor = '#60a5fa'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.moveTo(bullet.x, bullet.y)
  ctx.lineTo(bullet.x - bullet.vx * 0.02, bullet.y - bullet.vy * 0.02)
  ctx.stroke()
  ctx.restore()
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: ParticleSystem) {
  for (const p of particles.particles) {
    const alpha = Math.max(0, p.life / p.maxLife)
    ctx.fillStyle = p.color
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function getShipPosition(state: GameState) {
  return {
    x: state.planetX + Math.cos(state.shipAngle) * state.shipOrbitRadius,
    y: state.planetY + Math.sin(state.shipAngle) * state.shipOrbitRadius,
  }
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  planetImage: HTMLImageElement | null,
  planetRotation: number,
) {
  const { width, height } = state
  const time = performance.now() / 1000

  ctx.save()
  if (state.screenShake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * state.screenShake,
      (Math.random() - 0.5) * state.screenShake,
    )
  }

  const stars = createStarfield(width, height)
  drawStarfield(ctx, stars, width, height, time)

  for (const enemy of state.enemies) {
    drawEnemy(ctx, enemy, time)
  }
  for (const bullet of state.bullets) {
    drawBullet(ctx, bullet)
  }

  const config: GameConfig = {
    width,
    height,
    planetRadius: state.planetRadius,
    planetX: state.planetX,
    planetY: state.planetY,
    shipOrbitRadius: state.shipOrbitRadius,
    maxPlanetHp: state.maxPlanetHp,
    photoUrl: planetImage?.src ?? '',
  }

  if (planetImage?.complete && planetImage.naturalWidth > 0) {
    const { planetX, planetY, planetRadius } = state
    const r = planetRadius
    const glow = ctx.createRadialGradient(planetX, planetY, r * 0.6, planetX, planetY, r * 2.2)
    glow.addColorStop(0, 'rgba(29, 78, 216, 0.35)')
    glow.addColorStop(0.5, 'rgba(124, 58, 237, 0.15)')
    glow.addColorStop(1, 'rgba(2, 6, 23, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(planetX, planetY, r * 2.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.translate(planetX, planetY)
    ctx.rotate(planetRotation)
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(planetImage, -r, -r, r * 2, r * 2)
    ctx.restore()

    if (state.shieldPulse > 0) {
      ctx.strokeStyle = `rgba(147, 197, 253, ${state.shieldPulse * 0.6})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(planetX, planetY, r + 8 + (1 - state.shieldPulse) * 12, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (state.hitFlash > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${state.hitFlash * 0.35})`
      ctx.beginPath()
      ctx.arc(planetX, planetY, r, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    drawPlanet(ctx, config, planetRotation, state.shieldPulse, state.hitFlash)
  }

  const ship = getShipPosition(state)
  drawShip(ctx, ship.x, ship.y, state.shipAngle)
  drawParticles(ctx, state.particles)

  ctx.restore()
}

