import React from 'react';
import { Share } from 'lucide-react';

const SocialButton = () => {
  return (
    <button className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
      <Share className="w-5 h-5 text-text-primary" />
    </button>
  );
};

export default SocialButton;