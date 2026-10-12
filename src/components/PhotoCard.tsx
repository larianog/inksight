import React, { useState } from 'react';
import { Instagram, User, Eye, Sparkles } from 'lucide-react';
import { Photo } from '../types.ts';

interface PhotoCardProps {
  photo: Photo;
  onClick: (photo: Photo) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const authorName = photo.author?.name || 'Unknown Artist';
  const instagram = photo.author?.instagram || '';
  const imageName = photo.image_name || 'Untitled Tattoo Piece';

  return (
    <div
      onClick={() => onClick(photo)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-xl dark:bg-[#090912] dark:border-purple-950/80 dark:hover:border-cyan-400/70 dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.22)] transition-all duration-300 shadow-xs"
    >
      {/* Aspect Ratio Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-[#06060c]">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-purple-100/50 dark:bg-purple-950/20 animate-pulse">
            <Sparkles className="w-6 h-6 text-cyan-600 dark:text-cyan-400 animate-spin" />
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-[#090914] p-4 text-center">
            <span className="text-xs text-purple-700 dark:text-purple-400 font-medium">Image unavailable</span>
          </div>
        ) : (
          <img
            src={photo.path}
            alt={imageName}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 group-hover:rotate-[0.5deg] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Top Badges (Visible over photo) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 text-purple-900 border border-purple-200 shadow-xs dark:bg-[#06060c]/85 dark:backdrop-blur-md dark:text-cyan-300 dark:border-cyan-500/40">
            {photo.style}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-cyan-900 border border-cyan-200 shadow-xs dark:bg-[#06060c]/85 dark:backdrop-blur-md dark:text-purple-300 dark:border-purple-500/40">
            {photo.how}
          </span>
        </div>

        {/* Hover Overlay - Requirements: "hover the photo, which will show its information: image name, author and instagram." */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06060e] via-[#090918]/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-20">
          {/* Quick view indicator */}
          <div className="absolute top-3 right-3 p-2 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 text-white shadow-lg shadow-cyan-500/30 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <Eye className="w-4 h-4" />
          </div>

          <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 space-y-2.5">
            {/* Image Name */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Tattoo Artifact</span>
              </p>
              <h3 className="text-base font-bold text-white line-clamp-2 leading-snug drop-shadow-md">
                {imageName}
              </h3>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 pt-1 border-t border-purple-900/40">
              <div className="w-6 h-6 rounded-full bg-purple-950/80 border border-cyan-400/50 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-purple-300 uppercase tracking-wider leading-none">
                  Artist
                </p>
                <p className="text-xs font-semibold text-white truncate">
                  {authorName}
                </p>
              </div>
            </div>

            {/* Instagram */}
            {instagram && (
              <div className="flex items-center gap-1.5 text-xs text-purple-200 font-mono bg-purple-950/60 px-2 py-1 rounded-lg border border-purple-700/50">
                <Instagram className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{instagram}</span>
              </div>
            )}

            {/* Micro Tags Preview */}
            <div className="flex items-center flex-wrap gap-1 pt-0.5 text-[10px]">
              <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-cyan-200 border border-cyan-900/60 capitalize font-medium">
                {photo.color}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-200 border border-purple-800/60 capitalize font-medium">
                {photo.modern_traditional}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-zinc-300 border border-purple-900/60 capitalize font-medium">
                {photo.placement}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
