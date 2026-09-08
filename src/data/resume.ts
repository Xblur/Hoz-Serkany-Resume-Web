export interface NavLink {
  id: string
  label: string
}

export interface ContactInfo {
  email: string
  linkedin: string
  github: string
  location: string
}

export interface ExperienceRole {
  company: string
  title: string
  period: string
  bullets: string[]
}

export interface Project {
  name: string
  track: 'Full-Stack Product' | 'C++ / Systems'
  outcome: string
  description: string
  highlights: string[]
  tech: string[]
  url?: string
  demoUrl?: string
}

export interface ResumeLink {
  label: string
  shortLabel: string
  href: string
  downloadName: string
}

export interface Outcome {
  value: string
  label: string
  detail: string
}

export interface SkillGroup {
  category: string
  items: string[]
}

export interface Education {
  degree: string
  program: string
  school: string
  period: string
  courses: string[]
  award: string
  publication: {
    title: string
    publisher: string
    date: string
    summary: string
    url: string
  }
  volunteer: {
    org: string
    role: string
    period: string
    description: string
    tech: string[]
  }
}

export interface Resume {
  name: string
  title: string
  summary: string
  photo: string
  photoAlt: string
  resumes: ResumeLink[]
  outcomes: Outcome[]
  contact: ContactInfo
  nav: NavLink[]
  experience: ExperienceRole[]
  projects: Project[]
  skills: SkillGroup[]
  education: Education
}

export const resume: Resume = {
  name: 'Hoz Serkany',
  title: 'Full-Stack Product + C++ Systems Engineer',
  photo: `${import.meta.env.BASE_URL}hoz-serkany.png`,
  photoAlt: 'Portrait of Hoz Serkany',
  resumes: [
    {
      label: 'Full-Stack Product resume',
      shortLabel: 'Full-Stack resume',
      href: `${import.meta.env.BASE_URL}Hoz-Serkany-Full-Stack-Product-Resume.pdf`,
      downloadName: 'Hoz-Serkany-Full-Stack-Product-Resume.pdf',
    },
    {
      label: 'Embedded/C++ Systems resume',
      shortLabel: 'C++ / Systems resume',
      href: `${import.meta.env.BASE_URL}Hoz-Serkany-Embedded-Cpp-Systems-Resume.pdf`,
      downloadName: 'Hoz-Serkany-Embedded-Cpp-Systems-Resume.pdf',
    },
  ],
  outcomes: [
    {
      value: '40+',
      label: 'database migrations',
      detail: 'Delivered for a secure Flutter and Supabase assignment platform.',
    },
    {
      value: '70%',
      label: 'less streamed payload',
      detail: 'Removed duplicate notification volume in a production sensor platform.',
    },
    {
      value: '30+',
      label: 'production defects fixed',
      detail: 'Improved operator workflows, reliability, and release confidence.',
    },
    {
      value: '1 core',
      label: 'embedded execution',
      detail: 'Optimized radio messaging software by removing unnecessary threads.',
    },
  ],
  summary:
    'Computer engineer delivering product software across two focused tracks: secure full-stack platforms built with Flutter, TypeScript, Node.js, and Postgres, plus C++ systems spanning simulation, embedded Linux, networking, and automated verification. I take work from architecture through tested releases, field deployment, and operational handoff.',
  contact: {
    email: 'hozserkany@gmail.com',
    linkedin: 'https://www.linkedin.com/in/hoz-s-71873550/',
    github: 'https://github.com/Xblur',
    location: 'Ottawa, Ontario, Canada',
  },
  nav: [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Case studies' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'contact', label: 'Contact' },
  ],
  experience: [
    {
      company: 'Languages of Life',
      title: 'Full-Stack Engineer (Contract)',
      period: 'June 2026 – Present',
      bullets: [
        'Rebuilt an early Next.js prototype as a cross-platform Flutter app for iOS, Android, and web while extending its Supabase backend.',
        'Delivered multi-role assignment workflows with Realtime updates and append-only audit history for clients, linguists, and admins.',
        'Enforced server-side authorization with Postgres grants, RLS, lifecycle RPCs, optimistic concurrency, and two-session race-condition tests.',
        'Shipped 40+ ordered migrations, Deno Edge Functions, GitHub Actions quality gates, Firebase staging, and production-readiness runbooks.',
      ],
    },
    {
      company: 'MNPS Inc.',
      title: 'Co-Founder & CTO',
      period: 'May 2026 – Present',
      bullets: [
        'Lead C++17 and CMake architecture for membrane process simulation, including segment-marching gas separation, multistage cascades with recycle, and plug-flow hollow-fibre models.',
        'Built multicomponent flowsheets, module geometry options, and CTest regression against literature and patent-aligned stream targets.',
        'Delivered CAPE-OPEN (COBIA) integration through a stable C ABI for industrial hosts such as Aspen Plus and HYSYS.',
      ],
    },
    {
      company: 'Sensofusion',
      title: 'Full-Stack Software Developer',
      period: 'September 2025 – February 2026',
      bullets: [
        'Fixed 30+ production bugs and shipped a mobile-view redesign, improving reliability and operator usability.',
        'Rebuilt and validated the Playwright end-to-end test suite, improving CI reliability and regression coverage.',
        'Deployed production workloads on AWS (ECS, EKS, Lambda, S3) and configured Cloudflare for secure routing and edge delivery.',
        'Built Next.js/Redux operator interfaces and Node.js services for sensor, telemetry, geospatial, mission, and video data, reducing duplicate notification payload volume by 70%.',
        'Supported on-site field deployments, customer demonstrations, and production ramp-up with hardware and software teams.',
      ],
    },
    {
      company: 'Şandin Tech Inc.',
      title: 'Founder / Director',
      period: 'January 2023 – Present',
      bullets: [
        'Lead Şandin Tech end to end: problem validation, product engineering, go-to-market, and startup operations for the Şand peer-to-peer delivery platform.',
        'Architect and maintain a Next.js/Express/MongoDB platform with modular REST APIs, containerized environments, and CI/CD-ready testing infrastructure.',
        'Build core product capabilities including JWT authentication, geolocation filtering, user verification, trust-based ratings, and video upload/streaming workflows.',
        'Built geospatial map views and server-side map tile generation using D3.js, Leaflet, Mapbox, and WebGL to support delivery discovery and workflow UI.',
      ],
    },
    {
      company: 'Ericsson',
      title: 'Cloud RAN Software Developer (Co-op)',
      period: 'May 2021 – April 2023',
      bullets: [
        'Developed a cloud-enabled messaging system for radio equipment running on embedded Linux.',
        'Coordinated integration of software modules with existing radio control systems and legacy interfaces.',
        'Configured embedded Linux startup and system initialization for radio equipment; optimized software to run on a single processor core.',
        'Created Jenkins CI/CD pipelines for automated module testing and wrote scripts to automate submodule testing post-merge.',
        'Completed an internal Ericsson object-oriented design patterns course in Java, building a radio management training project to apply OOP principles.',
        'Migrated legacy unit testing code from C to C++ and automated unit testing through designed test configurations.',
      ],
    },
  ],
  projects: [
    {
      name: 'Languages of Life Assignment Platform',
      track: 'Full-Stack Product',
      outcome: 'Secure multi-role product delivered through staging and production readiness',
      description:
        'Rebuilt an early web prototype into a cross-platform assignment product for clients, linguists, and admins, while hardening the backend for authorization, concurrency, compliance, and operations.',
      highlights: [
        '40+ ordered Postgres migrations and a feature-first Flutter client',
        'RLS, lifecycle RPCs, optimistic concurrency, and two-session race tests',
        'FCM and Twilio Edge Functions, CI quality gates, Firebase staging, and release runbooks',
      ],
      tech: ['Flutter', 'Dart', 'Supabase', 'PostgreSQL', 'RLS', 'Deno', 'GitHub Actions'],
    },
    {
      name: 'MNPS Membrane Process Simulator',
      track: 'C++ / Systems',
      outcome: 'Industrial simulation core with automated numerical regression',
      description:
        'Architecting a native process simulation product for membrane gas separation, from multicomponent numerical models through industrial simulator integration.',
      highlights: [
        'Segment-marching, multistage recycle, and plug-flow hollow-fibre models',
        'CTest regression against literature and patent-aligned stream targets',
        'CAPE-OPEN (COBIA) unit operation exposed through a stable C ABI',
      ],
      tech: ['C++17', 'CMake', 'CTest', 'C ABI', 'CAPE-OPEN', 'Numerical simulation'],
    },
    {
      name: 'Sensor Command-and-Control Platform',
      track: 'Full-Stack Product',
      outcome: '70% payload reduction and 30+ production defects resolved',
      description:
        'Delivered operator-facing workflows and backend services for live sensor, mission, telemetry, geospatial, and video data in field environments.',
      highlights: [
        'Rebuilt Playwright end-to-end coverage and expanded Vitest and Storybook tests',
        'Deployed AWS workloads across ECS, EKS, Lambda, and S3',
        'Supported Canadian facility setup, field deployments, and customer demonstrations',
      ],
      tech: ['Next.js', 'Redux', 'Node.js', 'AWS', 'Playwright', 'Mapbox', 'WebGL'],
    },
    {
      name: 'Embedded Radio Messaging',
      track: 'C++ / Systems',
      outcome: 'Constrained software optimized to one processor core',
      description:
        'Developed cloud-enabled messaging for radio equipment, integrated legacy control interfaces, and improved repeatable verification on embedded Linux.',
      highlights: [
        'Removed unnecessary threads to support single-core execution',
        'Migrated legacy unit tests from C to C++',
        'Built Jenkins pipelines and post-merge verification scripts',
      ],
      tech: ['C++', 'C', 'Embedded Linux', 'Jenkins', 'Python', 'Bash', 'Radio systems'],
    },
  ],
  skills: [
    {
      category: 'Languages',
      items: [
        'C++',
        'Python',
        'TypeScript',
        'JavaScript',
        'Dart',
        'C',
        'Java',
        'SQL',
        'Bash',
      ],
    },
    {
      category: 'Web & APIs',
      items: [
        'Flutter',
        'Next.js',
        'React',
        'Redux',
        'Node.js',
        'Express',
        'REST',
        'PostgreSQL',
        'Supabase Auth & RLS',
        'MongoDB',
        'Playwright',
      ],
    },
    {
      category: 'Cloud & DevOps',
      items: [
        'AWS (ECS, EKS, Lambda, S3)',
        'Docker',
        'Kubernetes',
        'Jenkins',
        'GitHub Actions',
        'Firebase Hosting',
        'Git',
      ],
    },
    {
      category: 'Systems & embedded',
      items: [
        'Embedded Linux',
        'CMake',
        'CTest',
        'CAPE-OPEN',
        'Multithreading',
        'Microcontrollers',
        'Raspberry Pi',
        'TCP/IP',
      ],
    },
    {
      category: 'Natural languages',
      items: [
        'English (fluent)',
        'Kurdish (fluent)',
        'Arabic (fluent)',
        'French (intermediate)',
      ],
    },
  ],
  education: {
    degree: 'Bachelor of Applied Science',
    program: 'Computer Engineering (Innovation Stream)',
    school: 'Queen’s University',
    period: 'September 2017 – April 2023',
    courses: [
      'Operating Systems',
      'Advanced Data Analytics',
      'Cryptography & Network Security',
      'Microprocessor Systems',
      'Image Processing',
      'Neural & Genetic Computing',
      'Digital Systems Engineering',
      'Software Quality Assurance',
    ],
    award:
      'First place, mechatronics/robotics competition. Built and programmed a robot with fine-tuned servo motion control and multi-sensor feedback (C++, Arduino).',
    publication: {
      title: 'Stroke Prediction',
      publisher: 'David Publishing Company',
      date: 'December 2021',
      summary:
        'Developed a machine learning model using a Multilayer Perceptron to predict stroke susceptibility.',
      url: 'https://www.davidpublisher.com/Public/uploads/Contribute/61d510ca673c3.pdf',
    },
    volunteer: {
      org: 'QMIND AI Consulting',
      role: 'Chatbot Development (Immigration Law Firm)',
      period: 'September 2020 – April 2021',
      description:
        'Developed an AI chatbot using BotPress to automate applicant processing and scoring for an immigration law firm.',
      tech: ['TypeScript', 'Docker', 'BotPress', 'Git'],
    },
  },
}
