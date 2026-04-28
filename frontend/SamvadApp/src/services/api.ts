import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL when running
const BASE_URL = 'http://localhost:3000/api';

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
  category: 'Pothole' | 'Drainage' | 'Streetlight' | 'Other';
  status: 'Reported' | 'In Progress' | 'Resolved' | 'Rejected';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photoUrl?: string;
  citizenId: string;
  assignedDepartment?: string;
  adminNotes?: string;
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

  // Issues
  async getIssues(userId?: string, userType?: 'citizen' | 'admin'): Promise<ApiResponse<Issue[]>> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userType) params.append('userType', userType);
    
    return this.makeRequest<Issue[]>(`/issues?${params.toString()}`);
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
    return this.makeRequest<Issue>('/issues', {
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
    return this.makeRequest<Issue>(`/issues/${issueId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async getIssueById(issueId: string): Promise<ApiResponse<Issue>> {
    return this.makeRequest<Issue>(`/issues/${issueId}`);
  }
}

export default new ApiService();
export type { User, Issue, ApiResponse };