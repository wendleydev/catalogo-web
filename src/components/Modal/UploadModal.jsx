/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { X, Upload, Image } from "lucide-react";
import OptimizedImageUpload from "../OptimizedImageUpload/OptimizedImageUpload";
import { optimizeImage } from "../../utils/imageOptimizer";

/**
 * Componente Modal específico para upload de imagens
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.isOpen - Se o modal está aberto
 * @param {Function} props.onClose - Função para fechar o modal
 * @param {Function} props.onUpload - Função chamada quando o upload é confirmado
 * @param {string} props.title - Título do modal
 * @param {string} props.size - Tamanho do modal ('sm', 'md', 'lg', 'xl')
 */
const UploadModal = ({
  isOpen,
  onClose,
  onUpload,
  title = "Adicionar Imagem",
  size = "lg",
  confirmButtonText = "Adicionar Imagem",
}) => {
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    imageFile: null,
    imagePreview: null,
  });

  // Gerenciamento de scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Impede scroll do body
    }

    return () => {
      document.body.style.overflow = ""; // Restaura scroll do body
    };
  }, [isOpen]);

  // Função para obter tamanho do modal
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "max-w-sm";
      case "md":
        return "max-w-md";
      case "lg":
        return "max-w-md";
      case "xl":
        return "max-w-lg";
      default:
        return "max-w-md";
    }
  };

  // Função para lidar com upload otimizado
  const handleOptimizedUpload = async (optimizedImages) => {
    if (optimizedImages.length > 0) {
      const optimizedImage = optimizedImages[0];
      setUploadData((prev) => ({
        ...prev,
        imageFile: optimizedImage.optimized,
        imagePreview: optimizedImage.optimizedUrl,
      }));
      
      console.log('Imagem do carrossel otimizada:', {
        originalSize: `${(optimizedImage.originalSize / 1024).toFixed(1)}KB`,
        optimizedSize: `${(optimizedImage.size / 1024).toFixed(1)}KB`,
        compressionRatio: `${optimizedImage.compressionRatio}%`,
        format: optimizedImage.format
      });
    }
  };

  // Função para confirmar upload
  const handleUploadConfirm = () => {
    if (onUpload && uploadData.imageFile) {
      onUpload(uploadData);
    }
    // Reset upload data
    setUploadData({
      title: "",
      description: "",
      imageFile: null,
      imagePreview: null,
    });
    onClose();
  };

  // Função para fechar e resetar dados
  const handleClose = () => {
    setUploadData({
      title: "",
      description: "",
      imageFile: null,
      imagePreview: null,
    });
    onClose();
  };

  return (
    <>
      {isOpen && (
        <section
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 overflow-hidden"
          aria-modal="true"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-600 rounded-xl shadow-2xl p-4 ${getSizeClasses()} w-full mx-4 text-center relative max-h-[90vh] overflow-y-auto`}
          >
            {/* Botão de fechar */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Fechar modal"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>

            {/* Conteúdo do modal */}
            <div className="space-y-3">
              {/* Ícone */}
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Upload size={32} className="text-blue-500 dark:text-blue-400" />
                </div>
              </div>

              {/* Título */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                {title}
              </h3>

              {/* Preview da imagem */}
              {uploadData.imagePreview && (
                <div className="relative">
                  <img
                    src={uploadData.imagePreview}
                    alt="Preview"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() =>
                      setUploadData((prev) => ({
                        ...prev,
                        imageFile: null,
                        imagePreview: null,
                      }))
                    }
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Upload de arquivo */}
              {!uploadData.imageFile && (
                <OptimizedImageUpload
                  onUpload={handleOptimizedUpload}
                  multiple={false}
                  maxFiles={1}
                  maxFileSize={500 * 1024} // 500KB para carrossel
                  showPreview={false}
                  showProgress={true}
                  className="w-full"
                />
              )}

              {/* Campos de texto */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título do Slide (opcional)
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Ex: Produtos Frescos"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição do Slide (opcional)
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Ex: Descrição detalhada do slide..."
                  rows={2}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <p>• Se não preencher, serão usados valores padrão</p>
                <p>• Tamanho máximo da imagem: 500KB</p>
                <p>• Título padrão: "Slide do Carrossel"</p>
                <p>
                  • Descrição padrão: "Descrição do slide do carrossel da Feira
                  Livre de Buritizeiro"
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadConfirm}
                  disabled={!uploadData.imageFile}
                  className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {confirmButtonText}
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      )}
    </>
  );
};

// PropTypes para validação
UploadModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  title: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  confirmButtonText: PropTypes.string,
};

// Props padrão
UploadModal.defaultProps = {
  title: "Adicionar Imagem",
  size: "lg",
  confirmButtonText: "Adicionar Imagem",
};

export default UploadModal;
