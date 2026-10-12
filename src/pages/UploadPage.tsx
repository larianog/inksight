import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Clipboard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Trash2,
  User,
  Hash,
} from 'lucide-react';
import { ExtractedResult } from '../types.ts';

interface UploadPageProps {
  onNavigateToGallery: () => void;
}

interface QueuedItem {
  id: string;
  file?: File;
  base64?: string;
  name: string;
  previewUrl: string;
  size: number;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  onNavigateToGallery,
}) => {
  const [queuedItems, setQueuedItems] = useState<QueuedItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [results, setResults] = useState<ExtractedResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener (Upload from computer or paste into it)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing || results.length > 0) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const newQueued: QueuedItem[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const previewUrl = URL.createObjectURL(file);
            newQueued.push({
              id: `${Date.now()}-${Math.random()}`,
              file,
              name: file.name || `Pasted_Tattoo_${newQueued.length + 1}.png`,
              previewUrl,
              size: file.size,
            });
          }
        }
      }

      if (newQueued.length > 0) {
        setQueuedItems((prev) => [...prev, ...newQueued]);
        setErrorMessage(null);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isProcessing, results.length]);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newQueued: QueuedItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        newQueued.push({
          id: `${Date.now()}-${Math.random()}-${i}`,
          file,
          name: file.name,
          previewUrl,
          size: file.size,
        });
      }
    }

    if (newQueued.length > 0) {
      setQueuedItems((prev) => [...prev, ...newQueued]);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing || results.length > 0) return;
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing && results.length === 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeItem = (id: string) => {
    setQueuedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearQueue = () => {
    setQueuedItems([]);
    setErrorMessage(null);
  };

  // Reset to upload new photos as required by prompt
  const handleResetForNewUploads = () => {
    setResults([]);
    setQueuedItems([]);
    setErrorMessage(null);
    setCurrentStep('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload & run pipeline
  const processUploadPipeline = async () => {
    if (queuedItems.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStep('Extracting & saving image...');

    try {
      const formData = new FormData();
      for (const item of queuedItems) {
        if (item.file) {
          formData.append('photos', item.file, item.name);
        }
      }

      setCurrentStep('Extracting tags...');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload pipeline failed');
      }

      setCurrentStep('Inserting images into database...');
      const data = await response.json();

      if (data.success && data.photos) {
        setResults(data.photos);
      } else {
        throw new Error('Pipeline returned unexpected response');
      }
    } catch (err: any) {
      console.error('Pipeline error:', err);
      setErrorMessage(err.message || 'Failed to complete upload and extraction pipeline');
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  // Quick preset sample tattoo for immediate testing
  const addSampleTattoo = async (imageUrl: string, title: string) => {
    try {
      setIsProcessing(true);
      setCurrentStep('Summoning sample artwork...');
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${title.replace(/\s+/g, '_')}.jpg`, {
        type: 'image/jpeg',
      });
      const previewUrl = URL.createObjectURL(file);
      setQueuedItems((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          previewUrl,
          size: file.size,
        },
      ]);
      setErrorMessage(null);
    } catch (e) {
      console.error('Failed to load sample:', e);
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#07070d] dark:text-zinc-100 py-10 px-4 sm:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-purple-900/40 pb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Upload Tattoo Images</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1 max-w-xl">
              Drap and drop, paste photos from your clipboard or select files from your computer. Images are uploaded to a storage, tags are extracted by an AI and recorded in a database.
            </p>
          </div>

          <button
            onClick={onNavigateToGallery}
            className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs transition-colors cursor-pointer dark:bg-[#0e0e1c] dark:hover:bg-purple-950/60 dark:text-cyan-300 dark:border-purple-900/50"
          >
            ← Return to Gallery
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm shadow-sm dark:bg-rose-950/50 dark:border-rose-900/70 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="flex-1 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* SUCCESS VIEW: Results extracted & inserted */}
        {results.length > 0 ? (
          <div className="space-y-8 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:bg-cyan-950/20 dark:border-cyan-500/40 dark:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md dark:bg-gradient-to-br dark:from-cyan-400 dark:to-purple-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Occult Extraction &amp; Storage Completed!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    {results.length} {results.length === 1 ? 'tattoo' : 'tattoos'} saved to Blob storage and permanently inserted into the PostgreSQL Photos table.
                  </p>
                </div>
              </div>

              {/* Requirements: "Once the photos are uploaded with success and the extractor extracted the photos, the user can click a button to upload new photos." */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetForNewUploads}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs transition-all cursor-pointer dark:bg-[#121224] dark:hover:bg-purple-950/60 dark:text-cyan-300 dark:border-purple-800/50"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Upload New Photos</span>
                </button>
                <button
                  onClick={onNavigateToGallery}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-105 cursor-pointer"
                >
                  <span>View in Gallery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Extracted Cards breakdown */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Extracted Elements &amp; PostgreSQL Records</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5 dark:bg-[#090914] dark:border-purple-900/40 dark:shadow-xl"
                  >
                    <div className="flex gap-4">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 dark:bg-[#05050a] dark:border-purple-900/50">
                        <img
                          src={res.photo.path}
                          alt={res.photo.image_name || 'Tattoo'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded border border-cyan-200 font-bold dark:text-cyan-400 dark:bg-cyan-950/60 dark:border-cyan-500/30">
                          Photos #{res.photo.id}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1 leading-snug truncate">
                          {res.photo.image_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-purple-900 dark:text-purple-300 mt-1">
                          <User className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                          <span className="truncate font-semibold">{res.photo.author?.name}</span>
                          {res.photo.author?.instagram && (
                            <span className="text-purple-700 dark:text-cyan-400 text-[11px] font-mono">
                              ({res.photo.author.instagram})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-1 truncate">
                          Blob: {res.photo.path}
                        </p>
                      </div>
                    </div>

                    {/* Metadata attributes badges */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#0e0e1c] dark:border-purple-900/30">
                        <span className="text-purple-800 dark:text-purple-400 text-[10px] uppercase block font-semibold">Style</span>
                        <span className="text-slate-900 dark:text-zinc-200 font-semibold capitalize">
                          {res.photo.style}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#0e0e1c] dark:border-purple-900/30">
                        <span className="text-purple-800 dark:text-purple-400 text-[10px] uppercase block font-semibold">Era</span>
                        <span className="text-slate-900 dark:text-zinc-200 font-semibold capitalize">
                          {res.photo.modern_traditional}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#0e0e1c] dark:border-purple-900/30">
                        <span className="text-purple-800 dark:text-purple-400 text-[10px] uppercase block font-semibold">Placement</span>
                        <span className="text-slate-900 dark:text-zinc-200 font-semibold capitalize">
                          {res.photo.placement}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#0e0e1c] dark:border-purple-900/30">
                        <span className="text-purple-800 dark:text-purple-400 text-[10px] uppercase block font-semibold">Coverage</span>
                        <span className="text-slate-900 dark:text-zinc-200 font-semibold capitalize">
                          {res.photo.how}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#0e0e1c] dark:border-purple-900/30 col-span-2">
                        <span className="text-purple-800 dark:text-purple-400 text-[10px] uppercase block font-semibold">Color</span>
                        <span className="text-cyan-800 dark:text-cyan-300 font-semibold capitalize">
                          {res.photo.color}
                        </span>
                      </div>
                    </div>

                    {/* Subjects list */}
                    {res.photo.subjects && (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-purple-800 dark:text-purple-400 tracking-wider block mb-1.5">
                          Detected Elements:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {res.photo.subjects.split(',').map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-950 text-xs border border-purple-200 flex items-center gap-1 dark:bg-purple-950/70 dark:text-cyan-200 dark:border-purple-800/40"
                            >
                              <Hash className="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400" />
                              <span>{tag.trim()}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw Structured JSON collapsible */}
                    <details className="text-xs bg-slate-100 rounded-xl border border-slate-200 p-3 group dark:bg-[#05050a] dark:border-purple-950">
                      <summary className="font-mono text-purple-900 dark:text-purple-300 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center justify-between font-semibold">
                        <span>View Raw LLM Extractor JSON</span>
                        <span className="text-[10px] text-slate-500 dark:text-purple-500 group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>
                      <pre className="mt-2 text-[11px] text-cyan-900 bg-white dark:text-cyan-300 font-mono overflow-x-auto p-2.5 rounded-lg border border-slate-200 dark:border-purple-900/40 dark:bg-[#090914]">
                        {JSON.stringify(res.extracted, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* UPLOAD FORM VIEW */
          <div className="space-y-6">
            {/* Drag & Drop Area with Paste Listener */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-50 shadow-md scale-[1.01] dark:border-cyan-400 dark:bg-cyan-950/30 dark:shadow-[0_0_35px_rgba(6,182,212,0.3)]'
                  : 'border-slate-300 bg-white hover:border-cyan-500 hover:bg-slate-50/80 shadow-2xs dark:border-purple-900/60 dark:bg-[#090912] dark:hover:border-cyan-400/80 dark:hover:bg-[#0e0e1a]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-900 border border-purple-200 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform dark:bg-gradient-to-br dark:from-cyan-500/20 dark:via-purple-600/30 dark:to-purple-900/40 dark:border-cyan-400/40 dark:text-cyan-300">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Drag and drop tattoo photos here
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                  Or click to browse from your device. You can also{' '}
                  <span className="text-cyan-700 dark:text-cyan-400 font-semibold underline decoration-cyan-400/50">
                    paste directly (Ctrl+V / Cmd+V)
                  </span>{' '}
                  from your clipboard!
                </p>
                <p className="text-[11px] text-purple-700 dark:text-purple-400 pt-1 font-medium">
                  Upload multiple photos simultaneously (JPEG, PNG, WebP)
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-950 border border-purple-200 text-xs font-semibold shadow-2xs dark:bg-purple-950/80 dark:text-cyan-300 dark:border-cyan-500/30">
                <Clipboard className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Clipboard Active (Ctrl+V)</span>
              </div>
            </div>

            {/* QUEUED FILES LIST */}
            {queuedItems.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Upload Queue</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-200 text-xs font-mono font-bold dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-500/40">
                      {queuedItems.length}
                    </span>
                  </h3>
                  <button
                    onClick={clearQueue}
                    disabled={isProcessing}
                    className="text-xs text-rose-600 hover:text-rose-700 dark:text-purple-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Clear queue
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {queuedItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-2xl bg-white border border-slate-200 p-2 overflow-hidden shadow-xs flex flex-col justify-between dark:bg-[#090914] dark:border-purple-900/40"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-[#05050a] relative">
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {!isProcessing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-slate-700 hover:bg-rose-600 hover:text-white border border-slate-200 transition-colors shadow-xs dark:bg-black/80 dark:text-zinc-300 dark:hover:bg-rose-900 dark:border-transparent cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">
                          {(item.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pipeline Execute Action */}
                <div className="pt-4 flex flex-col sm:flex-row items-center">
                  <button
                    onClick={processUploadPipeline}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-white" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span> Extract Tags &amp; Upload ({queuedItems.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
