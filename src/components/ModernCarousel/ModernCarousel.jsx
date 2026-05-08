import { useState, useCallback, useEffect, memo } from "react";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Trash2, Upload, RefreshCw } from "lucide-react";
import PropTypes from "prop-types";
import OptimizedImage from "../OptimizedImage/OptimizedImage";

const ModernCarousel = ({
  images,
  onDeleteSlide,
  isAdmin,
  onAddImage,
  onReplaceImage,
}) => {

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      skipSnaps: false,
      dragFree: false,
      containScroll: "trimSnaps",
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoading, setImageLoading] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index) => emblaApi?.scrollTo(index),
    [emblaApi]
  );



  const handleImageLoad = useCallback((index) => {
    setImageLoading((prev) => ({ ...prev, [index]: true }));
  }, []);

  const handleImageError = useCallback((index) => {
    setImageLoading((prev) => ({ ...prev, [index]: false }));
  }, []);

  // Gestos de swipe para mobile
  const onTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      scrollNext();
    }
    if (isRightSwipe) {
      scrollPrev();
    }
  }, [touchStart, touchEnd, scrollNext, scrollPrev]);

  // Navegação por teclado
  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          scrollPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          scrollNext();
          break;
        case "Home":
          e.preventDefault();
          scrollTo(0);
          break;
        case "End":
          e.preventDefault();
          scrollTo(images.length - 1);
          break;
        default:
          break;
      }
    },
    [scrollPrev, scrollNext, scrollTo, images.length]
  );

  useEffect(() => {
    if (!emblaApi) return;
    
    const handleInit = () => {
      setScrollSnaps(emblaApi.scrollSnapList());
    };
    
    const handleSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    
    handleInit();
    handleSelect();
    
    emblaApi.on("reInit", handleInit);
    emblaApi.on("select", handleSelect);
    
    return () => {
      emblaApi.off("reInit", handleInit);
      emblaApi.off("select", handleSelect);
    };
  }, [emblaApi]);

  if (!images || images.length === 0) {
    return (
      <section className="relative">
        <div className="w-full h-[300px] md:h-[400px] lg:h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando carrossel...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Carrossel de imagens"
    >
      {/* Carousel container */}
      <div
        className="overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-700 scroll-snap-horizontal scroll-momentum"
        ref={emblaRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex">
          {images.map((image, index) => (
            <div
              key={image.id || index}
              className="flex-[0_0_100%] relative scroll-snap-horizontal-item"
            >
              <div className="relative scroll-vertical">
                {/* Loading skeleton */}
                {!imageLoading[index] && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 animate-pulse rounded-2xl" />
                )}

                <OptimizedImage
                  src={image.imageUrl}
                  alt={image.alt || `Slide ${index + 1} do carrossel`}
                  className="w-full h-[300px] md:h-[400px] lg:h-[500px] object-cover transition-transform duration-700 hover:scale-105"
                  lazy={index > 0} // Primeira imagem carrega imediatamente
                  priority={index === 0}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                />

                {/* Overlay gradiente melhorado */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Informações do slide */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white via-green-100 to-green-200 bg-clip-text text-transparent mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {image.title || `Slide ${index + 1}`}
                  </h3>
                  <p className="text-sm md:text-base opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {image.description || "Descrição do slide"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botão de exclusão para admin */}
      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          {onReplaceImage && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isHovered ? 1 : 0.7, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const currentImage = images[selectedIndex];
                if (!currentImage.id.toString().startsWith("default")) {
                  onReplaceImage(currentImage);
                }
              }}
              className="w-10 h-10 bg-amber-500/90 hover:bg-amber-600/90 text-white rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm transition-all duration-300"
              aria-label="Substituir imagem do slide atual"
              title="Substituir imagem"
            >
              <RefreshCw size={18} />
            </motion.button>
          )}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 1 : 0.7, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const currentImage = images[selectedIndex];
              if (!currentImage.id.toString().startsWith("default")) {
                onDeleteSlide(
                  currentImage.id,
                  currentImage.imageUrl,
                  currentImage.title || "Slide do Carrossel"
                );
              }
            }}
            className="w-10 h-10 bg-red-500/90 hover:bg-red-600/90 text-white rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm transition-all duration-300"
            aria-label="Excluir slide atual"
          >
            <Trash2 size={18} />
          </motion.button>
        </div>
      )}

      {/* Botão de adicionar imagem para admin */}
      {isAdmin && onAddImage && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0.7, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onAddImage}
          className="absolute top-4 left-4 w-10 h-10 bg-green-500/90 hover:bg-green-600/90 text-white rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm transition-all duration-300 z-20"
          aria-label="Adicionar nova imagem"
        >
          <Upload size={18} />
        </motion.button>
      )}

      {/* Botões de navegação */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{
          opacity: isHovered ? 1 : 0.3,
          x: 0,
        }}
        whileHover={{ scale: 1.1, x: -2 }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollPrev}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full shadow-xl backdrop-blur-sm transition-all duration-300 z-10 flex items-center justify-center"
        aria-label="Slide anterior"
      >
        <ChevronLeft size={20} className="md:w-6 md:h-6" />
      </motion.button>

      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{
          opacity: isHovered ? 1 : 0.3,
          x: 0,
        }}
        whileHover={{ scale: 1.1, x: 2 }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollNext}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full shadow-xl backdrop-blur-sm transition-all duration-300 z-10 flex items-center justify-center"
        aria-label="Próximo slide"
      >
        <ChevronRight size={20} className="md:w-6 md:h-6" />
      </motion.button>

      {/* Indicadores de pontos */}
      <div className="flex justify-center space-x-2 md:space-x-3 mt-4 md:mt-6 scroll-horizontal">
        {scrollSnaps.map((_, index) => (
          <motion.button
            key={`indicator-${index}`}
            onClick={() => scrollTo(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={`h-2 md:h-3 rounded-full transition-all duration-300 ${
              selectedIndex === index
                ? "w-8 md:w-10 bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg"
                : "w-2 md:w-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Indicador de slide atual para acessibilidade */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {selectedIndex + 1} de {images.length}:{" "}
        {images[selectedIndex]?.title || `Slide ${selectedIndex + 1}`}
      </div>
    </section>
  );
};

ModernCarousel.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      imageUrl: PropTypes.string.isRequired,
      alt: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
    })
  ).isRequired,
  onDeleteSlide: PropTypes.func.isRequired,
  onAddImage: PropTypes.func,
  onReplaceImage: PropTypes.func,
  isAdmin: PropTypes.bool,
};

ModernCarousel.defaultProps = {
  isAdmin: false,
  onAddImage: null,
  onReplaceImage: null,
};

ModernCarousel.displayName = "ModernCarousel";

export default memo(ModernCarousel);
