
import React from 'react';

interface AtlasLogoProps {
  size?: number;
  className?: string;
}

export const AtlasLogo: React.FC<AtlasLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Atlas Logo"
      style={{ filter: 'drop-shadow(0px 2px 4px rgba(99, 102, 241, 0.3))' }}
    >
      <defs>
        <linearGradient id="atlas-gradient-v5" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      
      <path 
        d="M12 2L3.5 22L12 17.5V2Z" 
        fill="url(#atlas-gradient-v5)" 
        fillOpacity="0.8"
      />
      <path 
        d="M12 2L20.5 22L12 17.5V2Z" 
        fill="url(#atlas-gradient-v5)" 
      />
    </svg>
  );
};
