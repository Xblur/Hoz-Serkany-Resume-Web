import gsap from 'gsap'
import { getPlanetDiameter } from './types'
import type { PortraitRect } from './types'
import { playSfx } from './audio'

export interface IntroElements {
  overlay: HTMLElement
  portraitClone: HTMLImageElement
  planetWrap: HTMLElement
  shipEl: HTMLElement
  contentDim: HTMLElement | null
}

export interface IntroOptions {
  portraitSrc: string
  portraitAlt: string
  sourceRect: PortraitRect
  triggerShipRect?: PortraitRect
  reducedMotion: boolean
  onPhaseChange?: (phase: string) => void
}

function getTargetSize(viewportWidth: number): number {
  return getPlanetDiameter(viewportWidth)
}

function getShipOrbitPosition(vw: number, vh: number): { x: number; y: number } {
  const targetSize = getTargetSize(vw)
  const orbitRadius = targetSize / 2 + 52
  const planetX = vw / 2
  const planetY = vh / 2
  const shipAngle = -Math.PI / 2
  return {
    x: planetX + Math.cos(shipAngle) * orbitRadius,
    y: planetY + Math.sin(shipAngle) * orbitRadius,
  }
}

function getShipStartPosition(
  vw: number,
  triggerShipRect?: PortraitRect,
): { x: number; y: number } {
  if (triggerShipRect) {
    return {
      x: triggerShipRect.left + triggerShipRect.width / 2,
      y: triggerShipRect.top + triggerShipRect.height / 2,
    }
  }
  return { x: vw * 0.85, y: 48 }
}

function positionShipAtPoint(shipEl: HTMLElement, x: number, y: number, opacity = 1) {
  gsap.set(shipEl, {
    position: 'fixed',
    left: x,
    top: y,
    x: 0,
    y: 0,
    xPercent: -50,
    yPercent: -50,
    opacity,
    rotation: 0,
  })
}

function flyShipAlongArc(
  shipEl: HTMLElement,
  start: { x: number; y: number },
  end: { x: number; y: number },
  duration: number,
  onComplete?: () => void,
) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const dist = Math.hypot(dx, dy) || 1
  const controlX = (start.x + end.x) / 2 + (dy / dist) * dist * 0.22
  const controlY = (start.y + end.y) / 2 - (dx / dist) * dist * 0.22

  const proxy = { t: 0 }
  let prevX = start.x
  let prevY = start.y

  return gsap.to(proxy, {
    t: 1,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      const t = proxy.t
      const mt = 1 - t
      const x = mt * mt * start.x + 2 * mt * t * controlX + t * t * end.x
      const y = mt * mt * start.y + 2 * mt * t * controlY + t * t * end.y
      const angle = (Math.atan2(y - prevY, x - prevX) * 180) / Math.PI + 90
      prevX = x
      prevY = y
      gsap.set(shipEl, {
        left: x,
        top: y,
        xPercent: -50,
        yPercent: -50,
        rotation: angle,
      })
    },
    onComplete,
  })
}

export function createPortraitClone(
  container: HTMLElement,
  src: string,
  alt: string,
  rect: PortraitRect,
): HTMLImageElement {
  const img = document.createElement('img')
  img.src = src
  img.alt = alt
  img.className = 'sd-portrait-clone'
  img.style.position = 'fixed'
  img.style.left = `${rect.left}px`
  img.style.top = `${rect.top}px`
  img.style.width = `${rect.width}px`
  img.style.height = `${rect.height}px`
  img.style.borderRadius = '50%'
  img.style.objectFit = 'cover'
  img.style.objectPosition = 'top'
  img.style.zIndex = '60'
  img.style.pointerEvents = 'none'
  container.appendChild(img)
  return img
}

export function runIntro(
  elements: IntroElements,
  options: IntroOptions,
): Promise<void> {
  const { portraitClone, planetWrap, shipEl, contentDim } = elements
  const { reducedMotion } = options
  const vw = window.innerWidth
  const vh = window.innerHeight
  const targetSize = getTargetSize(vw)
  const cx = vw / 2 - targetSize / 2
  const cy = vh / 2 - targetSize / 2
  const shipStart = getShipStartPosition(vw, options.triggerShipRect)
  const shipOrbit = getShipOrbitPosition(vw, vh)

  positionShipAtPoint(shipEl, shipStart.x, shipStart.y)

  if (reducedMotion) {
    portraitClone.style.display = 'none'
    planetWrap.classList.add('sd-planet-wrap--visible')
    planetWrap.style.width = `${targetSize}px`
    planetWrap.style.height = `${targetSize}px`
    positionShipAtPoint(shipEl, shipOrbit.x, shipOrbit.y, 0)
    shipEl.classList.add('sd-ship-intro--ready')
    if (contentDim) contentDim.style.opacity = '0.3'
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve })

    options.onPhaseChange?.('flip')
    playSfx('warpHum')

    if (contentDim) {
      tl.to(contentDim, { opacity: 0.15, duration: 0.5, ease: 'power2.out' }, 0)
    }

    tl.to(
      portraitClone,
      {
        left: cx,
        top: cy,
        width: targetSize,
        height: targetSize,
        duration: 0.9,
        ease: 'power3.inOut',
      },
      0,
    )

    tl.call(() => options.onPhaseChange?.('planet-reveal'), [], 0.85)
    tl.to(
      portraitClone,
      {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          portraitClone.style.display = 'none'
        },
      },
      0.85,
    )
    tl.call(
      () => {
        planetWrap.classList.add('sd-planet-wrap--visible')
        planetWrap.style.width = `${targetSize}px`
        planetWrap.style.height = `${targetSize}px`
      },
      [],
      0.85,
    )

    tl.call(() => options.onPhaseChange?.('ship-fly'), [], 1.1)
    tl.call(() => playSfx('shipApproach'), [], 1.1)
    tl.add(
      flyShipAlongArc(shipEl, shipStart, shipOrbit, 0.8, () => {
        shipEl.classList.add('sd-ship-intro--ready')
      }),
      1.1,
    )

    tl.call(() => options.onPhaseChange?.('playing'), [], 1.9)
  })
}

export function runExit(
  elements: IntroElements,
  reducedMotion: boolean,
): Promise<void> {
  const { planetWrap, shipEl, overlay, contentDim } = elements

  if (reducedMotion) {
    overlay.style.opacity = '0'
    if (contentDim) contentDim.style.opacity = '1'
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve })

    tl.to(shipEl, { x: -200, y: -100, opacity: 0, duration: 0.4, ease: 'power2.in' }, 0)
    tl.to(
      planetWrap,
      { scale: 0.5, opacity: 0, duration: 0.5, ease: 'power2.in' },
      0.1,
    )
    tl.to(overlay, { opacity: 0, duration: 0.3 }, 0.3)
    if (contentDim) {
      tl.to(contentDim, { opacity: 1, duration: 0.3 }, 0.3)
    }
  })
}
