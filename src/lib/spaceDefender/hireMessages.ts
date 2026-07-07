import { resume } from '../../data/resume'

export const HIRE_TOAST_FIRST_DELAY_MS = 18_000
export const HIRE_TOAST_INTERVAL_MS = 22_000

export interface HireMessage {
  id: string
  text: string
  ctaLabel?: string
  ctaHref?: string
}

export const introHireMessage: HireMessage = {
  id: 'intro',
  text: 'Planet Hoz is under attack! Defend it from rejection emails and ghosts. Save the planet with an offer.',
}

export const hireToasts: HireMessage[] = [
  {
    id: 'rejections',
    text: 'Shoot down those rejection emails before they reach Planet Hoz!',
    ctaLabel: 'Email me',
    ctaHref: `mailto:${resume.contact.email}`,
  },
  {
    id: 'ghosts',
    text: 'Ghosts of past applications haunt the orbit. Defend the planet!',
    ctaLabel: 'LinkedIn',
    ctaHref: resume.contact.linkedin,
  },
  {
    id: 'fullstack',
    text: 'Need a full-stack engineer who ships production systems?',
    ctaLabel: 'Email me',
    ctaHref: `mailto:${resume.contact.email}`,
  },
  {
    id: 'embedded',
    text: 'Embedded Linux, cloud, and web. I integrate hardware and software end to end.',
    ctaLabel: 'LinkedIn',
    ctaHref: resume.contact.linkedin,
  },
  {
    id: 'aws',
    text: 'AWS deployments, CI/CD, and operator-facing dashboards. Let’s talk.',
    ctaLabel: 'Email me',
    ctaHref: `mailto:${resume.contact.email}`,
  },
  {
    id: 'founder',
    text: 'Founder of Şandin Tech. I build products from architecture through launch.',
    ctaLabel: 'View GitHub',
    ctaHref: resume.contact.github,
  },
  {
    id: 'ottawa',
    text: 'Based in Ottawa. Open to remote and on-site opportunities.',
    ctaLabel: 'Download resume',
    ctaHref: resume.resumePdf,
  },
]

export interface GameOverCta {
  label: string
  href: string
  primary?: boolean
  external?: boolean
  download?: boolean
}

export const gameOverCtas: GameOverCta[] = [
  {
    label: 'Email me',
    href: `mailto:${resume.contact.email}`,
    primary: true,
  },
  {
    label: 'LinkedIn',
    href: resume.contact.linkedin,
    external: true,
  },
  {
    label: 'Download resume',
    href: resume.resumePdf,
    download: true,
    external: true,
  },
]

export function getIntroHireMessage(): HireMessage {
  return introHireMessage
}

export function getNextHireToast(index: number): HireMessage {
  return hireToasts[index % hireToasts.length]!
}

export function getGameOverHeadline(score: number, wave: number, rank: number | null): string {
  if (rank !== null && rank <= 3) {
    return `Top ${rank} defender! Score ${score}, Wave ${wave}`
  }
  if (score >= 2000) {
    return `Elite defender! Score ${score}, Wave ${wave}`
  }
  return `Mission ended. Score ${score}, Wave ${wave}`
}
