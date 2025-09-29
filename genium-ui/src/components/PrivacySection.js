import React from 'react';

const PrivacySection = () => {
  return (
    <section className="py-16 bg-surface dark:bg-surface-dark">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-center text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text-primary dark:text-white max-w-4xl">
        Genium is committed to protecting your privacy and will never use your personal data for AI training or analytics.
      </h2>
    </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer circle */}
            <div className="absolute w-full h-full rounded-full border border-dashed border-gray-500 dark:border-gray-400 animate-spin-slow" style={{ animationDuration: '20s' }}></div>
            {/* Middle circle */}
            <div className="absolute w-48 h-48 rounded-full border border-dashed border-gray-400 dark:border-gray-500 animate-spin-slow" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
            {/* Inner circle */}
            <div className="absolute w-32 h-32 rounded-full border border-dashed border-gray-300 dark:border-gray-600 animate-spin-slow" style={{ animationDuration: '10s' }}></div>

            {/* Central Lock Icon */}
            <div className="relative w-24 h-24 bg-primary dark:bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            {/* Smaller Icons positioned around the central icon */}
            {/* People Icon */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h-1.5a4.5 4.5 0 00-9 0H7m-2.5 0h-1.5a4.5 4.5 0 01-9 0H2m10-10a4 4 0 100-8 4 4 0 000 8zM7 13a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacySection;