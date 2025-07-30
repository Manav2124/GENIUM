import React, { useState } from 'react';
import { Code, FileText, Sparkles, MessageSquare, Zap, Brain } from 'lucide-react';
import AiInputSearch from './ui/ai-input.tsx';
import { BorderBeam } from "./ui/border-beam.jsx";
import './CardFlip.css';

const CardFlip = ({ type = 'document-qa', onActionClick }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleMouseEnter = () => {
    setIsFlipped(true);
  };

  const handleMouseLeave = () => {
    setIsFlipped(false);
  };

  // Configuration for different card types
  const cardConfig = {
    'prompt-to-code': {
      front: {
        icon: <Brain className="w-12 h-12 mb-4" />,
        title: "Prompt to Code",
        description: "Transform your ideas into working code with AI assistance"
      },
      back: {
        icon: <Code className="w-8 h-8 mb-3" />,
        title: "AI Code Generation",
        description: "Describe what you want to build and get instant code suggestions",
        features: [
          "Natural language to code conversion",
          "Multiple programming languages",
          "Code explanations and comments",
          "Best practices suggestions"
        ],
        actionText: "Try Code Assistant"
      }
    },
    'document-qa': {
      front: {
        icon: <FileText className="w-12 h-12 mb-4" />,
        title: "Documents Q&A",
        description: "Ask questions about your documents and get instant answers"
      },
      back: {
        icon: <MessageSquare className="w-8 h-8 mb-3" />,
        title: "Document Analysis",
        description: "Upload PDFs and text files to get AI-powered insights",
        features: [
          "PDF and text file support",
          "Semantic search capabilities",
          "Context-aware answers",
          "Page reference tracking"
        ],
        actionText: "Try Document Q&A"
      }
    }
  };

  const config = cardConfig[type];

  return (
    <div
      className="card-flip-container relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <BorderBeam size={250} duration={12} delay={9} />
      <div className={`card-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
        {/* Front of the card - Simple content */}
        <div className="card-flip-front">
          <div className="card-flip-content">
            {config.front.icon}
            <div className="card-flip-title">{config.front.title}</div>
            <div className="card-flip-description">
              {config.front.description}
            </div>
          </div>
        </div>

        {/* Back of the card - Detailed content */}
        <div className="card-flip-back">
          <div className="card-flip-content">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center mb-2">
                {config.back.icon}
              </div>
              <div className="card-flip-title">{config.back.title}</div>
              <div className="card-flip-description">
                {config.back.description}
              </div>
            </div>
            
            <div className="card-flip-features">
              {config.back.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 mb-1">
                  <Zap className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => onActionClick(config.back.actionText)}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              {config.back.actionText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardFlip;
