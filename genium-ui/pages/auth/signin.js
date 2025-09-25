import React from 'react';
import AuthCard from '../../src/components/AuthCard'; // Adjust path as needed
import SessionProviderWrapper from '../../src/components/SessionProviderWrapper'; // Import SessionProviderWrapper

export default function SignInPage() {
  return (
    <SessionProviderWrapper>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AuthCard />
      </div>
    </SessionProviderWrapper>
  );
}