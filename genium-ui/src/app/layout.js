import { Inter } from 'next/font/google';
import './global.css'
import SessionProviderWrapper from '../components/SessionProviderWrapper';
import { UserDataProvider } from '../components/UserDataContext';
import { getSession } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Footer } from '../components/Footer.tsx';
import { Github, Twitter, Youtube } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Genium AI',
  description: 'AI-powered document analysis and code assistance',
};

export default async function RootLayout({ children }) {
  const session = await getSession();
  const userId = session?.user?.id || null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProviderWrapper>
            <UserDataProvider userId={userId}>
              {children}
              <Footer
                brandName="GENIUM"
                socialLinks={[
                  {
                    icon: <Twitter className="h-5 w-5" />,
                    href: "https://twitter.com",
                    label: "Twitter",
                  },
                  {
                    icon: <Youtube className="h-5 w-5" />,
                    href: "https://youtube.com",
                    label: "YouTube",
                  },
                  {
                    icon: <Github className="h-5 w-5" />,
                    href: "https://github.com",
                    label: "GitHub",
                  },
                ]}
                mainLinks={[
                  { href: "/", label: "Home" },
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/plan", label: "Pricing" },
                  { href: "/code-assistance", label: "Code Assistance" },
                  { href: "/docs", label: "Docs" },
                ]}
                legalLinks={[
                  { href: "/privacy", label: "Privacy Policy" },
                  { href: "#", label: "Terms of Service" },
                  { href: "#", label: "Cookie Policy" },
                ]}
                copyright={{
                  text: "© 2025 GENIUM. All rights reserved.",
                }}
              />
            </UserDataProvider>
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}