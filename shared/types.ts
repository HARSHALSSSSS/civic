// Shared TypeScript types for Samvad Platform

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  userType: 'citizen' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
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

export interface CreateIssueRequest {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  photo?: File | string; // File for web, string path for mobile
}

export interface UpdateIssueRequest {
  status?: Issue['status'];
  adminNotes?: string;
  assignedDepartment?: string;
}

export interface LoginRequest {
  email: string;
  userType: 'citizen' | 'admin';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}