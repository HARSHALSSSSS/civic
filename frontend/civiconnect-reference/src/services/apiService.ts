import { API_CONFIG, getAuthHeaders, getUploadHeaders } from '../config/api';
import { fetchJson } from '../lib/apiFetch';

async function parseResponse(response: Response) {
  let data: Record<string, unknown> | null = null;
  try {
    data = await response.json();
  } catch {
    // Response body may be empty or non-JSON
  }

  if (!response.ok) {
    const errors = data?.errors as Array<{ msg?: string }> | undefined;
    const validationMessage = errors?.map((e) => e.msg).filter(Boolean).join(". ");
    const message =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      validationMessage ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data ?? {};
}

function saveSession(data: Record<string, unknown>) {
  if (data.token) {
    localStorage.setItem('authToken', String(data.token));
    localStorage.setItem('userData', JSON.stringify(data.user));
  }
}

export class ApiService {
  private baseUrl = API_CONFIG.BASE_URL;

  private getToken() {
    return localStorage.getItem('authToken') || undefined;
  }

  async login(email: string, password: string) {
    const data = await fetchJson<Record<string, unknown>>(
      `${this.baseUrl}${API_CONFIG.ENDPOINTS.LOGIN}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, password }),
      },
      { timeoutMs: 50_000, retries: 1 }
    );
    saveSession(data);
    return data;
  }

  async register(userData: Record<string, unknown>) {
    const data = await fetchJson<Record<string, unknown>>(
      `${this.baseUrl}${API_CONFIG.ENDPOINTS.REGISTER}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      },
      { timeoutMs: 50_000, retries: 1 }
    );
    saveSession(data);
    return data;
  }

  async getMe() {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ME}`, {
      headers: getAuthHeaders(this.getToken()),
    });
    return parseResponse(response);
  }

  async updateProfile(profile: Record<string, unknown>) {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.UPDATE_PROFILE}`, {
      method: 'PUT',
      headers: getAuthHeaders(this.getToken()),
      body: JSON.stringify(profile),
    });
    const data = await parseResponse(response);
    if (data.user) {
      localStorage.setItem('userData', JSON.stringify(data.user));
    }
    return data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.CHANGE_PASSWORD}`, {
      method: 'PUT',
      headers: getAuthHeaders(this.getToken()),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return parseResponse(response);
  }

  async getMyReports() {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.REPORTS_MY}`, {
      headers: getAuthHeaders(this.getToken()),
    });
    return parseResponse(response);
  }

  async getAdminReports() {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.REPORTS_ADMIN}`, {
      headers: getAuthHeaders(this.getToken()),
    });
    return parseResponse(response);
  }

  async getCommunityReports() {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.REPORTS_COMMUNITY}`, {
      headers: getAuthHeaders(this.getToken()),
    });
    return parseResponse(response);
  }

  async getReportById(id: string) {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.REPORT_BY_ID(id)}`, {
      headers: getAuthHeaders(this.getToken()),
    });
    return parseResponse(response);
  }

  async createReport(formData: FormData) {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.REPORTS}`, {
      method: 'POST',
      headers: getUploadHeaders(this.getToken()),
      body: formData,
    });
    return parseResponse(response);
  }

  async createReportJson(reportData: Record<string, unknown>) {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.REPORTS}`, {
      method: 'POST',
      headers: getAuthHeaders(this.getToken()),
      body: JSON.stringify(reportData),
    });
    return parseResponse(response);
  }

  async toggleSupport(reportId: string) {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.TOGGLE_SUPPORT(reportId)}`, {
      method: 'POST',
      headers: getAuthHeaders(this.getToken()),
    });
    return parseResponse(response);
  }

  async submitFeedback(reportId: string, rating: number, comment?: string) {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.SUBMIT_FEEDBACK(reportId)}`, {
      method: 'POST',
      headers: getAuthHeaders(this.getToken()),
      body: JSON.stringify({ rating, comment }),
    });
    return parseResponse(response);
  }

  async assignReport(reportId: string, staffId?: string) {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ASSIGN_REPORT(reportId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(this.getToken()),
      body: JSON.stringify(staffId ? { staffId } : {}),
    });
    return parseResponse(response);
  }

  async updateReportStatus(
    reportId: string,
    payload: {
      status: string;
      resolutionDetails?: string;
      estimatedResolutionDate?: string;
      rejectionReason?: string;
      statusNote?: string;
    }
  ) {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.UPDATE_STATUS(reportId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(this.getToken()),
      body: JSON.stringify(payload),
    });
    return parseResponse(response);
  }

  async updateReportPriority(
    reportId: string,
    payload: { priority: number; note?: string }
  ) {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.UPDATE_PRIORITY(reportId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(this.getToken()),
      body: JSON.stringify(payload),
    });
    return parseResponse(response);
  }

  async getStaffMembers() {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.STAFF_MEMBERS}`, {
      headers: getAuthHeaders(this.getToken()),
    });
    return parseResponse(response);
  }

  async addStaffComment(reportId: string, comment: string) {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ADD_COMMENT(reportId)}`, {
      method: 'POST',
      headers: getAuthHeaders(this.getToken()),
      body: JSON.stringify({ comment }),
    });
    return parseResponse(response);
  }

  async getAnalyticsStats() {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ANALYTICS_STATS}`);
    return parseResponse(response);
  }

  async getAdvancedAnalytics() {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ANALYTICS_ADVANCED}`, {
      headers: getAuthHeaders(this.getToken()),
    });
    return parseResponse(response);
  }

  async getStaffDashboard() {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.STAFF_DASHBOARD}`, {
      headers: getAuthHeaders(this.getToken()),
    });
    return parseResponse(response);
  }

  getCurrentUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }
}

export const apiService = new ApiService();
