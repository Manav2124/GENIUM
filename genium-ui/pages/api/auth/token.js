import { getToken, encode } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the raw JWT token from cookies
    const cookies = req.cookies;
    const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];

    if (!sessionToken) {
      console.log('Token API: No session token found in cookies');
      console.log('Token API: Available cookies:', Object.keys(cookies));
      console.log('Token API: All cookies:', cookies);
      return res.status(401).json({ error: 'No session token found. Please log in.' });
    }

    console.log('Token API: Retrieved raw JWT from cookie, length:', sessionToken.length);
    console.log('Token API: JWT starts with:', sessionToken.substring(0, 20) + '...');
    console.log('Token API: Full JWT (first 100 chars):', sessionToken.substring(0, 100) + '...');
    console.log('Token API: JWT ends with:', sessionToken.substring(sessionToken.length - 20) + '...');
    console.log('Token API: JWT has', sessionToken.split('.').length, 'parts');

    // Verify the token to ensure it's valid
    const decoded = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!decoded) {
      console.log('Token API: Token verification failed - decoded is null/undefined');
      console.log('Token API: Request headers:', req.headers);
      console.log('Token API: Request cookies keys:', Object.keys(req.cookies || {}));
      return res.status(401).json({ error: 'Token verification failed. Please log in again.' });
    }

    console.log('Token API: Token verified successfully');
    console.log('Token API: Decoded token keys:', Object.keys(decoded));
    console.log('Token API: Decoded token sub:', decoded.sub);
    console.log('Token API: Decoded token userId:', decoded.userId);
    console.log('Token API: Decoded token exp:', decoded.exp ? new Date(decoded.exp * 1000) : 'No exp');

    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.log('Token API: Token is expired');
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }

    // Return the raw JWT token string
    res.status(200).json({ token: sessionToken });
  } catch (error) {
    console.error('Token API: Error getting token:', error.message);
    console.error('Token API: Error name:', error.name);
    console.error('Token API: Error stack:', error.stack);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid JWT token format' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Token not yet valid' });
    }

    res.status(500).json({ error: 'Internal server error retrieving token' });
  }
}