import React from 'react';

const Logo = ({ className, invert }: { className?: string, invert?: boolean }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <img 
      src="https://i.imgur.com/uEFOBeo.png" 
      alt="Forest Beach House Logo" 
      className={`h-full w-auto object-contain ${invert ? 'invert' : ''}`} 
    />
  </div>
);

export default Logo;