import React from 'react';

export const LiveWaveform = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-in-out ${
            isActive ? 'animate-pulse' : 'h-1 opacity-20'
          }`}
          style={{
            height: isActive ? `${Math.random() * 100}%` : '4px',
            animationDelay: `${i * 0.1}s`,
            minHeight: '4px',
            maxHeight: '40px'
          }}
        />
      ))}
    </div>
  );
};