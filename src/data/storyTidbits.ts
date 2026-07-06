export interface StoryTidbit {
  label: string
  body: string
}

/** Static engineering tidbits tied to resume themes — slide 2 pool. */
export const storyTidbits: StoryTidbit[] = [
  {
    label: 'From the field',
    body: 'At Sensofusion I cut streamed notification payload volume by 70% through structural backend changes—same operator UX, far less bandwidth on congested field networks.',
  },
  {
    label: 'Embedded insight',
    body: 'On Ericsson Cloud RAN co-op I configured embedded Linux startup for single-core radio equipment, coordinating legacy interfaces with new messaging modules under tight CPU budgets.',
  },
  {
    label: 'Full-stack pattern',
    body: 'Şandin Tech runs Next.js + Express + MongoDB with modular REST APIs and containerized CI—JWT auth, geolocation filters, and trust-based ratings all share one typed contract layer.',
  },
  {
    label: 'Vision pipeline',
    body: 'My capstone gesture demo held 20+ fps live inference by batching MediaPipe landmarks and debouncing gesture state—blink-to-confirm prevents accidental triggers better than raw classifiers alone.',
  },
  {
    label: 'Cloud deploy',
    body: 'Production workloads on AWS ECS and EKS taught me that health-check grace periods matter as much as Dockerfile size—rolling deploys fail silently when probes fire before the BFF warms its connection pools.',
  },
  {
    label: 'Test discipline',
    body: 'Rebuilding Playwright E2E at Sensofusion meant flaky tests were product bugs: every retry hid a race between Redux hydration and WebSocket subscribe. Fixing the suite fixed operator-facing reliability.',
  },
  {
    label: 'Geospatial UX',
    body: 'D3 + Leaflet + Mapbox in C2 dashboards: keep heavy layout off the main thread, stream deltas not full state, and tile-cache aggressively—operators pan maps during incidents, not during demos.',
  },
  {
    label: 'Hardware meets software',
    body: 'Queen\'s AutoDrive taught me ROS integration is 10% model accuracy and 90% timestamp alignment—point-cloud segmentation only matters if your lidar frames and odometry share a clock.',
  },
  {
    label: 'Home lab',
    body: 'My Raspberry Pi Home Assistant hub is a living embedded project: VLAN-segmented IoT, MQTT automations, and the same TCP/IP debugging mindset I use on production BFF services.',
  },
  {
    label: 'ML in production',
    body: 'Deepfake detection and emotion CNNs both hit accuracy walls on domain shift—normalizing lighting in OpenCV pipelines bought more lift than swapping architectures without rebalancing training data.',
  },
]

/** Deterministic index from YYYY-MM-DD date string. */
function dateSeed(date: string): number {
  let hash = 0
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0
  }
  return hash
}

export function pickTidbitForDate(date: string): StoryTidbit {
  const index = dateSeed(date) % storyTidbits.length
  return storyTidbits[index]!
}
