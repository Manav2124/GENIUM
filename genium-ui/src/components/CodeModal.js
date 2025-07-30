import React, { useState } from 'react';
import { Code, Copy, Play, Sparkles, MessageSquare } from 'lucide-react';

const CodeModal = ({ code, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('code');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleRun = () => {
    // In a real implementation, this would execute the code
    alert('Code execution feature coming soon!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>X</button>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Code className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold">Code Assistant</h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-4">
          <button
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'code' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'explanation' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('explanation')}
          >
            Explanation
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'suggestions' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('suggestions')}
          >
            Suggestions
          </button>
        </div>

        {/* Content */}
        {activeTab === 'code' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-400">JavaScript Example</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleRun}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Run
                </button>
              </div>
            </div>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
              <code className="text-green-400 font-mono text-sm">
                {code}
              </code>
            </pre>
          </div>
        )}

        {activeTab === 'explanation' && (
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-300 mb-2">Code Explanation</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                This code demonstrates a simple greeting function in JavaScript. The function takes a name parameter 
                and uses template literals to create a personalized greeting message. This is a basic example of 
                how GENIUM can help you understand and write code more effectively.
              </p>
            </div>
            
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
              <h3 className="font-semibold text-green-300 mb-2">Key Concepts</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Function declaration and parameters</li>
                <li>• Template literals (backticks)</li>
                <li>• String interpolation with ${'{'}</li>
                <li>• Console output methods</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
              <h3 className="font-semibold text-purple-300 mb-2">Improvement Suggestions</h3>
              <div className="space-y-3">
                <div className="bg-gray-800 rounded p-3">
                  <h4 className="text-sm font-medium text-gray-200 mb-1">Add Error Handling</h4>
                  <p className="text-xs text-gray-400">Consider adding input validation for the name parameter</p>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <h4 className="text-sm font-medium text-gray-200 mb-1">Use Arrow Function</h4>
                  <p className="text-xs text-gray-400">Modern JavaScript prefers arrow functions for simple operations</p>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <h4 className="text-sm font-medium text-gray-200 mb-1">Add JSDoc Comments</h4>
                  <p className="text-xs text-gray-400">Document your functions for better code maintainability</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4" />
              Powered by GENIUM AI
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;