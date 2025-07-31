import React from 'react';

const PrivacySection = () => {
  return (
    <div className="py-12 md:py-20 lg:py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            We value your privacy and do not use your personal data to train GENIUM.
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            GENIUM does not use your personal data, including your source uploads, queries and the responses from the model for training.
          </p>
        </div>
        <div className="mt-12 flex justify-center items-center">
          <div className="relative flex justify-center items-center w-64 h-64">
            <div className="absolute w-full h-full border-2 border-gray-200 dark:border-gray-700 rounded-full animate-spin-slow"></div>
            <div className="absolute w-48 h-48 border-2 border-gray-200 dark:border-gray-700 rounded-full animate-spin-slow animation-delay-2000"></div>
            <div className="absolute w-32 h-32 border-2 border-gray-200 dark:border-gray-700 rounded-full animate-spin-slow animation-delay-4000"></div>
            <div className="absolute bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-8 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-5.197M15 21a6 6 0 00-9-5.197" />
              </svg>
            </div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-8 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySection;