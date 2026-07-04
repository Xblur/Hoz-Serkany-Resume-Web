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
  description: string
  tech: string[]
  url?: string
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
  resumePdf: string
  contact: ContactInfo
  nav: NavLink[]
  experience: ExperienceRole[]
  projects: Project[]
  skills: SkillGroup[]
  education: Education
}

export const resume: Resume = {
  name: 'Hoz Serkany',
  title: 'Computer Engineering',
  photo: `${import.meta.env.BASE_URL}hoz-serkany.png`,
  photoAlt: 'Portrait of Hoz Serkany',
  resumePdf: `${import.meta.env.BASE_URL}Hoz-Serkany-Resume.pdf`,
  summary:
    'Computer engineering professional with production experience building full-stack web platforms, Node.js backend services, Redux/Next.js frontends, and embedded Linux systems. Delivered AWS (ECS, EKS, Lambda, S3) deployments at Sensofusion and CI/CD automation at Ericsson; also built operator-facing command-and-control interfaces, live telemetry dashboards, and geospatial visualizations. Founder of Şandin Tech Inc., leading product engineering from architecture through launch. Experienced in field deployments and cross-functional hardware/software integration.',
  contact: {
    email: 'hozserkany@gmail.com',
    linkedin: 'https://www.linkedin.com/in/hoz-s-71873550/',
    github: 'https://github.com/Xblur',
    location: 'Ottawa, Ontario, Canada',
  },
  nav: [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'contact', label: 'Contact' },
  ],
  experience: [
    {
      company: 'Sensofusion',
      title: 'Full-Stack Software Developer',
      period: 'September 2025 – February 2026',
      bullets: [
        'Fixed 30+ production bugs and shipped UI/UX improvements, including a mobile-view redesign, improving reliability and operator usability.',
        'Rebuilt and validated the Playwright end-to-end test suite, improving CI reliability and regression coverage.',
        'Deployed production workloads on AWS (ECS, EKS, Lambda, S3) and configured Cloudflare for secure routing and edge delivery.',
        'Developed and maintained the command-and-control Next.js application with Redux, integrating multiple sensor types and countermeasure systems.',
        'Built live telemetry dashboards and geospatial map views (D3.js, Leaflet, Mapbox, WebGL) for operator situational awareness.',
        'Built Node.js backend-for-frontend (BFF) services to ingest, normalize, and stream sensor and mission data to the C2 client.',
        'Reduced streamed payload volume by 70% for duplicated notifications through structural backend optimizations.',
        'Supported Canadian market expansion through on-site field deployments, live customer demonstrations, and hardware/software integration.',
      ],
    },
    {
      company: 'Şandin Tech Inc.',
      title: 'Founder / Director',
      period: 'January 2023 – Present',
      bullets: [
        'Lead Şandin Tech end to end—problem validation, product engineering, go-to-market, and startup operations for the Şand peer-to-peer delivery platform.',
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
        'Migrated legacy unit testing code from C to C++ and automated unit testing through designed test configurations.',
      ],
    },
  ],
  projects: [
    {
      name: 'Raspberry Pi Home Assistant Hub',
      description:
        'Deployed and maintain a Raspberry Pi-based Home Assistant instance—OS imaging, networking setup, sensor and device integrations, automations, and ongoing administration.',
      tech: ['Raspberry Pi OS', 'Home Assistant', 'Python', 'TCP/IP'],
    },
    {
      name: 'Autonomous Driving (Queen’s AutoDrive)',
      description:
        'Worked on 3D point cloud segmentation and classification using ROS for system integration on an autonomous vehicle platform.',
      tech: ['Python', 'ROS', 'Keras', 'CNN', 'Transformers'],
    },
    {
      name: 'Facial Emotion & Gesture Recognition',
      description:
        'Trained a CNN to classify seven emotions from images (90% accuracy) and designed a live-video gesture recognition system above 20 fps that synthesizes speech from a custom dictionary (70% accuracy).',
      tech: ['Python', 'Flask', 'OpenCV', 'Keras', 'TensorFlow', 'NumPy'],
      url: 'https://github.com/Xblur/ELEC490_Gesture_Recognition',
    },
    {
      name: 'Deepfake Detection',
      description:
        'Built and trained a deep neural network to detect deepfake images.',
      tech: ['Python', 'Flask', 'TensorFlow', 'Pandas'],
    },
    {
      name: 'Elopement Prevention System',
      description:
        'Designed a sensor-integrated system to secure nursing home premises using embedded hardware and wireless connectivity.',
      tech: ['C++', 'Hardware', 'Sensors', 'Bluetooth Mesh', 'RFID', 'IR'],
    },
    {
      name: '16-bit Microprocessor Design',
      description:
        'Simulated a custom processor with branching functionalities and UART integration.',
      tech: ['Assembly', 'VHDL', 'ModelSim', 'Altera'],
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
        'C',
        'Java',
        'SQL',
        'bash',
        'Go (familiar)',
        'C# (familiar)',
      ],
    },
    {
      category: 'Web & APIs',
      items: [
        'Next.js',
        'React',
        'Redux',
        'Node.js',
        'Express',
        'REST',
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
        'CI/CD',
        'Git',
      ],
    },
    {
      category: 'Systems & embedded',
      items: [
        'Embedded Linux',
        'Microcontrollers',
        'Raspberry Pi',
        'TCP/IP',
        'Home Assistant',
      ],
    },
    {
      category: 'AI/ML',
      items: [
        'TensorFlow',
        'PyTorch',
        'OpenCV',
        'Computer vision',
        'Scikit-learn',
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
      'Algorithms',
      'Cryptography & Network Security',
      'Microprocessor Systems',
      'Image Processing',
      'Neural & Genetic Computing',
      'Digital Systems Engineering',
      'Software Quality Assurance',
    ],
    award:
      'First place, mechatronics/robotics competition—built and programmed a robot with fine-tuned servo motion control and multi-sensor feedback (C++, Arduino).',
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
      role: 'Chatbot Development (VisaPlace)',
      period: 'September 2020 – April 2021',
      description:
        'Developed an AI chatbot using BotPress to automate applicant processing and scoring for an immigration law firm.',
      tech: ['TypeScript', 'Docker', 'BotPress', 'Git'],
    },
  },
}
