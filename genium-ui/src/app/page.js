'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Import useRouter

// Dynamically import components that might cause SSR issues
const ThemeSwitcher = dynamic(() => import('../components/ThemeSwitcher'), { ssr: false });
const Profile = dynamic(() => import('../components/Profile'), { ssr: false });
const WrapButton = dynamic(() => import('../components/ui/wrap-button'), { ssr: false });
const PricingSection = dynamic(() => import('../components/ui/pricing.tsx').then(mod => ({ default: mod.PricingSection })), { ssr: false });
const AiInputSearch = dynamic(() => import('../components/ui/ai-input.tsx'), { ssr: false });
const CardFlip = dynamic(() => import('../components/CardFlip'), { ssr: false });
const CodeModal = dynamic(() => import('../components/CodeModal'), { ssr: false });
const CodeAssistancePage = dynamic(() => import('../components/CodeAssistancePage'), { ssr: false });
const FileUpload = dynamic(() => import('../components/FileUpload'), { ssr: false });
const PrivacySection = dynamic(() => import('../components/PrivacySection'), { ssr: false });
const DocsPage = dynamic(() => import('../components/DocsPage'), { ssr: false });
const AITextLoading = dynamic(() => import('../components/ui/ai-text-loading'), { ssr: false });
const AuthCard = dynamic(() => import('../components/AuthCard'), { ssr: false });
const Dialog = dynamic(() => import('../components/ui/dialog').then(mod => mod.Dialog), { ssr: false });
const DialogContent = dynamic(() => import('../components/ui/dialog').then(mod => mod.DialogContent), { ssr: false });
const DialogTrigger = dynamic(() => import('../components/ui/dialog').then(mod => mod.DialogTrigger), { ssr: false });
const DialogHeader = dynamic(() => import('../components/ui/dialog').then(mod => mod.DialogHeader), { ssr: false });
const DialogTitle = dynamic(() => import('../components/ui/dialog').then(mod => mod.DialogTitle), { ssr: false });
// const LiquidButton = dynamic(() => import('../components/ui/liquid-glass-button').then(mod => ({ default: mod.LiquidButton })), { ssr: false });
import { FileUp, Landmark, ShieldCheck, Zap, Menu, CircleCheckIcon, X, Globe, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { uploadFileToBackend, askDocumentQuestion, askQuestionWithGlobalSearch } from '../utils/api'; // Import the API functions
import './FeatureBoxes.css'; // Import the new CSS file

// Utility function to parse markdown links and bold formatting
function parseMarkdownLinks(text) {
  // First, handle markdown links: [title](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let parsedText = text.replace(markdownLinkRegex, (match, title, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${title}</a>`;
  });

  // Then, handle markdown bold: **text**
  const markdownBoldRegex = /\*\*(.*?)\*\*/g;
  parsedText = parsedText.replace(markdownBoldRegex, (match, content) => {
    return `<strong class="font-bold text-foreground">${content}</strong>`;
  });

  // Handle markdown italic: *text*
  const markdownItalicRegex = /\*(.*?)\*/g;
  parsedText = parsedText.replace(markdownItalicRegex, (match, content) => {
    return `<em class="italic text-foreground">${content}</em>`;
  });

  return parsedText;
}

// Function to separate main answer from references
function separateAnswerAndReferences(text) {
  if (!text) return { mainAnswer: '', references: [] };

  // Split by double newlines to separate sections
  const sections = text.split('\n\n');

  // Find sections that contain references (numbered items with links)
  const mainSections = [];
  const referenceSections = [];

  sections.forEach(section => {
    // Check if this section contains numbered references with links
    if (section.match(/^\[\d+\]/) && section.includes('](')) {
      referenceSections.push(section);
    } else {
      mainSections.push(section);
    }
  });

  return {
    mainAnswer: mainSections.join('\n\n'),
    references: referenceSections
  };
}

// Function to format answer text with proper structure
function formatAnswerText(text) {
  if (!text) return '';

  // Split into paragraphs
  const paragraphs = text.split('\n\n');
  let inList = false;
  let listType = '';
  let result = '';

  paragraphs.forEach(paragraph => {
    const trimmed = paragraph.trim();

    // Check if it's a bullet point
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      if (!inList || listType !== 'ul') {
        if (inList) result += '</ol>';
        result += '<ul>';
        inList = true;
        listType = 'ul';
      }
      result += `<li>${trimmed.substring(2)}</li>`;
    }
    // Check if it's a numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        if (inList) result += '</ul>';
        result += '<ol>';
        inList = true;
        listType = 'ol';
      }
      result += `<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`;
    }
    // Regular paragraph
    else {
      if (inList) {
        result += listType === 'ul' ? '</ul>' : '</ol>';
        inList = false;
      }
      if (trimmed) {
        result += `<p>${trimmed}</p>`;
      }
    }
  });

  // Close any open list
  if (inList) {
    result += listType === 'ul' ? '</ul>' : '</ol>';
  }

  return result;
}

// Function to highlight important keywords and phrases
function highlightKeywords(text) {
  if (!text) return '';

  // First, clean the text to remove any unwanted highlight tags that might appear in the response
  let cleanedText = text.replace(/highlight-keyword/g, '').replace(/highlight-phrase/g, '');

  // Keywords to highlight (expanded based on user requirements)
  const keywords = [
    'important', 'key', 'significant', 'main', 'primary', 'essential',
    'definition', 'concept', 'theory', 'principle', 'example',
    'summary', 'conclusion', 'result', 'finding', 'analysis',
    'goal', 'objective', 'purpose', 'function', 'method', 'technique',
    'algorithm', 'process', 'procedure', 'step', 'stage', 'phase',
    'requirement', 'specification', 'criteria', 'condition', 'rule',
    'implementation', 'development', 'design', 'architecture', 'structure',
    'feature', 'capability', 'functionality', 'component', 'module',
    'interface', 'api', 'endpoint', 'service', 'system', 'framework',
    'library', 'tool', 'utility', 'resource', 'documentation'
  ];

  // Multi-word phrases to highlight
  const phrases = [
    'primary goal', 'key concept', 'main objective', 'important note',
    'essential requirement', 'core functionality', 'best practice',
    'recommended approach', 'standard method', 'common pattern',
    // Added based on user feedback for hierarchical and quantitative terms
    'three types of levels', 'lowest level', 'next-higher', 'highest level',
    'first step', 'second step', 'final step', 'initial phase', 'final phase'
  ];

  let highlightedText = cleanedText;

  // Highlight multi-word phrases first (to avoid conflicts with single words)
  phrases.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `<strong>$&</strong>`);
  });

  // Highlight keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `<strong>$&</strong>`);
  });

  // Highlight phrases in quotes
  highlightedText = highlightedText.replace(/"([^"]+)"/g, '<span class="highlight-quote">"$1"</span>');

  // Highlight important numbers and dates
  highlightedText = highlightedText.replace(/\b\d{4}\b/g, '<span class="highlight-number">$&</span>'); // Years
  highlightedText = highlightedText.replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '<span class="highlight-date">$&</span>'); // Dates
 
  // Highlight page numbers
  highlightedText = highlightedText.replace(/\b(page\s+\d+)\b/gi, '<strong>$1</strong>');
 
  return highlightedText;
}

// Function to generate PDF from the formatted content
async function generatePDF(content, question) {
  // Dynamically import html2pdf.js to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  const element = document.createElement('div');
  element.innerHTML = `
    <style>
      .highlight-keyword { background-color: #fef3c7; color: #92400e; padding: 2px 4px; border-radius: 3px; font-weight: 600; }
      .highlight-phrase { background-color: #fed7d7; color: #9b2c2c; padding: 2px 4px; border-radius: 3px; font-weight: 600; border: 1px solid #e53e3e; }
      .highlight-quote { background-color: #e0e7ff; color: #312e81; padding: 2px 4px; border-radius: 3px; font-style: italic; }
      .highlight-number { background-color: #dbeafe; color: #1e40af; padding: 1px 3px; border-radius: 2px; font-weight: 500; }
      .highlight-date { background-color: #dcfce7; color: #166534; padding: 1px 3px; border-radius: 2px; font-weight: 500; }
      .formatted-answer p { margin-bottom: 1rem; line-height: 1.6; }
      .formatted-answer ul, .formatted-answer ol { margin-bottom: 1rem; padding-left: 1.5rem; }
      .formatted-answer li { margin-bottom: 0.5rem; line-height: 1.5; }
      .formatted-answer ul { list-style-type: disc; }
      .formatted-answer ol { list-style-type: decimal; }
    </style>
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #111827;">
      <h1 style="color: #2563eb; margin-bottom: 20px; font-size: 24px; text-align: center;">Document Analysis Notes</h1>
      <h2 style="color: #374151; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Question: ${question}</h2>
      <div style="line-height: 1.6; font-size: 14px; margin-bottom: 20px;">
        ${content}
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
        Generated by GENIUM - ${new Date().toLocaleDateString()}
      </div>
    </div>
  `;

  const opt = {
    margin: 0.5,
    filename: `document-analysis-notes-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

// PLANS constant for pricing section
const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    info: 'For most individuals',
    price: {
      monthly: 7,
      yearly: Math.round(7 * 12 * (1 - 0.12)),
    },
    features: [
      { text: 'Up to 3 Blog posts', limit: '100 tags' },
      { text: 'Up to 3 Transcriptions' },
      { text: 'Up to 3 Posts stored' },
      {
        text: 'Markdown support',
        tooltip: 'Export content in Markdown format',
      },
      {
        text: 'Community support',
        tooltip: 'Get answers your questions on discord',
      },
      {
        text: 'AI powered suggestions',
        tooltip: 'Get up to 100 AI powered suggestions',
      },
    ],
    btn: {
      text: 'Start Your Free Trial',
      href: '#',
    },
  },
  {
    highlighted: true,
    id: 'pro',
    name: 'Pro',
    info: 'For small businesses',
    price: {
      monthly: 17.99,
      yearly: Math.round(17.99 * 12 * (1 - 0.12)),
    },
    features: [
      { text: 'Up to 500 Blog Posts', limit: '500 tags' },
      { text: 'Up to 500 Transcriptions' },
      { text: 'Up to 500 Posts stored' },
      {
        text: 'Unlimited Markdown support',
        tooltip: 'Export content in Markdown format',
      },
      { text: 'SEO optimization tools' },
      { text: 'Priority support', tooltip: 'Get 24/7 chat support' },
      {
        text: 'AI powered suggestions',
        tooltip: 'Get up to 500 AI powered suggestions',
      },
    ],
    btn: {
      text: 'Get started',
      href: '#',
    },
  },
  {
    name: 'Business',
    info: 'For large organizations',
    price: {
      monthly: 69.99,
      yearly: Math.round(49.99 * 12 * (1 - 0.12)),
    },
    features: [
      { text: 'Unlimited Blog Posts' },
      { text: 'Unlimited Transcriptions' },
      { text: 'Unlimited Posts stored' },
      { text: 'Unlimited Markdown support' },
      {
        text: 'SEO optimization tools',
        tooltip: 'Advanced SEO optimization tools',
      },
      { text: 'Priority support', tooltip: 'Get 24/7 chat support' },
      {
        text: 'AI powered suggestions',
        tooltip: 'Get up to 500 AI powered suggestions',
      },
    ],
    btn: {
      text: 'Contact team',
      href: '#',
    },
  },
];

// Helper component for Icons
const FeatureBox = ({ icon: Icon, title, description }) => (
  <div className="feature-box">
    <div className="icon">
      <Icon />
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const [isClient, setIsClient] = useState(false);
  const [jwtToken, setJwtToken] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('currentPage') || 'overview';
    }
    return 'overview';
  });
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [fileProcessed, setFileProcessed] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [answer, setAnswer] = useState('');
  const [documentAnswer, setDocumentAnswer] = useState('');
  const [googleAnswer, setGoogleAnswer] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isFetchingGoogle, setIsFetchingGoogle] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [lastGlobalSearchUsed, setLastGlobalSearchUsed] = useState(false);
  const [isGlobalSearchOn, setIsGlobalSearchOn] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('currentPage', currentPage);
    }
  }, [currentPage, isClient]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const getJwtToken = useCallback(async () => {
    try {
      const token = 'mock-jwt-token-' + Date.now();
      console.log('Mock JWT token generated in page.js:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('Mock JWT token length:', token?.length);
      return token;
    } catch (error) {
      console.error('Error generating mock JWT token in page.js:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchJwtToken = async () => {
      if (session?.user) {
        try {
          const token = await getJwtToken();
          setJwtToken(token);
        } catch (error) {
          console.error('Failed to fetch JWT token:', error);
          setJwtToken(null);
        }
      } else {
        setJwtToken(null);
      }
    };

    fetchJwtToken();
  }, [session, getJwtToken]);

  const handleAskQuestion = async (question, globalSearch = false) => {
    if (!question.trim()) {
      setError('Please enter a question');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!fileProcessed && !globalSearch) {
      setError('Please upload and process a document first, or enable web search to ask questions without documents');
      setTimeout(() => setError(''), 5000);
      return;
    }

    const token = jwtToken || await getJwtToken();

    setCurrentQuestion(question);
    setLastGlobalSearchUsed(globalSearch);
    setIsAsking(true);
    setError('');
    setAnswer('');
    setDocumentAnswer('');
    setGoogleAnswer('');

    try {
      const documentResponse = await askDocumentQuestion(question, token);
      const documentAnswerText = documentResponse.answer;

      setDocumentAnswer(documentAnswerText);
      setAnswer(documentAnswerText);

      if (globalSearch) {
        setIsFetchingGoogle(true);
        try {
          const globalResponse = await askQuestionWithGlobalSearch(question, true, token);
          const googleAnswerText = globalResponse.answer;

          setGoogleAnswer(googleAnswerText);
          setAnswer(`${documentAnswerText}\n\n--- Answer from the Web ---\n\n${googleAnswerText}`);
        } catch (googleErr) {
          console.error('Global search failed:', googleErr);
          const fallbackMsg = 'Unable to fetch web results at this time. Please try again later.';
          setGoogleAnswer(fallbackMsg);
          setAnswer(`${documentAnswerText}\n\n--- Answer from the Web ---\n\n${fallbackMsg}`);
        } finally {
          setIsFetchingGoogle(false);
        }
      }
    } catch (err) {
      console.error('Document query failed:', err);

      let errorMessage = 'Sorry, something went wrong while getting the answer.';

      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        errorMessage = 'Unable to connect to the server. Please check if the backend service is running and try again.';
      } else if (err.response) {
        if (err.response.status === 500) {
          errorMessage = 'Server error occurred. Please try again in a moment.';
        } else if (err.response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }

      setError(errorMessage);
      setTimeout(() => setError(''), 8000);
    } finally {
      setIsAsking(false);
    }
  };

  const handleUpload = useCallback(async (file, userId, accessToken) => {
    console.log('=== UPLOAD DEBUG START ===');
    console.log('Session state:', session ? 'Present' : 'Null');
    console.log('Session user:', session?.user);
    console.log('Session user ID:', session?.user?.id);
    console.log('JWT token from state:', jwtToken ? 'Present' : 'Null');
    console.log('JWT token length:', jwtToken?.length);
    console.log('JWT token type:', typeof jwtToken);
    console.log('Access token prop:', accessToken ? 'Present' : 'Null');
    console.log('Access token length:', accessToken?.length);
    console.log('Access token type:', typeof accessToken);

    const currentUserId = userId || session?.user?.id;
    console.log('Current user ID to use:', currentUserId);

    const token = jwtToken || accessToken || await getJwtToken();

    console.log('=== UPLOAD DEBUG END ===');

    setIsUploading(true);
    setError('');
    setUploadError('');
    setFileProcessed(false);

    try {
      const response = await uploadFileToBackend(file, currentUserId, token);
      setFileProcessed(true);
      setShowUploadSuccess(true);
      console.log('File upload successful:', response);
    } catch (err) {
      console.error('File upload failed:', err);
      let errorMessage = 'Failed to upload and process file. Please try again.';
      if (err.message) {
        errorMessage = err.message;
      }
      setUploadError(errorMessage);
      setFileProcessed(false);
    } finally {
      setIsUploading(false);
    }
  }, [session, getJwtToken, jwtToken]);

  const handleCodeClick = () => {
    setCurrentPage('code-assistance');
  };

  const handleDocumentQAClick = () => {
    setCurrentPage('document-qa');
  };

  const handleFileUpload = useCallback((selectedFile) => {
    if (!selectedFile) return;
    setError('');
  }, []);

  const handleTryGeniumClick = () => {
    setCurrentPage('try-genium');
  };

  const handleBackToExplore = () => {
    setCurrentPage('try-genium');
  };

  const handleBackToOverview = () => {
    setCurrentPage('overview');
  };

  const handleDocsClick = () => {
    setCurrentPage('docs');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header>
        <nav
          data-state={menuOpen && 'active'}
          className="fixed z-20 w-full px-2 group">
          <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
            <div className="relative flex items-center gap-6 py-3 lg:py-4">
              <a
                href="#"
                aria-label="home"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage('overview');
                  router.push('/');
                }}
                className="flex items-center space-x-2">
                <h1 className="text-xl font-medium text-foreground font-melodrama-bold genium-logo-width">GENIUM</h1>
              </a>

              <div className="flex-1 flex justify-center">
                <div className="hidden md:flex items-center gap-4">
                  <button
                    onClick={() => setCurrentPage('overview')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isMounted && currentPage === 'overview' ? "bg-accent text-accent-foreground font-bold" : "text-foreground"
                    )}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setCurrentPage('plan')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isMounted && currentPage === 'plan' ? "bg-accent text-accent-foreground font-bold" : "text-foreground"
                    )}
                  >
                    Plan
                  </button>
                  <button
                    onClick={() => setCurrentPage('docs')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isMounted && currentPage === 'docs' ? "bg-accent text-accent-foreground font-bold" : "text-foreground"
                    )}
                  >
                    Docs
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="md:hidden">
                  <button onClick={() => setNavMenuOpen(!navMenuOpen)} className="p-2 text-foreground hover:text-primary transition-colors">
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
                <ThemeSwitcher />
                <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
                  <DialogTrigger asChild>
                    <button className="text-sm font-medium text-foreground hover:text-primary">Sign Up</button>
                  </DialogTrigger>
                  <DialogContent hideClose={true} className="dark bg-black text-white border-gray-800 rounded-lg sm:max-w-[425px]">
                    <AuthCard onClose={() => setShowSignupModal(false)} />
                  </DialogContent>
                </Dialog>
                <Profile onLoginClick={() => setShowAuthModal(true)} />
              </div>
            </div>
          </div>
        </nav>
      </header>

      {navMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-background/95 backdrop-blur-lg border-b z-10">
          <div className="flex flex-col items-center gap-2 py-4">
            <button
              onClick={() => { setCurrentPage('overview'); setNavMenuOpen(false); }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isMounted && currentPage === 'overview' ? "bg-accent text-accent-foreground font-bold" : "text-foreground"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => { setCurrentPage('plan'); setNavMenuOpen(false); }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isMounted && currentPage === 'plan' ? "bg-accent text-accent-foreground font-bold" : "text-foreground"
              )}
            >
              Plan
            </button>
          </div>
        </div>
      )}

      {!isClient ? (
        <div className="flex flex-grow items-center justify-center">
          {/* Optional: Add a loading spinner or placeholder here */}
          Loading...
        </div>
      ) : (
        <>
          <div>
            <aside className={`w-0 md:w-0 bg-surface dark:bg-surface-dark p-0 flex flex-col transition-all duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:static top-14 bottom-0 z-20`}>
              <div className="flex-1 overflow-y-auto space-y-1">
              </div>
            </aside>

            <main className={`${showAuthModal ? 'blur-active' : ''}`}>
              {currentPage === 'overview' && (
                <>
                  <section className="flex flex-col items-center justify-center text-center pt-48 pb-16 px-6 max-w-3xl mx-auto">
                    <div className="text-5xl md:text-7xl font-medium mb-4 text-text-primary dark:text-white font-roboto flex flex-col items-center">
                      <span>Understand</span>
                      <span className="gradient-text">anything</span>
                    </div>
                    <p className="text-lg text-text-secondary dark:text-gray-300 mb-8 max-w-xl">
                      Your research and thinking partner, grounded in the information that you trust, built with the latest GENIUM models.
                    </p>
                    <div className="flex justify-center">
                      <WrapButton className="mt-4" onClick={handleTryGeniumClick}>
                        Try Genium
                      </WrapButton>
                    </div>
                  </section>

                  <section className="py-12 bg-surface dark:bg-surface-dark">
                    <div className="features-container">
                      <FeatureBox icon={FileUp} title="Upload" description="Easily upload your files and documents for instant analysis." />
                      <FeatureBox icon={Landmark} title="Knowledge" description="Tap into a vast knowledge base for accurate answers." />
                      <FeatureBox icon={ShieldCheck} title="Privacy" description="Your data is secure and private, always." />
                      <FeatureBox icon={Zap} title="Fast" description="Get instant responses powered by advanced AI." />
                    </div>
                  </section>
                  <PrivacySection />
                </>
              )}

              {currentPage === 'try-genium' && (
                <div className="min-h-screen flex flex-col items-center justify-center py-16 px-6 pt-32">
                  <div className="w-full max-w-6xl mb-8">
                    <button
                      onClick={() => setCurrentPage('overview')}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      ← Back to Overview
                    </button>
                  </div>

                  <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary dark:text-white">
                      Explore GENIUM
                    </h1>
                    <p className="text-lg text-text-secondary dark:text-gray-300 max-w-2xl">
                      Choose the feature you'd like to experience. Click any card to flip and explore our AI-powered tools.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                    <div className="flex justify-center">
                      <CardFlip
                        type="prompt-to-code"
                        onActionClick={handleCodeClick}
                      />
                    </div>

                    <div className="flex justify-center">
                      <CardFlip
                        type="document-qa"
                        onActionClick={handleDocumentQAClick}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentPage === 'code-assistance' && (
                <CodeAssistancePage onBack={handleBackToExplore} />
              )}

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
                  <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mt-8 mb-8">
                    Document Analysis
                  </h1>
                  <div className="w-full max-w-7xl mx-auto mb-4">
                    <button
                      onClick={handleBackToExplore}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      ← Back to Explore
                    </button>
                  </div>

                  <div className="flex-grow flex gap-6 max-w-7xl mx-auto w-full">
                    <div className="w-1/3 flex flex-col gap-6">
                      <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4">Upload Document</h2>
                        <FileUpload
                          onUploadSuccess={handleFileUpload}
                          onUploadError={setUploadError}
                          acceptedFileTypes={['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                          maxFileSize={10 * 1024 * 1024} // 10MB
                          uploadFunction={handleUpload}
                          userId={session?.user?.id} // Pass userId directly to FileUpload component
                          accessToken={jwtToken} // Pass JWT token for backend authentication
                          onUploadStart={() => {
                            setShowUploadSuccess(false);
                            setUploadError('');
                          }}
                          onFileRemove={() => {
                            setFileProcessed(false);
                            setShowUploadSuccess(false);
                            setUploadError('');
                          }}
                        />
                        {uploadError && (
                          <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 mt-4">
                            {uploadError.message || uploadError}
                          </div>
                        )}
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
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold">Ask a Question</h2>
                          <div className="flex items-center gap-2">
                            <Globe className={cn("w-5 h-5", isGlobalSearchOn ? "text-blue-600" : "text-gray-400")} />
                            <label htmlFor="global-search-toggle" className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                id="global-search-toggle"
                                className="sr-only peer"
                                checked={isGlobalSearchOn}
                                onChange={() => setIsGlobalSearchOn(!isGlobalSearchOn)}
                                disabled={isUploading || isAsking}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                {isGlobalSearchOn ? 'ON' : 'OFF'}
                              </span>
                            </label>
                          </div>
                        </div>
                        <AiInputSearch
                          onSend={(question) => handleAskQuestion(question, isGlobalSearchOn)}
                          disabled={isUploading || isAsking}
                          placeholder={isGlobalSearchOn ? "Ask any question..." : "Ask a question about the document..."}
                        />
                        {error && (
                          <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 mt-4">
                            {error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-2/3 bg-surface dark:bg-surface-dark rounded-lg p-6 flex flex-col border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Response</h2>
                        {!isAsking && answer && (
                          <button
                            onClick={async () => await generatePDF(
                              `<div class="formatted-answer">${highlightKeywords(formatAnswerText(separateAnswerAndReferences(answer).mainAnswer))}</div>`,
                              currentQuestion
                            )}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download Notes
                          </button>
                        )}
                      </div>
                      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/50 rounded-md p-4 border border-gray-200 dark:border-gray-700">
                        {/* Add CSS styles for highlighting */}
                        <style jsx>{`
                          .highlight-keyword {
                            background-color: #fef3c7;
                            color: #92400e;
                            padding: 2px 4px;
                            border-radius: 3px;
                            font-weight: 600;
                          }
                          .dark .highlight-keyword {
                            background-color: #451a03;
                            color: #fbbf24;
                          }
                          .highlight-phrase {
                            background-color: #fed7d7;
                            color: #9b2c2c;
                            padding: 2px 4px;
                            border-radius: 3px;
                            font-weight: 600;
                            border: 1px solid #e53e3e;
                          }
                          .dark .highlight-phrase {
                            background-color: #2d1810;
                            color: #fca5a5;
                            border-color: #dc2626;
                          }
                          .highlight-quote {
                            background-color: #e0e7ff;
                            color: #312e81;
                            padding: 2px 4px;
                            border-radius: 3px;
                            font-style: italic;
                          }
                          .dark .highlight-quote {
                            background-color: #1e1b4b;
                            color: #a5b4fc;
                          }
                          .highlight-number {
                            background-color: #dbeafe;
                            color: #1e40af;
                            padding: 1px 3px;
                            border-radius: 2px;
                            font-weight: 500;
                          }
                          .dark .highlight-number {
                            background-color: #1e3a8a;
                            color: #93c5fd;
                          }
                          .highlight-date {
                            background-color: #dcfce7;
                            color: #166534;
                            padding: 1px 3px;
                            border-radius: 2px;
                            font-weight: 500;
                          }
                          .dark .highlight-date {
                            background-color: #14532d;
                            color: #86efac;
                          }
                          .formatted-answer p {
                            margin-bottom: 1rem;
                            line-height: 1.6;
                          }
                          .formatted-answer ul, .formatted-answer ol {
                            margin-bottom: 1rem;
                            padding-left: 1.5rem;
                          }
                          .formatted-answer li {
                            margin-bottom: 0.5rem;
                            line-height: 1.5;
                          }
                          .formatted-answer ul {
                            list-style-type: disc;
                          }
                          .formatted-answer ol {
                            list-style-type: decimal;
                          }
                        `}</style>
                        {isAsking && (
                          <div className="flex items-center justify-center h-full">
                            <AITextLoading />
                          </div>
                        )}
                        {!isAsking && (documentAnswer || answer) && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <p className="font-bold text-text-primary text-lg">{currentQuestion}</p>
                              {lastGlobalSearchUsed && (
                                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                  <Globe className="w-3 h-3" />
                                  <span>Global Search</span>
                                </div>
                              )}
                            </div>

                            {/* Document Answer Section */}
                            {/* Document Answer Section - Only show if fileProcessed is true AND there's a documentAnswer */}
                            {fileProcessed && documentAnswer && (
                              <div className="mb-6">
                                <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center gap-2">
                                   <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                   Answer from Document
                                </h3>
                                <div
                                   className="formatted-answer text-text-primary"
                                   dangerouslySetInnerHTML={{
                                     __html: parseMarkdownLinks(highlightKeywords(formatAnswerText(separateAnswerAndReferences(documentAnswer).mainAnswer)))
                                   }}
                                />
                              </div>
                            )}

                            {/* Google/Web Answer Section - Only show if global search was used */}
                            {lastGlobalSearchUsed && (googleAnswer || isFetchingGoogle) && (
                              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center gap-2">
                                   <Globe className="w-4 h-4 text-blue-600" />
                                   Answer from the Web
                                   {isFetchingGoogle && (
                                     <span className="text-xs text-gray-500">(Fetching...)</span>
                                   )}
                                </h3>
                                {isFetchingGoogle ? (
                                   <div className="flex items-center justify-center py-4">
                                     <AITextLoading />
                                   </div>
                                ) : googleAnswer ? (
                                   <div
                                     className="formatted-answer text-text-primary"
                                     dangerouslySetInnerHTML={{
                                       __html: parseMarkdownLinks(highlightKeywords(formatAnswerText(googleAnswer)))
                                     }}
                                   />
                                ) : null}
                              </div>
                            )}

                            {/* Fallback/General Answer Display - Only show if no specific document or google answer is present, but there's a general answer */}
                            {!fileProcessed && !lastGlobalSearchUsed && answer && (
                              <div className="mb-4">
                                <div
                                   className="formatted-answer text-text-primary"
                                   dangerouslySetInnerHTML={{
                                     __html: parseMarkdownLinks(highlightKeywords(formatAnswerText(separateAnswerAndReferences(answer).mainAnswer)))
                                   }}
                                />
                              </div>
                            )}

                            {/* References Section - Only show if there are references */}
                            {lastGlobalSearchUsed && separateAnswerAndReferences(answer).references.length > 0 && (
                              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                   <Globe className="w-4 h-4 text-blue-600" />
                                   References
                                </h3>
                                <div className="space-y-2">
                                  {separateAnswerAndReferences(answer).references.map((reference, index) => (
                                    <div
                                      key={index}
                                      className="text-sm text-text-secondary bg-gray-50 dark:bg-gray-800/50 rounded-md p-3 border-l-2 border-blue-500"
                                      dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(highlightKeywords(formatAnswerText(reference))) }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
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

              {currentPage === 'docs' && (
                <DocsPage onBack={handleBackToOverview} />
              )}
            </main>
          </div>


        </>
      )}
    </div>
  );
}