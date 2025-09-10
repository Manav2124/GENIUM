import React from 'react';

const PrivacySection = () => {
  return (
    <section className="py-16 bg-surface dark:bg-surface-dark">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text-primary dark:text-white">
            Your Privacy Matters
          </h2>
          <p className="text-lg text-text-secondary dark:text-gray-300 max-w-3xl mx-auto">
            We are committed to protecting your privacy and ensuring your data remains secure.
            Our privacy-first approach means your information stays yours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-text-primary dark:text-white">Data Encryption</h3>
            <p className="text-text-secondary dark:text-gray-300">
              All your data is encrypted in transit and at rest using industry-standard encryption protocols.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-text-primary dark:text-white">No Data Sharing</h3>
            <p className="text-text-secondary dark:text-gray-300">
              We never sell, share, or rent your personal information to third parties without your consent.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-text-primary dark:text-white">Fast & Secure</h3>
            <p className="text-text-secondary dark:text-gray-300">
              Experience lightning-fast performance with enterprise-grade security measures in place.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacySection;