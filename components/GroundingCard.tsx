import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Star, Navigation, Car, Calendar, Share2, Mail, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { GroundingChunk, Coordinates } from '../types';

interface GroundingCardProps {
  chunk: GroundingChunk;
  userLocation?: Coordinates | null;
}

export const GroundingCard: React.FC<GroundingCardProps> = ({ chunk, userLocation }) => {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!chunk.maps) return null;

  const { title, googleMapsUri, rating, userReviewCount } = chunk.maps;
  const metadata = chunk.extractedMetadata;

  // Fallback values
  const displayRating = metadata?.rating || rating || "N/A";
  const displayReviews = metadata?.reviews || (userReviewCount ? `(${userReviewCount})` : "");
  const displayDistance = metadata?.distance ? `${metadata.distance}km` : "Nearby";

  // Robust Go Link: Prioritize API URI for accuracy, fallback to Search
  const finalMapsLink = googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title || "")}`;

  const handleShare = (platform: 'whatsapp' | 'email' | 'copy') => {
    const text = `Check out ${title} on Atlas! ⭐ ${displayRating} • ${displayDistance}`;
    const url = finalMapsLink;
    const fullText = `${text}\n${url}`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(`Check out ${title}`)}&body=${encodeURIComponent(fullText)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(fullText).then(() => alert("Copied to clipboard!"));
        break;
    }
    setIsShareMenuOpen(false);
  };

  const handleRide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://m.uber.com/ul/?action=setPickup&client_id=uber&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(title || "")}`, '_blank', 'noopener,noreferrer');
  };

  const handleBook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://www.google.com/search?q=reserve+${encodeURIComponent(title || "")}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="group relative overflow-visible rounded-2xl bg-[#18181b] border border-white/10 hover:border-white/20 transition-all duration-300 mb-4 shadow-xl hover:shadow-2xl hover:-translate-y-1 w-full max-w-sm">

      {/* Gradient Header */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />

      <a
        href={finalMapsLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative z-10"
      >
        <div className="relative p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">
              <MapPin size={12} />
              {displayDistance}
            </div>
            <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
              <Star size={12} fill="currentColor" />
              <span className="text-xs font-bold">{displayRating}</span>
              <span className="text-[10px] opacity-70">{displayReviews}</span>
            </div>
          </div>

          <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight mb-1">
            {title}
          </h4>
        </div>
      </a>

      {/* Action Buttons */}
      <div className="relative z-10 grid grid-cols-4 border-t border-white/5 divide-x divide-white/5 bg-black/20 backdrop-blur-sm rounded-b-2xl">
        <a
          href={finalMapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-3 hover:bg-white/5 transition-colors group/btn cursor-pointer"
          title="Directions"
        >
          <Navigation size={16} className="text-slate-400 group-hover/btn:text-indigo-400 mb-1" />
          <span className="text-[10px] text-slate-500 font-medium">Go</span>
        </a>

        <button
          onClick={handleRide}
          className="flex flex-col items-center justify-center py-3 hover:bg-white/5 transition-colors group/btn cursor-pointer"
          title="Get a Ride"
        >
          <Car size={16} className="text-slate-400 group-hover/btn:text-indigo-400 mb-1" />
          <span className="text-[10px] text-slate-500 font-medium">Ride</span>
        </button>

        <button
          onClick={handleBook}
          className="flex flex-col items-center justify-center py-3 hover:bg-white/5 transition-colors group/btn cursor-pointer"
          title="Book Table"
        >
          <Calendar size={16} className="text-slate-400 group-hover/btn:text-indigo-400 mb-1" />
          <span className="text-[10px] text-slate-500 font-medium">Book</span>
        </button>

        <div className="relative" ref={shareMenuRef}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsShareMenuOpen(!isShareMenuOpen);
            }}
            className={`flex flex-col items-center justify-center py-3 w-full transition-colors group/btn cursor-pointer ${isShareMenuOpen ? 'bg-white/10 text-indigo-400' : 'hover:bg-white/5'}`}
            title="Share"
          >
            <Share2 size={16} className={`${isShareMenuOpen ? 'text-indigo-400' : 'text-slate-400'} group-hover/btn:text-indigo-400 mb-1`} />
            <span className={`text-[10px] font-medium ${isShareMenuOpen ? 'text-indigo-400' : 'text-slate-500'}`}>Share</span>
          </button>

          {/* Share Menu Dropdown */}
          {isShareMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-32 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-green-400 transition-colors text-left"
              >
                <MessageCircle size={14} /> WhatsApp
              </button>
              <button
                onClick={() => handleShare('email')}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-blue-400 transition-colors text-left"
              >
                <Mail size={14} /> Email
              </button>
              <div className="h-px bg-white/5" />
              <button
                onClick={() => handleShare('copy')}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition-colors text-left"
              >
                <LinkIcon size={14} /> Copy Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
