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
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
            <div className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
              <img
                src={avatarUrl}
                alt="User Avatar"
                className="w-8 h-8 rounded-full mr-3"
              />
              <div>
                <p className="font-medium">{user.name || user.username || 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Welcome back!</p>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
            <button
              onClick={() => {
                setDropdownOpen(false);
                setProfileModalOpen(true);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              role="menuitem"
            >
              <svg className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                signOut();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              role="menuitem"
            >
              <svg className="w-4 h-4 mr-3 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}

      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-[280px] bg-white dark:bg-gray-800 p-0 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 h-20 flex items-center justify-center">
            <img
              src={avatarUrl}
              alt="User Avatar"
              className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover absolute -bottom-12"
            />
          </div>
          <div className="pt-14 pb-6 px-4 flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {user.name || user.username || 'User'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {user.email}
            </p>

            <div className="w-full px-2 mt-4">
              <button
                onClick={() => {
                  setProfileModalOpen(false);
                  signOut();
                }}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-md text-base"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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