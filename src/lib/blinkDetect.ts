import type { FaceGesture } from './faceGestures'
import type { BlendshapeScores } from './headPose'

export interface BlinkCallbacks {
  onCloseStart?: () => void
  onBlink?: () => void
}

/** Minimum time eyes must stay closed before a reopen counts as a blink command. */
export const BLINK_CLOSE_HOLD_MS = 500

/** Detects a completed eye blink from MediaPipe blink blendshapes. */
export class BlinkDetector {
  private eyesClosed = false
  private closedSince: number | null = null
  private closeConfirmed = false
  private cooldownUntil = 0
  private readonly closeHoldMs: number

  constructor(closeHoldMs = BLINK_CLOSE_HOLD_MS) {
    this.closeHoldMs = closeHoldMs
  }

  update(
    blendshapes: BlendshapeScores,
    now: number,
    callbacks: BlinkCallbacks = {},
  ): void {
    const left = blendshapes.eyeBlinkLeft ?? 0
    const right = blendshapes.eyeBlinkRight ?? 0
    const closed = left > 0.55 && right > 0.55

    if (now < this.cooldownUntil) {
      if (!closed) {
        this.eyesClosed = false
        this.closedSince = null
        this.closeConfirmed = false
      }
      return
    }

    if (closed) {
      if (!this.eyesClosed) {
        this.eyesClosed = true
        this.closedSince = now
        this.closeConfirmed = false
      } else if (
        !this.closeConfirmed &&
        this.closedSince !== null &&
        now - this.closedSince >= this.closeHoldMs
      ) {
        this.closeConfirmed = true
        callbacks.onCloseStart?.()
      }
    } else if (this.eyesClosed) {
      if (this.closeConfirmed) {
        this.cooldownUntil = now + 450
        callbacks.onBlink?.()
      }
      this.eyesClosed = false
      this.closedSince = null
      this.closeConfirmed = false
    }
  }

  get isEyesClosed(): boolean {
    return this.eyesClosed
  }

  reset(): void {
    this.eyesClosed = false
    this.closedSince = null
    this.closeConfirmed = false
    this.cooldownUntil = 0
  }
}

/** Fires once after a gesture is held continuously for `holdMs`. */
export class HoldCommandDetector {
  private holdStart: number | null = null
  private fired = false

  update(gesture: FaceGesture, command: FaceGesture, holdMs: number, now: number): boolean {
    if (gesture === command) {
      if (this.holdStart === null) this.holdStart = now
      if (!this.fired && now - this.holdStart >= holdMs) {
        this.fired = true
        return true
      }
    } else {
      this.reset()
    }
    return false
  }

  get isHolding(): boolean {
    return this.holdStart !== null && !this.fired
  }

  reset(): void {
    this.holdStart = null
    this.fired = false
  }
}

/** Delays gesture changes until the same input is held for `confirmMs`. */
export class GestureConfirmator {
  private confirmed: FaceGesture = 'Neutral'
  private pending: FaceGesture = 'Neutral'
  private pendingSince = 0

  update(incoming: FaceGesture, now: number, confirmMs: number): FaceGesture {
    if (incoming !== this.pending) {
      this.pending = incoming
      this.pendingSince = now
    }

    if (now - this.pendingSince >= confirmMs) {
      this.confirmed = this.pending
    }

    return this.confirmed
  }

  get confirmedGesture(): FaceGesture {
    return this.confirmed
  }

  /** Milliseconds the pending gesture has been held continuously. */
  getHoldMs(now: number): number {
    return this.pendingSince > 0 ? now - this.pendingSince : 0
  }

  reset(): void {
    this.confirmed = 'Neutral'
    this.pending = 'Neutral'
    this.pendingSince = 0
  }
}
