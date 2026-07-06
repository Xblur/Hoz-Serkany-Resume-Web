<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  fetchStoryMeta,
  loadDailyStory,
  type ResolvedStory,
  type StorySlide,
} from '../lib/storyLoader'

const props = defineProps<{
  photo: string
  photoAlt: string
}>()

const SLIDE_MS = 6000

const isOpen = ref(false)
const isLoading = ref(false)
const story = ref<ResolvedStory | null>(null)
const currentSlide = ref(0)
const progressKey = ref(0)
const isPaused = ref(false)
/** Toggle pause via button — stays paused until toggled off. */
const pauseLocked = ref(false)
const pauseEnabled = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const dialogRef = ref<HTMLDivElement | null>(null)
const tapZoneRef = ref<HTMLDivElement | null>(null)
const previouslyFocused = ref<HTMLElement | null>(null)
/** In-memory only — resets on hard refresh / new tab. */
const storyVersion = ref<string | null>(null)
const seenVersion = ref<string | null>(null)

let timerId: ReturnType<typeof setTimeout> | null = null
let holdTimerId: ReturnType<typeof setTimeout> | null = null
/** Suppress tap navigation after a hold-to-pause gesture. */
let suppressNextTap = false
const HOLD_PAUSE_MS = 180

const isSeen = computed(
  () => storyVersion.value !== null && seenVersion.value === storyVersion.value,
)

const prefersReducedMotion = computed(() => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

const slides = computed<StorySlide[]>(() => story.value?.slides ?? [])
const totalSlides = computed(() => slides.value.length)
const lastSlideIndex = computed(() => Math.max(0, totalSlides.value - 1))

const fallbackLabel = computed(() => {
  if (!story.value?.isFallback || !story.value.sourceDate) return null
  const d = new Date(story.value.sourceDate + 'T12:00:00')
  const formatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `From ${formatted} — today's story is on its way`
})

function clearHoldTimer() {
  if (holdTimerId !== null) {
    clearTimeout(holdTimerId)
    holdTimerId = null
  }
}

function pausePlayback() {
  isPaused.value = true
  clearTimer()
}

function resumePlayback() {
  if (pauseLocked.value) return
  isPaused.value = false
  if (currentSlide.value >= lastSlideIndex.value) {
    scheduleFinalClose()
  } else {
    scheduleAdvance()
  }
}

function scheduleFinalClose() {
  clearTimer()
  if (!isOpen.value || isPaused.value || prefersReducedMotion.value) return
  if (currentSlide.value < lastSlideIndex.value) return
  timerId = setTimeout(() => closeStory(), SLIDE_MS)
}

function togglePause() {
  pauseLocked.value = !pauseLocked.value
  if (pauseLocked.value) {
    pausePlayback()
  } else {
    resumePlayback()
  }
}

function clearTimer() {
  if (timerId !== null) {
    clearTimeout(timerId)
    timerId = null
  }
}

function scheduleAdvance() {
  clearTimer()
  if (!isOpen.value || isPaused.value || prefersReducedMotion.value) return
  if (currentSlide.value >= lastSlideIndex.value) return

  timerId = setTimeout(() => {
    currentSlide.value += 1
    progressKey.value += 1
    scheduleAdvance()
  }, SLIDE_MS)
}

function markSeen() {
  if (storyVersion.value) {
    seenVersion.value = storyVersion.value
  }
}

async function refreshStoryVersion() {
  const meta = await fetchStoryMeta()
  storyVersion.value = meta.version
}

function getFocusableElements(): HTMLElement[] {
  if (!dialogRef.value) return []
  return Array.from(
    dialogRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

function onKeydown(event: KeyboardEvent) {
  if (!isOpen.value) return

  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      closeStory()
      break
    case 'ArrowLeft':
      event.preventDefault()
      goPrev()
      break
    case 'ArrowRight':
      event.preventDefault()
      goNext()
      break
    case ' ':
    case 'k':
      event.preventDefault()
      togglePause()
      break
    case 'Tab':
      trapFocus(event)
      break
  }
}

async function openStory() {
  previouslyFocused.value = triggerRef.value
  isOpen.value = true
  document.body.style.overflow = 'hidden'
  currentSlide.value = 0
  progressKey.value += 1
  isPaused.value = false
  pauseLocked.value = false

  isLoading.value = true
  try {
    await refreshStoryVersion()
    story.value = await loadDailyStory()
  } finally {
    isLoading.value = false
  }

  await nextTick()
  const focusable = getFocusableElements()
  if (focusable.length > 0) {
    focusable[0]!.focus()
  } else {
    dialogRef.value?.focus()
  }

  pauseEnabled.value = false
  window.setTimeout(() => {
    pauseEnabled.value = true
  }, 400)

  scheduleAdvance()
}

function closeStory() {
  clearTimer()
  isOpen.value = false
  document.body.style.overflow = ''
  isPaused.value = false
  pauseLocked.value = false
  pauseEnabled.value = false
  clearHoldTimer()
  markSeen()

  nextTick(() => {
    previouslyFocused.value?.focus()
  })
}

function goNext() {
  if (currentSlide.value < lastSlideIndex.value) {
    currentSlide.value += 1
    progressKey.value += 1
    scheduleAdvance()
  } else {
    closeStory()
  }
}

function goPrev() {
  if (currentSlide.value > 0) {
    currentSlide.value -= 1
    progressKey.value += 1
    scheduleAdvance()
  }
}

function onTapZone(event: MouseEvent) {
  if (pauseLocked.value || suppressNextTap) {
    suppressNextTap = false
    return
  }
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  if (x < rect.width / 2) {
    goPrev()
  } else {
    goNext()
  }
}

function onPointerDown(event: PointerEvent) {
  if (prefersReducedMotion.value || !pauseEnabled.value || pauseLocked.value) return
  if (event.button !== 0) return

  const zone = tapZoneRef.value
  if (!zone) return

  zone.setPointerCapture(event.pointerId)
  clearHoldTimer()
  holdTimerId = setTimeout(() => {
    holdTimerId = null
    suppressNextTap = true
    pausePlayback()
  }, HOLD_PAUSE_MS)
}

function onPointerUp(event: PointerEvent) {
  const zone = tapZoneRef.value
  if (zone?.hasPointerCapture(event.pointerId)) {
    zone.releasePointerCapture(event.pointerId)
  }

  if (holdTimerId !== null) {
    clearHoldTimer()
    return
  }

  if (!pauseLocked.value && isPaused.value) {
    resumePlayback()
  }
}

function onPointerCancel(event: PointerEvent) {
  clearHoldTimer()
  onPointerUp(event)
}

watch(currentSlide, (idx) => {
  if (isOpen.value && idx >= lastSlideIndex.value && !prefersReducedMotion.value) {
    scheduleFinalClose()
  }
})

watch(storyVersion, (newV, oldV) => {
  if (oldV && newV !== oldV) {
    story.value = null
  }
})

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    void refreshStoryVersion()
  }
}

onMounted(() => {
  try {
    localStorage.removeItem('storySeenDate')
  } catch {
    // ignore
  }
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('visibilitychange', onVisibilityChange)
  void refreshStoryVersion()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  document.body.style.overflow = ''
  clearTimer()
  clearHoldTimer()
})
</script>

<template>
  <button
    ref="triggerRef"
    type="button"
    class="story-ring group shrink-0 rounded-full transition-opacity"
    :class="{ 'story-ring--seen': isSeen }"
    :aria-label="isSeen ? 'View tech story' : 'View today\'s tech story'"
    :aria-expanded="isOpen"
    @click="openStory"
  >
    <img
      :src="photo"
      :alt="photoAlt"
      width="176"
      height="176"
      class="block h-36 w-36 rounded-full object-cover object-top sm:h-40 sm:w-40 md:h-44 md:w-44"
      decoding="async"
      fetchpriority="high"
    />
    <span
      v-if="!isSeen"
      class="sr-only"
    >New story available</span>
  </button>

  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="dialogRef"
      role="dialog"
      aria-modal="true"
      aria-label="Profile story"
      tabindex="-1"
      class="fixed inset-0 z-50 flex flex-col bg-ink/95"
    >
      <!-- Progress bars -->
      <div
        class="flex gap-1 px-3 pt-3 sm:px-4 sm:pt-4"
        aria-hidden="true"
      >
        <div
          v-for="i in totalSlides"
          :key="i"
          class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25"
        >
          <div
            v-if="i - 1 < currentSlide"
            class="h-full w-full bg-white"
          />
          <div
            v-else-if="i - 1 === currentSlide && !prefersReducedMotion"
            :key="`progress-${progressKey}`"
            class="story-progress-bar h-full bg-white"
            :style="{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: isPaused ? 'paused' : 'running' }"
          />
          <div
            v-else-if="i - 1 === currentSlide"
            class="h-full w-full bg-white"
          />
        </div>
      </div>

      <!-- Header -->
      <div class="relative px-4 py-3">
        <button
          type="button"
          class="absolute top-1/2 left-4 -translate-y-1/2 rounded-md px-2.5 py-1 text-sm text-white/80 hover:bg-white/10 hover:text-white"
          :aria-label="pauseLocked ? 'Resume story' : 'Pause story'"
          @click.stop="togglePause"
        >
          <span aria-hidden="true">{{ pauseLocked ? '▶' : '⏸' }}</span>
        </button>
        <p class="text-center text-xl font-semibold text-white sm:text-2xl">
          {{ slides[currentSlide]?.label ?? 'Loading…' }}
        </p>
        <button
          type="button"
          class="absolute top-1/2 right-4 -translate-y-1/2 rounded-md px-2 py-1 text-sm text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Close story"
          @click="closeStory"
        >
          ✕
        </button>
      </div>

      <!-- Tap zones -->
      <div
        ref="tapZoneRef"
        class="relative flex flex-1 flex-col touch-none select-none"
        @click="onTapZone"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
      >
        <div class="pointer-events-none absolute inset-0 flex">
          <div class="w-1/3" aria-hidden="true" />
          <div class="w-1/3" aria-hidden="true" />
          <div class="w-1/3" aria-hidden="true" />
        </div>

        <div class="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
          <div
            v-if="isLoading"
            class="text-center text-white/70"
          >
            Loading story…
          </div>

          <div
            v-else
            class="pointer-events-auto max-w-lg text-center"
          >
            <p
              v-if="currentSlide === 0 && slides[currentSlide]?.kind === 'fact' && fallbackLabel"
              class="mb-4 text-xs text-white/60"
            >
              {{ fallbackLabel }}
            </p>

            <p class="text-lg leading-relaxed text-white sm:text-xl">
              {{ slides[currentSlide]?.body }}
            </p>

            <a
              v-if="slides[currentSlide]?.sourceUrl"
              :href="slides[currentSlide]!.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-6 inline-block text-sm text-accent-ring underline underline-offset-2 hover:text-white"
              @click.stop
            >
              {{ slides[currentSlide]?.sourceTitle ?? 'Source' }}
              <span class="sr-only"> (opens in a new tab)</span>
            </a>

            <a
              v-if="slides[currentSlide]?.ctaHref"
              :href="slides[currentSlide]!.ctaHref"
              class="mt-8 inline-flex items-center rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white no-underline hover:bg-accent-hover"
              @click.stop="closeStory"
            >
              {{ slides[currentSlide]?.ctaLabel ?? 'Learn more' }}
            </a>
          </div>
        </div>
      </div>

      <!-- Manual nav hint (reduced motion) -->
      <p
        v-if="prefersReducedMotion"
        class="pb-6 text-center text-xs text-white/50"
      >
        Use arrow keys or tap sides to navigate · Space to pause · Esc to close
      </p>
    </div>
  </Teleport>
</template>
