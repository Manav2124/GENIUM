import React from 'react';
import { useRouter } from 'next/router';

export default function ErrorPage() {
  const router = useRouter();
  const { error } = router.query;

  let errorMessage = 'An unexpected error occurred.';
  if (error === 'EmailNotVerified') {
    errorMessage = 'Your email is not verified. Please verify your email to continue.';
  } else if (error === 'SignInError') {
    errorMessage = 'Failed to sign in. Please try again.';
  } else if (error) {
    errorMessage = `Authentication Error: ${error}`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="bg-card p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-red-500 mb-6">{errorMessage}</p>
        <button
          onClick={() => router.push('/auth/signin')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}