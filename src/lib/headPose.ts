export interface HeadPose {
  pitch: number
  yaw: number
  roll: number
}

export interface FaceTransformMatrix {
  data: number[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Extract head pitch/yaw/roll (degrees) from MediaPipe's 4×4 face pose matrix. */
export function extractHeadPose(matrix: FaceTransformMatrix | undefined): HeadPose {
  const m = matrix?.data
  if (!m || m.length < 16) {
    return { pitch: 0, yaw: 0, roll: 0 }
  }

  const r = (row: number, col: number) => m[row * 4 + col]
  const pitch = Math.asin(clamp(-r(2, 1), -1, 1))
  const yaw = Math.atan2(r(2, 0), r(2, 2))
  const roll = Math.atan2(r(0, 1), r(1, 1))
  const toDeg = 180 / Math.PI

  return {
    pitch: pitch * toDeg,
    yaw: yaw * toDeg,
    roll: roll * toDeg,
  }
}

/** True when the face is turned far enough that gaze labels become unreliable. */
export function isExtremeHeadPose(pose: HeadPose): boolean {
  return Math.abs(pose.yaw) > 38 || Math.abs(pose.pitch) > 32 || Math.abs(pose.roll) > 25
}

/**
 * Slowly learn a neutral expression baseline so thresholds adapt to camera placement.
 */
export class PoseCalibrator {
  private baseline: BlendshapeScores = {}
  private poseBaseline: HeadPose = { pitch: 0, yaw: 0, roll: 0 }
  private ready = false
  private readonly alpha = 0.04

  reset(): void {
    this.baseline = {}
    this.poseBaseline = { pitch: 0, yaw: 0, roll: 0 }
    this.ready = false
  }

  update(blendshapes: BlendshapeScores, pose: HeadPose, isNeutralFrame: boolean): void {
    if (
      !isNeutralFrame ||
      isExtremeHeadPose(pose) ||
      Math.abs(pose.yaw) > 22 ||
      Math.abs(pose.pitch) > 22
    ) {
      return
    }

    if (!this.ready) {
      this.baseline = { ...blendshapes }
      this.poseBaseline = { ...pose }
      this.ready = true
      return
    }

    for (const [key, value] of Object.entries(blendshapes)) {
      this.baseline[key] = (1 - this.alpha) * (this.baseline[key] ?? value) + this.alpha * value
    }
    this.poseBaseline = {
      pitch: (1 - this.alpha) * this.poseBaseline.pitch + this.alpha * pose.pitch,
      yaw: (1 - this.alpha) * this.poseBaseline.yaw + this.alpha * pose.yaw,
      roll: (1 - this.alpha) * this.poseBaseline.roll + this.alpha * pose.roll,
    }
  }

  relative(name: string, value: number): number {
    if (!this.ready) return value
    return Math.max(0, value - (this.baseline[name] ?? 0))
  }

  get isReady(): boolean {
    return this.ready
  }

  /** Head pose relative to the learned neutral baseline (degrees). */
  relativePose(pose: HeadPose): HeadPose {
    if (!this.ready) {
      return { pitch: 0, yaw: 0, roll: 0 }
    }
    return {
      pitch: pose.pitch - this.poseBaseline.pitch,
      yaw: pose.yaw - this.poseBaseline.yaw,
      roll: pose.roll - this.poseBaseline.roll,
    }
  }
}

export type BlendshapeScores = Record<string, number>

/** Remove head-pose bias from gaze blendshapes using calibrated neutral pose. */
export function poseCompensatedGaze(
  blendshapes: BlendshapeScores,
  pose: HeadPose,
  calibrator: PoseCalibrator,
): {
  lookUpBlend: number
  lookDown: number
  gazeLeft: number
  gazeRight: number
  yawMargin: number
} {
  const rel = (name: string) => calibrator.relative(name, blendshapes[name] ?? 0)

  const lookUpLeft = rel('eyeLookUpLeft')
  const lookUpRight = rel('eyeLookUpRight')
  const lookDownLeft = rel('eyeLookDownLeft')
  const lookDownRight = rel('eyeLookDownRight')
  const gazeInLeft = rel('eyeLookInLeft')
  const gazeOutLeft = rel('eyeLookOutLeft')
  const gazeInRight = rel('eyeLookInRight')
  const gazeOutRight = rel('eyeLookOutRight')

  let lookUpBlend = Math.max(lookUpLeft, lookUpRight)
  const lookDown = Math.max(lookDownLeft, lookDownRight)

  // Mirrored webcam pairing for horizontal gaze.
  let gazeLeft = (gazeInLeft + gazeOutRight) / 2
  let gazeRight = (gazeOutLeft + gazeInRight) / 2

  // Head pitch adds false upward eye signal when the camera is below face level.
  const pitchBias = Math.max(0, pose.pitch - 6) * 0.011
  lookUpBlend = Math.max(0, lookUpBlend - pitchBias)

  // Head yaw shifts apparent horizontal gaze — require stronger signal when turned.
  const yawMargin = Math.abs(pose.yaw) * 0.007
  const yawShift = pose.yaw * 0.009
  gazeLeft = Math.max(0, gazeLeft - Math.max(0, yawShift))
  gazeRight = Math.max(0, gazeRight + Math.min(0, yawShift))

  return { lookUpBlend, lookDown, gazeLeft, gazeRight, yawMargin }
}
