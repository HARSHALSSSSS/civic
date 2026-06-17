import { ReportCategory } from "@/constants/categories";

export interface StatusHistoryEntry {
  fromStatus: string | null;
  toStatus: string;
  changedBy?: string;
  changedByName?: string;
  changedByRole?: string;
  note?: string;
  createdAt: Date;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  department?: string;
  role: string;
  staffId?: string;
}

export interface StaffReportUpdate {
  status?: Report["status"];
  resolutionDetails?: string;
  estimatedResolutionDate?: string;
  rejectionReason?: string;
  statusNote?: string;
  staffComment?: string;
  priority?: number;
  assignStaffId?: string;
  assignSelf?: boolean;
}

export interface Report {
  id: string;
  reportId?: string;
  title: string;
  description: string;
  category: ReportCategory | "Light";
  subcategory?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  status: "Submitted" | "Assigned" | "In Progress" | "Resolved" | "Closed" | "Rejected";
  urgencyLevel?: "low" | "medium" | "high" | "emergency";
  affectedArea?: "individual" | "street" | "block" | "neighborhood";
  contactPreference?: "app" | "email" | "phone" | "none";
  isPublic?: boolean;
  photoUrl?: string;
  photoUrls?: string[];
  location: {
    lat: number;
    lng: number;
    address?: string;
    landmark?: string;
  };
  citizenId: string;
  citizenName?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  staffComment?: string;
  staffComments?: Array<{ comment: string; createdAt: Date; staffName?: string }>;
  statusHistory?: StatusHistoryEntry[];
  rejectionReason?: string;
  supportCount?: number;
  hasSupported?: boolean;
  resolutionDetails?: string;
  estimatedResolutionDate?: Date;
  resolvedAt?: Date;
  citizenFeedback?: { rating?: number; comment?: string };
  aiSuggestions?: {
    suggestedCategory?: string;
    suggestedPriority?: number;
    confidence?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "citizen" | "staff" | "admin";
  phone?: string;
  department?: string;
  createdAt?: Date;
}

export interface MockGeolocation {
  lat: number;
  lng: number;
  address: string;
}
