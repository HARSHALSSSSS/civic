import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android emulator: 10.0.2.2 | iOS simulator: localhost | physical device: your PC LAN IP
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${DEV_HOST}:5000/api`;
const UPLOAD_BASE = `http://${DEV_HOST}:5000`;

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
  user?: Record<string, unknown>;
  reports?: unknown[];
  report?: unknown;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photoUrl?: string;
  citizenId: string;
  assignedDepartment?: string;
  adminNotes?: string;
  supportCount?: number;
  hasSupported?: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapReportToIssue(report: Record<string, unknown>): Issue {
  const location = report.location as { coordinates?: [number, number]; address?: string } | undefined;
  const photos = report.photos as Array<{ url?: string }> | undefined;
  const citizenId = report.citizenId as { _id?: string } | string | undefined;
  const assignedStaff = report.assignedStaffId as { department?: string } | undefined;
  const staffComments = report.staffComments as Array<{ comment: string }> | undefined;

  return {
    id: String(report._id || report.id),
    title: String(report.title || ''),
    description: String(report.description || ''),
    category: String(report.category || 'Other'),
    status: String(report.status || 'Submitted'),
    priority: Number(report.priority) || 3,
    location: {
      latitude: location?.coordinates?.[1] ?? 0,
      longitude: location?.coordinates?.[0] ?? 0,
      address: location?.address,
    },
    photoUrl: photos?.[0]?.url ? `${UPLOAD_BASE}${photos[0].url}` : undefined,
    citizenId: typeof citizenId === 'object' && citizenId?._id ? citizenId._id : String(citizenId || ''),
    assignedDepartment: assignedStaff?.department,
    adminNotes: staffComments?.[staffComments.length - 1]?.comment,
    supportCount: Number(report.supportCount) || 0,
    createdAt: String(report.createdAt),
    updatedAt: String(report.updatedAt),
  };
}

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `Request failed (${response.status})`,
        };
      }
      return data;
    } catch {
      return { success: false, error: 'Network error or server unavailable' };
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.makeRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const token = response.token;
    const user = response.user;

    if (response.success && token && user) {
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return { success: true, data: { user: user as unknown as User, token } };
    }

    return { success: false, error: response.error || response.message || 'Login failed' };
  }

  async register(payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, role: payload.role || 'citizen' }),
    });

    if (response.success && response.token) {
      await AsyncStorage.setItem('auth_token', response.token);
      if (response.user) await AsyncStorage.setItem('user', JSON.stringify(response.user));
      return {
        success: true,
        data: { user: response.user as User, token: response.token },
      };
    }
    return { success: false, error: response.error || response.message || 'Registration failed' };
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  async getIssues(_userId?: string, userType?: 'citizen' | 'admin'): Promise<ApiResponse<Issue[]>> {
    const endpoint = userType === 'admin' ? '/reports/admin' : '/reports/my';
    const response = await this.makeRequest(endpoint);

    if (response.success && response.reports) {
      const issues = (response.reports as Record<string, unknown>[]).map(mapReportToIssue);
      return { success: true, data: issues };
    }
    return { success: false, error: response.error || 'Failed to fetch issues' };
  }

  async createIssue(issueData: {
    title: string;
    description: string;
    category: string;
    priority: number;
    latitude: number;
    longitude: number;
    address?: string;
  }): Promise<ApiResponse<Issue>> {
    const response = await this.makeRequest('/reports', {
      method: 'POST',
      body: JSON.stringify({
        title: issueData.title,
        description: issueData.description,
        category: issueData.category,
        priority: issueData.priority,
        latitude: issueData.latitude,
        longitude: issueData.longitude,
        address: issueData.address,
      }),
    });

    if (response.success && response.report) {
      return { success: true, data: mapReportToIssue(response.report as Record<string, unknown>) };
    }
    return { success: false, error: response.error || response.message || 'Failed to create issue' };
  }

  async getIssueById(issueId: string): Promise<ApiResponse<Issue>> {
    const response = await this.makeRequest(`/reports/${issueId}`);
    if (response.success && response.report) {
      return { success: true, data: mapReportToIssue(response.report as Record<string, unknown>) };
    }
    return { success: false, error: response.error || 'Failed to fetch issue' };
  }

  async toggleSupport(issueId: string): Promise<ApiResponse<{ supportCount: number; hasSupported: boolean }>> {
    return this.makeRequest(`/reports/${issueId}/support`, { method: 'POST' });
  }
}

export default new ApiService();
export type { User, Issue, ApiResponse };
