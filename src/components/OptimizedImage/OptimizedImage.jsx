import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

const INLINE_FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#e5e7eb"/>
      <g fill="#6b7280" font-family="Arial, sans-serif" text-anchor="middle">
        <text x="600" y="390" font-size="42">Imagem indisponível</text>
        <text x="600" y="440" font-size="24">Tente novamente mais tarde</text>
      </g>
    </svg>
  `);

/**
 * Componente de imagem otimizada com lazy loading
 */
const OptimizedImage = ({
  src,
  alt,
  className = '',
  placeholder = null,
  fallback = INLINE_FALLBACK_IMAGE,
  width,
  height,
  lazy = true,
  priority = false,
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder || fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!lazy || priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, priority]);

  // Carregamento da imagem
  useEffect(() => {
    if (!isInView) return;
    if (!src) {
      setImageSrc(fallback);
      setIsLoading(false);
      setError(true);
      onError?.();
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setIsLoaded(true);
      setError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setImageSrc(fallback);
      setIsLoading(false);
      setError(true);
      onError?.();
    };

    img.src = src;
  }, [src, isInView, fallback, onLoad, onError]);

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder/loading */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center"
          >
            <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-600 border-t-green-500 rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Imagem */}
      <AnimatePresence>
        {isInView && (
          <motion.img
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: isLoaded ? 1 : 0,
              scale: isLoaded ? 1 : 1.1
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.5,
              ease: 'easeOut'
            }}
            src={imageSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isLoaded ? 'blur-0' : 'blur-sm'
            }`}
            loading={lazy ? 'lazy' : 'eager'}
            {...props}
          />
        )}
      </AnimatePresence>

      {/* Indicador de erro */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Imagem não disponível</p>
          </div>
        </div>
      )}
    </div>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  fallback: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lazy: PropTypes.bool,
  priority: PropTypes.bool,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

export default OptimizedImage; 