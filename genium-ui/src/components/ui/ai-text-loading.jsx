import React from 'react';

const AITextLoading = ({ className = "" }) => {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">AI is thinking...</span>
    </div>
  );
};

export default AITextLoading;