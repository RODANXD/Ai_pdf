import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const authApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  access_token?: string;
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await authApi.post('/auth/login', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await authApi.post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

};