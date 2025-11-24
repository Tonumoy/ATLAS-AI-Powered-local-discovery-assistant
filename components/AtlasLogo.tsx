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
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Atlas Logo"
    >
      <path
        d="M12 2L3.5 22L12 17.5V2Z"
        fillOpacity="0.9"
      />
      <path
        d="M12 2L20.5 22L12 17.5V2Z"
      />
    </svg>
  );
};
