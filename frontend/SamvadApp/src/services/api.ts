import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL when running
const BASE_URL = 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  userType: 'citizen' | 'admin';
  createdAt: string;
  updatedAt: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  category: 'Pothole' | 'Waste' | 'Light' | 'Water' | 'Traffic' | 'Other';
  status: 'Submitted' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed' | 'Rejected';
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
  resolvedAt?: string;
}

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: 'Network error or server unavailable'
      };
    }
  }

  // Authentication
  async login(email: string, userType: 'citizen' | 'admin'): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.makeRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, userType }),
    });

    if (response.success && response.data) {
      // Store token for future requests
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Issues - maps to reports endpoint
  async getIssues(userId?: string, userType?: 'citizen' | 'admin'): Promise<ApiResponse<Issue[]>> {
    try {
      // For citizens, use the /reports/my endpoint
      if (userType === 'citizen') {
        const response = await this.makeRequest<{ reports: any[] }>('/reports/my');
        if (response.success && response.data) {
          // Transform reports to Issue format
          const issues = response.data.reports.map((report: any) => ({
            id: report._id,
            title: report.title,
            description: report.description,
            category: report.category,
            status: report.status,
            location: {
              latitude: report.location?.coordinates?.[1] || 0,
              longitude: report.location?.coordinates?.[0] || 0,
              address: report.location?.address
            },
            photoUrl: report.photos?.[0]?.url,
            citizenId: report.citizenId?._id,
            assignedDepartment: report.assignedStaffId?.department,
            adminNotes: report.staffComments?.[0]?.comment,
            supportCount: report.supportCount || 0,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt
          }));
          return { success: true, data: issues };
        }
        return response;
      }
      
      // For admin, use /reports/admin
      const response = await this.makeRequest<{ reports: any[] }>('/reports/admin');
      if (response.success && response.data) {
        const issues = response.data.reports.map((report: any) => ({
          id: report._id,
          title: report.title,
          description: report.description,
          category: report.category,
          status: report.status,
          location: {
            latitude: report.location?.coordinates?.[1] || 0,
            longitude: report.location?.coordinates?.[0] || 0,
            address: report.location?.address
          },
          photoUrl: report.photos?.[0]?.url,
          citizenId: report.citizenId?._id,
          assignedDepartment: report.assignedStaffId?.department,
          adminNotes: report.staffComments?.[0]?.comment,
          supportCount: report.supportCount || 0,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt
        }));
        return { success: true, data: issues };
      }
      return response;
    } catch (error) {
      console.error('Error fetching issues:', error);
      return { success: false, error: 'Failed to fetch issues' };
    }
  }

  async createIssue(issueData: {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    address?: string;
    photoUrl?: string;
    citizenId: string;
  }): Promise<ApiResponse<Issue>> {
    return this.makeRequest<Issue>('/reports', {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
  }

  async updateIssue(
    issueId: string,
    updateData: {
      status?: Issue['status'];
      adminNotes?: string;
      assignedDepartment?: string;
    }
  ): Promise<ApiResponse<Issue>> {
    return this.makeRequest<Issue>(`/reports/${issueId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async getIssueById(issueId: string): Promise<ApiResponse<Issue>> {
    return this.makeRequest<Issue>(`/reports/${issueId}`);
  }
}

export default new ApiService();
export type { User, Issue, ApiResponse };