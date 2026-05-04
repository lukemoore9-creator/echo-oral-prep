export const TOPIC_NAMES: Record<string, string> = {
  colregs: "COLREGs & Rules of the Road",
  navigation: "Navigation & Passage Planning",
  safety: "Safety & Emergency Procedures",
  solas: "SOLAS Requirements",
  meteorology: "Meteorology & Weather",
  stability: "Ship Stability",
  marpol: "MARPOL & Environmental",
  stcw: "STCW & Watchkeeping",
  cargo: "Cargo Operations",
  gmdss: "GMDSS Communications",
  "bridge-equipment": "Bridge Equipment & Radar",
  "maritime-law": "Maritime Law",
};

export const ALL_TOPIC_SLUGS = Object.keys(TOPIC_NAMES);

export function getTopicName(slug: string): string {
  return TOPIC_NAMES[slug] || slug;
}
