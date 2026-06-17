export type ReportCategory =
  | "Pothole"
  | "Road Damage"
  | "Waste"
  | "Sanitation"
  | "Light"
  | "Streetlight"
  | "Water"
  | "Drainage"
  | "Traffic"
  | "Parks"
  | "Noise"
  | "Building"
  | "Public Safety"
  | "Other";

export interface CategoryConfig {
  value: ReportCategory;
  label: string;
  icon: string;
  department: string;
  subcategories: string[];
  defaultPriority: number;
}

export const REPORT_CATEGORIES: CategoryConfig[] = [
  {
    value: "Pothole",
    label: "Potholes & Road Surface",
    icon: "🕳️",
    department: "Public Works (PWD)",
    subcategories: ["Small pothole", "Large pothole", "Multiple potholes", "Road depression"],
    defaultPriority: 4,
  },
  {
    value: "Road Damage",
    label: "Road & Footpath Damage",
    icon: "🛣️",
    department: "Public Works (PWD)",
    subcategories: ["Cracked road", "Broken footpath", "Damaged speed breaker", "Open manhole"],
    defaultPriority: 4,
  },
  {
    value: "Waste",
    label: "Garbage & Waste",
    icon: "🗑️",
    department: "Sanitation Department",
    subcategories: ["Overflowing bin", "Illegal dumping", "Street litter", "Bulk waste"],
    defaultPriority: 3,
  },
  {
    value: "Sanitation",
    label: "Sanitation & Hygiene",
    icon: "🧹",
    department: "Sanitation Department",
    subcategories: ["Public toilet issue", "Sewage overflow", "Unclean area", "Dead animal"],
    defaultPriority: 4,
  },
  {
    value: "Streetlight",
    label: "Street Lighting",
    icon: "💡",
    department: "Electricity Department",
    subcategories: ["Light not working", "Flickering light", "Broken pole", "Dark area"],
    defaultPriority: 3,
  },
  {
    value: "Water",
    label: "Water Supply",
    icon: "💧",
    department: "Water Board",
    subcategories: ["Pipeline leak", "No water supply", "Contaminated water", "Broken tap"],
    defaultPriority: 4,
  },
  {
    value: "Drainage",
    label: "Drainage & Flooding",
    icon: "🌊",
    department: "Water & Sewerage",
    subcategories: ["Blocked drain", "Waterlogging", "Open drain", "Storm drain issue"],
    defaultPriority: 4,
  },
  {
    value: "Traffic",
    label: "Traffic & Signage",
    icon: "🚦",
    department: "Traffic Police",
    subcategories: ["Broken signal", "Missing sign", "Illegal parking", "Road marking faded"],
    defaultPriority: 3,
  },
  {
    value: "Parks",
    label: "Parks & Green Spaces",
    icon: "🌳",
    department: "Horticulture / Parks",
    subcategories: ["Damaged equipment", "Overgrown vegetation", "Broken fence", "Tree hazard"],
    defaultPriority: 2,
  },
  {
    value: "Noise",
    label: "Noise Pollution",
    icon: "🔊",
    department: "Pollution Control",
    subcategories: ["Construction noise", "Loudspeaker", "Industrial noise", "Vehicle horn"],
    defaultPriority: 2,
  },
  {
    value: "Building",
    label: "Building & Structure",
    icon: "🏗️",
    department: "Municipal Engineering",
    subcategories: ["Illegal construction", "Unsafe structure", "Wall collapse risk", "Encroachment"],
    defaultPriority: 4,
  },
  {
    value: "Public Safety",
    label: "Public Safety",
    icon: "⚠️",
    department: "Disaster Management",
    subcategories: ["Open electrical wire", "Fire hazard", "Accident spot", "Security concern"],
    defaultPriority: 5,
  },
  {
    value: "Other",
    label: "Other Civic Issue",
    icon: "📋",
    department: "General Administration",
    subcategories: ["General complaint", "Suggestion", "Other infrastructure"],
    defaultPriority: 2,
  },
];

export const URGENCY_LEVELS = [
  { value: "low", label: "Low — Can wait weeks", color: "text-success" },
  { value: "medium", label: "Medium — Within a week", color: "text-primary" },
  { value: "high", label: "High — Needs attention soon", color: "text-warning" },
  { value: "emergency", label: "Emergency — Immediate danger", color: "text-destructive" },
] as const;

export const AFFECTED_AREAS = [
  { value: "individual", label: "Just me / my property" },
  { value: "street", label: "My street / lane" },
  { value: "block", label: "Entire block / colony" },
  { value: "neighborhood", label: "Whole neighborhood" },
] as const;

export const CONTACT_PREFERENCES = [
  { value: "app", label: "In-app notifications" },
  { value: "email", label: "Email updates" },
  { value: "phone", label: "Phone call" },
  { value: "none", label: "No contact needed" },
] as const;

export const PRIORITY_LABELS: Record<number, string> = {
  1: "Very Low",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Critical",
};

export function getCategoryConfig(category: string): CategoryConfig | undefined {
  return REPORT_CATEGORIES.find(
    (c) => c.value === category || (category === "Light" && c.value === "Streetlight")
  );
}

export function urgencyToPriority(urgency: string): number {
  switch (urgency) {
    case "emergency": return 5;
    case "high": return 4;
    case "medium": return 3;
    case "low": return 2;
    default: return 3;
  }
}
