import React, { useEffect, useRef } from 'react';

const PrivacySection = () => {
  const sectionRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            // Add animation class with delay based on index
            setTimeout(() => {
              entry.target.classList.add('animate-in');
            }, index * 300); // 300ms delay between each item
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Observe each item
    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  const getAnimationClass = (index) => {
    const directions = ['slide-in-left', 'slide-in-bottom', 'slide-in-right'];
    return directions[index % directions.length];
  };

  return (
    <section ref={sectionRef} className="py-16 bg-surface dark:bg-surface-dark">
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
          <div
            ref={(el) => (itemRefs.current[0] = el)}
            className={`text-center p-6 opacity-0 transform translate-x-[-100px] transition-all duration-1000 ease-out ${getAnimationClass(0)}`}
          >
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

          <div
            ref={(el) => (itemRefs.current[1] = el)}
            className={`text-center p-6 opacity-0 transform translate-y-[100px] transition-all duration-1000 ease-out ${getAnimationClass(1)}`}
          >
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

          <div
            ref={(el) => (itemRefs.current[2] = el)}
            className={`text-center p-6 opacity-0 transform translate-x-[100px] transition-all duration-1000 ease-out ${getAnimationClass(2)}`}
          >
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

      <style jsx>{`
        .slide-in-left.animate-in {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }

        .slide-in-bottom.animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .slide-in-right.animate-in {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }
      `}</style>
    </section>
  );
};

export default PrivacySection;