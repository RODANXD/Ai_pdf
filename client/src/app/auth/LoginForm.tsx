
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/Authcontext';
interface LoginFormProps {
  onToggle: () => void;
}

export default function LoginForm({ onToggle }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const router = useRouter();
  const { login } = useAuth();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Login successful!');
        localStorage.setItem('access_token', data.access_token);
        login(data.access_token);
        router.push('/dashboard');
        // Handle successful login (redirect, etc.)
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h1>
        <div className="flex justify-center space-x-4 mb-6">
          <button className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200">
            <i className="ri-facebook-fill text-blue-600"></i>
          </button>
          <button className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200">
            <i className="ri-google-fill text-red-500"></i>
          </button>
          <button className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200">
            <i className="ri-linkedin-fill text-blue-700"></i>
          </button>
        </div>
        <p className="text-gray-600 text-sm">or use your email for registration</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div>
          <div className="relative">
            <i className="ri-mail-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
              placeholder="Email"
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <i className="ri-lock-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
              placeholder="Password"
            />
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200"
          >
            Forgot your password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-full font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
        </button>
      </form>
    </motion.div>
  );
}
