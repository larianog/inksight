import React from 'react';
import {
  X,
  Instagram,
  User,
  Database,
  Hash,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Photo } from '../types.ts';

interface PhotoDetailModalProps {
  photo: Photo | null;
  onClose: () => void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  onClose,
}) => {
  if (!photo) return null;

  const subjectsList = photo.subjects
    ? photo.subjects.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const instagramHandle = photo.author?.instagram?.replace(/^@/, '') || '';
  const instagramUrl = instagramHandle
    ? `https://instagram.com/${instagramHandle}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl flex flex-col md:flex-row overflow-hidden dark:bg-[#070710] dark:text-zinc-100 dark:border-cyan-500/30 dark:shadow-cyan-950/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors shadow-md dark:bg-[#06060c]/80 dark:hover:bg-purple-900/60 dark:text-zinc-300 dark:hover:text-white dark:border-purple-700/50 cursor-pointer"
        >
          <X className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        </button>

        {/* Image preview column */}
        <div className="w-full md:w-1/2 bg-slate-100 relative min-h-[340px] md:min-h-full flex items-center justify-center p-3 border-b md:border-b-0 md:border-r border-slate-200 dark:bg-[#05050a] dark:border-purple-900/30">
          <img
            src={photo.path}
            alt={photo.image_name || 'Tattoo photo'}
            className="w-full h-full object-contain max-h-[75vh] rounded-2xl shadow-xl"
          />
        </div>

        {/* Information column */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between bg-white dark:bg-[#070710] space-y-6">
          <div className="space-y-5">
            {/* Database ID badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 text-xs font-mono border border-purple-200 dark:bg-purple-950/60 dark:text-cyan-300 dark:border-cyan-500/30">
                <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                PostgreSQL Photos #{photo.id}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs uppercase tracking-wider font-bold bg-purple-100 text-purple-800 border border-purple-200 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-purple-500/20 dark:text-cyan-300 dark:border-purple-500/40">
                {photo.style}
              </span>
            </div>

            {/* Title */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-purple-700 dark:text-purple-400 font-bold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span>Detected Artwork</span>
              </p>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {photo.image_name || 'Untitled Tattoo Piece'}
              </h2>
            </div>

            {/* Author & Instagram */}
            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-center justify-between gap-4 shadow-2xs dark:bg-[#0c0c18] dark:border-purple-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-900 border border-purple-300 flex items-center justify-center dark:bg-gradient-to-br dark:from-cyan-500/30 dark:to-purple-600/30 dark:border-cyan-400/50 dark:text-cyan-300">
                  <User className="w-5 h-5 text-purple-900 dark:text-cyan-300" />
                </div>
                <div>
                  <p className="text-[10px] text-purple-800 dark:text-purple-400 uppercase font-semibold tracking-wider">
                    Tattoo Artist
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {photo.author?.name || 'Unknown Artist'}
                  </p>
                </div>
              </div>

              {photo.author?.instagram && (
                <div className="text-right">
                  {instagramUrl ? (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 text-xs font-mono font-semibold transition-all shadow-2xs hover:scale-105 dark:bg-purple-950/80 dark:hover:bg-purple-900/80 dark:text-cyan-300 dark:border-cyan-400/40"
                    >
                      <Instagram className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>{photo.author.instagram}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-1.5 text-purple-900 dark:text-cyan-300 text-xs font-mono">
                      <Instagram className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>{photo.author.instagram}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Grid of metadata attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-[#0a0a16] dark:border-purple-900/30">
                <span className="text-purple-800 dark:text-purple-400 block text-[10px] uppercase tracking-wider font-semibold">
                  Style
                </span>
                <span className="text-slate-900 dark:text-white font-bold capitalize mt-0.5 block">
                  {photo.style}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-[#0a0a16] dark:border-purple-900/30">
                <span className="text-purple-800 dark:text-purple-400 block text-[10px] uppercase tracking-wider font-semibold">
                  Lineage
                </span>
                <span className="text-slate-900 dark:text-white font-bold capitalize mt-0.5 block">
                  {photo.modern_traditional}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-[#0a0a16] dark:border-purple-900/30">
                <span className="text-purple-800 dark:text-purple-400 block text-[10px] uppercase tracking-wider font-semibold">
                  Placement
                </span>
                <span className="text-slate-900 dark:text-white font-bold capitalize mt-0.5 block">
                  {photo.placement}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-[#0a0a16] dark:border-purple-900/30">
                <span className="text-purple-800 dark:text-purple-400 block text-[10px] uppercase tracking-wider font-semibold">
                  Coverage
                </span>
                <span className="text-slate-900 dark:text-white font-bold capitalize mt-0.5 block">
                  {photo.how}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-[#0a0a16] dark:border-purple-900/30 col-span-2">
                <span className="text-purple-800 dark:text-purple-400 block text-[10px] uppercase tracking-wider font-semibold">
                  Color Palette
                </span>
                <span className="text-cyan-800 dark:text-cyan-300 font-bold capitalize mt-0.5 block">
                  {photo.color}
                </span>
              </div>
            </div>

            {/* Subjects Tags */}
            {subjectsList.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-purple-800 dark:text-purple-400 font-bold mb-2">
                  Extracted Arcane Elements
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {subjectsList.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-950 text-xs border border-purple-200 flex items-center gap-1 shadow-2xs dark:bg-purple-950/70 dark:text-cyan-200 dark:border-purple-800/40"
                    >
                      <Hash className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer with blob storage info */}
          <div className="pt-4 border-t border-slate-200 dark:border-purple-900/30 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-500">
            <span className="truncate max-w-[220px] font-mono text-[11px]">
              Blob: {photo.path}
            </span>
            <a
              href={photo.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-700 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>View Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
