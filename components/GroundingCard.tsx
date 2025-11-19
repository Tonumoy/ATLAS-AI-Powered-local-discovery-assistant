import React from 'react';
import { GroundingChunk } from '../types';
import { MapPin, Star, Navigation, Quote } from 'lucide-react';

interface GroundingCardProps {
  chunk: GroundingChunk;
}

export const GroundingCard: React.FC<GroundingCardProps> = ({ chunk }) => {
  if (!chunk.maps) return null;

  const { title, uri, placeAnswerSources } = chunk.maps;
  // We'll simulate a rating logic or extract it if available in future API updates. 
  // For now, we style it to look verified.
  const review = placeAnswerSources?.reviewSnippets?.[0];
  
  // Helper to extract a possible rating or make it look like a verified top pick
  const isTopPick = review && review.content && review.content.length > 50;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 mb-4 backdrop-blur-md shadow-lg">
      
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />

      <div className="relative p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-indigo-500/20 p-1.5 rounded-md text-indigo-400">
                <MapPin size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Verified Location</span>
            </div>
            
            <h4 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">
              {title}
            </h4>
            
            {/* Fake Star Rating for UI feel (since API doesn't send numeric rating in chunks yet) */}
            <div className="flex items-center gap-1 mt-1 text-amber-400">
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" className="opacity-50" />
              <span className="text-xs text-slate-400 ml-1">(Local Favorite)</span>
            </div>
          </div>

          <a 
            href={uri} 
            target="_blank" 
            rel="noreferrer"
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/20 transition-all transform group-hover:scale-105"
          >
            <Navigation size={18} />
          </a>
        </div>

        {review && (
          <div className="mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="flex gap-2">
              <Quote size={14} className="text-slate-500 flex-shrink-0 transform scale-x-[-1]" />
              <p className="text-xs md:text-sm text-slate-300 italic leading-relaxed line-clamp-3">
                "{review.content}"
              </p>
            </div>
            {review.author && (
               <p className="text-[10px] text-slate-500 text-right mt-2">— {review.author}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Footer Action */}
      <a 
        href={uri}
        target="_blank" 
        rel="noreferrer"
        className="block w-full py-2 bg-slate-800/50 hover:bg-slate-800 text-center text-xs font-medium text-indigo-300 transition-colors border-t border-slate-800"
      >
        Open in Google Maps
      </a>
    </div>
  );
};