import {
  PoseCalibrator,
  extractHeadPose,
  type FaceTransformMatrix,
  type HeadPose,
} from './headPose'

/** Capstone gesture set plus look down for sequence controls. */
export const FACE_GESTURES = [
  'LookLeft',
  'LookRight',
  'LookUp',
  'LookDown',
  'Neutral',
  'RaiseEyebrows',
  'Smile',
  'OpenMouth',
] as const

export type FaceGesture = (typeof FACE_GESTURES)[number]

/** Custom speech dictionary — maps detected gestures to spoken phrases. */
export const GESTURE_SPEECH: Record<FaceGesture, string> = {
  LookLeft: 'Looking left',
  LookRight: 'Looking right',
  LookUp: 'Looking up',
  LookDown: 'Looking down',
  Neutral: 'Neutral face',
  RaiseEyebrows: 'Eyebrows raised',
  Smile: 'Smile detected',
  OpenMouth: 'Mouth open',
}

export const GESTURE_COMMANDS = {
  lookDown: 'LookDown',
  speakSequence: 'OpenMouth',
} as const satisfies Record<string, FaceGesture>

/** Minimum head tilt from neutral baseline to register a direction (degrees). */
export const HEAD_TILT_THRESHOLD_DEG = 12

export type BlendshapeScores = Record<string, number>

type Landmark = { x: number; y: number; z?: number }

const calibrator = new PoseCalibrator()

export function resetGestureCalibration(): void {
  calibrator.reset()
}

export function blendshapesToMap(
  categories: Array<{ categoryName?: string; score?: number }> | undefined,
): BlendshapeScores {
  const map: BlendshapeScores = {}
  if (!categories) return map
  for (const category of categories) {
    if (category.categoryName) {
      map[category.categoryName] = category.score ?? 0
    }
  }
  return map
}

function score(map: BlendshapeScores, name: string): number {
  return map[name] ?? 0
}

/** Classify head-tilt direction relative to calibrated neutral pose. */
export function classifyHeadTilt(relativePose: HeadPose): FaceGesture | null {
  // Mirrored webcam feed — negate yaw so labels match the user's left/right.
  const yaw = -relativePose.yaw
  const pitch = relativePose.pitch
  const absYaw = Math.abs(yaw)
  const absPitch = Math.abs(pitch)

  if (absYaw < HEAD_TILT_THRESHOLD_DEG && absPitch < HEAD_TILT_THRESHOLD_DEG) {
    return null
  }

  if (absPitch >= absYaw) {
    if (pitch > HEAD_TILT_THRESHOLD_DEG) return 'LookDown'
    if (pitch < -HEAD_TILT_THRESHOLD_DEG) return 'LookUp'
  } else {
    if (yaw > HEAD_TILT_THRESHOLD_DEG) return 'LookLeft'
    if (yaw < -HEAD_TILT_THRESHOLD_DEG) return 'LookRight'
  }

  return null
}

/**
 * Classify gestures from MediaPipe blendshapes and head pose.
 * Direction gestures use head tilt, not eye gaze.
 */
export function classifyFromBlendshapes(
  blendshapes: BlendshapeScores,
  landmarks?: Landmark[],
  transformMatrix?: FaceTransformMatrix,
): FaceGesture {
  void landmarks

  const pose = extractHeadPose(transformMatrix)
  const relativePose = calibrator.relativePose(pose)
  const jawOpen = calibrator.relative('jawOpen', score(blendshapes, 'jawOpen'))
  const smile =
    (calibrator.relative('mouthSmileLeft', score(blendshapes, 'mouthSmileLeft')) +
      calibrator.relative('mouthSmileRight', score(blendshapes, 'mouthSmileRight'))) /
    2
  const browInner = calibrator.relative('browInnerUp', score(blendshapes, 'browInnerUp'))
  const browInnerRaw = score(blendshapes, 'browInnerUp')
  const browOuter =
    (calibrator.relative('browOuterUpLeft', score(blendshapes, 'browOuterUpLeft')) +
      calibrator.relative('browOuterUpRight', score(blendshapes, 'browOuterUpRight'))) /
    2
  const brows = (browInner + browOuter) / 2

  if (jawOpen > 0.35) {
    calibrator.update(blendshapes, pose, false)
    return 'OpenMouth'
  }
  if (smile > 0.4 && jawOpen < 0.28) {
    calibrator.update(blendshapes, pose, false)
    return 'Smile'
  }

  let gesture: FaceGesture = 'Neutral'

  const headTilt = classifyHeadTilt(relativePose)
  if (headTilt) {
    gesture = headTilt
  } else {
    const raisedBrows =
      jawOpen < 0.32 &&
      smile < 0.45 &&
      (browInner > 0.12 || brows > 0.14 || browInnerRaw > 0.32)

    if (raisedBrows) {
      gesture = 'RaiseEyebrows'
    }
  }

  calibrator.update(blendshapes, pose, gesture === 'Neutral')
  return gesture
}

/** Fallback when blendshapes are unavailable. */
export function classifyFaceGesture(
  landmarks: Landmark[],
  blendshapes?: BlendshapeScores,
  transformMatrix?: FaceTransformMatrix,
): FaceGesture {
  if (blendshapes && Object.keys(blendshapes).length > 0) {
    return classifyFromBlendshapes(blendshapes, landmarks, transformMatrix)
  }

  const jawOpen = distance(landmarks[13], landmarks[14])
  const faceWidth = distance(landmarks[33], landmarks[263])
  if (faceWidth < 1e-6) return 'Neutral'

  const mouthAspect = jawOpen / faceWidth
  if (mouthAspect > 0.1) return 'OpenMouth'

  return 'Neutral'
}

function distance(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Majority vote over recent raw classifications. */
export function smoothGesture(history: FaceGesture[], windowSize = 3): FaceGesture {
  if (history.length === 0) return 'Neutral'

  const window = history.slice(-windowSize)
  const counts = new Map<FaceGesture, number>()
  for (const gesture of window) {
    counts.set(gesture, (counts.get(gesture) ?? 0) + 1)
  }

  let winner: FaceGesture = window[window.length - 1]
  let max = 0
  for (const [gesture, count] of counts) {
    if (count > max) {
      max = count
      winner = gesture
    }
  }
  return winner
}

export { extractHeadPose, type HeadPose }
