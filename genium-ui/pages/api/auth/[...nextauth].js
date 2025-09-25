import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: profile.email.split('@')[0],
          email_verified: profile.email_verified, // Add email_verified to the profile
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    // Note: accessToken removed from JWT to prevent cookie size limits
    // that could cause JWT truncation and invalid token format errors
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log("signIn callback", { user, account, profile, email, credentials });
      try {
        // Log successful authentication
        console.log(`User ${user.email} signed in with ${account.provider}`);
        if (account.provider === "google" && !profile.email_verified) { // Use profile.email_verified
          console.log("Google sign-in failed: Email not verified");
          return '/auth/error?error=EmailNotVerified'; // Redirect to error page with specific error
        }

        // Send user data to the backend for storage in MongoDB
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5002';
        const nextAuthSecret = process.env.NEXTAUTH_SECRET; // Declare once here
        if (!nextAuthSecret) {
          console.error("NEXTAUTH_SECRET is not defined in the environment variables.");
          return '/auth/error?error=NextAuthSecretMissing';
        }

        let tokenToSend = null;
        try {
          tokenToSend = jwt.sign(
            { sub: String(user.id), email: user.email, name: user.name, picture: user.image },
            nextAuthSecret,
            { algorithm: 'HS256', expiresIn: '1h' } // Explicitly set algorithm to HS256
          );
          console.log(`Generated custom HS256 JWT for backend authentication for user ${user.email}.`);
        } catch (jwtError) {
          console.error('Error generating custom JWT:', jwtError);
          return '/auth/error?error=JwtGenerationFailed';
        }

        try {
          const response = await fetch(`${backendUrl}/api/user/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenToSend}`
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
              provider_id: user.id,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Backend user sync failed:', errorData.error);
            return '/auth/error?error=BackendSyncFailed';
          }
          console.log('Backend user data synced successfully.');
        } catch (backendError) {
          console.error('Error calling backend user sync API:', backendError);
          return '/auth/error?error=BackendConnectionError';
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return '/auth/error?error=SignInError'; // Redirect to error page with generic error
      }
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id; // Keep sub for NextAuth compatibility
        token.userId = user.id; // Add userId claim for backend
      }
      // Remove accessToken from JWT to reduce size and prevent cookie truncation
      // if (account) {
      //   token.accessToken = account.access_token;
      //   token.provider = account.provider;
      // }
      // Store the JWT token itself for backend authentication
      // This will be the encoded JWT that gets passed to the backend
      return token;
    },
    async session({ session, token }) {
      // Remove accessToken from session since it's not used and was removed from JWT
      // session.accessToken = token.accessToken;
      // session.provider = token.provider;
      session.user.id = token.id;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard or profile after sign in
      // The default redirect is to the page the user was on, or to the baseUrl
      // We want to redirect to a specific page like /dashboard or /profile
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl + '/dashboard'; // Or '/profile'
    },
  },
  events: {
    async signIn(message) {
      console.log('Sign in event:', message);
    },
    async signOut(message) {
      console.log('Sign out event:', message);
    },
    async error(error) {
      console.error('Authentication error:', error);
      // You can log the error message or redirect to a custom error page
      // For example, redirect to '/auth/error?error=' + error.message
    },
  },
};

export default NextAuth(authOptions);