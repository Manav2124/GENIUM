'use client';

import React, { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

const AuthCard = ({ onClose }) => {
  const { data: session, status } = useSession();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle authentication logic here
    console.log('Form submitted:', formData);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  if (status === 'loading') {
    return (
      <div className="bg-black rounded-lg shadow-xl max-w-md w-full mx-auto py-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (session) {
    const user = session.user;
    const avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || 'User')}&background=random&color=fff&size=64`;

    return (
      <div className="bg-black rounded-xl shadow-2xl max-w-md w-full mx-auto overflow-hidden">
        <div className="py-4">
          <div className="flex justify-center items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              Welcome Back!
            </h2>
          </div>

          <div className="text-center mb-4">
            <div className="relative inline-block mb-4">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full mx-auto border-4 border-primary/20 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            <h3 className="text-xl font-semibold text-text-primary dark:text-white mb-1">
              {user.name || user.username || 'User'}
            </h3>
            <p className="text-sm text-text-secondary dark:text-gray-300 mb-2">
              {user.email ? user.email : 'No email provided'}
            </p>
            <p className="text-xs text-text-secondary dark:text-gray-400">
              Signed in successfully
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                // Navigate to profile
                // For now, just close the modal
                onClose();
              }}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center space-x-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>View Profile</span>
            </button>

            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-2xl shadow-2xl max-w-md w-full mx-auto py-4 relative">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-white">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-700 rounded-xl bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email address"
            required
            autoComplete="username"
          />
        </div>

        <div>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-700 rounded-xl bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
            required
            autoComplete="current-password"
          />
        </div>

        {isSignUp && (
          <div>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-700 rounded-xl bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm Password"
              required
              autoComplete="new-password"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-white text-gray-900 py-2 px-4 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-lg"
        >
          {isSignUp ? 'Create Account' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={toggleMode}
          className="text-blue-400 hover:underline text-sm"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>

        <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-black text-gray-400 uppercase text-xs font-semibold">Or continue with</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <button onClick={() => { console.log("AuthCard: Attempting to sign in with Google"); signIn('google'); }} className="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-700 rounded-xl bg-black text-white font-medium hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => { console.log("AuthCard: Attempting to sign in with GitHub"); signIn('github'); }}
            className="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-700 rounded-xl bg-black text-white font-medium hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.82c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.65.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
            </svg>
            <span>Continue with GitHub</span>
          </button>
        </div>
      </div>
    
  );
};

export default AuthCard;