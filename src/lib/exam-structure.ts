export interface ExamSection {
  id: string;
  name: string;
  questionCount: number;
  topics: string[];
}

export const OOW_UNLIMITED_STRUCTURE: ExamSection[] = [
  { id: "colregs", name: "COLREGs & Lights", questionCount: 6, topics: ["colregs"] },
  { id: "emergencies", name: "Emergencies & Safety", questionCount: 5, topics: ["safety", "solas"] },
  { id: "chartwork", name: "Chartwork & Navigation", questionCount: 4, topics: ["navigation"] },
  { id: "cargo", name: "Cargo & Stability", questionCount: 3, topics: ["cargo", "stability"] },
];

export const MASTER_UNLIMITED_STRUCTURE: ExamSection[] = [
  { id: "colregs", name: "COLREGs & Lights", questionCount: 5, topics: ["colregs"] },
  { id: "navigation", name: "Navigation & Passage Planning", questionCount: 5, topics: ["navigation"] },
  { id: "safety", name: "Safety Management & SOLAS", questionCount: 5, topics: ["safety", "solas"] },
  { id: "cargo", name: "Cargo & Stability", questionCount: 4, topics: ["cargo", "stability"] },
  { id: "law", name: "Maritime Law & ISM", questionCount: 3, topics: ["maritime-law"] },
];

export const MASTER_3000GT_STRUCTURE: ExamSection[] = [
  { id: "colregs", name: "COLREGs & Lights", questionCount: 5, topics: ["colregs"] },
  { id: "navigation", name: "Navigation & Chartwork", questionCount: 4, topics: ["navigation"] },
  { id: "safety", name: "Safety & Emergency", questionCount: 5, topics: ["safety", "solas"] },
  { id: "cargo", name: "Cargo & Stability", questionCount: 3, topics: ["cargo", "stability"] },
  { id: "law", name: "Maritime Law", questionCount: 2, topics: ["maritime-law"] },
];

export const YM_OFFSHORE_STRUCTURE: ExamSection[] = [
  { id: "colregs", name: "COLREGs & Lights", questionCount: 5, topics: ["colregs"] },
  { id: "navigation", name: "Navigation & Pilotage", questionCount: 4, topics: ["navigation"] },
  { id: "safety", name: "Safety & Emergency", questionCount: 4, topics: ["safety"] },
  { id: "meteorology", name: "Meteorology", questionCount: 3, topics: ["meteorology"] },
];

export const YM_OCEAN_STRUCTURE: ExamSection[] = [
  { id: "colregs", name: "COLREGs & Lights", questionCount: 5, topics: ["colregs"] },
  { id: "celestial", name: "Celestial Navigation & Chartwork", questionCount: 5, topics: ["navigation"] },
  { id: "safety", name: "Safety & Emergency", questionCount: 4, topics: ["safety"] },
  { id: "meteorology", name: "Meteorology & Weather Routing", questionCount: 4, topics: ["meteorology"] },
];

const STRUCTURES: Record<string, ExamSection[]> = {
  "oow-unlimited": OOW_UNLIMITED_STRUCTURE,
  "master-unlimited": MASTER_UNLIMITED_STRUCTURE,
  "master-3000gt": MASTER_3000GT_STRUCTURE,
  "ym-offshore": YM_OFFSHORE_STRUCTURE,
  "ym-ocean": YM_OCEAN_STRUCTURE,
};

export function getStructureForTicket(ticketSlug: string): ExamSection[] {
  return STRUCTURES[ticketSlug] || OOW_UNLIMITED_STRUCTURE;
}
