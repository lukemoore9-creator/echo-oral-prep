export type TicketSlug =
  | 'oow-unlimited'
  | 'master-unlimited'
  | 'master-3000gt'
  | 'master-3000gt-yacht'
  | 'oow-nearcoastal'
  | 'master-200gt'
  | 'master-500gt'
  | 'ym-offshore'
  | 'ym-ocean'
  | 'mate-200gt-yacht'
  | 'master-200gt-yacht'
  | 'master-500gt-yacht'
  | 'engineer-oow'
  | 'eto';

export interface Ticket {
  slug: TicketSlug;
  name: string;
  side: 'commercial' | 'yacht' | 'engineering';
  liveForStudents: boolean;
}

export const ALL_TICKETS: Ticket[] = [
  { slug: 'oow-unlimited',       name: 'OOW Unlimited',          side: 'commercial',  liveForStudents: true  },
  { slug: 'master-unlimited',    name: 'Master Unlimited',       side: 'commercial',  liveForStudents: true  },
  { slug: 'master-3000gt',       name: 'Master 3000GT',          side: 'commercial',  liveForStudents: true  },
  { slug: 'master-3000gt-yacht', name: 'Master 3000GT Yacht',    side: 'yacht',       liveForStudents: true  },
  { slug: 'oow-nearcoastal',     name: 'OOW Near Coastal',       side: 'commercial',  liveForStudents: false },
  { slug: 'master-200gt',        name: 'Master 200GT',           side: 'commercial',  liveForStudents: false },
  { slug: 'master-500gt',        name: 'Master 500GT',           side: 'commercial',  liveForStudents: false },
  { slug: 'ym-offshore',         name: 'Yacht Master Offshore',  side: 'yacht',       liveForStudents: false },
  { slug: 'ym-ocean',            name: 'Yacht Master Ocean',     side: 'yacht',       liveForStudents: false },
  { slug: 'mate-200gt-yacht',    name: 'Mate 200GT Yacht',       side: 'yacht',       liveForStudents: false },
  { slug: 'master-200gt-yacht',  name: 'Master 200GT Yacht',     side: 'yacht',       liveForStudents: false },
  { slug: 'master-500gt-yacht',  name: 'Master 500GT Yacht',     side: 'yacht',       liveForStudents: false },
  { slug: 'engineer-oow',        name: 'Engineer OOW',           side: 'engineering', liveForStudents: false },
  { slug: 'eto',                 name: 'ETO',                    side: 'engineering', liveForStudents: false },
];

export const STUDENT_TICKETS = ALL_TICKETS.filter(t => t.liveForStudents);
export const TRAINER_TICKETS = ALL_TICKETS;
export const STUDENT_TICKET_SLUGS = STUDENT_TICKETS.map(t => t.slug);

export function getTicketName(slug: string): string {
  return ALL_TICKETS.find(t => t.slug === slug)?.name ?? slug;
}

export function getTicketSide(slug: string): Ticket['side'] | undefined {
  return ALL_TICKETS.find(t => t.slug === slug)?.side;
}

export function isStudentTicket(slug: string): boolean {
  return STUDENT_TICKETS.some(t => t.slug === slug);
}
