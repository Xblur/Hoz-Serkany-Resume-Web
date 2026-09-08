export interface StoryTidbit {
  label: string
  body: string
}

/** Static engineering tidbits tied to resume themes. */
export const storyTidbits: StoryTidbit[] = [
  {
    label: 'Secure product delivery',
    body: 'Languages of Life combines Flutter with Supabase RLS, lifecycle RPCs, and two-session race tests so authorization and assignment state remain correct under concurrent use.',
  },
  {
    label: 'C++ simulation',
    body: 'MNPS uses C++17, CMake, and CTest to turn membrane process models into repeatable multistage simulations, with a stable C ABI for CAPE-OPEN host integration.',
  },
  {
    label: 'From the field',
    body: 'At Sensofusion I reduced streamed payload volume by 70% for duplicated notifications through structural backend changes, while also supporting field deployments and operator workflows.',
  },
  {
    label: 'Embedded insight',
    body: 'On Ericsson Cloud RAN co-op I configured embedded Linux startup, integrated legacy interfaces with new messaging modules, and removed extra threads so the software could run on one processor core.',
  },
  {
    label: 'Full-stack pattern',
    body: 'Şandin Tech uses Next.js, Express, and MongoDB with modular REST APIs and containerized environments. The product includes JWT authentication, geolocation filtering, user verification, and trust-based ratings.',
  },
  {
    label: 'Cloud deploy',
    body: 'At Sensofusion I deployed production workloads across AWS ECS, EKS, Lambda, and S3, and configured Cloudflare for secure routing and edge delivery.',
  },
  {
    label: 'Test discipline',
    body: 'At Sensofusion I rebuilt and validated the Playwright end-to-end suite and expanded Vitest and Storybook coverage to improve CI reliability and regression protection.',
  },
  {
    label: 'Geospatial UX',
    body: 'At Sensofusion I built operator-facing geospatial views and custom map-tile generation with D3.js, Leaflet, Mapbox, and WebGL using sensor and operational data.',
  },
  {
    label: 'Home lab',
    body: 'My Raspberry Pi Home Assistant hub includes Raspberry Pi OS setup, networking, sensor and device integrations, automations, and ongoing administration.',
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
