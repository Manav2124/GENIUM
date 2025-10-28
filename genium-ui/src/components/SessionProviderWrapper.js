'use client';

import { SessionProvider } from 'next-auth/react'; 

export default function SessionProviderWrapper({ children }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}