
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
      style={{ filter: 'drop-shadow(0px 4px 6px rgba(99, 102, 241, 0.3))' }}
    >
      <defs>
        <linearGradient id="atlas-gradient-static" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /> {/* Indigo 500 */}
          <stop offset="0.5" stopColor="#A855F7" /> {/* Purple 500 */}
          <stop offset="1" stopColor="#EC4899" /> {/* Pink 500 */}
        </linearGradient>
      </defs>
      
      {/* Left Wing - Folded effect with lower opacity */}
      <path 
        d="M12 2L3 22L12 17.5V2Z" 
        fill="url(#atlas-gradient-static)" 
        fillOpacity="0.8"
      />
      
      {/* Right Wing - Solid for depth */}
      <path 
        d="M12 2L21 22L12 17.5V2Z" 
        fill="url(#atlas-gradient-static)" 
      />
    </svg>
  );
};
