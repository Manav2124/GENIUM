'use client';

import React, { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export default function Profile({ onLoginClick }) {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn('github')}
        className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted"
      >
        Login
      </button>
    );
  }

  const user = session.user;
  const avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || 'User')}&background=random&color=fff&size=40`;

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors duration-200"
      >
        <img
          src={avatarUrl}
          alt="User Avatar"
          className="w-10 h-10 rounded-full border-2 border-transparent hover:border-primary/20 transition-colors duration-200"
        />
        <span className="hidden md:block truncate max-w-32">{user.name || user.username || 'User'}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface dark:bg-surface-dark rounded-xl shadow-2xl border border-border z-50 overflow-hidden">
          <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="User Avatar"
                  className="w-14 h-14 rounded-full border-2 border-primary/20 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-white truncate">
                  {user.name || user.username || 'User'}
                </p>
                <p className="text-xs text-text-secondary dark:text-gray-400">
                  Welcome back!
                </p>
              </div>
            </div>
          </div>
          <div className="py-2">
            <button
              onClick={() => {
                setDropdownOpen(false);
                // Navigate to dashboard
                window.location.href = '/dashboard';
              }}
              className="flex items-center w-full text-left px-4 py-3 text-sm text-text-primary dark:text-gray-300 hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                setProfileModalOpen(true);
              }}
              className="flex items-center w-full text-left px-4 py-3 text-sm text-text-primary dark:text-gray-300 hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                signOut();
              }}
              className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}

      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-text-primary dark:text-white text-center">Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="relative">
              <img
                src={avatarUrl}
                alt="User Avatar"
                className="w-24 h-24 rounded-full border-4 border-primary/20 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-text-primary dark:text-white">
                {user.name || user.username || 'User'}
              </h3>
              <p className="text-text-secondary dark:text-gray-400">
                {user.email}
              </p>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={() => {
                  setProfileModalOpen(false);
                  window.location.href = '/dashboard';
                }}
                className="w-full flex items-center justify-center px-4 py-3 bg-accent/10 dark:bg-accent/5 hover:bg-accent/20 dark:hover:bg-accent/10 rounded-lg text-text-primary dark:text-gray-300 transition-colors duration-150"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                Go to Dashboard
              </button>

              <button
                onClick={() => {
                  setProfileModalOpen(false);
                  signOut();
                }}
                className="w-full flex items-center justify-center px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors duration-150"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}