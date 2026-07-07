<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import { usePreferredReducedMotion, useWindowSize } from '@vueuse/core'
import { resume } from '../data/resume'
import SpaceDefenderLeaderboard from './SpaceDefenderLeaderboard.vue'
import { SpaceDefenderEngine } from '../lib/spaceDefender/engine'
import {
  createStarfield,
  drawEnemy,
  drawBullet,
  drawParticles,
  drawPlanet,
  drawShip,
  drawStarfield,
  type Star,
} from '../lib/spaceDefender/render'
import { getPlanetDiameter } from '../lib/spaceDefender/types'
import {
  createPortraitClone,
  runExit,
  runIntro,
  type IntroElements,
} from '../lib/spaceDefender/intro'
import type { PortraitRect } from '../lib/spaceDefender/types'
import {
  getLastPlayerName,
  submitScore,
} from '../lib/spaceDefender/leaderboard'
import {
  getGameOverHeadline,
  getIntroHireMessage,
  getNextHireToast,
  gameOverCtas,
  HIRE_TOAST_FIRST_DELAY_MS,
  HIRE_TOAST_INTERVAL_MS,
  type HireMessage,
} from '../lib/spaceDefender/hireMessages'
import {
  initAudio,
  isMuted,
  playSfx,
  setMuted,
  stopAllSfx,
  toggleMute,
} from '../lib/spaceDefender/audio'

const props = defineProps<{
  portraitEl: HTMLImageElement | null
  triggerShipRect: PortraitRect | null
}>()

const emit = defineEmits<{
  close: []
}>()

const dialogRef = useTemplateRef<HTMLDivElement>('dialog')
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const overlayRef = useTemplateRef<HTMLDivElement>('overlay')
const planetWrapRef = useTemplateRef<HTMLDivElement>('planetWrap')
const shipIntroRef = useTemplateRef<HTMLDivElement>('shipIntro')
const contentDimRef = useTemplateRef<HTMLDivElement>('contentDim')
const leaderboardRef = useTemplateRef<InstanceType<typeof SpaceDefenderLeaderboard>>('leaderboard')
const previouslyFocused = ref<HTMLElement | null>(null)

const { width: windowWidth, height: windowHeight } = useWindowSize()
const prefersReducedMotion = usePreferredReducedMotion()
const reducedMotion = computed(() => prefersReducedMotion.value === 'reduce')

const engine = ref<SpaceDefenderEngine | null>(null)
const stars = ref<Star[]>([])
const phase = ref<'intro' | 'playing' | 'game-over' | 'exiting'>('intro')
const muted = ref(false)
const leaderboardOpen = ref(false)
const hireToast = ref<HireMessage | null>(null)
const hireToastIndex = ref(0)
const showHireToast = ref(false)

const initials = ref('')
const submitError = ref<string | null>(null)
const submitting = ref(false)
const submittedRank = ref<number | null>(null)
const submitted = ref(false)

let animationId = 0
let lastTime = 0
let portraitClone: HTMLImageElement | null = null
let hireToastTimer: ReturnType<typeof setInterval> | null = null
let hireToastFirstTimer: ReturnType<typeof setTimeout> | null = null
let gameTime = 0

const snapshot = computed(() => engine.value?.getSnapshot() ?? null)
const hudScore = computed(() => snapshot.value?.score ?? 0)
const hudWave = computed(() => snapshot.value?.wave ?? 1)
const hudHp = computed(() => snapshot.value?.planetHp ?? 4)
const maxHp = computed(() => snapshot.value?.maxPlanetHp ?? 4)
const gameOverHeadline = computed(() =>
  getGameOverHeadline(
    snapshot.value?.score ?? 0,
    snapshot.value?.wave ?? 1,
    submittedRank.value,
  ),
)

function getFocusableElements(): HTMLElement[] {
  if (!dialogRef.value) return []
  return Array.from(
    dialogRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

function trapFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !dialogRef.value) return
  const focusable = getFocusableElements()
  if (focusable.length === 0) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function createEngine(): SpaceDefenderEngine {
  const w = windowWidth.value
  const h = windowHeight.value
  const planetRadius = getPlanetDiameter(w) / 2
  return new SpaceDefenderEngine(
    {
      width: w,
      height: h,
      planetRadius,
      planetX: w / 2,
      planetY: h / 2,
      shipOrbitRadius: planetRadius + 52,
      maxPlanetHp: 4,
      photoUrl: resume.photo,
    },
    {
      onEnemyDestroyed: () => playSfx('explosion'),
      onPlanetHit: () => playSfx('planetHit'),
      onGameOver: () => {
        playSfx('gameOver')
        phase.value = 'game-over'
        stopHireToasts()
      },
    },
  )
}

function setupCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = windowWidth.value
  const h = windowHeight.value
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  if (!engine.value) {
    engine.value = createEngine()
    stars.value = createStarfield(w, h)
  } else {
    const planetRadius = getPlanetDiameter(w) / 2
    engine.value.resize({
      width: w,
      height: h,
      planetRadius,
      planetX: w / 2,
      planetY: h / 2,
      shipOrbitRadius: planetRadius + 52,
    })
    if (stars.value.length === 0) {
      stars.value = createStarfield(w, h)
    }
  }
}

function onPointerMove(event: PointerEvent) {
  if (!engine.value || phase.value !== 'playing') return
  engine.value.setPointer(event.clientX, event.clientY)
}

function onPointerDown(event: PointerEvent) {
  if (phase.value !== 'playing' || !engine.value) return
  event.preventDefault()
  if (engine.value.shoot(performance.now())) {
    playSfx('laser')
  }
}

function gameLoop(now: number) {
  animationId = requestAnimationFrame(gameLoop)
  const dt = Math.min((now - lastTime) / 1000, 0.05)
  lastTime = now
  gameTime += dt

  const eng = engine.value
  const canvas = canvasRef.value
  if (!eng || !canvas || phase.value !== 'playing') return

  eng.update(dt, now)

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const shake = eng.screenShake
  const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0
  const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0

  ctx.save()
  ctx.translate(shakeX, shakeY)

  drawStarfield(ctx, stars.value, eng.config.width, eng.config.height, gameTime)
  drawPlanet(ctx, eng.config, eng.planetRotation, eng.shieldPulse, eng.hitFlash)

  for (const enemy of eng.enemies) {
    drawEnemy(ctx, enemy, gameTime)
  }
  for (const bullet of eng.bullets) {
    drawBullet(ctx, bullet)
  }

  const ship = eng.getShipPosition()
  drawShip(ctx, ship.x, ship.y, eng.shipAngle)
  drawParticles(ctx, eng.particles)

  ctx.restore()
}

function showHirePrompt(message: HireMessage) {
  if (phase.value !== 'playing') return
  hireToast.value = message
  showHireToast.value = true
}

function showHireToastMessage() {
  showHirePrompt(getNextHireToast(hireToastIndex.value))
  hireToastIndex.value += 1
}

function showIntroHirePrompt() {
  showHirePrompt(getIntroHireMessage())
}

function clearHireToastTimers() {
  if (hireToastFirstTimer !== null) {
    clearTimeout(hireToastFirstTimer)
    hireToastFirstTimer = null
  }
  if (hireToastTimer !== null) {
    clearInterval(hireToastTimer)
    hireToastTimer = null
  }
}

function startHireToasts() {
  clearHireToastTimers()
  hireToastIndex.value = 0
  hireToastFirstTimer = setTimeout(() => {
    showHireToastMessage()
    hireToastTimer = setInterval(showHireToastMessage, HIRE_TOAST_INTERVAL_MS)
  }, HIRE_TOAST_FIRST_DELAY_MS)
}

function stopHireToasts() {
  clearHireToastTimers()
  showHireToast.value = false
}

async function beginIntro() {
  document.body.style.overflow = 'hidden'
  initAudio()
  muted.value = isMuted()
  setMuted(muted.value)
  initials.value = getLastPlayerName()
  setupCanvas()

  const portrait = props.portraitEl
  const rect = portrait?.getBoundingClientRect() ?? {
    left: window.innerWidth / 2 - 80,
    top: window.innerHeight / 2 - 80,
    width: 160,
    height: 160,
  }

  const overlay = overlayRef.value
  const planetWrap = planetWrapRef.value
  const shipEl = shipIntroRef.value
  if (!overlay || !planetWrap || !shipEl) return

  portraitClone = createPortraitClone(overlay, resume.photo, resume.photoAlt, rect)

  const introElements: IntroElements = {
    overlay,
    portraitClone,
    planetWrap,
    shipEl,
    contentDim: contentDimRef.value,
  }

  await runIntro(introElements, {
    portraitSrc: resume.photo,
    portraitAlt: resume.photoAlt,
    sourceRect: rect,
    triggerShipRect: props.triggerShipRect ?? undefined,
    reducedMotion: reducedMotion.value,
  })

  phase.value = 'playing'
  planetWrap.style.opacity = '0'
  planetWrap.style.pointerEvents = 'none'
  lastTime = performance.now()
  gameTime = 0
  animationId = requestAnimationFrame(gameLoop)
  showIntroHirePrompt()
  startHireToasts()

  await nextTick()
  void leaderboardRef.value?.refresh()
}

async function handleClose() {
  if (phase.value === 'exiting') return
  phase.value = 'exiting'
  stopHireToasts()
  cancelAnimationFrame(animationId)
  stopAllSfx()

  const overlay = overlayRef.value
  const planetWrap = planetWrapRef.value
  const shipEl = shipIntroRef.value
  if (overlay && planetWrap && shipEl && portraitClone) {
    await runExit(
      {
        overlay,
        portraitClone,
        planetWrap,
        shipEl,
        contentDim: contentDimRef.value,
      },
      reducedMotion.value,
    )
  }

  portraitClone?.remove()
  portraitClone = null
  document.body.style.overflow = ''
  emit('close')
}

function handlePlayAgain() {
  submitted.value = false
  submittedRank.value = null
  submitError.value = null
  phase.value = 'playing'
  engine.value?.reset()
  const planetWrap = planetWrapRef.value
  if (planetWrap) {
    planetWrap.style.opacity = '0'
  }
  lastTime = performance.now()
  gameTime = 0
  animationId = requestAnimationFrame(gameLoop)
  showIntroHirePrompt()
  startHireToasts()
}

async function handleSubmitScore() {
  if (!engine.value || submitting.value) return
  submitting.value = true
  submitError.value = null
  const snap = engine.value.getSnapshot()
  const result = await submitScore({
    name: initials.value,
    score: snap.score,
    wave: snap.wave,
  })
  submitting.value = false
  if (!result.ok) {
    submitError.value = result.error ?? 'Submit failed'
    return
  }
  submitted.value = true
  submittedRank.value = result.rank ?? null
  await leaderboardRef.value?.refresh()
}

function onKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      void handleClose()
      break
    case ' ':
      if (phase.value === 'playing' && engine.value) {
        event.preventDefault()
        if (engine.value.shoot(performance.now())) {
          playSfx('laser')
        }
      }
      break
    case 'm':
    case 'M':
      muted.value = toggleMute()
      break
    case 'l':
    case 'L':
      leaderboardOpen.value = !leaderboardOpen.value
      break
    case 'Tab':
      trapFocus(event)
      break
  }
}

watch([windowWidth, windowHeight], () => {
  if (phase.value === 'playing' || phase.value === 'intro') setupCanvas()
})

onMounted(async () => {
  previouslyFocused.value = document.activeElement as HTMLElement | null
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  dialogRef.value?.focus()
  void beginIntro()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  cancelAnimationFrame(animationId)
  stopHireToasts()
  stopAllSfx()
  portraitClone?.remove()
  document.body.style.overflow = ''
  nextTick(() => previouslyFocused.value?.focus())
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="contentDim"
      class="sd-content-dim"
      aria-hidden="true"
    />

    <div
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Space Defender mini-game"
      tabindex="-1"
      class="sd-game"
    >
      <div
        ref="overlay"
        class="sd-game__overlay"
      >
        <div
          class="sd-starfield"
          aria-hidden="true"
        />

        <div
          ref="planetWrap"
          class="sd-planet-wrap"
        >
          <img
            :src="resume.photo"
            :alt="resume.photoAlt"
            class="sd-planet-wrap__photo"
            width="200"
            height="200"
          />
          <div class="sd-planet-wrap__atmosphere" />
          <div class="sd-planet-wrap__cloud-band" />
          <div class="sd-planet-wrap__ring" />
          <div class="sd-planet-wrap__shield" />
        </div>

        <div
          ref="shipIntro"
          class="sd-ship-intro"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 32 32"
            width="40"
            height="40"
          >
            <path
              d="M16 4 L24 22 L16 18 L8 22 Z"
              fill="#e2e8f0"
            />
            <path
              d="M13 20 L16 28 L19 20 Z"
              fill="#38bdf8"
              opacity="0.8"
            />
          </svg>
        </div>
      </div>

      <canvas
        ref="canvas"
        class="sd-game__canvas"
        :class="{ 'sd-game__canvas--active': phase === 'playing' || phase === 'game-over' }"
        @pointermove="onPointerMove"
        @pointerdown="onPointerDown"
      />

      <div
        v-if="phase === 'playing'"
        class="sd-hud"
      >
        <div class="sd-hud__stats">
          <span>Score: {{ hudScore.toLocaleString() }}</span>
          <span>Wave: {{ hudWave }}</span>
          <span>HP: {{ hudHp }}/{{ maxHp }}</span>
        </div>
        <div class="sd-hud__prompt">
          <Transition name="sd-hire-prompt">
            <div
              v-if="showHireToast && hireToast"
              class="sd-hire-prompt"
              role="status"
              aria-live="polite"
            >
              <p class="sd-hire-prompt__text">{{ hireToast.text }}</p>
              <a
                v-if="hireToast.ctaHref"
                :href="hireToast.ctaHref"
                class="sd-hire-prompt__cta"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ hireToast.ctaLabel }}
              </a>
            </div>
          </Transition>
        </div>
        <div class="sd-hud__controls">
          <button
            type="button"
            class="sd-hud__btn"
            :aria-label="muted ? 'Unmute sound' : 'Mute sound'"
            @click="muted = toggleMute()"
          >
            {{ muted ? '🔇' : '🔊' }}
          </button>
          <button
            type="button"
            class="sd-hud__btn"
            :aria-pressed="leaderboardOpen"
            aria-label="Toggle leaderboard"
            @click="leaderboardOpen = !leaderboardOpen"
          >
            🏆
          </button>
          <button
            type="button"
            class="sd-hud__btn"
            aria-label="Exit game"
            @click="handleClose"
          >
            ✕
          </button>
        </div>
      </div>

      <SpaceDefenderLeaderboard
        ref="leaderboard"
        :open="leaderboardOpen"
        :player-name="submitted ? initials : undefined"
        :player-score="snapshot?.score"
        :highlight-name="submitted ? initials : undefined"
        @close="leaderboardOpen = false"
      />

      <div
        v-if="phase === 'game-over'"
        class="sd-game-over"
      >
        <h2 class="sd-game-over__title">
          {{ gameOverHeadline }}
        </h2>

        <div
          v-if="!submitted"
          class="sd-game-over__submit"
        >
          <label
            for="sd-initials"
            class="sd-game-over__label"
          >
            Enter initials for the leaderboard
          </label>
          <input
            id="sd-initials"
            v-model="initials"
            type="text"
            maxlength="12"
            class="sd-game-over__input"
            placeholder="ABC"
            autocomplete="nickname"
          />
          <p
            v-if="submitError"
            class="sd-game-over__error"
            role="alert"
          >
            {{ submitError }}
          </p>
          <button
            type="button"
            class="sd-game-over__btn sd-game-over__btn--primary"
            :disabled="submitting || initials.trim().length === 0"
            @click="handleSubmitScore"
          >
            {{ submitting ? 'Submitting…' : 'Submit score' }}
          </button>
        </div>

        <p
          v-else-if="submittedRank"
          class="sd-game-over__rank"
        >
          You ranked #{{ submittedRank }} globally!
        </p>

        <p class="sd-game-over__hire">
          <span>Oh no!Planet Hoz has been overrun by rejections.</span>
          <span class="sd-game-over__hire-cta">Save it with an offer!</span>
        </p>
        <div class="sd-game-over__ctas">
          <a
            v-for="cta in gameOverCtas"
            :key="cta.label"
            :href="cta.href"
            class="sd-game-over__btn"
            :class="{ 'sd-game-over__btn--primary': cta.primary }"
            :target="cta.external ? '_blank' : undefined"
            :rel="cta.external ? 'noopener noreferrer' : undefined"
            :download="cta.download ? 'Hoz-Serkany-Resume.pdf' : undefined"
          >
            {{ cta.label }}
          </a>
        </div>

        <div class="sd-game-over__actions">
          <button
            type="button"
            class="sd-game-over__btn"
            @click="handlePlayAgain"
          >
            Play again
          </button>
          <button
            type="button"
            class="sd-game-over__btn"
            @click="handleClose"
          >
            Back to resume
          </button>
        </div>
      </div>

      <p class="sd-hint sr-only">
        Space to shoot, M to mute, L for leaderboard, Esc to exit
      </p>
    </div>
  </Teleport>
</template>
