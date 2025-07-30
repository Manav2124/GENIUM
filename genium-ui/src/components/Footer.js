import React, { useEffect, useState } from 'react';

const Footer = ({ setCurrentPage }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

  useEffect(() => {
    setTheme(localStorage.getItem('theme') || 'system');
  }, []);

  const bgColor = 'bg-background';
  const textColor = 'text-foreground';

  return (
    <footer className={`py-12 ${bgColor} ${textColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Description */}
          <div className="col-span-1 md:col-span-2">
            <video loop autoPlay muted width="320" height="240" style={{borderRadius: '50px'}}>
              <source src="/videos/video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-lg font-semibold mb-4">PRODUCT</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Component Library</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Design System</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Pro Features <span className="bg-green-500 text-xs px-2 py-0.5 rounded-full">New</span></a></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">COMPANY</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">License</a></li>
            </ul>
          </div>


          {/* Column 4: Resources */}
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} <span className="text-xl font-medium text-foreground font-melodrama-bold genium-logo-width">GENIUM</span>. Crafting the future of web interfaces.
          </p>
          <button className="bg-white text-black px-6 py-3 rounded-full flex items-center space-x-2 hover:bg-gray-200 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg" onClick={() => setCurrentPage('plan')} >
           <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v2.102a1 1 0 01-.8.98L7 6.994V10h4a1 1 0 01.8.4L14 13.596V18a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2.102a1 1 0 01.8-.98L13 13.006V10H9a1 1 0 01-.8-.4L6 6.404V2a1 1 0 011-1h2a1 1 0 011 1v2.102a1 1 0 01-.8.98L7 6.994V10h4a1 1 0 01.8.4L14 13.596V18a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2.102a1 1 0 01.8-.98L13 13.006V10H9a1 1 0 01-.8-.4L6 6.404V2a1 1 0 011-1h2a1 1 0 011 1v2.102a1 1 0 01-.8.98L7 6.994V10h4a1 1 0 01.8.4L14 13.596V18a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2.102a1 1 0 01.8-.98L13 13.006V10H9a1 1 0 01-.8-.4L6 6.404V2a1 1 0 011-1h2a1 1 0 011 1z" clipRule="evenodd" />
            </svg>
            <span>Upgrade to Pro</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;