
import React from 'react';
import { GroundingChunk } from '../types';
import { MapPin, Star, Navigation, Quote, Image as ImageIcon } from 'lucide-react';

interface GroundingCardProps {
  chunk: GroundingChunk;
}

export const GroundingCard: React.FC<GroundingCardProps> = ({ chunk }) => {
  if (!chunk.maps) return null;

  const { title, uri, placeAnswerSources } = chunk.maps;
  const { extractedMetadata } = chunk;
  const review = placeAnswerSources?.reviewSnippets?.[0];
  
  // Calculate stars based on numeric rating
  const ratingNum = extractedMetadata?.rating ? parseFloat(extractedMetadata.rating) : 0;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
     if (i <= ratingNum) stars.push('full');
     else if (i - 0.5 <= ratingNum) stars.push('half');
     else stars.push('empty');
  }

  // Generate a deterministic gradient based on title length/chars
  const seed = title ? title.length + title.charCodeAt(0) : 0;
  const hues = [
    'from-indigo-600 to-purple-600',
    'from-emerald-600 to-teal-600',
    'from-rose-600 to-orange-600',
    'from-blue-600 to-cyan-600'
  ];
  const gradient = hues[seed % hues.length];

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 mb-4 backdrop-blur-md shadow-lg">
      
      {/* Hero Image Section (Simulated) */}
      <div className={`h-24 w-full bg-gradient-to-r ${gradient} relative overflow-hidden`}>
         <div className="absolute inset-0 bg-black/20" />
         <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <MapPin size={64} />
         </div>
         
         {/* Extracted Rating Badge */}
         {ratingNum > 0 && (
            <div className="absolute bottom-2 left-3 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 border border-white/10 shadow-lg">
               <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                  {ratingNum} <Star size={10} fill="currentColor" />
               </span>
               <span className="text-[10px] text-slate-400 border-l border-slate-600 pl-1.5">
                  {extractedMetadata?.reviews}
               </span>
            </div>
         )}

         {/* Distance Badge */}
         {extractedMetadata?.distance && (
            <div className="absolute bottom-2 right-3 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10 shadow-lg">
               {extractedMetadata.distance}km away
            </div>
         )}
      </div>

      <div className="relative p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">Verified</span>
            </div>
            
            <h4 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors leading-tight">
              {title}
            </h4>
            
            {/* Fallback visual rating if extracted unavailable */}
            {ratingNum === 0 && (
               <div className="flex items-center gap-1 mt-1 opacity-50">
                  <span className="text-xs text-slate-500">Rating details unavailable</span>
               </div>
            )}
          </div>

          <a 
            href={uri} 
            target="_blank" 
            rel="noreferrer"
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg"
          >
            <Navigation size={14} />
          </a>
        </div>

        {review && (
          <div className="mt-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
            <div className="flex gap-2">
              <Quote size={12} className="text-slate-500 flex-shrink-0 transform scale-x-[-1]" />
              <p className="text-xs text-slate-300 italic leading-relaxed line-clamp-2">
                "{review.content}"
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Action */}
      <a 
        href={uri}
        target="_blank" 
        rel="noreferrer"
        className="block w-full py-2 bg-slate-800/30 hover:bg-slate-800 text-center text-[10px] font-medium text-indigo-300 transition-colors border-t border-slate-800/50 uppercase tracking-wider"
      >
        Open in Google Maps
      </a>
    </div>
  );
};
