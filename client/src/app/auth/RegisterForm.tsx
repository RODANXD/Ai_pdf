
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface RegisterFormProps {
  onToggle: () => void;
}

export default function RegisterForm({ onToggle }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirm_password
        }),
      });

      const data = await response.json();
      

      if (response.ok) {
        setSuccess('Registration successful! Please sign in.');
        setTimeout(() => {
          onToggle();
        }, 1500);
      } else {
        setError(data.message || 'Registration failed');
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
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

      <form onSubmit={handleSubmit} className="space-y-3">
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
            <i className="ri-user-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
              placeholder="Username"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="relative">
              <i className="ri-user-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                placeholder="First Name"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <i className="ri-user-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
                placeholder="Last Name"
              />
            </div>
          </div>
        </div>

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

        <div>
          <div className="relative">
            <i className="ri-lock-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50"
              placeholder="Confirm Password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-full font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
        </button>
      </form>
    </motion.div>
  );
}
