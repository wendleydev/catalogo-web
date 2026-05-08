
import {
  useState,
  useEffect,
  useContext,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import banner from "../../assets/banner.webp";
import { db, storage } from "../../services/firebaseConnection";
import ScrollTopoButton from "../../components/ScrollTopoButton";
import MenuTopo from "../../components/MenuTopo/MenuTopo";
import Footer from "../../components/Footer";
import BancaCard from "../../components/BancaCard/BancaCard";
import StatsSection from "../../components/StatsSection";
import { Modal, UploadModal } from "../../components/Modal";
import TermPopup from "../../components/TermPopup";
import SEO from "../../components/SEO/SEO";
import ModernCarousel from "../../components/ModernCarousel";
import HeroSection from "../../components/HeroSection";
import CategoriaCard from "../../components/CategoriaCard";

import {
  ChevronRight,
  Star,
  MapPin,
  Users,
  Award,
  Heart,
  ShoppingBag,
  Phone,
} from "lucide-react";
import {
  doc,
  collection,
  addDoc,
  getDocs,
  query,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

import { AuthContext } from "../../contexts/AuthContext";
import {
  ref,
  getDownloadURL,
} from "firebase/storage";

// Dados das estatísticas da página principal - Memoizado para performance
const getMainPageStats = () => [
  {
    icon: Users,
    value: "40+",
    label: "Anos de Tradição",
    color: "text-blue-500",
    description: "Décadas de experiência e qualidade",
  },
  {
    icon: ShoppingBag,
    value: "32",
    label: "Boxes Disponíveis",
    color: "text-green-500",
    description: "Espaços para vendedores locais",
  },
  {
    icon: Award,
    value: "100%",
    label: "Produtos Locais",
    color: "text-purple-500",
    description: "Frescos e de qualidade",
  },
  {
    icon: Heart,
    value: "10000+",
    label: "Famílias Atendidas",
    color: "text-red-500",
    description: "Comunidade satisfeita",
  },
];

// Dados do hero da página principal
const getMainPageHeroData = () => ({
  title: "Bem-vindo à Feira Livre de Buritizeiro",
  description:
    "Descubra produtos frescos e de alta qualidade diretamente da nossa comunidade local.",
  backgroundImage: banner,
});

// Dados das categorias em destaque
const getFeaturedCategories = () => [
  {
    id: "1",
    nome: "Frutas Frescas",
    icon: "🍎",
    description: "Frutas da estação direto do produtor",
    color: "from-orange-50 to-red-50",
    image:
      "https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "2",
    nome: "Verduras",
    icon: "🥬",
    description: "Verduras frescas e orgânicas",
    color: "from-green-50 to-emerald-50",
    image:
      "https://images.pexels.com/photos/1400172/pexels-photo-1400172.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

const defaultSlideSvg = (title) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#16a34a"/>
          <stop offset="100%" stop-color="#0f766e"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="700" fill="url(#bg)"/>
      <g fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif">
        <text x="600" y="330" font-size="54" font-weight="700">${title}</text>
        <text x="600" y="390" font-size="28">Feira Livre de Buritizeiro</text>
      </g>
    </svg>
  `);

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

// ======================================================= Página Principal

const PaginaPrincipal = () => {
  const { user } = useContext(AuthContext);
  const [categorias, setCategorias] = useState([]);
  const [bancas, setBancas] = useState([]);
  const [sliderImages, setSliderImages] = useState([]);
  const [selectedBanca, setSelectedBanca] = useState(null);
  const [showEvaluationPopup, setShowEvaluationPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Adicionar classe has-header para espaçamento do MenuTopo
  useEffect(() => {
    document.body.classList.add('has-header');
    return () => {
      document.body.classList.remove('has-header');
    };
  }, []);
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  const [uploadModal, setUploadModal] = useState({
    isOpen: false,
    mode: "add",
    slideId: null,
    currentTitle: "",
    currentDescription: "",
  });
  const vendedoresRef = useRef(null);
  const navigate = useNavigate();

  // Imagens padrão do carrossel
  const defaultSliderImages = useMemo(
    () => [
      defaultSlideSvg("Bem-vindo"),
      defaultSlideSvg("Produtos Frescos"),
      defaultSlideSvg("Tradição Local"),
    ],
    []
  );

  // Funções
  const showModal = useCallback((type, title, message, onConfirm = null) => {
    setModal({ isOpen: true, type, title, message, onConfirm });
  }, []);

  const closeModal = useCallback(() => {
    setModal({
      isOpen: false,
      type: "",
      title: "",
      message: "",
      onConfirm: null,
    });
  }, []);

  const uploadImageToFirestore = useCallback(
    async (imageFile, userId, title = "", description = "") => {
      try {
        const base64Image = await fileToDataUrl(imageFile);
        const docRef = await addDoc(collection(db, "slides"), {
          userId: userId,
          imageUrl: base64Image,
          title: title || "Slide do Carrossel",
          description:
            description ||
            "Descrição do slide do carrossel da Feira Livre de Buritizeiro",
          createdAt: new Date(),
        });
        return { imageUrl: base64Image, docId: docRef.id };
      } catch (error) {
        console.error("Erro ao fazer upload da imagem:", error);
        throw new Error("Erro ao fazer upload da imagem. Tente novamente.");
      }
    },
    []
  );

  const handleCarouselUpload = useCallback(async () => {
    console.log("handleCarouselUpload chamado");

    if (sliderImages.length >= 10) {
      showModal(
        "warning",
        "Limite Atingido",
        "Você atingiu o limite máximo de 10 imagens. Exclua outras para continuar."
      );
      return;
    }

    console.log("Abrindo modal de upload");
    setUploadModal({
      isOpen: true,
      mode: "add",
      slideId: null,
      currentTitle: "",
      currentDescription: "",
    });
  }, [sliderImages.length, showModal]);

  const handleReplaceSlide = useCallback((slide) => {
    if (!slide?.id || slide.id.toString().startsWith("default")) return;
    setUploadModal({
      isOpen: true,
      mode: "replace",
      slideId: slide.id,
      currentTitle: slide.title || "Slide do Carrossel",
      currentDescription:
        slide.description ||
        "Descrição do slide do carrossel da Feira Livre de Buritizeiro",
    });
  }, []);

  const handleDeleteSlide = useCallback(
    (id, imageUrl, title = "imagem") => {
      if (!id) {
        console.error("ID não definido. Não é possível excluir a imagem.");
        return;
      }

      showModal(
        "warning",
        "Confirmar Exclusão",
        `Tem certeza que deseja excluir a imagem "${title}"?`,
        async () => {
          try {
            await deleteDoc(doc(db, "slides", id));
            setSliderImages((prev) => prev.filter((img) => img.id !== id));
            closeModal();
            showModal(
              "success",
              "Sucesso!",
              `Imagem "${title}" excluída com sucesso!`
            );
          } catch (error) {
            console.error("Erro ao excluir imagem:", error);
            showModal(
              "error",
              "Erro!",
              `Erro ao excluir imagem "${title}". Tente novamente.`
            );
          }
        }
      );
    },
    [showModal, closeModal]
  );

  const handleUploadConfirm = useCallback(
    async (uploadData) => {
      if (!uploadData.imageFile) return;

      try {
        const title =
          uploadData.title ||
          uploadModal.currentTitle ||
          "Slide do Carrossel";
        const description =
          uploadData.description ||
          uploadModal.currentDescription ||
          "Descrição do slide do carrossel da Feira Livre de Buritizeiro";

        if (uploadModal.mode === "replace" && uploadModal.slideId) {
          const imageUrl = await fileToDataUrl(uploadData.imageFile);
          await updateDoc(doc(db, "slides", uploadModal.slideId), {
            imageUrl,
            title,
            description,
            updatedAt: new Date(),
          });

          setSliderImages((prev) =>
            prev.map((img) =>
              img.id === uploadModal.slideId
                ? { ...img, imageUrl, title, description }
                : img
            )
          );

          showModal("success", "Sucesso!", "Imagem do slide substituída!");
          return;
        }

        const { imageUrl, docId } = await uploadImageToFirestore(
          uploadData.imageFile,
          user.uid,
          title,
          description
        );

        setSliderImages((prev) => [
          ...prev,
          {
            id: docId,
            imageUrl,
            title,
            description,
          },
        ]);

        showModal("success", "Sucesso!", "Imagem cadastrada com sucesso!");
      } catch (error) {
        console.error("Erro ao fazer upload da imagem:", error);
        showModal(
          "error",
          "Erro!",
          "Erro ao cadastrar imagem. Tente novamente."
        );
      }
    },
    [uploadImageToFirestore, user?.uid, showModal, uploadModal]
  );

  const closeUploadModal = useCallback(() => {
    setUploadModal({
      isOpen: false,
      mode: "add",
      slideId: null,
      currentTitle: "",
      currentDescription: "",
    });
  }, []);

  // --------------------------------------------------------------- Busca efeitos de dados

  useEffect(() => {
    const fetchSliderImages = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "slides"));
        const images = (
          await Promise.all(
            querySnapshot.docs.map(async (slideDoc) => {
              const data = slideDoc.data();
              const rawImageUrl =
                data.imageUrl || data.url || data.imagemUrl || data.image;
              const normalizedRawImageUrl = normalizeRawUrl(rawImageUrl);

              if (
                !isValidImageUrl(normalizedRawImageUrl) &&
                !isStorageRelativePath(normalizedRawImageUrl)
              ) {
                return null;
              }

              let imageUrl = normalizedRawImageUrl;

              // Compatibilidade: converte gs://... para URL HTTP pública.
              if (imageUrl.startsWith("gs://") || isStorageRelativePath(imageUrl)) {
                try {
                  imageUrl = await getDownloadURL(ref(storage, imageUrl));
                } catch (error) {
                  console.warn("Falha ao converter gs:// para URL pública:", {
                    slideId: slideDoc.id,
                    imageUrl,
                    error,
                  });
                  return null;
                }
              }

              return {
                id: slideDoc.id,
                imageUrl,
                title: data.title || "Slide do Carrossel",
                description:
                  data.description ||
                  "Descrição do slide do carrossel da Feira Livre de Buritizeiro",
              };
            })
          )
        ).filter(Boolean);
        setSliderImages(
          images.length > 0
            ? images
            : defaultSliderImages.map((url, index) => ({
                id: `default-${index}`,
                imageUrl: url,
                title: `Slide ${index + 1}`,
                description:
                  "Descrição do slide do carrossel da Feira Livre de Buritizeiro",
              }))
        );
      } catch (error) {
        console.error("Erro ao buscar imagens do Firestore:", error);
        setSliderImages(
          defaultSliderImages.map((url, index) => ({
            id: `default-${index}`,
            imageUrl: url,
            title: `Slide ${index + 1}`,
            description:
              "Descrição do slide do carrossel da Feira Livre de Buritizeiro",
          }))
        );
      }
    };

    fetchSliderImages();
  }, [defaultSliderImages]);

  useEffect(() => {
    const fetchCategorias = async () => {
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
            ...doc.data(),
          }));
          categoria.produtos = produtosData;
          categoriasData.push(categoria);
        }
        // Ordenar categorias por quantidade de produtos (mais produtos primeiro)
        const categoriasOrdenadas = categoriasData.sort(
          (a, b) => (b.produtos?.length || 0) - (a.produtos?.length || 0)
        );
        setCategorias(categoriasOrdenadas.slice(0, 2));
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        // Usando dados memoizados para demonstração
        setCategorias(getFeaturedCategories());
      }
    };

    fetchCategorias();
  }, []);

  useEffect(() => {
    const fetchBancas = async () => {
      try {
        const snapshotBancas = await getDocs(collection(db, "bancas"));
        const bancasData = [];
        for (const doc of snapshotBancas.docs) {
          const banca = { id: doc.id, ...doc.data() };
          
          // Buscar vendedores da banca
          const vendedoresSnapshot = await getDocs(
            query(collection(db, `bancas/${banca.id}/vendedores`))
          );
          const vendedoresData = (
            await Promise.all(
              vendedoresSnapshot.docs.map(async (vendedorDoc) => {
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
            )
          ).filter(Boolean);
          banca.vendedores = vendedoresData;
          
          // Os produtos já estão no documento da banca como array
          banca.produtos = banca.produtos || [];
          
          bancasData.push(banca);
        }
        // Ordenar bancas por quantidade de produtos (mais produtos primeiro)
        const bancasOrdenadas = bancasData.sort(
          (a, b) => (b.produtos?.length || 0) - (a.produtos?.length || 0)
        );
        setBancas(bancasOrdenadas.slice(0, 3));
      } catch (error) {
        console.error("Erro ao buscar bancas:", error);
        setBancas([
          {
            id: "1",
            nome: "Banca das Frutas",
            vendedores: [
              {
                id: "1",
                nome: "João Silva",
                cidade: "Buritizeiro - MG",
                whatsapp: "5538999999999",
                images: [
                  {
                    url: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400",
                  },
                ],
              },
            ],
          },
        ]);
      }
    };

    fetchBancas();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (vendedoresRef.current && !vendedoresRef.current.contains(e.target)) {
        setSelectedBanca(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Função para simular carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectVendedores = useCallback(
    (bancaId) => {
      setSelectedBanca(selectedBanca === bancaId ? null : bancaId);
    },
    [selectedBanca]
  );

  const handleEvaluationAccept = useCallback(() => {
    setShowEvaluationPopup(false);
    navigate("/avaliacao");
  }, [navigate]);

  // Renderização condicional de loading
  if (isLoading) {
    return (
              <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando Feira Livre...</p>
        </div>
      </div>
    );
  }

  return (
          <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 scroll-smooth">
      <MenuTopo />
      <SEO
        title="Feira Livre de Buritizeiro - Produtos Frescos e de Qualidade"
        description="Descubra a Feira Livre de Buritizeiro, onde você encontra produtos frescos e de alta qualidade diretamente da nossa comunidade local. Todos os domingos das 6h às 12h, você encontra produtos frescos e de qualidade no coração de Buritizeiro."
        keywords={[
          "Feira Livre",
          "Buritizeiro",
          "produtos frescos",
          "alimentos orgânicos",
          "mercado livre",
          "banca de produtos",
          "comércio local",
        ]}
      />

      {/* Hero Section */}
      <HeroSection {...getMainPageHeroData()} />

      {/* Seção Principal com Carrossel e Categorias */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Carrossel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <ModernCarousel
                images={sliderImages}
                onDeleteSlide={handleDeleteSlide}
                onReplaceImage={handleReplaceSlide}
                isAdmin={user?.role === "admin"}
                onAddImage={handleCarouselUpload}
                key={`carousel-${sliderImages.length}`}
              />
            </motion.div>

            {/* Categorias */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-blue-800 dark:from-gray-100 dark:via-green-400 dark:to-blue-400 bg-clip-text text-transparent mb-10">
                Categorias em Destaque
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categorias.map((categoria, index) => (
                  <CategoriaCard
                    key={categoria.id}
                    categoria={categoria}
                    index={index}
                    variant="compact"
                  />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link
                  to="/todascategorias"
                  className="inline-flex mt-10 items-center text-sm space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span>Ver todas as Categorias</span>
                  <ChevronRight size={20} />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section id="estatisticas" className="scroll-to-element">
        <StatsSection
          stats={getMainPageStats()}
          title="Nossa Feira em números"
          subtitle="Décadas de tradição e qualidade comprovada"
          variant="glass"
        />
      </section>

      {/* Seção de Bancas Modernizada */}
      <section
        id="bancas"
        className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 scroll-to-element"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-blue-800 dark:from-gray-100 dark:via-green-400 dark:to-blue-400 bg-clip-text text-transparent mb-6">
              Conheça Nossas Bancas
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Vendedores locais com produtos de qualidade garantida
            </p>
          </motion.div>

          {/* Cards de Bancas */}
          <article className="grid grid-cols-1 mt-6 gap-8 md:grid-cols-3 lg:grid-cols-3 mx-2 scroll-container">
            {bancas.map((banca, index) => (
              <motion.div
                key={banca.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <BancaCard
                  banca={banca}
                  index={index}
                  showAdminControls={false}
                  showVendedoresDropdown={true}
                  onSelectVendedores={handleSelectVendedores}
                  selectedBanca={selectedBanca}
                  whatsappMessage="Olá! Vi sua banca no site da Feira de Buritizeiro e fiquei interessado!"
                  acessarBancaText="Acessar banca"
                  verVendedoresText="Ver Vendedores"
                  fecharVendedoresText="Fechar Vendedores"
                />
              </motion.div>
            ))}
          </article>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mt-12"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/bancas"
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white px-10 py-3 rounded-xl font-semibold hover:from-gray-800 hover:via-blue-800 hover:to-purple-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <span>Ver todas as Bancas</span>
                <ChevronRight size={20} />
              </Link>
              <button
                onClick={() => setShowEvaluationPopup(true)}
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <Star size={20} />
                <span>Avaliar o Site!</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Seção de Contato Modernizada */}
      <section
        id="contato"
        className="py-16 bg-gradient-to-r from-green-600 via-green-700 to-green-800 relative overflow-hidden"
      >
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-10 w-20 h-20 bg-white dark:bg-gray-300 rounded-full blur-xl"></div>
              <div className="absolute bottom-20 right-20 w-32 h-32 bg-white dark:bg-gray-300 rounded-full blur-xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-green-100 to-green-200 bg-clip-text text-transparent mb-4">
              Venha nos Visitar!
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Todos os domingos das 6h às 12h, você encontra produtos frescos e
              de qualidade no coração de Buritizeiro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/localizacao"
                className="inline-flex items-center space-x-2 bg-white dark:bg-gray-100 text-green-700 dark:text-green-800 px-8 py-2 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-200 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <MapPin size={20} />
                <span>Ver Localização</span>
              </Link>
              <a
                href="tel:+553837421011"
                className="inline-flex items-center space-x-2 bg-green-800 text-white px-8 py-2 rounded-xl font-semibold hover:bg-green-900 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <Phone size={20} />
                <span>(38) 3742-1011</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <ScrollTopoButton />

      <Footer />

      {/* Modais */}
      <AnimatePresence>
        {modal.isOpen && (
          <Modal
            key="main-modal"
            isOpen={modal.isOpen}
            onClose={closeModal}
            type={modal.type}
            title={modal.title}
            message={modal.message}
            onConfirm={modal.onConfirm}
          />
        )}

        {showEvaluationPopup && (
          <TermPopup
            key="evaluation-popup"
            isOpen={showEvaluationPopup}
            onClose={() => setShowEvaluationPopup(false)}
            onAccept={handleEvaluationAccept}
          />
        )}

        {uploadModal.isOpen && (
          <UploadModal
            key="upload-modal"
            isOpen={uploadModal.isOpen}
            onClose={closeUploadModal}
            onUpload={handleUploadConfirm}
            title={
              uploadModal.mode === "replace"
                ? "Substituir Imagem do Slide"
                : "Adicionar Imagem ao Carrossel"
            }
            confirmButtonText={
              uploadModal.mode === "replace"
                ? "Substituir Imagem"
                : "Adicionar Imagem"
            }
            size="md"
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default PaginaPrincipal;
