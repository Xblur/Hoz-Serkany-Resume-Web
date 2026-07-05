<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { BlinkDetector, GestureConfirmator, HoldCommandDetector } from '../lib/blinkDetect'
import {
  FACE_GESTURES,
  GESTURE_COMMANDS,
  GESTURE_SPEECH,
  type FaceGesture,
  blendshapesToMap,
  classifyFaceGesture,
  resetGestureCalibration,
} from '../lib/faceGestures'

const videoRef = useTemplateRef<HTMLVideoElement>('video')
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const sequenceScrollRef = useTemplateRef<HTMLDivElement>('sequenceScroll')

const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMessage = ref('')
const gesture = ref<FaceGesture>('Neutral')
const fps = ref(0)
const gestureSequence = ref<FaceGesture[]>([])
const actionFeedback = ref('')

const GESTURE_CONFIRM_MS = 500
const BLINK_HOLD_MS = 500
const LOOKDOWN_CONFIRM_MS = 3000
const LOOKDOWN_RESET_MS = 5000
const OPENMOUTH_SPEAK_MS = 3000

let faceLandmarker: FaceLandmarker | null = null
let animationId = 0
let videoFrameCallbackId = 0
let stream: MediaStream | null = null
let frameCount = 0
let fpsTimer = 0
let feedbackTimer = 0
let blinkSnapshot: FaceGesture = 'Neutral'
let faceTracked = false

const blinkDetector = new BlinkDetector()
const gestureConfirmator = new GestureConfirmator()
const lookDownRemoveHold = new HoldCommandDetector()
const lookDownResetHold = new HoldCommandDetector()
const openMouthSpeakHold = new HoldCommandDetector()

const gestureGuide = computed(() =>
  FACE_GESTURES.map((name) => ({
    name,
    phrase: GESTURE_SPEECH[name],
    command:
      name === GESTURE_COMMANDS.lookDown
        ? 'Hold 3s → remove last · hold 5s → reset'
        : name === GESTURE_COMMANDS.speakSequence
          ? 'Hold 3s → speak · or blink to add'
          : null,
  })),
)

function scrollSequenceToEnd() {
  void nextTick(() => {
    const el = sequenceScrollRef.value
    if (!el) return
    el.scrollLeft = el.scrollWidth
  })
}

function showFeedback(message: string) {
  actionFeedback.value = message
  window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => {
    actionFeedback.value = ''
  }, 2200)
}

/** Map vertical wheel movement to horizontal scroll on the sequence strip. */
function onSequenceWheel(event: WheelEvent) {
  const el = sequenceScrollRef.value
  if (!el || el.scrollWidth <= el.clientWidth) return

  const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX
  if (delta === 0) return

  event.preventDefault()
  el.scrollLeft += delta
}

function resetTrackingState() {
  gesture.value = 'Neutral'
  blinkSnapshot = 'Neutral'
  faceTracked = false
  blinkDetector.reset()
  gestureConfirmator.reset()
  lookDownRemoveHold.reset()
  lookDownResetHold.reset()
  openMouthSpeakHold.reset()
}

function appendToSequence(name: FaceGesture) {
  if (name === 'Neutral') return
  gestureSequence.value = [...gestureSequence.value, name]
  showFeedback(`Added ${name}`)
  scrollSequenceToEnd()
}

function removeLastFromSequence() {
  if (gestureSequence.value.length === 0) {
    showFeedback('Sequence is empty')
    return
  }
  gestureSequence.value = gestureSequence.value.slice(0, -1)
  showFeedback('Removed last gesture')
}

function resetSequence() {
  gestureSequence.value = []
  showFeedback('Sequence reset')
}

function speakSequence() {
  if (gestureSequence.value.length === 0) {
    showFeedback('Nothing to speak')
    return
  }
  if (!('speechSynthesis' in window)) return

  const text = gestureSequence.value.map((name) => GESTURE_SPEECH[name]).join('. ')
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1.05
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
  showFeedback(`Speaking ${gestureSequence.value.length} gesture${gestureSequence.value.length === 1 ? '' : 's'}`)
}

function handleSequenceInput(
  confirmed: FaceGesture,
  blendshapes: ReturnType<typeof blendshapesToMap>,
  now: number,
) {
  if (
    openMouthSpeakHold.update(
      confirmed,
      GESTURE_COMMANDS.speakSequence,
      OPENMOUTH_SPEAK_MS,
      now,
    )
  ) {
    speakSequence()
    return
  }

  if (
    lookDownResetHold.update(
      confirmed,
      GESTURE_COMMANDS.lookDown,
      LOOKDOWN_RESET_MS,
      now,
    )
  ) {
    resetSequence()
    return
  }

  if (
    lookDownRemoveHold.update(
      confirmed,
      GESTURE_COMMANDS.lookDown,
      LOOKDOWN_CONFIRM_MS,
      now,
    )
  ) {
    removeLastFromSequence()
  }

  blinkDetector.update(blendshapes, now, {
    onCloseStart: () => {
      blinkSnapshot = confirmed
    },
    onBlink: () => {
      if (blinkSnapshot === 'Neutral') return
      if (gestureConfirmator.getHoldMs(now) < BLINK_HOLD_MS) {
        showFeedback('Hold the gesture for 0.5s, then blink')
        return
      }
      if (blinkSnapshot !== gestureConfirmator.confirmedGesture) return
      appendToSequence(blinkSnapshot)
    },
  })
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  landmarks: { x: number; y: number }[],
) {
  ctx.strokeStyle = '#1d4ed8'
  ctx.lineWidth = 1.5
  ctx.fillStyle = 'rgba(29, 78, 216, 0.35)'

  const indices = [1, 33, 133, 263, 362, 61, 291, 13, 14, 70, 300, 152, 10]
  for (const index of indices) {
    const point = landmarks[index]
    if (!point) continue
    const x = point.x * width
    const y = point.y * height
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(29, 78, 216, 0.5)'
  ctx.beginPath()
  ctx.moveTo(landmarks[33].x * width, landmarks[33].y * height)
  ctx.lineTo(landmarks[263].x * width, landmarks[263].y * height)
  ctx.stroke()
}

async function initDemo() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    )

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    })

    const video = videoRef.value
    if (!video) throw new Error('Video element not available')

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    })
    video.srcObject = stream
    video.setAttribute('playsinline', 'true')
    await video.play()

    await new Promise<void>((resolve) => {
      const check = () => {
        if (video.videoWidth > 0 && video.readyState >= 2) resolve()
        else requestAnimationFrame(check)
      }
      check()
    })

    status.value = 'ready'
    fpsTimer = performance.now()
    scheduleNextFrame()
  } catch (error) {
    status.value = 'error'
    errorMessage.value =
      error instanceof Error ? error.message : 'Unable to start the webcam demo.'
  }
}

function scheduleNextFrame() {
  const video = videoRef.value
  if (!video) return

  if ('requestVideoFrameCallback' in video) {
    videoFrameCallbackId = video.requestVideoFrameCallback(processFrame)
  } else {
    animationId = requestAnimationFrame(processFrame)
  }
}

function processFrame(now: number) {
  const video = videoRef.value
  const canvas = canvasRef.value

  if (!video || !canvas || !faceLandmarker || video.readyState < 2) {
    scheduleNextFrame()
    return
  }

  const width = video.videoWidth
  const height = video.videoHeight
  if (width === 0 || height === 0) {
    scheduleNextFrame()
    return
  }

  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    scheduleNextFrame()
    return
  }

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.scale(-1, 1)
  ctx.drawImage(video, -width, 0, width, height)
  ctx.restore()

  const result = faceLandmarker.detect(canvas)
  if (result.faceLandmarks.length > 0) {
    faceTracked = true
    const landmarks = result.faceLandmarks[0]
    drawOverlay(ctx, width, height, landmarks)

    const blendshapes = blendshapesToMap(result.faceBlendshapes[0]?.categories)
    const transformMatrix = result.facialTransformationMatrixes[0]
    const raw = classifyFaceGesture(landmarks, blendshapes, transformMatrix)
    const confirmed = gestureConfirmator.update(raw, now, GESTURE_CONFIRM_MS)

    gesture.value = confirmed
    handleSequenceInput(confirmed, blendshapes, now)
  } else if (faceTracked) {
    resetTrackingState()
  } else {
    gesture.value = 'Neutral'
  }

  frameCount += 1
  if (now - fpsTimer >= 1000) {
    fps.value = Math.round((frameCount * 1000) / (now - fpsTimer))
    frameCount = 0
    fpsTimer = now
  }

  scheduleNextFrame()
}

function stopDemo() {
  const video = videoRef.value
  if (video && 'cancelVideoFrameCallback' in video) {
    video.cancelVideoFrameCallback(videoFrameCallbackId)
  }
  cancelAnimationFrame(animationId)
  window.clearTimeout(feedbackTimer)
  resetGestureCalibration()
  resetTrackingState()
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
  faceLandmarker?.close()
  faceLandmarker = null
  window.speechSynthesis?.cancel()
}

onMounted(() => {
  void initDemo()
})

onUnmounted(() => {
  stopDemo()
})
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-surface/90 backdrop-blur-md">
      <div
        class="page-container flex flex-wrap items-center justify-between gap-3 py-3"
      >
        <RouterLink
          to="/"
          class="text-sm font-semibold text-ink no-underline hover:text-accent"
        >
          ← Back to resume
        </RouterLink>
        <p class="text-sm text-muted">ELEC 490 capstone · live browser demo</p>
      </div>
    </header>

    <main class="page-container section-pad">
      <p class="section-label">Capstone project</p>
      <h1 class="section-title">Facial Gesture Recognition</h1>
      <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate sm:text-base">
        Build a phrase by holding a gesture for 0.5 seconds (until it confirms), then
        blinking to add it. Tilt your head left/right/up/down for direction
        gestures. Hold head down 3 seconds to remove the last entry; hold head down 5 seconds to
        reset. Hold an open mouth for 3 seconds to speak the sequence. LookDown and OpenMouth
        can also be added to the sequence with blink like any other gesture.
      </p>

      <div class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section class="card overflow-hidden">
          <div class="relative aspect-[4/3] bg-ink">
            <video
              ref="video"
              class="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.01]"
              autoplay
              playsinline
              muted
              aria-hidden="true"
            />
            <canvas
              ref="canvas"
              class="pointer-events-none absolute inset-0 h-full w-full object-cover"
              aria-label="Live webcam feed with face landmark overlay"
            />

            <div class="pointer-events-none absolute inset-0 z-20">
            <div
              v-if="status === 'loading'"
              class="absolute inset-0 flex items-center justify-center bg-ink/80 px-6 text-center text-sm text-white"
            >
              Loading MediaPipe model and requesting camera access…
            </div>

            <div
              v-else-if="status === 'error'"
              class="absolute inset-0 flex items-center justify-center bg-ink/85 px-6 text-center text-sm text-white"
            >
              {{ errorMessage }}
            </div>

            <div
              class="absolute left-3 top-3 rounded-md bg-ink/70 px-2.5 py-1 text-xs font-medium text-white"
            >
              {{ fps }} FPS
            </div>

            <div
              class="absolute right-3 top-3 max-w-[min(14rem,45%)] rounded-lg bg-ink/75 px-3 py-2 text-right text-white"
            >
              <p class="text-[10px] uppercase tracking-wide text-white/70">
                Current gesture
              </p>
              <p class="text-lg font-semibold leading-tight">{{ gesture }}</p>
              <p class="mt-0.5 text-xs text-white/80">
                {{ GESTURE_SPEECH[gesture] }}
              </p>
              <p v-if="actionFeedback" class="mt-1.5 text-xs text-blue-200">
                {{ actionFeedback }}
              </p>
            </div>

            <div
              class="pointer-events-auto absolute bottom-0 left-0 right-0 border-t border-white/10 bg-ink/80 px-3 py-2.5 text-white"
              @wheel="onSequenceWheel"
            >
              <p class="text-[10px] uppercase tracking-wide text-white/70">
                Gesture sequence
              </p>
              <div
                v-if="gestureSequence.length > 0"
                ref="sequenceScroll"
                class="sequence-scroll mt-1.5 flex flex-nowrap gap-2 overflow-x-auto pb-0.5"
                aria-label="Built gesture sequence"
              >
                <span
                  v-for="(name, index) in gestureSequence"
                  :key="`${name}-${index}`"
                  class="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs"
                >
                  <span
                    class="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white"
                  >
                    {{ index + 1 }}
                  </span>
                  <span class="font-medium">{{ name }}</span>
                </span>
              </div>
              <p v-else class="mt-1 text-xs text-white/60">
                No gestures queued — hold a gesture 0.5s, then blink to add
              </p>
            </div>
            </div>
          </div>
        </section>

        <aside class="flex flex-col gap-5">
          <section class="card-soft p-5">
            <h2 class="text-base font-semibold text-ink">How to build a sequence</h2>
            <p class="mt-2 text-sm leading-relaxed text-slate">
              Hold a gesture for <strong>0.5 seconds</strong> until it confirms, then
              <strong>blink</strong> to append it (including LookDown and OpenMouth). Neutral
              is never added. Your sequence appears on the bottom of the camera feed.
            </p>
          </section>

          <section class="card-soft p-5">
            <h2 class="text-base font-semibold text-ink">Controls</h2>
            <ul class="mt-3 space-y-2 text-sm text-slate">
              <li class="rounded-md border border-line px-3 py-2">
                <span class="font-medium text-ink">Blink</span>
                <span class="mt-1 block text-xs text-muted">
                  After a gesture is confirmed (0.5s hold), close eyes for 0.5s then reopen to add it
                </span>
              </li>
              <li class="rounded-md border border-accent/30 bg-accent-soft px-3 py-2">
                <span class="font-medium text-accent">LookDown (hold 3s)</span>
                <span class="mt-1 block text-xs text-muted">
                  Remove the last gesture, or blink before 3s to add LookDown instead
                </span>
              </li>
              <li class="rounded-md border border-accent/30 bg-accent-soft px-3 py-2">
                <span class="font-medium text-accent">LookDown (hold 5s)</span>
                <span class="mt-1 block text-xs text-muted">
                  Clear the entire gesture sequence
                </span>
              </li>
              <li class="rounded-md border border-accent/30 bg-accent-soft px-3 py-2">
                <span class="font-medium text-accent">OpenMouth (hold 3s)</span>
                <span class="mt-1 block text-xs text-muted">
                  Speak the queued sequence, or blink before 3s to add OpenMouth instead
                </span>
              </li>
            </ul>
          </section>

          <section class="card-soft p-5">
            <h2 class="text-base font-semibold text-ink">Gesture classes</h2>
            <ul class="mt-3 space-y-2">
              <li
                v-for="item in gestureGuide"
                :key="item.name"
                class="flex flex-col gap-0.5 rounded-md border border-line px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                :class="
                  item.name === gesture
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'text-slate'
                "
              >
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-xs text-muted">{{ item.phrase }}</span>
                <span v-if="item.command" class="text-xs font-medium text-accent sm:ml-2">
                  {{ item.command }}
                </span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  </div>
</template>
