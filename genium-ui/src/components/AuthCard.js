import React from 'react';
import { Button } from './ui/button'; // Assuming a Button component exists or will be created
import SocialButton from './SocialButton'; // Reusing the SocialButton component

import { X } from 'lucide-react'; // Import the X icon

function AuthCard({ onClose }) {
  return (
    <div className="relative w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="space-y-6">
        <h3 className="text-xl font-medium text-gray-900 dark:text-white text-center">
          Welcome back
        </h3>
        <p className="text-sm font-medium text-gray-500 dark:text-white text-center">
          Choose your preferred sign in method
        </p>
        <div className="flex flex-col space-y-4">
          <Button className="w-full flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.072 0C5.403 0 0 5.403 0 12.072c0 5.344 3.478 9.809 8.313 11.385.605.111.794-.261.794-.577 0-.285-.011-1.04-.015-2.04-3.384.734-4.109-1.637-4.109-1.637-.553-1.408-1.349-1.786-1.349-1.786-1.097-.757.082-.742.082-.742 1.217.085 1.861 1.247 1.861 1.247 1.08 1.803 2.821 1.282 3.507.981.109-.762.424-1.283 2.04-.69 2.164-.335 2.164-.335.397.986 1.551 1.786 2.859 1.786 3.423 0 6.257-2.245 6.257-5.291 0-.38-.009-1.382-.018-2.722 0 0-1.013.663-2.203 0 0 0-.985-.779-.985-1.925 0-1.587.994-2.905 2.247-2.905 0 .237.328.362.526.362.197 0 .39-.015.583-.053-1.217-.457-4.186-2.287-4.186-5.073 0-1.124.403-2.059 1.057-2.792-.106-.264-.457-1.326.103-2.759 0 0 .869-.281 2.84.981 1.381-.383 2.83-.578 4.279-.578 1.447 0 2.897.194 4.277.573 1.967-1.263 2.835-.981 2.835-.981.561 1.433.211 2.495.105 2.759.654.732 1.056 1.667 1.056 2.791 0 2.791-2.814 4.824-4.182 5.074.2.038.391.053.586.053.197 0 .526-.125.526-.362 1.254 0 2.247 1.317 2.247 2.905 0 1.146-.988 1.925-.988 1.925-1.187.661-2.199 0-2.199 0-.009 1.341-.018 2.343-.018 2.722 0 3.046 2.826 5.291 6.253 5.291z" />
            </svg>
            <span>Continue with Google</span>
          </Button>
          <Button className="w-full flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.17 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.153-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.089 2.91.833.091-.647.35-1.089.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.682-.103-.253-.446-1.27.098-2.65 0 0 .84-.268 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.701.114 2.503.332 1.909-1.293 2.747-1.025 2.747-1.025.546 1.38.202 2.398.099 2.651.64.698 1.028 1.591 1.028 2.682 0 3.841-2.339 4.687-4.566 4.935.359.307.678.915.678 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.18.579.688.482C21.137 20.168 24 16.419 24 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
            </svg>
            <span>Continue with GitHub</span>
          </Button>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-300">OR CONTINUE WITH EMAIL</span>
        </div>
        <div>
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Enter your email</label>
          <input type="email" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@example.com" required />
        </div>
        <Button type="submit" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
          Send Magic Link
        </Button>
        <p className="text-sm text-gray-500 dark:text-gray-300 text-center">
          We'll send you a magic link to your email
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-300 text-center">
          By continuing, you agree to our <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Terms of Service</a> and <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export default AuthCard;