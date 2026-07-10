import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import banner from "../../../assets/banner.webp";
import { FaWhatsapp } from "react-icons/fa";
import { db } from "../../../services/firebaseConnection";
import { AuthContext } from "../../../contexts/AuthContext";
import { CartContext } from "../../../contexts/CartContext";
import OptimizedImageUpload from "../../../components/OptimizedImageUpload/OptimizedImageUpload";
import defaultProfileImage from "../../../assets/perfil.webp";
import MenuTopo from "../../../components/MenuTopo/MenuTopo";
import Footer from "../../../components/Footer";
import ScrollTopoButton from "../../../components/ScrollTopoButton";
import StatsSection from "../../../components/StatsSection";
import { Modal } from "../../../components/Modal";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import SEO from "../../../components/SEO/SEO";
import HeroSection from "../../../components/HeroSection";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  updateDoc,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../../../services/firebaseConnection";

import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Store,
  Users,
  Package,
  Loader,
  ShoppingBag,
  MapPin,
  Award,
  Heart,
  Edit3,
  Save,
  X,
} from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const UNIT_OPTIONS = [
  { value: "un", label: "Unidade (un)" },
  { value: "kg", label: "Quilo (kg)" },
  { value: "g", label: "Grama (g)" },
  { value: "l", label: "Litro (l)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "dz", label: "Duzia (dz)" },
  { value: "maco", label: "Maco" },
  { value: "bandeja", label: "Bandeja" },
];

const getUnitLabel = (unitValue) =>
  UNIT_OPTIONS.find((unit) => unit.value === unitValue)?.label || "Unidade (un)";

const isValidImageUrl = (url) =>
  typeof url === "string" &&
  /^(https?:\/\/|data:image\/|gs:\/\/)/i.test(url.trim());

const normalizeRawUrl = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
};

const isStorageRelativePath = (value) =>
  typeof value === "string" &&
  /^(slides|vendedores|produtos)\//i.test(value.trim());

const normalizeImageEntry = async (entry, storageRef) => {
  const rawUrl =
    entry?.url || entry?.imageUrl || entry?.downloadURL || entry?.image;

  const normalizedRawUrl = normalizeRawUrl(rawUrl);

  if (!isValidImageUrl(normalizedRawUrl) && !isStorageRelativePath(normalizedRawUrl)) {
    return null;
  }

  let resolvedUrl = normalizedRawUrl;

  if (resolvedUrl.startsWith("gs://") || isStorageRelativePath(resolvedUrl)) {
    try {
      resolvedUrl = await getDownloadURL(ref(storageRef, resolvedUrl));
    } catch (error) {
      console.warn("Falha ao converter imagem gs:// de vendedor:", {
        rawUrl: resolvedUrl,
        error,
      });
      return null;
    }
  }

  return { ...entry, url: resolvedUrl };
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Falha ao converter imagem para base64."));
    reader.readAsDataURL(file);
  });

// Função para gerar estatísticas dos vendedores
const getVendedoresStats = (vendedores, produtosAdicionados) => [
  {
    icon: Users,
    value: vendedores.length,
    label: "Vendedores",
    color: "text-blue-500",
  },
  {
    icon: Package,
    value: produtosAdicionados.length,
    label: "Produtos",
    color: "text-green-500",
  },
  {
    icon: Award,
    value: "100%",
    label: "Qualidade",
    color: "text-purple-500",
  },
  {
    icon: Heart,
    value: "Local",
    label: "Produção",
    color: "text-red-500",
  },
];

// Dados do hero da página de Vendedor
const getVendedorHeroData = (banca) => ({
  title: banca?.nome || "Banca",
  description: "Conheça nossos vendedores e produtos de qualidade",
  backgroundImage: banner,
  icon: Store,
});

// ======================================================= Página do vendedor

const Vendedor = () => {
  // Adicionar classe has-header para espaçamento do MenuTopo
  useEffect(() => {
    document.body.classList.add('has-header');
    return () => {
      document.body.classList.remove('has-header');
    };
  }, []);

  const { bancaId } = useParams();
  const { user } = useContext(AuthContext);
  const { addItem, updateBancaContext } = useContext(CartContext);
  const navigate = useNavigate();

  const [banca, setBanca] = useState(null);
  const [vendedores, setVendedores] = useState([]);
  const [produtosExistentes, setProdutosExistentes] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [produtosAdicionados, setProdutosAdicionados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para edição
  const [showEditVendedorModal, setShowEditVendedorModal] = useState(false);
  const [newVendedorName, setNewVendedorName] = useState("");
  const [newVendedorCity, setNewVendedorCity] = useState("");
  const [newVendedorImage, setNewVendedorImage] = useState(null);
  const [selectedVendedor, setSelectedVendedor] = useState(null);
  const [removeVendedorImage, setRemoveVendedorImage] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [vendedorToDelete, setVendedorToDelete] = useState(null);
  const [isEditingBancaName, setIsEditingBancaName] = useState(false);
  const [newBancaName, setNewBancaName] = useState("");
  const [showDeleteBancaModal, setShowDeleteBancaModal] = useState(false);
  const [novoProdutoPreco, setNovoProdutoPreco] = useState("");
  const [novoProdutoUnidade, setNovoProdutoUnidade] = useState("un");
  const [editProdutoModal, setEditProdutoModal] = useState({
    isOpen: false,
    produto: null,
    preco: "",
    unidade: "un",
  });

  // Modal estados
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    icon: null,
  });

  const showModal = (type, title, message, icon) => {
    setModal({ isOpen: true, type, title, message, icon });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: "info",
      title: "",
      message: "",
      icon: null,
    });
  };

  // Função para abrir modal de confirmação de remoção
  const openDeleteConfirmModal = (vendedor) => {
    setVendedorToDelete(vendedor);
    setShowDeleteConfirmModal(true);
  };

  // Função para editar nome da banca
  const handleEditBancaName = async () => {
    try {
      if (!newBancaName.trim()) {
        showModal(
          "warning",
          "Atenção!",
          "Digite um nome para a banca.",
          AlertTriangle
        );
        return;
      }

      await updateDoc(doc(db, "bancas", bancaId), {
        nome: newBancaName.trim(),
      });

      setBanca((prev) => ({ ...prev, nome: newBancaName.trim() }));
      setIsEditingBancaName(false);
      setNewBancaName("");
      showModal(
        "success",
        "Sucesso!",
        "Nome da banca atualizado com sucesso!",
        CheckCircle
      );
    } catch (error) {
      console.error("Erro ao atualizar nome da banca:", error);
      showModal("error", "Erro!", "Erro ao atualizar nome da banca.", XCircle);
    }
  };

  // Função para remover vendedor
  const handleDeleteVendedor = async () => {
    try {
      await deleteDoc(
        doc(db, `bancas/${bancaId}/vendedores/${vendedorToDelete.id}`)
      );

      setVendedores((prev) => prev.filter((v) => v.id !== vendedorToDelete.id));
      setShowDeleteConfirmModal(false);
      setVendedorToDelete(null);
      showModal(
        "success",
        "Sucesso!",
        "Vendedor removido com sucesso!",
        CheckCircle
      );
    } catch (error) {
      console.error("Erro ao remover vendedor:", error);
      showModal("error", "Erro!", "Erro ao remover vendedor.", XCircle);
    }
  };

  // Função para excluir a banca completa
  const handleDeleteBanca = async () => {
    try {
      // Primeiro, excluir todos os vendedores da banca
      const vendedoresSnapshot = await getDocs(
        collection(db, `bancas/${bancaId}/vendedores`)
      );

      const deleteVendedoresPromises = vendedoresSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deleteVendedoresPromises);

      // Remover produtos da banca (se houver)
      if (banca && banca.produtos && banca.produtos.length > 0) {
        await updateDoc(doc(db, "bancas", bancaId), {
          produtos: [],
        });
      }

      // Depois, excluir a banca
      await deleteDoc(doc(db, "bancas", bancaId));

      showModal(
        "success",
        "Sucesso!",
        "Banca excluída com sucesso! Redirecionando...",
        CheckCircle
      );

      // Redirecionar para a página de bancas após 2 segundos
      setTimeout(() => {
        navigate("/bancas");
      }, 2000);
    } catch (error) {
      console.error("Erro ao excluir banca:", error);
      showModal("error", "Erro!", "Erro ao excluir banca.", XCircle);
    }
  };

  // Função para editar vendedor
  const handleEditVendedor = async (vendedorId) => {
    try {
      if (!newVendedorName.trim() || !newVendedorCity.trim()) {
        showModal(
          "warning",
          "Atenção!",
          "Preencha todos os campos.",
          AlertTriangle
        );
        return;
      }

      const updateData = {
        nome: newVendedorName.trim(),
        cidade: newVendedorCity.trim(),
      };

      // Se há uma nova imagem, fazer upload
      if (newVendedorImage) {
        try {
          const base64Image = await fileToDataUrl(newVendedorImage);
          updateData.images = [{ url: base64Image }];
        } catch (uploadError) {
          console.error("Erro ao fazer upload da imagem:", uploadError);
          showModal(
            "error",
            "Erro!",
            "Erro ao fazer upload da imagem.",
            XCircle
          );
          return;
        }
      }

      // Se deve remover a imagem
      if (removeVendedorImage) {
        updateData.images = [];
      }

      await updateDoc(
        doc(db, `bancas/${bancaId}/vendedores/${vendedorId}`),
        updateData
      );

      setVendedores((prev) =>
        prev.map((v) =>
          v.id === vendedorId
            ? {
                ...v,
                nome: newVendedorName.trim(),
                cidade: newVendedorCity.trim(),
                ...(newVendedorImage && {
                  images: [
                    { url: updateData.images?.[0]?.url || v.images?.[0]?.url },
                  ],
                }),
                ...(removeVendedorImage && { images: [] }),
              }
            : v
        )
      );

      setShowEditVendedorModal(false);
      setNewVendedorName("");
      setNewVendedorCity("");
      setNewVendedorImage(null);
      setSelectedVendedor(null);
      setRemoveVendedorImage(false);
      showModal(
        "success",
        "Sucesso!",
        "Dados do vendedor atualizados com sucesso!",
        CheckCircle
      );
    } catch (error) {
      console.error("Erro ao atualizar vendedor:", error);
      showModal(
        "error",
        "Erro!",
        "Erro ao atualizar dados do vendedor.",
        XCircle
      );
    }
  };

  // Função para iniciar edição do nome da banca
  const startEditBancaName = () => {
    setNewBancaName(banca?.nome || "");
    setIsEditingBancaName(true);
  };

  // Função para iniciar edição do vendedor
  const startEditVendedor = (vendedor) => {
    setSelectedVendedor(vendedor);
    setNewVendedorName(vendedor.nome || "");
    setNewVendedorCity(vendedor.cidade || "");
    setNewVendedorImage(null);
    setShowEditVendedorModal(true);
  };

  // Função para otimizar upload de imagem do vendedor
  const handleOptimizedVendedorUpload = async (optimizedImages) => {
    if (optimizedImages.length > 0) {
      const optimizedImage = optimizedImages[0];
      setNewVendedorImage(optimizedImage.optimized);

      console.log("Imagem do vendedor otimizada:", {
        originalSize: `${(optimizedImage.originalSize / 1024).toFixed(1)}KB`,
        optimizedSize: `${(optimizedImage.size / 1024).toFixed(1)}KB`,
        compressionRatio: `${optimizedImage.compressionRatio}%`,
        format: optimizedImage.format,
      });
    }
  };

  // Função para cancelar edições
  const cancelEdit = () => {
    setShowEditVendedorModal(false);
    setNewVendedorName("");
    setNewVendedorCity("");
    setNewVendedorImage(null);
    setSelectedVendedor(null);
    setRemoveVendedorImage(false);
    setIsEditingBancaName(false);
    setNewBancaName("");
  };

  useEffect(() => {
    const fetchBanca = async () => {
      try {
        const bancaDoc = await getDoc(doc(db, "bancas", bancaId));
        if (bancaDoc.exists()) {
          setBanca({ id: bancaDoc.id, ...bancaDoc.data() });
          const vendedoresCollection = collection(
            db,
            `bancas/${bancaId}/vendedores`
          );
          const snapshot = await getDocs(vendedoresCollection);
          const vendedoresData = await Promise.all(
            snapshot.docs.map(async (vendedorDoc) => {
              const vendedorData = { id: vendedorDoc.id, ...vendedorDoc.data() };
              const rawImages = Array.isArray(vendedorData.images)
                ? vendedorData.images
                : [];

              const normalizedImages = (
                await Promise.all(
                  rawImages.map((imageEntry) =>
                    normalizeImageEntry(imageEntry, storage)
                  )
                )
              ).filter(Boolean);

              return {
                ...vendedorData,
                images: normalizedImages,
              };
            })
          );
          setVendedores(vendedoresData);
        } else {
          console.log("A banca não foi encontrada.");
        }
      } catch (error) {
        console.error("Erro ao buscar a banca:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanca();
  }, [bancaId]);

  useEffect(() => {
    if (!banca?.id) return;
    updateBancaContext({
      bancaId: banca.id,
      bancaNome: banca.nome,
      vendedores,
    });
  }, [banca?.id, banca?.nome, vendedores, updateBancaContext]);

  useEffect(() => {
    const fetchProdutosExistentes = async () => {
      try {
        const snapshotCategorias = await getDocs(collection(db, "categorias"));
        const categoriasData = [];
        for (const doc of snapshotCategorias.docs) {
          const categoria = { id: doc.id, ...doc.data() };
          const produtosSnapshot = await getDocs(
            query(collection(db, `categorias/${categoria.id}/produtos`))
          );
          const produtosData = produtosSnapshot.docs.map((doc) => ({
            id: doc.id,
            nome: doc.data().nome,
            preco: Number(doc.data().preco || 0),
            unidade: doc.data().unidade || "un",
            created: doc.data().created,
            images: doc.data().images,
          }));

          categoria.produtos = produtosData;
          categoriasData.push(categoria);
        }
        setProdutosExistentes(categoriasData);
      } catch (error) {
        console.error("Erro ao buscar produtos existentes:", error);
      }
    };

    fetchProdutosExistentes();
  }, []);

  useEffect(() => {
    const fetchProdutosAdicionados = async () => {
      try {
        const bancaDoc = await getDoc(doc(db, `bancas/${bancaId}`));
        if (bancaDoc.exists()) {
          const bancaData = bancaDoc.data();
          if (bancaData.produtos) {
            setProdutosAdicionados(bancaData.produtos);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar produtos adicionados:", error);
      }
    };

    fetchProdutosAdicionados();
  }, [bancaId]);

  const handleProdutoChange = (e) => {
    setProdutoSelecionado(e.target.value);
  };

  const handleAddProduto = async () => {
    try {
      if (!vendedores[0] || !produtoSelecionado) {
        showModal(
          "warning",
          "Atenção!",
          "Selecione um produto antes de adicionar.",
          AlertTriangle
        );
        return;
      }

      if (produtosAdicionados.length >= 24) {
        showModal(
          "warning",
          "Limite Atingido!",
          "Limite de 24 produtos atingido!",
          AlertTriangle
        );
        return;
      }

      const produtoId = produtoSelecionado;

      // Verificar se o produto já foi adicionado
      const produtoExistente = produtosAdicionados.find(
        (prod) => prod.id === produtoId
      );
      if (produtoExistente) {
        showModal(
          "error",
          "Produto Duplicado!",
          "Este produto já foi adicionado!",
          XCircle
        );
        return;
      }

      // Encontrar os detalhes do produto selecionado
      const produtoSelecionadoDados = produtosExistentes
        .flatMap((categoria) => categoria.produtos)
        .find((produto) => produto.id === produtoId);

      if (!produtoSelecionadoDados) {
        console.log("Produto não encontrado nos produtos existentes.");
        return;
      }

      const precoNormalizado = Number(novoProdutoPreco);
      if (Number.isNaN(precoNormalizado) || precoNormalizado < 0) {
        showModal(
          "warning",
          "Preço inválido",
          "Informe um preço válido para adicionar o produto na banca.",
          AlertTriangle
        );
        return;
      }

      const { nome, images } = produtoSelecionadoDados;
      // Adicionar o produto à banca no Firestore
      const bancaRef = doc(db, `bancas/${banca.id}`);
      await updateDoc(bancaRef, {
        produtos: arrayUnion({
          id: produtoId,
          nome,
          images,
          preco: precoNormalizado,
          unidade: novoProdutoUnidade || "un",
        }),
      });

      // Atualizar o estado local dos produtos adicionados
      setProdutosAdicionados((prevProdutos) => [
        ...prevProdutos,
        {
          id: produtoId,
          nome,
          images,
          preco: precoNormalizado,
          unidade: novoProdutoUnidade || "un",
        },
      ]);

      // Remover o produto da lista de produtos disponíveis
      setProdutosExistentes((prevProdutosExistentes) =>
        prevProdutosExistentes.map((categoria) => ({
          ...categoria,
          produtos: categoria.produtos.filter(
            (produto) => produto.id !== produtoId
          ),
        }))
      );

      showModal(
        "success",
        "Sucesso!",
        "Produto adicionado com sucesso!",
        CheckCircle
      );
      setProdutoSelecionado("");
      setNovoProdutoPreco("");
      setNovoProdutoUnidade("un");
      console.log("Produto adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      showModal(
        "error",
        "Erro!",
        "Erro ao adicionar produto. Tente novamente.",
        XCircle
      );
    }
  };

  const handleOpenEditProdutoModal = (produto) => {
    setEditProdutoModal({
      isOpen: true,
      produto,
      preco: Number(produto.preco || 0).toFixed(2),
      unidade: produto.unidade || "un",
    });
  };

  const handleCloseEditProdutoModal = () => {
    setEditProdutoModal({
      isOpen: false,
      produto: null,
      preco: "",
      unidade: "un",
    });
  };

  const handleSaveEditProduto = async () => {
    if (!editProdutoModal.produto?.id) return;
    const precoNormalizado = Number(editProdutoModal.preco);
    if (Number.isNaN(precoNormalizado) || precoNormalizado < 0) {
      showModal(
        "warning",
        "Preço inválido",
        "Informe um preço válido para salvar.",
        AlertTriangle
      );
      return;
    }

    const produtosAtualizados = produtosAdicionados.map((produto) =>
      produto.id === editProdutoModal.produto.id
        ? {
            ...produto,
            preco: precoNormalizado,
            unidade: editProdutoModal.unidade || "un",
          }
        : produto
    );

    try {
      await updateDoc(doc(db, `bancas/${banca.id}`), {
        produtos: produtosAtualizados,
      });
      setProdutosAdicionados(produtosAtualizados);
      handleCloseEditProdutoModal();
      showModal(
        "success",
        "Sucesso!",
        "Preco e unidade atualizados para a banca.",
        CheckCircle
      );
    } catch (error) {
      console.error("Erro ao atualizar produto da banca:", error);
      showModal(
        "error",
        "Erro!",
        "Não foi possível atualizar o produto da banca.",
        XCircle
      );
    }
  };

  const handleRemoverProduto = async (produtoId) => {
    try {
      const bancaRef = doc(db, `bancas/${banca.id}`);
      const novosProdutosAdicionados = produtosAdicionados.filter(
        (produto) => produto.id !== produtoId
      );

      await updateDoc(bancaRef, {
        produtos: novosProdutosAdicionados,
      });

      setProdutosAdicionados(novosProdutosAdicionados);
      showModal(
        "success",
        "Sucesso!",
        "Produto removido com sucesso!",
        CheckCircle
      );
      console.log("Produto removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover produto:", error);
      showModal(
        "error",
        "Erro!",
        "Erro ao remover produto. Tente novamente.",
        XCircle
      );
    }
  };

  const handleAddToCart = (produto) => {
    addItem({
      bancaId: banca?.id,
      bancaNome: banca?.nome,
      vendedores,
      item: {
        id: produto.id,
        nome: produto.nome,
        preco: Number(produto.preco || 0),
        unidade: produto.unidade || "un",
      },
    });
  };

  if (isLoading) {
    return (
      <section className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MenuTopo />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader
              className="animate-spin mx-auto mb-4 text-green-600"
              size={48}
            />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Carregando informações da banca...
            </p>
          </div>
        </div>
        <Footer />
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MenuTopo />
      <SEO
        title={`${banca?.nome} - Vendedores`}
        description={`Conheça os vendedores da ${banca?.nome} em Feira de Buritizeiro. Produtos de qualidade e variedade.`}
        keywords={[
          `${banca?.nome}`,
          "vendedores",
          "produtos",
          "Feira de Buritizeiro",
        ]}
      />

      {/* Hero Section */}
      <HeroSection {...getVendedorHeroData(banca)} />

      {/* Botão para editar nome da banca */}
      {user && user.role === "admin" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {isEditingBancaName ? (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50 dark:border-gray-700/50 max-w-md w-full">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
                  Editar nome da Banca
                </h3>
                <input
                  type="text"
                  value={newBancaName}
                  onChange={(e) => setNewBancaName(e.target.value)}
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Nome da banca"
                />
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleEditBancaName}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Salvar</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingBancaName(false);
                      setNewBancaName("");
                    }}
                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <X size={16} />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={startEditBancaName}
                  className="bg-green-100 hover:bg-green-200 text-green-600 px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  title="Editar nome da Banca"
                >
                  <Edit3 size={20} />
                  <span>Editar nome da Banca</span>
                </button>

                <button
                  onClick={() => setShowDeleteBancaModal(true)}
                  className="bg-red-100 hover:bg-red-200 text-red-600 px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  title="Excluir Banca"
                >
                  <Trash2 size={20} />
                  <span>Excluir Banca</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Estatísticas Section */}
      <StatsSection
        stats={getVendedoresStats(vendedores, produtosAdicionados)}
        title="Estatísticas da Banca"
        subtitle="Números que mostram nossa qualidade e variedade"
        variant="glass"
      />

      {/* Main Content */}
      <section className="py-20 bg-gradient-to-br bg-white dark:bg-gray-800 from-slate-50 dark:from-gray-700 relative overflow-hidden">
        {/* Background */}

        <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Vendedores Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-blue-800 dark:from-gray-100 dark:via-green-400 dark:to-blue-400 bg-clip-text text-transparent mb-10 text-center">
              Perfil do Vendedor
            </h2>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vendedores.map((vendedor, index) => (
                <motion.div
                  key={vendedor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-white/50 dark:border-gray-700/50"
                >
                  {/* Card do vendedor*/}
                  <div className="bg-gradient-to-r bg-white dark:bg-gray-700 via-teal-50 dark:via-teal-900/20 to-green-100 dark:to-green-900/20 p-6 text-center">
                    <div className="w-36 h-36 mx-auto relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-blue-300 rounded-full blur-lg"></div>
                      {vendedor.images && vendedor.images.length > 0 ? (
                        <img
                          src={vendedor.images[0].url}
                          alt={`Imagem de perfil de ${vendedor.nome}`}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = defaultProfileImage;
                          }}
                          className="relative w-full h-full rounded-full object-cover shadow-2xl border-1 border-white"
                        />
                      ) : (
                        <img
                          src={defaultProfileImage}
                          alt={`Imagem padrão de perfil`}
                          className="relative w-full h-full rounded-full object-cover shadow-2xl border-1 border-white"
                        />
                      )}
                    </div>
                  </div>

                  <div className="p-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {vendedor.nome}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-4 flex items-center justify-center space-x-2">
                      <MapPin size={16} />
                      <span>{vendedor.cidade}</span>
                    </p>

                    {/* Botões de editar e remover vendedor - apenas para admin */}
                    {user && user.role === "admin" && (
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => startEditVendedor(vendedor)}
                          className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                          title="Editar Vendedor"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirmModal(vendedor)}
                          className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                          title="Remover Vendedor"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}

                    <a
                      href={`https://api.whatsapp.com/send?phone=${vendedor?.whatsapp}&text=Olá ${vendedor?.nome}! Vi sua ${banca?.nome} no site da Feira de Buritizeiro e fiquei interessado.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-lg transform hover:scale-105"
                    >
                      <FaWhatsapp size={22} />
                      <span>Conversar no WhatsApp</span>
                    </a>
                  </div>
                </motion.div>
              ))}
            </section>
          </motion.div>

          {/* Admin gerencimento dos produtos */}
          {user && user.role === "admin" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-16"
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-lg p-8 border border-white/50 dark:border-gray-700/50">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                  Gerenciar Produtos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="produto"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Selecione um produto:
                    </label>
                    <select
                      id="produto"
                      onChange={handleProdutoChange}
                      value={produtoSelecionado}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Selecione um produto...</option>
                      {produtosExistentes
                        .flatMap((categoria) => categoria.produtos)
                        .filter(
                          (produto) =>
                            !produtosAdicionados.some(
                              (adicionado) => adicionado.id === produto.id
                            )
                        )
                        .sort((a, b) => a.nome.localeCompare(b.nome))
                        .map((produto) => (
                          <option key={produto.id} value={produto.id}>
                            {produto.nome}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={novoProdutoPreco}
                      onChange={(e) => setNovoProdutoPreco(e.target.value)}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Ex: 12.50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de venda
                    </label>
                    <select
                      value={novoProdutoUnidade}
                      onChange={(e) => setNovoProdutoUnidade(e.target.value)}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {UNIT_OPTIONS.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddProduto}
                    className="md:col-span-4 inline-flex justify-center items-center text-sm space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-lg transform hover:scale-105"
                  >
                    <Plus size={20} />
                    <span>Adicionar Produto na Banca</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Produtos Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl mt-32 text-center lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-blue-800 dark:from-gray-100 dark:via-green-400 dark:to-blue-400 bg-clip-text text-transparent mb-12">
              Produtos do Vendedor
            </h2>

            {produtosAdicionados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {produtosAdicionados.map((produto, index) => (
                  <motion.div
                    key={produto.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-white/50 dark:border-gray-700/50"
                  >
                    <div className="relative">
                      {produto.images && produto.images.length > 0 && (
                        <img
                          src={produto.images[0].url}
                          alt={`Imagem de ${produto.nome}`}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center">
                        {produto.nome}
                      </h3>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400 text-center mt-1">
                        {formatCurrency(produto.preco)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
                        {getUnitLabel(produto.unidade)}
                      </p>

                      <button
                        onClick={() => handleAddToCart(produto)}
                        className="w-full inline-flex mt-3 items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-1.5 px-3 rounded-lg text-sm font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                        aria-label="Adicionar ao carrinho"
                        title="Adicionar ao carrinho"
                      >
                        <ShoppingBag size={14} />
                        <span className="hidden sm:inline">Adicionar ao Carrinho</span>
                      </button>

                      {user && user.role === "admin" && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleOpenEditProdutoModal(produto)}
                            className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-lg transform hover:scale-105"
                          >
                            <Edit3 size={16} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleRemoverProduto(produto.id)}
                            className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-lg transform hover:scale-105"
                          >
                            <Trash2 size={16} />
                            <span>Remover</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-12 shadow-lg border border-white/50 dark:border-gray-700/50 max-w-md mx-auto">
                  <ShoppingBag
                    className="mx-auto mb-4 text-gray-400 dark:text-gray-500"
                    size={64}
                  />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Nenhum produto disponível
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Esta banca ainda não possui produtos cadastrados.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Botões de navegação */}

          <article className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link
                to="/todascategorias"
                className="inline-flex items-center text-sm space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-lg transform hover:scale-105"
              >
                <ChevronRight size={24} />
                <span>Conheça todas as categorias</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Link
                to="/bancas"
                className="inline-flex items-center text-sm space-x-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white px-8 py-3 rounded-xl font-semibold hover:from-gray-800 hover:to-gray-900 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
              >
                <ChevronRight size={24} />
                <span>Conheça todas as bancas</span>
              </Link>
            </motion.div>
          </article>
        </article>
      </section>

      <ScrollTopoButton />

      <Footer />

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        icon={modal.icon}
      />

      <Modal
        isOpen={editProdutoModal.isOpen}
        onClose={handleCloseEditProdutoModal}
        type="info"
        title={`Editar ${editProdutoModal.produto?.nome || "produto"}`}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preço (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editProdutoModal.preco}
              onChange={(e) =>
                setEditProdutoModal((prev) => ({ ...prev, preco: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de venda
            </label>
            <select
              value={editProdutoModal.unidade}
              onChange={(e) =>
                setEditProdutoModal((prev) => ({ ...prev, unidade: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleSaveEditProduto}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Confirmar preço
            </button>
            <button
              onClick={handleCloseEditProdutoModal}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Edição do Vendedor */}
      <Modal
        isOpen={showEditVendedorModal}
        onClose={cancelEdit}
        type="info"
        size="xl"
      >
        <div className="text-center p-6 max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Editar Vendedor
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Nome do Vendedor
              </label>
              <input
                type="text"
                value={newVendedorName}
                onChange={(e) => setNewVendedorName(e.target.value)}
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Nome do vendedor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Cidade
              </label>
              <input
                type="text"
                value={newVendedorCity}
                onChange={(e) => setNewVendedorCity(e.target.value)}
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Foto de Perfil
              </label>

              {/* Mostrar imagem atual se existir */}
              <div className="mb-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Foto atual:
                </p>
                <img
                  src={selectedVendedor?.images && selectedVendedor.images.length > 0 
                    ? selectedVendedor.images[0].url 
                    : defaultProfileImage}
                  alt="Foto atual"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultProfileImage;
                  }}
                  className="w-20 h-20 object-cover rounded-lg mx-auto"
                />
              </div>

              <OptimizedImageUpload
                onUpload={handleOptimizedVendedorUpload}
                multiple={false}
                maxFiles={1}
                maxFileSize={500 * 1024} // 500KB para perfil
                showPreview={false}
                showProgress={true}
                className="w-full"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Tamanho máximo da foto: 500KB.
              </p>
              {newVendedorImage && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(newVendedorImage)}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg mx-auto"
                  />
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {newVendedorImage.name}
                  </p>
                </div>
              )}

              {/* Opção para remover foto */}
              {selectedVendedor?.images &&
                selectedVendedor.images.length > 0 && (
                  <div className="mt-3">
                    <label className="flex items-center space-x-2 text-sm text-red-600">
                      <input
                        type="checkbox"
                        checked={removeVendedorImage}
                        onChange={(e) =>
                          setRemoveVendedorImage(e.target.checked)
                        }
                        className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 bg-white dark:bg-gray-700"
                      />
                      <span>Remover foto atual</span>
                    </label>
                  </div>
                )}
            </div>
          </div>

          <div className="flex justify-center space-x-3 mt-6">
            <button
              onClick={() =>
                selectedVendedor && handleEditVendedor(selectedVendedor.id)
              }
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Salvar</span>
            </button>
            <button
              onClick={cancelEdit}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <X size={16} />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação para Remover Vendedor */}
      <ConfirmModal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
          setShowDeleteConfirmModal(false);
          setVendedorToDelete(null);
        }}
        onConfirm={handleDeleteVendedor}
        title="Remover Vendedor"
        message={`Tem certeza que deseja remover o vendedor "${vendedorToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal de Confirmação para Excluir Banca */}
      <ConfirmModal
        isOpen={showDeleteBancaModal}
        onClose={() => setShowDeleteBancaModal(false)}
        onConfirm={handleDeleteBanca}
        title="Excluir Banca"
        message={`Tem certeza que deseja excluir a banca "${
          banca?.nome
        }" com todos os seus vendedores${
          banca?.produtos && banca.produtos.length > 0 ? " e produtos" : ""
        }? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </main>
  );
};

export default Vendedor;
