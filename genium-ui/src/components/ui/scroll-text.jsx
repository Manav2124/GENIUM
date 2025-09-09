'use client';

// import 'animate.css';
import React, { useState, useEffect } from 'react';

const ScrollText = ({ text, className = '', speed = 100, direction = 'left' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (!text) return;

    let enterClass = '';
    switch (direction) {
      case 'left':
        enterClass = 'animate__animated animate__fadeInLeft';
        break;
      case 'right':
        enterClass = 'animate__animated animate__fadeInRight';
        break;
      case 'bottom':
        enterClass = 'animate__animated animate__fadeInUp';
        break;
      default:
        enterClass = 'animate__animated animate__fadeInLeft';
    }

    setAnimationClass(enterClass);

    const showText = () => {
      setIsVisible(true);
    };

    const hideText = () => {
      setIsVisible(false);
      setAnimationClass('');
    };

    showText();

    // Hide after 3 seconds, then show again after 1 second
    const hideTimer = setTimeout(() => {
      hideText();
      const showTimer = setTimeout(showText, 1000);
      return () => clearTimeout(showTimer);
    }, 3000);

    return () => clearTimeout(hideTimer);
  }, [text]);

  return (
    <span
      className={`
        ${className}
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${animationClass}
        transition-opacity
        duration-300
      `}
    >
      {text}
    </span>
  );
};


export { ScrollText };