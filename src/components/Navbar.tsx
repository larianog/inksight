import React from 'react';
import {
  PlusCircle,
  Compass,
  Moon,
  Sun,
  FolderHeart,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';

interface NavbarProps {
  currentPage: 'home' | 'upload';
  onNavigate: (page: 'home' | 'upload') => void;
  photoCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  photoCount,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#07070e]/95 backdrop-blur-md border-b border-slate-200 dark:border-purple-950/60 px-4 sm:px-8 py-3.5 transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
        >
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-all">
            <FolderHeart className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                InkSight
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:block">
              Tattoo Archive
            </p>
          </div>
        </button>

        {/* Navigation tabs & Theme Switch */}
        <div className="flex items-center gap-3">
          {/* Gallery Button */}
          <button
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentPage === 'home'
                ? 'bg-purple-100 text-purple-950 border border-purple-300 font-semibold shadow-xs dark:bg-purple-950/60 dark:text-cyan-300 dark:border-cyan-500/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900/60'
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Gallery</span>
            {photoCount !== undefined && photoCount > 0 && (
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 dark:bg-purple-900/60 dark:text-cyan-300 font-semibold">
                {photoCount}
              </span>
            )}
          </button>

          {/* Add Photo Button */}
          <button
            onClick={() => onNavigate('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer ${
              currentPage === 'upload'
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-cyan-500/25 ring-2 ring-cyan-400/50'
                : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Add Photo</span>
          </button>

          {/* Light / Dark Mode Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border shadow-xs bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 dark:bg-[#121222] dark:hover:bg-[#18182e] dark:border-purple-500/30 dark:text-zinc-200 hover:border-cyan-500 dark:hover:border-cyan-400"
            title={`Toggle Theme (Current: ${theme === 'dark' ? 'Dark Mode' : 'Light Mode'})`}
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-cyan-300 animate-float-glow" />
                <span className="hidden sm:inline text-cyan-300 text-[11px] font-bold tracking-wider uppercase">
                  Dark
                </span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline text-purple-950 text-[11px] font-bold tracking-wider uppercase">
                  Light
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
