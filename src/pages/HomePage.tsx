import React, { useState, useEffect, useCallback } from 'react';
import { FilterBar } from '../components/FilterBar.tsx';
import { PhotoCard } from '../components/PhotoCard.tsx';
import { PhotoDetailModal } from '../components/PhotoDetailModal.tsx';
import { Photo, FilterOptions, ActiveFilters } from '../types.ts';
import {
  Sparkles,
  Search,
  PlusCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface HomePageProps {
  onNavigateToAdd: () => void;
}

const initialFilters: ActiveFilters = {
  subject: [],
  style: [],
  modern_traditional: [],
  placement: [],
  how: [],
  color: [],
  author_name: [],
};

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToAdd }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    subjects: [],
    styles: [],
    modern_traditional: [],
    placements: [],
    how: [],
    colors: [],
    authors: [],
  });
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Fetch unique filter values from database
  const fetchFilters = useCallback(async () => {
    try {
      const res = await fetch('/api/filters');
      if (res.ok) {
        const data = await res.json();
        setFilterOptions(data);
      }
    } catch (err) {
      console.error('Error fetching filters from database:', err);
    }
  }, []);

  // Fetch photos from database with query params
  const fetchPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      activeFilters.subject.forEach((s) => params.append('subject', s));
      activeFilters.style.forEach((st) => params.append('style', st));
      activeFilters.modern_traditional.forEach((m) =>
        params.append('modern_traditional', m)
      );
      activeFilters.placement.forEach((p) => params.append('placement', p));
      activeFilters.how.forEach((h) => params.append('how', h));
      activeFilters.color.forEach((c) => params.append('color', c));
      activeFilters.author_name.forEach((a) => params.append('author_name', a));

      const res = await fetch(`/api/photos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch (err) {
      console.error('Error fetching photos from database:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleFilterToggle = (key: keyof ActiveFilters, value: string) => {
    setActiveFilters((prev) => {
      const list = prev[key] || [];
      const exists = list.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      );
      const updated = exists
        ? list.filter((item) => item.toLowerCase() !== value.toLowerCase())
        : [...list, value];
      return {
        ...prev,
        [key]: updated,
      };
    });
  };

  const handleSelectAllCategory = (key: keyof ActiveFilters, options: string[]) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: [...options],
    }));
  };

  const handleClearCategory = (key: keyof ActiveFilters) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: [],
    }));
  };

  const handleClearFilters = () => {
    setActiveFilters(initialFilters);
    setSearchQuery('');
  };

  // Optional client-side search query refinement (searches name, author, subjects)
  const filteredPhotos = photos.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (p.image_name || '').toLowerCase().includes(q);
    const authorMatch = (p.author?.name || '').toLowerCase().includes(q);
    const instaMatch = (p.author?.instagram || '').toLowerCase().includes(q);
    const subjectMatch = (p.subjects || '').toLowerCase().includes(q);
    const styleMatch = (p.style || '').toLowerCase().includes(q);
    return nameMatch || authorMatch || instaMatch || subjectMatch || styleMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#07070d] dark:text-zinc-100 flex flex-col transition-colors duration-200">
      {/* Filter Bar with Add Button at top of page as required */}
      <FilterBar
        filterOptions={filterOptions}
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
        onSelectAllCategory={handleSelectAllCategory}
        onClearCategory={handleClearCategory}
        onClearFilters={handleClearFilters}
        onNavigateToAdd={onNavigateToAdd}
        totalResults={filteredPhotos.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Gallery Intro Banner / Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-600 dark:text-cyan-400" />
            <input
              type="text"
              placeholder="Search artist, subject, style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 shadow-2xs dark:bg-[#0c0c18] dark:border-purple-900/50 dark:text-zinc-200 dark:placeholder-zinc-500 dark:focus:ring-cyan-500/50 dark:focus:border-cyan-400 transition-all text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-2xl bg-slate-200/60 dark:bg-purple-950/15 border border-slate-200 dark:border-purple-900/30 animate-pulse flex items-center justify-center p-6"
              >
                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-cyan-950/50" />
              </div>
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 px-4 rounded-3xl bg-white border border-slate-200 max-w-2xl mx-auto my-8 space-y-4 shadow-sm dark:bg-[#0a0a14] dark:border-purple-900/40 dark:shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-900 border border-purple-200 flex items-center justify-center mx-auto dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-purple-600/20 dark:border-cyan-500/40 dark:text-cyan-300">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              No tattoos match the selected criteria
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
              Try adjusting your checkboxes or upload fresh tattoo photos to be automatically extracted into the archive!
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer dark:bg-[#121224] dark:hover:bg-purple-950/60 dark:text-zinc-200 dark:border-purple-800/40"
              >
                Reset All Filters
              </button>
              <button
                onClick={onNavigateToAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-cyan-500/20 hover:scale-105 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Upload Tattoo Photo</span>
              </button>
            </div>
          </div>
        ) : (
          /* Photo Grid Gallery */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={(p) => setSelectedPhoto(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Lightbox / Details Modal */}
      <PhotoDetailModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </div>
  );
};
