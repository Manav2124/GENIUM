"use client";

import React, { useState, useEffect } from 'react';
import { Code, Sparkles, MessageSquare, Lightbulb, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';
import AiInputSearch from './ui/ai-input.tsx';
import { PromptBox } from './ui/chatgpt-prompt-input.tsx';
import AITextLoading from './ui/ai-text-loading.tsx';
import FileTree from './FileTree'; // Import the FileTree component
import { ShikiViewer } from './ShikiViewer'; // Import ShikiViewer from its new file
import { parseCodeGenerationOutput } from '../lib/code-parser'; // Import the new parser
import { Textarea } from './ui/textarea.tsx';
import { Toaster } from './ui/sonner.tsx'; // Import Toaster
import { useTheme } from 'next-themes'; // Import useTheme
// Note: JSZip would need to be installed: npm install jszip
// For now, we'll implement a simple download without zipping

const CodeAssistancePage = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(''); // Added for backend response
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedFileContent, setSelectedFileContent] = useState('');
  const [showVideoAnimation, setShowVideoAnimation] = useState(false);

  useEffect(() => {
    const shouldShow = prompt.trim().length > 0 &&
                       response === '' &&
                       isGenerating &&
                       (!projectData || projectData.files.length === 0);
    console.log('Debug: prompt', prompt);
    console.log('Debug: response', response);
    console.log('Debug: isGenerating', isGenerating);
    console.log('Debug: projectData', projectData);
    console.log('Debug: shouldShowVideoAnimation', shouldShow);
    setShowVideoAnimation(shouldShow);
  }, [prompt, response, isGenerating, projectData]);

  const programmingLanguages = [
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'java', label: 'Java', icon: '☕' },
    { value: 'cpp', label: 'C++', icon: '⚡' },
    { value: 'csharp', label: 'C#', icon: '🔷' },
    { value: 'typescript', label: 'TypeScript', icon: '🔷' },
    { value: 'go', label: 'Go', icon: '🐹' },
    { value: 'rust', label: 'Rust', icon: '🦀' },
    { value: 'php', label: 'PHP', icon: '🐘' },
    { value: 'ruby', label: 'Ruby', icon: '💎' },
  ];

  // Modified handleGenerateCode to use the new backend API
  const handleGenerateCode = async (userPrompt) => {
    if (!userPrompt.trim()) return;

    setIsGenerating(true);
    setPrompt(userPrompt);
    setResponse(''); // Clear previous response
    setGeneratedCode('');
    setProjectData(null);
    setSelectedFile('');
    setSelectedFileContent('');

    try {
      const res = await fetch('http://localhost:5002/generate-code', { // Use the correct API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userPrompt }), // Send prompt
      });
      const jsonResponse = await res.json(); // Parse as JSON

      if (jsonResponse.code) {
        const parsedFiles = parseCodeGenerationOutput(jsonResponse.code);
        if (parsedFiles.length > 0) {
          const firstFilePath = parsedFiles[0].path;
          const pathParts = firstFilePath.split('/');
          const rootFolder = pathParts.length > 1 ? pathParts[0] : null; // Only set rootFolder if there's a directory structure
          setProjectData({ files: parsedFiles, rootFolder: rootFolder });
          setSelectedFile(firstFilePath);
          setSelectedFileContent(parsedFiles[0].content);
          setGeneratedCode(parsedFiles[0].content);
          setResponse(''); // Clear response in main content area if files are found
        } else {
          setProjectData(null);
          setResponse(jsonResponse.code); // Fallback to display raw content if parsing fails
          setSelectedFile('');
          setSelectedFileContent('');
        }
      } else {
        setProjectData(null); // Clear project data if no files are found
        setResponse('No files generated or recognized structure.'); // Display raw content or message if no files
      }
    } catch (error) {
      setResponse(`Error: ${error.message}`);
      setProjectData(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Removed generateSampleCode as it's no longer needed for the new functionality
  // const generateSampleCode = (userPrompt) => {
  //   // ... (removed sample code generation logic)
  // };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleRun = () => {
    // In a real implementation, this would execute the code
    alert('Code execution feature coming soon! This would run your code in a sandboxed environment.');
  };

  const handleFileSelect = (filePath) => {
    setSelectedFile(filePath);
    const file = projectData?.files.find(f => f.path === filePath);
    if (file && file.content) {
      setSelectedFileContent(file.content);
      setGeneratedCode(file.content);
    }
  };

  const generateProjectSuggestions = (projectData) => {
    const suggestions = [];

    if (projectData.project_name.includes('todo')) {
      suggestions.push({
        title: 'Add Local Storage',
        description: 'Implement local storage to persist todos between sessions',
        type: 'feature'
      });
      suggestions.push({
        title: 'Add Categories',
        description: 'Allow users to organize todos into different categories',
        type: 'feature'
      });
      suggestions.push({
        title: 'Add Due Dates',
        description: 'Add due date functionality with notifications',
        type: 'feature'
      });
    } else if (projectData.project_name.includes('calculator')) {
      suggestions.push({
        title: 'Add Scientific Functions',
        description: 'Implement trigonometric and logarithmic functions',
        type: 'feature'
      });
      suggestions.push({
        title: 'Add History',
        description: 'Keep track of previous calculations',
        type: 'feature'
      });
      suggestions.push({
        title: 'Add Keyboard Support',
        description: 'Allow keyboard input for calculator operations',
        type: 'usability'
      });
    }

    suggestions.push({
      title: 'Add Unit Tests',
      description: 'Create comprehensive unit tests for all components',
      type: 'testing'
    });
    suggestions.push({
      title: 'Add Error Handling',
      description: 'Implement proper error handling and user feedback',
      type: 'robustness'
    });
    suggestions.push({
      title: 'Add Responsive Design',
      description: 'Ensure the application works well on mobile devices',
      type: 'usability'
    });

    return suggestions;
  };

  const handleDownloadProject = () => {
    if (!projectData) return;

    // For now, download the main file
    const mainFile = projectData.files.find(file => file.path === projectData.main_file);
    if (mainFile && mainFile.content) {
      const blob = new Blob([mainFile.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = projectData.main_file;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <React.Fragment>
      <div className="relative flex min-h-screen bg-white dark:bg-black text-black dark:text-white pt-48 px-32"> {/* Increased top padding (pt-48) and horizontal padding (px-32) */}
        {/* Back to Explore Button */}
        <button
          onClick={onBack} // Use the onBack prop for navigation
          className="absolute top-40 left-16 text-gray-800 hover:text-gray-900 transition-colors duration-200 cursor-pointer flex items-center space-x-1 z-10"
        >
          <span className="text-lg">←</span> <span>Back to Explore</span>
        </button>

        {/* Left Sidebar */}
        <aside className="w-96 bg-gray-100 dark:bg-gray-900 shadow-md flex flex-col p-4 rounded-lg my-4 border border-gray-300 dark:border-gray-700"> {/* Added margin, rounded corners, and border */}
          {/* Theme Toggle */}

          {/* Siri-style animation */}
          <div className="flex flex-col items-center space-y-4 mb-auto">
            {/* Siri-style glowing circular animated element */}
            {showVideoAnimation && (
              <video
                src="/videos/v3.mp4"
                loop
                muted
                autoPlay
                className="w-64 h-64 object-cover rounded-full"
              />
            )}
          </div>

          {/* New container for FileTree */}
          <div className="flex-1 overflow-auto mb-4">
            {projectData && projectData.files && (
              <FileTree
                files={projectData.files}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                rootFolder={projectData.rootFolder} // Pass the root folder to FileTree
              />
            )}
          </div>

          {/* PromptBox at the bottom */}
          <div className="mt-auto">
            <PromptBox
              value={prompt}
              isLoading={isGenerating}
              onChange={(e) => setPrompt(e.target.value)}
              onSubmit={(e) => {
                e.preventDefault();
                console.log('Submitting prompt:', prompt); // Add console log
                handleGenerateCode(prompt);
              }}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 overflow-auto my-4 ml-8 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md border border-gray-300 dark:border-gray-700"> {/* Increased left margin (ml-8) */}
          <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-md shadow-sm min-h-full">
            {isGenerating ? (
              <div className="flex justify-center items-center h-64">
                <AITextLoading />
              </div>
            ) : (
              <>
                {response && !projectData?.files?.length && ( // Only show raw response if no project data or no files are parsed
                  <pre className="whitespace-pre-wrap">
                    {response}
                  </pre>
                )}
                {selectedFileContent && (
                  <ShikiViewer
                    code={selectedFileContent}
                    lang={selectedFile.split('.').pop()} // Infer language from file extension
                    showLineNumbers={true}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
      <Toaster /> {/* Add Toaster component */}
    </React.Fragment>
  );
};

export default CodeAssistancePage;