import React from 'react';

function SignInCard() {
  return (
    <div className="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700">
      <form className="space-y-6" action="#">
        <h3 className="text-xl font-medium text-gray-900 dark:text-white">
          Welcome back
        </h3>
        <p className="text-sm font-medium text-gray-500 dark:text-white">
          Choose your preferred sign in method
        </p>
        <div>
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
          <input type="email" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@company.com" required />
        </div>
        <div>
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your password</label>
          <input type="password" name="password" id="password" placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
        </div>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input id="remember" type="checkbox" value="" className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800" required />
          </div>
          <label htmlFor="remember" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Remember me</label>
        </div>
        <button type="submit" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Sign in</button>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
          Not registered? <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Create account</a>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-300">Or continue with</span>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <a href="#" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.669 9.116 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.479 1.191-3.977 3.932-3.977 1.143 0 1.743.085 1.987.122v2.845h-1.666c-.969 0-1.264.487-1.264 1.236v1.547h2.533l-.398 2.987h-2.135v6.987C18.331 21.116 22 16.991 22 12z" clipRule="evenodd" />
            </svg>
            <span className="sr-only">Facebook</span>
          </a>
          <a href="#" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.139-.002-.276-.006-.413A8.345 8.345 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.807-2.278 8.224 8.224 0 01-2.605.996 4.127 4.127 0 00-6.993 3.703 11.662 11.662 0 01-8.457-4.287 4.109 4.109 0 001.27 5.495 4.105 4.105 0 01-1.856-.513v.052a4.102 4.102 0 003.292 4.022 4.094 4.094 0 01-1.855.072 4.149 4.149 0 003.834 2.85A8.25 8.25 0 012 18.384 11.64 11.64 0 008.29 20.251z" />
            </svg>
            <span className="sr-only">Twitter</span>
          </a>
          <a href="#" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.072 0C5.403 0 0 5.403 0 12.072c0 5.344 3.478 9.809 8.313 11.385.605.111.794-.261.794-.577 0-.285-.011-1.04-.015-2.04-3.384.734-4.109-1.637-4.109-1.637-.553-1.408-1.349-1.786-1.349-1.786-1.097-.757.082-.742.082-.742 1.217.085 1.861 1.247 1.861 1.247 1.08 1.803 2.821 1.282 3.507.981.109-.762.424-1.283 2.04-.69 2.164-.335 2.164-.335.397.986 1.551 1.786 2.859 1.786 3.423 0 6.257-2.245 6.257-5.291 0-.38-.009-1.382-.018-2.722 0 0-1.013.663-2.203 0 0 0-.985-.779-.985-1.925 0-1.587.994-2.905 2.247-2.905 0 .237.328.362.526.362.197 0 .39-.015.583-.053-1.217-.457-4.186-2.287-4.186-5.073 0-1.124.403-2.059 1.057-2.792-.106-.264-.457-1.326.103-2.759 0 0 .869-.281 2.84.981 1.381-.383 2.83-.578 4.279-.578 1.447 0 2.897.194 4.277.573 1.967-1.263 2.835-.981 2.835-.981.561 1.433.211 2.495.105 2.759.654.732 1.056 1.667 1.056 2.791 0 2.791-2.814 4.824-4.182 5.074.2.038.391.053.586.053.197 0 .526-.125.526-.362 1.254 0 2.247 1.317 2.247 2.905 0 1.146-.988 1.925-.988 1.925-1.187.661-2.199 0-2.199 0-.009 1.341-.018 2.343-.018 2.722 0 3.046 2.826 5.291 6.253 5.291z" />
            </svg>
            <span className="sr-only">Google</span>
          </a>
        </div>
      </form>
    </div>
  );
}

export default SignInCard;