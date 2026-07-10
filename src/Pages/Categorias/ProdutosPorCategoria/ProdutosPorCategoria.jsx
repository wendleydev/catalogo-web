import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../../services/firebaseConnection";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  query,
} from "firebase/firestore";

import MenuTopo from "../../../components/MenuTopo/MenuTopo";
import Footer from "../../../components/Footer";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import SEO from "../../../components/SEO/SEO";
import {
  FaSearch,
  FaSpinner,
  FaTrashAlt,
  FaArrowLeft,
  FaStore,
} from "react-icons/fa";
import PropTypes from "prop-types";
import React from "react";

/**
 * Componente para exibir imagem do produto
 */
const ProductImage = ({ images, name }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-60 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
        <span className="text-white text-lg">Sem imagem</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 overflow-hidden group">
      <motion.img
        key={currentImageIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        src={images[currentImageIndex].url}
        alt={`${name} - Imagem ${currentImageIndex + 1}`}
        className="object-cover w-full h-full transform scale-100 group-hover:scale-110 transition-transform duration-500"
      />

      {/* Overlay com nome do produto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-white font-bold text-lg text-center px-4 pb-4">
          {name}
        </p>
      </div>

      {/* Navegação de imagens */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            →
          </button>

          {/* Indicadores de imagem */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex
                    ? "bg-white"
                    : "bg-white/50 dark:bg-gray-300/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

ProductImage.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      name: PropTypes.string,
    })
  ),
  name: PropTypes.string.isRequired,
};

/**
 * Componente para card de produto
 */
const ProductCard = ({ produto, onSelect, onDelete, isAdmin }) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Clique no card do produto:", produto.id);
    onSelect(produto.id);
  };

  return (
    <div className="cursor-pointer" onClick={handleClick}>
      <section className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-white/50 dark:border-gray-700/50">
        <ProductImage images={produto.images} name={produto.nome} />
        <div className="px-4 pt-3 pb-4">
          <h4 className="text-gray-900 dark:text-gray-100 font-bold text-base truncate">
            {produto.nome}
          </h4>
        </div>

        {/* Etiqueta simples */}
        <div className="absolute top-3 left-3">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg border border-white/20 dark:border-gray-700/20"></div>
        </div>

        {/* Botão de deletar para admin */}
        {isAdmin && (
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(produto);
              }}
              className="bg-red-500/90 hover:bg-red-600/90 text-white p-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
              aria-label={`Excluir ${produto.nome}`}
            >
              <FaTrashAlt size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

ProductCard.propTypes = {
  produto: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    images: PropTypes.array,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
};

ProductCard.defaultProps = {
  isAdmin: false,
};

/**
 * Componente para lista de bancas
 */
const BancasList = ({ bancas, produtoName, loading, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-gradient-to-br from-white via-gray-50 to-white backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 relative max-w-lg w-full max-h-[85vh] overflow-hidden"
    >
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-t-3xl p-6 pr-8 relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-gray-600/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 dark:bg-gray-600/10 rounded-full translate-y-12 -translate-x-12"></div>

        {/* Título */}
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 bg-white/20 dark:bg-gray-700/20 rounded-xl backdrop-blur-sm flex-shrink-0">
            <FaStore className="text-white text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl truncate">Bancas Disponíveis</h3>
            <p className="text-white/90 text-sm font-medium truncate">
              Produto: {produtoName}
            </p>
          </div>

          {/* Botão X para fechar */}
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/20 dark:hover:bg-gray-700/20 rounded-full transition-all duration-300 text-white hover:text-white/80 backdrop-blur-sm flex-shrink-0 ml-2"
            aria-label="Fechar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-green-400 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-4 font-medium">
              Buscando bancas...
            </p>
          </div>
        ) : bancas.length > 0 ? (
          <div className="space-y-3">
            <div className="text-center mb-4">
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                {bancas.length} banca{bancas.length !== 1 ? "s" : ""} encontrada
                {bancas.length !== 1 ? "s" : ""}
              </span>
            </div>
            {bancas.map((banca, index) => (
              <motion.div
                key={banca.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link to={`/bancas/${banca.id}`} className="block group">
                  <div className="bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-green-100 rounded-2xl p-4 transition-all duration-300 border border-gray-200 hover:border-green-300 hover:shadow-lg transform hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                          {banca.nome?.charAt(0)?.toUpperCase() || "B"}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                            {banca.nome || "Nome da banca não disponível"}
                          </h4>
                          <p className="text-gray-500 text-xs">
                            Clique para ver detalhes
                          </p>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaStore className="text-gray-400 text-2xl" />
            </div>
            <h4 className="text-gray-700 font-semibold mb-2">
              Nenhuma banca encontrada
            </h4>
            <p className="text-gray-500 text-sm">
              Este produto ainda não faz parte de nenhuma banca.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

BancasList.propTypes = {
  bancas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nome: PropTypes.string,
    })
  ).isRequired,
  produtoName: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

/**
 * Componente de busca
 */
const SearchBar = React.memo(({ searchTerm, onSearchChange }) => {
  const handleInputChange = (e) => {
    onSearchChange(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // A busca é automática, não precisa fazer nada aqui
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-3xl mx-auto mb-8"
    >
      <div className="bg-gradient-to-r from-white/95 via-gray-50/95 to-white/95 dark:from-gray-800/95 dark:via-gray-700/95 dark:to-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/60 dark:border-gray-600/60 relative overflow-hidden">
        {/* Decorações de fundo */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500/10 rounded-full translate-y-8 -translate-x-8"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
              <FaSearch className="text-white text-xl" />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 text-sm">
                Buscar Produtos
              </label>
              <input
                className="w-full pl-4 pr-4 py-3 bg-white/70 dark:bg-gray-700/70 border-2 border-gray-200 dark:border-gray-600 rounded-2xl text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-300 text-lg shadow-inner"
                placeholder="Digite o nome do produto..."
                value={searchTerm}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
              />
            </div>
            {searchTerm && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => handleInputChange({ target: { value: "" } })}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105"
                title="Limpar busca"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
});

SearchBar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
};

SearchBar.defaultProps = {
  searchTerm: "",
};

SearchBar.displayName = "SearchBar";

/**
 * Componente de estatísticas
 */
const StatsSection = ({ produtos, categoria }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-8"
    >
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/60 dark:border-gray-700/60 max-w-5xl mx-auto relative overflow-hidden">
        {/* Decorações de fundo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full translate-y-12 -translate-x-12"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-blue-800 dark:from-gray-100 dark:via-green-400 dark:to-blue-400 bg-clip-text text-transparent">
              {categoria.nome}
            </h1>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="bg-gradient-to-r from-green-100 to-green-200 px-6 py-3 rounded-2xl shadow-lg">
              <p className="text-green-800 font-bold text-lg">
                {produtos.length}
              </p>
              <p className="text-green-600 text-sm">
                produto{produtos.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-100 to-blue-200 px-6 py-3 rounded-2xl shadow-lg">
              <p className="text-blue-800 font-bold text-lg">
                {produtos.filter((p) => p.images && p.images.length > 0).length}
              </p>
              <p className="text-blue-600 text-sm">com imagens</p>
            </div>
          </div>

          <div className="w-32 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 mx-auto rounded-full shadow-lg"></div>
        </div>
      </div>
    </motion.div>
  );
};

StatsSection.propTypes = {
  produtos: PropTypes.array.isRequired,
  categoria: PropTypes.shape({
    nome: PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * Página principal de produtos por categoria
 */
const ProdutosPorCategoria = () => {
  // Adicionar classe has-header para espaçamento do MenuTopo
  useEffect(() => {
    document.body.classList.add("has-header");
    return () => {
      document.body.classList.remove("has-header");
    };
  }, []);

  const { idCategoria } = useParams();
  const [allProdutos, setAllProdutos] = useState([]); // Todos os produtos
  const [produtos, setProdutos] = useState([]); // Produtos filtrados
  const [searchTerm, setSearchTerm] = useState("");
  const [categoria, setCategoria] = useState({ nome: "" });
  const [bancasProduto, setBancasProduto] = useState([]);
  const [selectedProdutoId, setSelectedProdutoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingBancas, setLoadingBancas] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    produto: null,
  });
  const listRef = useRef(null);

  // Buscar categoria
  useEffect(() => {
    const fetchCategoria = async () => {
      try {
        const docRef = doc(db, "categorias", idCategoria);
        const categoriaDoc = await getDoc(docRef);
        if (categoriaDoc.exists()) {
          const categoriaData = categoriaDoc.data();
          setCategoria(categoriaData);
        }
      } catch (error) {
        setError("Erro ao buscar categoria");
        console.error("Erro ao buscar categoria:", error);
      }
    };
    fetchCategoria();
  }, [idCategoria]);

  // Buscar produtos
  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const q = query(collection(db, `categorias/${idCategoria}/produtos`));
      const produtosSnapshot = await getDocs(q);
      const produtosData = produtosSnapshot.docs.map((doc) => ({
        id: doc.id,
        nome: doc.data().nome,
        created: doc.data().created,
        images: doc.data().images || [],
      }));

      produtosData.sort((a, b) => a.nome.localeCompare(b.nome));
      setAllProdutos(produtosData);
    } catch (error) {
      setError("Erro ao buscar produtos");
      console.error("Erro ao buscar produtos por categoria:", error);
    } finally {
      setLoading(false);
    }
  }, [idCategoria]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  // Filtrar produtos em tempo real
  useEffect(() => {
    if (!searchTerm.trim()) {
      setProdutos(allProdutos);
    } else {
      const filtered = allProdutos.filter((produto) =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setProdutos(filtered);
    }
  }, [searchTerm, allProdutos]);

  // Buscar bancas por produto
  const fetchBancasPorProduto = useCallback(async (produtoId) => {
    setLoadingBancas(true);
    try {
      console.log("Buscando bancas para o produto:", produtoId);
      const snapshotBancas = await getDocs(collection(db, "bancas"));
      const bancasData = [];

      for (const doc of snapshotBancas.docs) {
        const banca = { id: doc.id, ...doc.data() };

        // Buscar vendedores da banca
        const vendedoresSnapshot = await getDocs(
          query(collection(db, `bancas/${banca.id}/vendedores`))
        );
        const vendedoresData = vendedoresSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Verificar se a banca tem produtos
        const produtosData = banca.produtos || [];
        console.log(`Banca ${banca.nome} tem produtos:`, produtosData);

        // Verificar se algum produto da banca corresponde ao produtoId
        const temProduto = produtosData.some((produto) => {
          console.log(`Comparando produto ${produto.id} com ${produtoId}`);
          return produto.id === produtoId;
        });

        if (temProduto) {
          console.log(`Banca ${banca.nome} vende o produto ${produtoId}`);
          banca.vendedores = vendedoresData;
          banca.produtos = produtosData;
          bancasData.push(banca);
        }
      }

      console.log("Bancas encontradas:", bancasData);
      setBancasProduto(bancasData);
    } catch (error) {
      console.error("Erro ao buscar bancas por produto:", error);
      setBancasProduto([]);
    } finally {
      setLoadingBancas(false);
    }
  }, []);

  // Deletar produto
  const handleDeleteProduto = useCallback(async () => {
    if (!deleteModal.produto) return;

    try {
      await deleteDoc(
        doc(db, `categorias/${idCategoria}/produtos`, deleteModal.produto.id)
      );
      setProdutos(
        produtos.filter((item) => item.id !== deleteModal.produto.id)
      );
      if (selectedProdutoId === deleteModal.produto.id) {
        setSelectedProdutoId(null);
      }
      setDeleteModal({ isOpen: false, produto: null });
    } catch (error) {
      setError("Erro ao excluir produto");
      console.error("Erro ao excluir produto:", error);
    }
  }, [deleteModal.produto, idCategoria, produtos, selectedProdutoId]);

  // Handlers
  const handleProdutoClick = useCallback(
    async (produtoId) => {
      console.log("Clique no produto:", produtoId);
      console.log("Produto selecionado atual:", selectedProdutoId);

      if (selectedProdutoId === produtoId) {
        console.log("Fechando detalhes do produto");
        setSelectedProdutoId(null);
        setBancasProduto([]); // Limpar bancas quando fechar
      } else {
        console.log("Abrindo detalhes do produto:", produtoId);
        setSelectedProdutoId(produtoId);
        await fetchBancasPorProduto(produtoId);
      }
    },
    [selectedProdutoId, fetchBancasPorProduto]
  );

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleDeleteClick = useCallback((produto) => {
    setDeleteModal({ isOpen: true, produto });
  }, []);

  // Função para fechar o modal das bancas
  const handleCloseBancas = useCallback(() => {
    setSelectedProdutoId(null);
    setBancasProduto([]);
  }, []);

  // Click outside para fechar detalhes - apenas quando modal está aberto
  useEffect(() => {
    if (!selectedProdutoId) return;

    const handleClickOutside = (event) => {
      // Verificar se o clique foi fora do modal
      const modalElement = document.querySelector('[data-modal="bancas"]');
      if (modalElement && !modalElement.contains(event.target)) {
        // Verificar se não clicou em outro modal ou menu
        const otherModal = document.querySelector(
          '[data-modal]:not([data-modal="bancas"])'
        );
        const menuElement = document.querySelector('[role="menu"]');

        if (
          !otherModal?.contains(event.target) &&
          !menuElement?.contains(event.target)
        ) {
          setSelectedProdutoId(null);
          setBancasProduto([]);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedProdutoId]);

  return (
    <>
      <SEO
        title={`Produtos ${categoria.nome}`}
        description={`Descubra os melhores produtos de ${categoria.nome} na Feira Livre de Buritizeiro. Produtos frescos e de qualidade direto dos produtores locais.`}
        keywords={[
          categoria.nome,
          "produtos",
          "feira buritizeiro",
          "frescos",
          "qualidade",
        ]}
        image="/logo.png"
        url={window.location.href}
        type="website"
      />

      <main className="min-h-screen bg-white dark:bg-gray-900">
        <MenuTopo />

        <div className="container mx-auto py-8 px-1 overflow-hidden relative z-10">
          {/* Header e Estatísticas */}
          <StatsSection produtos={produtos} categoria={categoria} />

          {/* Barra de Busca */}
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
          />

          {/* Mensagem de Erro */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/20 border border-red-400/30 rounded-lg p-2 mb-6 text-center"
              >
                <p className="text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center py-12"
            >
              <div className="text-center">
                <FaSpinner className="animate-spin text-white text-3xl mx-auto mb-4" />
                <p className="text-white">Carregando produtos...</p>
              </div>
            </motion.div>
          )}

          {/* Grid de Produtos */}
          {!loading && (
            <div className="mb-8">
              {/* Header do Grid */}
              <div className="flex items-center justify-between mb-8 mt-12">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-800 dark:text-gray-300 font-bold text-xl">
                      Produtos Disponíveis
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Clique nos cards para ver as bancas
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                ref={listRef}
              >
                {produtos.length > 0 ? (
                  produtos.map((produto, index) => (
                    <motion.div
                      key={produto.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <ProductCard
                        produto={produto}
                        onSelect={handleProdutoClick}
                        onDelete={handleDeleteClick}
                        isAdmin={false}
                      />

                      <AnimatePresence>
                        {selectedProdutoId === produto.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
                            onClick={handleCloseBancas}
                            data-modal="bancas"
                          >
                            <div onClick={(e) => e.stopPropagation()}>
                              <BancasList
                                bancas={bancasProduto}
                                produtoName={produto.nome}
                                loading={loadingBancas}
                                onClose={handleCloseBancas}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-full text-center py-16"
                  >
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 border border-white/60 dark:border-gray-700/60 shadow-xl max-w-md mx-auto">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-10 h-10 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.343A7.962 7.962 0 0112 9c-2.34 0-4.29-1.009-5.824-2.562"
                          />
                        </svg>
                      </div>
                      <h4 className="text-gray-800 dark:text-gray-200 font-bold text-xl mb-2">
                        {searchTerm
                          ? "Nenhum produto encontrado"
                          : "Nenhum produto disponível"}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {searchTerm
                          ? `Não encontramos produtos para "${searchTerm}"`
                          : "Esta categoria ainda não possui produtos cadastrados"}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Botão Voltar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-4 border border-white/20 max-w-md mx-auto">
              <Link
                to="/todascategorias"
                className="inline-flex items-center text-sm space-x-2 px-8 gap-3 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors duration-300">
                  <FaArrowLeft className="text-white" />
                </div>
                <span>Voltar para Categorias</span>
              </Link>
            </div>
          </motion.div>
        </div>

        <Footer />

        {/* Modal de Confirmação de Exclusão */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, produto: null })}
          onConfirm={handleDeleteProduto}
          title="Confirmar Exclusão"
          message={`Você tem certeza que deseja excluir o produto "${deleteModal.produto?.nome}"?`}
          confirmText="Excluir"
          cancelText="Cancelar"
          type="danger"
        />

      </main>
    </>
  );
};

ProdutosPorCategoria.displayName = "ProdutosPorCategoria";

export default ProdutosPorCategoria;
