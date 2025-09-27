import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function AuthErrorPage() {
  const router = useRouter();
  const { error } = router.query;
  const [errorMessage, setErrorMessage] = useState('An unknown authentication error occurred.');

  useEffect(() => {
    if (error) {
      switch (error) {
        case 'OAuthSignin':
          setErrorMessage('There was an error signing in with your OAuth provider. Please try again.');
          break;
        case 'OAuthCallback':
          setErrorMessage('There was an error processing your sign-in. Please try again.');
          break;
        case 'OAuthCreateAccount':
          setErrorMessage('Could not create account with the provided details. Please try again.');
          break;
        case 'EmailCreateAccount':
          setErrorMessage('Could not create account with the provided email. Please try again.');
          break;
        case 'Callback':
          setErrorMessage('An error occurred during the authentication callback. Please try again.');
          break;
        case 'NextAuthSecretMissing':
          setErrorMessage('Authentication configuration error: NEXTAUTH_SECRET is missing in your environment variables.');
          break;
        case 'JwtGenerationFailed':
          setErrorMessage('Authentication error: Failed to generate a secure token. Please try again.');
          break;
        case 'BackendSyncFailed':
          setErrorMessage('Authentication error: Failed to sync your user data with the backend. Please try again.');
          break;
        case 'BackendConnectionError':
          setErrorMessage('Authentication error: Could not connect to the backend server. Please ensure the backend is running and accessible.');
          break;
        case 'SignInError':
          setErrorMessage('An unexpected error occurred during sign-in. Please try again.');
          break;
        case 'AccessDenied':
          setErrorMessage('Access Denied. You do not have permission to access this page.');
          break;
        case 'Verification':
          setErrorMessage('The sign in link is no longer valid. It may have been used already or it has expired.');
          break;
        default:
          setErrorMessage(`An authentication error occurred: ${error}. Please try again.`);
          break;
      }
    }
  }, [error]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#1a1a1a', color: '#e0e0e0', padding: '20px' }}>
      <h1 style={{ fontSize: '3em', marginBottom: '20px', color: '#ff6b6b' }}>Authentication Error</h1>
      <p style={{ fontSize: '1.2em', textAlign: 'center', maxWidth: '600px', lineHeight: '1.5' }}>{errorMessage}</p>
      <button
        onClick={() => router.push('/')}
        style={{
          marginTop: '30px',
          padding: '10px 25px',
          fontSize: '1em',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          textDecoration: 'none',
          transition: 'background-color 0.3s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
      >
        Go to Home
      </button>
    </div>
  );
}