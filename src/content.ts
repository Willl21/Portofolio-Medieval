// Everything the portfolio says, in one place. Edit here; the UI follows.
// TODO(wildan): lines marked DRAFT are placeholder copy — replace with the real details.
import festaFestum from './assets/medieval/projects/festa-festum.webp'
import dungeonMap from './assets/medieval/projects/dungeon-map.webp'

export const PROFILE = {
  name: 'Wildan Habibul Malik',
  title: 'Informatics Student',
  roles: ['Web Developer', 'Fullstack Developer'],
  // DRAFT
  intro:
    'I build for the web end to end — from the interface people touch to the server and database behind it. I care about software that is clear to use, honest about what it does, and pleasant to come back to.',
  // DRAFT
  focus: ['Deepening fullstack work with React, TypeScript and Node.js', 'Designing clean data models in SQL databases', 'Crafting interfaces with personality, like this one'],
  // DRAFT
  interests: ['Interactive & experimental frontends', 'Procedural generation', 'Developer tooling', 'Games and the stories behind them'],
  email: 'hello@example.com', // TODO(wildan): your real address — the contact form sends here
  links: [
    { label: 'GitHub', href: 'https://github.com/' }, // TODO(wildan)
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' }, // TODO(wildan)
  ],
}

export type Project = {
  slug: string
  name: string
  category: string
  image: string
  summary: string
  description: string
  role: string
  tech: string[]
  features: string[]
  github?: string
  demo?: string
}

export const PROJECTS: Project[] = [
  {
    slug: 'festa-festum',
    name: 'Festa Festum',
    category: 'Web Application', // DRAFT
    image: festaFestum,
    summary: 'A web platform for discovering and organising festivals and events.', // DRAFT
    description:
      'Festa Festum brings event information into one place: browse what is happening, read the details, and keep track of the events you care about. Built with a focus on fast pages and a clear, friendly interface.', // DRAFT
    role: 'Fullstack Developer', // DRAFT
    tech: ['React', 'TypeScript', 'Node.js', 'MySQL'], // DRAFT
    features: ['Event listing with search and filters', 'Event detail pages', 'Responsive layout for phones and desktops', 'Admin tools for managing events'], // DRAFT
    github: 'https://github.com/', // TODO(wildan)
  },
  {
    slug: 'dungeon-map-generator',
    name: 'Dungeon Map Generator',
    category: 'Procedural Tool', // DRAFT
    image: dungeonMap,
    summary: 'Generates dungeon layouts — rooms, corridors and routes — at the press of a button.', // DRAFT
    description:
      'A procedural generator that lays out non-overlapping rooms, connects them with corridors and renders the result as a classic hatched dungeon map, ready for a tabletop session or a game prototype.', // DRAFT
    role: 'Solo Developer', // DRAFT
    tech: ['TypeScript', 'HTML Canvas', 'CSS'], // DRAFT
    features: ['Seeded generation for reproducible maps', 'Room placement with collision checks', 'Corridor routing between rooms', 'Export the map as an image'], // DRAFT
    github: 'https://github.com/', // TODO(wildan)
  },
]

export const SKILLS = [
  { group: 'Frontend', note: 'Interfaces & interaction', items: ['React', 'TypeScript', 'HTML', 'CSS'] },
  { group: 'Backend', note: 'Servers & APIs', items: ['Node.js', 'Express', 'PHP'] },
  { group: 'Database', note: 'Data & storage', items: ['MySQL', 'PostgreSQL'] },
  { group: 'Tools', note: 'Craft & workflow', items: ['Git', 'GitHub', 'Vite', 'Three.js'] },
]

export const EXPERIENCE = [
  // DRAFT — replace with your real history
  { period: 'Present', role: 'Informatics Student', org: 'Your University', text: 'Studying informatics, with coursework in software engineering, databases and web development.' },
  { period: '2025', role: 'Fullstack Developer', org: 'Festa Festum', text: 'Designed and built the platform end to end — interface, API and database.' },
  { period: '2024', role: 'Web Developer', org: 'Personal & freelance projects', text: 'Built websites and tools, including the Dungeon Map Generator.' },
]
