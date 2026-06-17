import { Report } from "@/types";
import { API_CONFIG } from "@/config/api";

const UPLOAD_BASE = API_CONFIG.BASE_URL.replace("/api", "");

/** Safely read an id from a string, ObjectId, or populated ref (null-safe). */
function refId(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as { _id?: unknown })._id;
    return id != null ? String(id) : undefined;
  }
  return undefined;
}

function refName(value: unknown): string | undefined {
  if (value == null || typeof value !== "object") return undefined;
  return (value as { name?: string }).name;
}

export function transformBackendReport(report: Record<string, unknown> | null | undefined): Report {
  if (!report) {
    throw new Error("Invalid report data received from server");
  }

  const photos = report.photos as Array<{ url?: string }> | undefined;
  const location = report.location as {
    coordinates?: [number, number];
    address?: string;
    landmark?: string;
  } | undefined;
  const staffComments = report.staffComments as Array<{
    comment: string;
    createdAt: string;
    staffId?: unknown;
  }> | undefined;
  const statusHistory = report.statusHistory as Array<{
    fromStatus?: string | null;
    toStatus: string;
    note?: string;
    createdAt: string;
    changedBy?: unknown;
  }> | undefined;
  const citizenFeedback = report.citizenFeedback as { rating?: number; comment?: string } | undefined;
  const aiSuggestions = report.aiSuggestions as {
    suggestedCategory?: string;
    suggestedPriority?: number;
    confidence?: number;
  } | undefined;

  const createdAtRaw = report.createdAt as string | undefined;
  const updatedAtRaw = report.updatedAt as string | undefined;

  return {
    id: refId(report._id ?? report.id) || String(report.id ?? ""),
    reportId: report.reportId as string | undefined,
    title: (report.title as string) || "",
    description: (report.description as string) || "",
    category: report.category as Report["category"],
    subcategory: report.subcategory as string | undefined,
    priority: (report.priority as Report["priority"]) || 3,
    status: (report.status as Report["status"]) || "Submitted",
    urgencyLevel: report.urgencyLevel as Report["urgencyLevel"],
    affectedArea: report.affectedArea as Report["affectedArea"],
    contactPreference: report.contactPreference as Report["contactPreference"],
    isPublic: report.isPublic as boolean | undefined,
    photoUrl: photos?.[0]?.url ? `${UPLOAD_BASE}${photos[0].url}` : undefined,
    photoUrls: photos?.map((p) => (p.url ? `${UPLOAD_BASE}${p.url}` : "")).filter(Boolean),
    location: {
      lat: location?.coordinates?.[1] ?? 0,
      lng: location?.coordinates?.[0] ?? 0,
      address: location?.address || "Unknown location",
      landmark: location?.landmark,
    },
    citizenId: refId(report.citizenId) || "Anonymous",
    citizenName: refName(report.citizenId),
    assignedStaffId: refId(report.assignedStaffId),
    assignedStaffName: refName(report.assignedStaffId),
    staffComment: staffComments?.[staffComments.length - 1]?.comment,
    staffComments: staffComments?.map((c) => ({
      comment: c.comment,
      createdAt: new Date(c.createdAt),
      staffName: refName(c.staffId),
    })),
    statusHistory: statusHistory?.map((h) => ({
      fromStatus: h.fromStatus ?? null,
      toStatus: h.toStatus,
      changedBy: refId(h.changedBy),
      changedByName: refName(h.changedBy),
      changedByRole: (h.changedBy as { role?: string } | undefined)?.role,
      note: h.note,
      createdAt: new Date(h.createdAt),
    })),
    rejectionReason: report.rejectionReason as string | undefined,
    supportCount: (report.supportCount as number) || 0,
    hasSupported: report.hasSupported as boolean | undefined,
    resolutionDetails: report.resolutionDetails as string | undefined,
    estimatedResolutionDate: report.estimatedResolutionDate
      ? new Date(report.estimatedResolutionDate as string)
      : undefined,
    resolvedAt: report.resolvedAt ? new Date(report.resolvedAt as string) : undefined,
    citizenFeedback,
    aiSuggestions,
    createdAt: createdAtRaw ? new Date(createdAtRaw) : new Date(),
    updatedAt: updatedAtRaw ? new Date(updatedAtRaw) : new Date(),
  };
}

/** Normalize create-report API payload (Mongoose doc or plain JSON). */
export function extractCreatedReport(response: Record<string, unknown>): Record<string, unknown> {
  const report = response.report ?? response.data;
  if (!report) {
    throw new Error("Server did not return the created report");
  }
  // Mongoose documents expose toJSON; plain objects pass through
  if (typeof report === "object" && report !== null && "toJSON" in report && typeof (report as { toJSON: () => unknown }).toJSON === "function") {
    return (report as { toJSON: () => Record<string, unknown> }).toJSON();
  }
  return report as Record<string, unknown>;
}
