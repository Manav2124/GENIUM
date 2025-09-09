import { Inter } from 'next/font/google';
import './globals.css'
import SessionProviderWrapper from '../components/SessionProviderWrapper';
import { UserDataProvider } from '../components/UserDataContext';
import { getSession } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Genium AI',
  description: 'AI-powered document analysis and code assistance',
};

export default async function RootLayout({ children }) {
  const session = await getSession();
  const userId = session?.user?.id || null;

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <UserDataProvider userId={userId}>
            {children}
          </UserDataProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}