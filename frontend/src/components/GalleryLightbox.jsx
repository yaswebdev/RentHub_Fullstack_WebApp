import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';

/**
 * GalleryLightbox - Une visionneuse d'images immersive
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {string[]} images
 * @param {number} initialIndex
 */
export const GalleryLightbox = ({ isOpen, onClose, images, initialIndex = 0 }) => {
  const [index, setIndex] = useState(initialIndex);

  // Synchroniser l'index
  useEffect(() => {
    if (isOpen) setIndex(initialIndex);
  }, [isOpen, initialIndex]);

  // Bloquer le scroll du body quand ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Gestion du clavier
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, index]);

  const next = () => setIndex((prev) => (prev + 1) % images.length);
  const prev = () => setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  if (!images || images.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
        >
          {/* Header Actions */}
          <div className="absolute top-0 w-full p-4 md:p-6 flex justify-between items-center z-50">
            <span className="text-white/60 font-medium text-sm">
              {index + 1} / {images.length}
            </span>
            <div className="flex gap-4">
              <Button
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Navigation Controls */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 md:left-8 z-50 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10 group focus-visible:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <ChevronLeft className="h-8 w-8 group-hover:-translate-x-1 transition-transform" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 md:right-8 z-50 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10 group focus-visible:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <ChevronRight className="h-8 w-8 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}

          {/* Image Container */}
          <div className="relative w-full h-full max-h-screen p-4 md:p-12 flex items-center justify-center outline-none" onClick={onClose}>
            <AnimatePresence mode="wait">
              <motion.img
                key={index}
                src={images[index]}
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                alt={`Vue ${index + 1}`}
                referrerPolicy="no-referrer"
                onClick={(e) => { e.stopPropagation(); next(); }}
              />
            </AnimatePresence>
          </div>

          {/* Thumbnail Strip (Desktop only) */}
          {images.length > 1 && (
            <div className="absolute bottom-6 w-full hidden md:flex justify-center gap-3 px-8 z-50 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                  className={cn(
                    "flex-shrink-0 relative overflow-hidden rounded-lg h-16 w-24 border-2 transition-all cursor-pointer",
                    index === i 
                      ? "border-primary-500 opacity-100 scale-110" 
                      : "border-transparent opacity-40 hover:opacity-100"
                  )}
                >
                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
