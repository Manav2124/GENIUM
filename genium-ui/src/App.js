import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FileUp, Landmark, ShieldCheck, Zap, Menu, CircleCheckIcon, X } from 'lucide-react';
import { WrapButton } from './components/ui/wrap-button';
import { PricingSection, PLANS } from './components/ui/pricing.tsx';
import AiInputSearch from './components/ui/ai-input.tsx';
import ThemeSwitcher from './components/ThemeSwitcher';
import Footer from './components/Footer';
import AuthCard from './components/AuthCard'; // Import the new AuthCard component
import CardFlip from './components/CardFlip'; // Import the CardFlip component
import CodeModal from './components/CodeModal'; // Import the CodeModal component
import FileUpload from './components/FileUpload'; // Import the FileUpload component
import PrivacySection from './components/PrivacySection'; // Import the PrivacySection component
import './App.css';
import './components/Modal.css'; // Import the modal CSS
import AITextLoading from './components/ui/ai-text-loading';
import { cn } from './lib/utils';


// Helper component for Icons
const FeatureIcon = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-4">
    <div className="bg-background rounded-full p-3 mb-4">
      <Icon className="w-6 h-6 text-google-blue" />
    </div>
    <h3 className="font-medium text-lg mb-1 font-roboto">{title}</h3>
    <p className="text-text-secondary text-sm">{description}</p>
  </div>
);

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('overview'); // 'overview', 'plan', or 'try-genium'
  const [showAuthModal, setShowAuthModal] = useState(false); // New state for auth modal visibility
  const [showCodeModal, setShowCodeModal] = useState(false); // New state for code modal visibility
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [fileProcessed, setFileProcessed] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleAskQuestion = async (question) => {
    if (!question.trim()) {
      setError('Please enter a question');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!fileProcessed) {
      setError('Please upload and process a document first');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setCurrentQuestion(question);
    setIsAsking(true);
    setError('');
    setAnswer('');

    try {
      const response = await axios.post('http://localhost:5001/api/ask', { question });
      setAnswer(response.data.answer);
    } catch (err) {
      setError('Sorry, something went wrong while getting the answer.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsAsking(false);
    }
  };

  const handleUpload = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setError('');

    try {
      await axios.post('http://localhost:5001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFileProcessed(true);
      setShowUploadSuccess(true);
    } catch (err) {
      setError('Failed to upload and process file.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Handler functions for card flip options
  const handleCodeClick = () => {
    setShowCodeModal(true);
  };

  const handleDocumentQAClick = () => {
    setCurrentPage('document-qa');
  };

  const handleFileUpload = useCallback((selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or text file');
      return;
    }

    // Validate file size (200MB)
    if (selectedFile.size > 200 * 1024 * 1024) {
      setError('File size must be less than 200MB');
      return;
    }

    setFileProcessed(false);
    setError('');
    handleUpload(selectedFile);
  }, [handleUpload]);


  // Handler for Try GENIUM button click
  const handleTryGeniumClick = () => {
    setCurrentPage('try-genium');
  };

  const handleBackToExplore = () => {
    setCurrentPage('try-genium');
  };

  const handleBackToOverview = () => {
    setCurrentPage('overview');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header>
            <nav
                data-state={menuOpen && 'active'}
                className="fixed z-20 w-full px-2 group">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-10 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto lg:justify-self-start">
                            <a
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <h1 className="text-xl font-medium text-foreground font-melodrama-bold genium-logo-width">GENIUM</h1>
                            </a>

                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                aria-label={menuOpen === true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="hidden lg:block">
                            <ul className="flex gap-8 text-sm">
                                <li>
                                    <button
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                                          currentPage === 'overview' ? 'bg-muted text-foreground' : 'text-foreground hover:bg-muted'
                                        }`}
                                        onClick={() => setCurrentPage('overview')}
                                      >
                                        Overview
                                      </button>
                                </li>
                                <li>
                                    <button
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                                          currentPage === 'plan' ? 'bg-muted text-foreground' : 'text-foreground hover:bg-muted'
                                        }`}
                                        onClick={() => setCurrentPage('plan')}
                                      >
                                        Plan
                                      </button>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:justify-self-end lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    <li>
                                        <button
                                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                              currentPage === 'overview' ? 'bg-muted text-foreground' : 'text-foreground hover:bg-muted'
                                            }`}
                                            onClick={() => setCurrentPage('overview')}
                                          >
                                            Overview
                                          </button>
                                    </li>
                                    <li>
                                        <button
                                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                              currentPage === 'plan' ? 'bg-muted text-foreground' : 'text-foreground hover:bg-muted'
                                            }`}
                                            onClick={() => setCurrentPage('plan')}
                                          >
                                            Plan
                                          </button>
                                    </li>
                                </ul>
                            </div>
                            <div className="flex w-full items-center flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <ThemeSwitcher />
                                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit" onClick={() => setShowAuthModal(true)}>
                                    {isScrolled ? (
                                      <button
                                        className="bg-primary text-primary-foreground px-4 py-2 rounded-google font-medium hover:bg-primary/90 transition-colors"
                                      >
                                        Get Started
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          className="px-4 py-2 rounded-google font-medium transition-colors hover:bg-muted"
                                        >
                                          Login
                                        </button>
                                        <button
                                          className="bg-primary text-primary-foreground px-4 py-2 rounded-google font-medium hover:bg-primary/90 transition-colors"
                                        >
                                          Sign Up
                                        </button>
                                      </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>

      <div>
        {/* NotebookLM-style Sidebar */}
        <aside className={`w-0 md:w-0 bg-surface dark:bg-surface-dark p-0 flex flex-col transition-all duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:static top-14 bottom-0 z-20`}>
          <div className="flex-1 overflow-y-auto space-y-1">
            {/* Sidebar items removed for cleaner UI */}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`${showAuthModal ? 'blur-active' : ''}`}>
          {currentPage === 'overview' && (
            <>
              {/* Hero Section - NotebookLM Style */}
              <section className="flex flex-col items-center justify-center text-center pt-48 pb-16 px-6 max-w-3xl mx-auto">
                <div className="text-5xl md:text-7xl font-medium mb-4 text-text-primary dark:text-white font-roboto flex flex-col items-center">
                  <span>Understand</span>
                  <span className="gradient-text">anything</span>
                </div>
                <p className="text-lg text-text-secondary dark:text-gray-300 mb-8 max-w-xl">
                  Your research and thinking partner, grounded in the information that you trust, built with the latest GENIUM models.
                </p>
                {/* Replaced Try GENIUM Button with WrapButton */}
                <div className="flex justify-center">
                  <WrapButton className="mt-4" onClick={handleTryGeniumClick}>
                    Try Genium
                  </WrapButton>
                </div>
              </section>

              {/* Features Section - NotebookLM Style */}
              <section className="py-12 bg-surface dark:bg-surface-dark">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6">
                  <FeatureIcon icon={FileUp} title="Upload" description="Easily upload your files and documents for instant analysis." />
                  <FeatureIcon icon={Landmark} title="Knowledge" description="Tap into a vast knowledge base for accurate answers." />
                  <FeatureIcon icon={ShieldCheck} title="Privacy" description="Your data is secure and private, always." />
                  <FeatureIcon icon={Zap} title="Fast" description="Get instant responses powered by advanced AI." />
                </div>
              </section>
              <PrivacySection />
            </>
          )}

          {/* Try GENIUM Page with Two Separate Card Flips */}
          {currentPage === 'try-genium' && (
            <div className="min-h-screen flex flex-col items-center justify-center py-16 px-6 pt-32">
              {/* Back Button */}
              <div className="w-full max-w-6xl mb-8">
                <button
                  onClick={() => setCurrentPage('overview')}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  ← Back to Overview
                </button>
              </div>

              {/* Page Title */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary dark:text-white">
                  Explore GENIUM
                </h1>
                <p className="text-lg text-text-secondary dark:text-gray-300 max-w-2xl">
                  Choose the feature you'd like to experience. Click any card to flip and explore our AI-powered tools.
                </p>
              </div>

              {/* Two Card Flip Components */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* Prompt to Code Card */}
                <div className="flex justify-center">
                  <CardFlip
                    type="prompt-to-code"
                    onActionClick={handleCodeClick}
                  />
                </div>

                {/* Documents Q&A Card */}
                <div className="flex justify-center">
                  <CardFlip
                    type="document-qa"
                    onActionClick={handleDocumentQAClick}
                  />
                </div>
              </div>
            </div>
          )}
    
          {/* Code Modal */}
          {showCodeModal && (
            <CodeModal
              code={`// Example Code Snippet
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('Genium User');

// AI-powered code assistance
// Get suggestions, explanations, and improvements
// Powered by the latest GENIUM models`}
              onClose={() => setShowCodeModal(false)}
            />
          )}

          {currentPage === 'plan' && (
            <div className="flex min-h-screen items-center justify-center py-32">
              <PricingSection
                plans={PLANS}
                heading="Plans that Scale with You"
                description="Whether you're just starting out or growing fast, our flexible pricing has you covered — with no hidden costs."
              />
            </div>
          )}

          {currentPage === 'document-qa' && (
            <div className="document-qa-page flex flex-col h-full p-6 pt-32">
              {/* Back Button */}
              <div className="w-full max-w-7xl mx-auto mb-4">
                <button
                  onClick={handleBackToExplore}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  ← Back to Explore
                </button>
              </div>

              <div className="flex-grow flex gap-6 max-w-7xl mx-auto w-full">
                {/* Left Column */}
                <div className="w-1/3 flex flex-col gap-6">
                  <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4">Upload Document</h2>
                    <FileUpload
                      onUploadSuccess={handleFileUpload}
                      onUploadStart={() => {
                        setShowUploadSuccess(false);
                      }}
                      onFileRemove={() => {
                        setFileProcessed(false);
                        setShowUploadSuccess(false);
                      }}
                    />
                    {isUploading && (
                        <div className="flex items-center justify-center p-4">
                            <p>Uploading file...</p>
                        </div>
                    )}
                    {showUploadSuccess && !isUploading && (
                      <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg px-6 py-3 flex items-center justify-center transition-opacity duration-300 z-20 my-4">
                        <CircleCheckIcon className="me-3 -mt-0.5 inline-flex text-emerald-500" size={20} aria-hidden="true" />
                        <span className="text-sm text-gray-900 dark:text-white">The file has been uploaded successfully!</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 flex-grow border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4">Ask a Question</h2>
                    <AiInputSearch
                      onSend={handleAskQuestion}
                      disabled={!fileProcessed || isUploading || isAsking}
                      placeholder="Ask a question about the document..."
                    />
                    {error && (
                      <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 mt-4">
                        {error}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="w-2/3 bg-surface dark:bg-surface-dark rounded-lg p-6 flex flex-col border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-4">Response</h2>
                  <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/50 rounded-md p-4 border border-gray-200 dark:border-gray-700">
                    {isAsking && (
                      <div className="flex items-center justify-center h-full">
                        <AITextLoading />
                      </div>
                    )}
                    {!isAsking && answer && (
                      <div>
                        <p className="font-bold text-text-primary mb-2">{currentQuestion}</p>
                        <p className="text-text-primary whitespace-pre-wrap">{answer}</p>
                      </div>
                    )}
                    {!isAsking && !answer && (
                      <div className="flex items-center justify-center h-full text-text-secondary">
                        <p>The answer will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="relative">
            <AuthCard onClose={() => setShowAuthModal(false)} /> {/* Pass onClose prop */}
          </div>
        </div>
      )}

      {currentPage !== 'plan' && currentPage !== 'try-genium' && currentPage !== 'document-qa' && <Footer setCurrentPage={setCurrentPage} />}
    </div>
  );
}
