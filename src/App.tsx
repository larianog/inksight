import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { UploadPage } from './pages/UploadPage.tsx';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<'home' | 'upload'>('home');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#07070d] dark:text-zinc-100 selection:bg-cyan-500 selection:text-black flex flex-col font-sans transition-colors duration-200">
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
      />

      <div className="flex-1">
        {currentPage === 'home' ? (
          <HomePage onNavigateToAdd={() => setCurrentPage('upload')} />
        ) : (
          <UploadPage onNavigateToGallery={() => setCurrentPage('home')} />
        )}
      </div>

      <footer className="border-t border-slate-200 dark:border-purple-900/30 bg-white/90 dark:bg-[#06060c]/90 py-6 px-4 text-center text-xs text-slate-500 dark:text-zinc-500 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-purple-600 to-indigo-600 dark:from-cyan-400 dark:to-purple-400">
              InkSight
            </span>
            <span>—</span>
            <span className="text-slate-600 dark:text-zinc-400">
              Occult Tattoo Archive &amp; Gemini 3.8 Flash Tag Extractor
            </span>
          </div>
          <div className="flex items-center gap-4 text-purple-700 dark:text-purple-400/80 font-mono text-[11px]">
            <span>Model: gemini-3.8-flash (T=0)</span>
            <span>•</span>
            <span>PostgreSQL: Photos</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
