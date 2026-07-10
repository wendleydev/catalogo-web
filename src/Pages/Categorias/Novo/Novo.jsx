/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useContext } from "react";
import { FiUpload, FiTrash, FiArrowLeft } from "react-icons/fi";
import { useForm } from "react-hook-form";
import MenuTopo from "../../../components/MenuTopo/MenuTopo";
import { Link } from "react-router-dom";
import fundo from "../../../assets/fundo.webp";
import { AuthContext } from "../../../contexts/AuthContext";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { db } from "../../../services/firebaseConnection";
import { addDoc, collection, getDocs } from "firebase/firestore";
import SEO from "../../../components/SEO/SEO";
import OptimizedImageUpload from "../../../components/OptimizedImageUpload/OptimizedImageUpload";
import { optimizeImage } from "../../../utils/imageOptimizer";

const ImageUploadButton = ({ onChange }) => (
  <label className="relative inline-flex items-center justify-center w-48 h-20 md:w-48 border-2 border-gray-300 rounded-lg overflow-hidden transition duration-300 ease-in-out hover:bg-gray-800 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500">
    <span className="absolute inset-0 flex items-center justify-center">
      <FiUpload className="h-6 w-6" />
    </span>
    <span className="absolute inset-0 flex items-center justify-center transition duration-300 ease-in-out opacity-0 hover:opacity-100">
      Selecionar Imagem
    </span>
    <input
      type="file"
      accept="image/*"
      className="absolute inset-0 opacity-0 cursor-pointer"
      onChange={onChange}
    />
  </label>
);

const NovoProdutoForm = () => {
  // Adicionar classe has-header para espaçamento do MenuTopo
  useEffect(() => {
    document.body.classList.add('has-header');
    return () => {
      document.body.classList.remove('has-header');
    };
  }, []);

  const { user } = useContext(AuthContext);
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [produtoCadastrado, setProdutoCadastrado] = useState("");
  const [imagemProduto, setImagemProduto] = useState(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    const getCategorias = async () => {
      try {
        const categoriasSnapshot = await getDocs(collection(db, "categorias"));
        const categoriasData = categoriasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategorias(categoriasData);
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
      }
    };

    getCategorias();
  }, []);

  const ImagePreview = ({ item, onDelete }) => (
    <div className="w-full h-32 mt-1 mb-2 flex items-center justify-center relative">
      <button className="absolute" onClick={() => onDelete(item)}>
        <FiTrash size={28} color="#FFF" />
      </button>
      <img
        src={item.previewUrl}
        className="rounded-lg w-full h-36 object-cover"
        alt="Imagem do produto"
      />
    </div>
  );
  const handleOptimizedUpload = async (optimizedImages) => {
    if (optimizedImages.length > 0) {
      const optimizedImage = optimizedImages[0];
      setImagemProduto(optimizedImage.optimized);
      
      toast.success(`Imagem do produto otimizada! ${optimizedImage.compressionRatio}% menor que o original.`);
      
      console.log('Produto otimizado:', {
        originalSize: `${(optimizedImage.originalSize / 1024).toFixed(1)}KB`,
        optimizedSize: `${(optimizedImage.size / 1024).toFixed(1)}KB`,
        compressionRatio: `${optimizedImage.compressionRatio}%`,
        format: optimizedImage.format
      });
    }
  };

  const handleDeleteProdutoImage = () => {
    setImagemProduto(null);
  };

  const handleCategoriaChange = (e) => {
    setCategoriaSelecionada(e.target.value);
    setNovaCategoria("");
  };

  const onSubmit = async (data) => {
    try {
      if (!user) throw new Error("Usuário não autenticado.");
      if (user.role !== "admin") {
        toast.error("Apenas administradores podem cadastrar produtos.");
        return;
      }

      let categoriaId = categoriaSelecionada ? categoriaSelecionada : "";
      let imagemProdutoUrl = "";

      if (imagemProduto) {
        const uidImageProduto = uuidV4();
        const reader = new FileReader();
        reader.readAsDataURL(imagemProduto);
        reader.onload = async () => {
          const base64Image = reader.result;
          imagemProdutoUrl = base64Image;
          submitProductData(
            data,
            categoriaId,
            imagemProdutoUrl,
            uidImageProduto
          );

          if (!data.novaCategoria) {
            setCategoriaSelecionada("");
          }
        };
      } else {
        submitProductData(data, categoriaId, imagemProdutoUrl);

        if (!data.novaCategoria) {
          setCategoriaSelecionada("");
        }
      }
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);
      toast.error("Erro ao cadastrar produto. Tente novamente.");
    }
  };

  const submitProductData = async (
    data,
    categoriaId,
    imagemProdutoUrl,
    uidImageProduto = ""
  ) => {
    try {
      if (!categoriaSelecionada && data.novaCategoria !== "") {
        const categoriaRef = await addDoc(collection(db, "categorias"), {
          nome: data.novaCategoria,
        });
        categoriaId = categoriaRef.id;
        const categoriasSnapshot = await getDocs(collection(db, "categorias"));
        const categoriasData = categoriasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategorias(categoriasData);
      }

      const produto = {
        nome: data.nome.toUpperCase(),
        descricao: data.descricao?.trim() || "",
        preco: Number(data.preco),
        categoria: categoriaId,
        created: new Date(),
        owner: user.name,
        uid: user.uid,
        images: imagemProdutoUrl
          ? [
              {
                uid: user.uid,
                name: uidImageProduto,
                url: imagemProdutoUrl,
              },
            ]
          : [],
      };

      await addDoc(
        collection(db, `categorias/${categoriaId}/produtos`),
        produto
      );

      setProdutoCadastrado(data.nome);

      reset();
      setImagemProduto(null);
      console.log("Produto cadastrado com sucesso!");
      toast.success("Produto cadastrado com sucesso!");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);
      toast.error("Erro ao cadastrar produto. Tente novamente.");
      setShowErrorModal(true);
    }
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
  };

  return (
    <div
      className="bg-cover bg-center text-sm text-gray-200 relative min-h-screen"
      style={{ backgroundImage: `url(${fundo})` }}
    >
      <SEO
        title="Cadastro de Produto"
        description="Página para cadastrar novo produto no sistema."
      />
      <div className="bg-gray-700 min-h-screen bg-opacity-65 h-full relative z-10">
        <MenuTopo />
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-md mx-auto p-8 rounded-xl mt-2 bg-gray-800 bg-opacity-80 shadow-md"
        >
          <h2 className="text-sm font-semibold text-center uppercase mb-4">
            Cadastro de Produto
          </h2>
          <div className="-mb-20 mt-6">
            <div className="space-y-2 w-full h-56">
              {imagemProduto ? (
                <ImagePreview
                  item={{ previewUrl: URL.createObjectURL(imagemProduto) }}
                  onDelete={handleDeleteProdutoImage}
                />
              ) : (
                <div className="flex justify-center">
                  <OptimizedImageUpload
                    onUpload={handleOptimizedUpload}
                    multiple={false}
                    maxFiles={1}
                    maxFileSize={5 * 1024 * 1024} // 5MB para produtos
                    showPreview={false}
                    showProgress={true}
                    className="w-full max-w-xs"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="mb-5 ">
            <label
              htmlFor="nome"
              className="block text-xs uppercase mb-2 text-center text-gray-300"
            >
              Nome do Produto
            </label>
            <input
              type="text"
              id="nome"
              {...register("nome", { required: true })}
              className="mt-2 form-input block w-full rounded-xl py-1 px-2 text-gray-800 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
            />
            {errors.nome && (
              <p className="mt-1 text-xs text-red-500">
                O nome do produto é obrigatório.
              </p>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="preco"
              className="block text-xs uppercase mb-2 text-center text-gray-300"
            >
              Preço (R$)
            </label>
            <input
              type="number"
              id="preco"
              step="0.01"
              min="0"
              {...register("preco", {
                required: true,
                min: 0,
              })}
              className="mt-2 form-input block w-full rounded-xl py-1 px-2 text-gray-800 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
            />
            {errors.preco && (
              <p className="mt-1 text-xs text-red-500">
                Informe um preço válido.
              </p>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="descricao"
              className="block text-xs uppercase mb-2 text-center text-gray-300"
            >
              Descrição do Produto (opcional)
            </label>
            <textarea
              id="descricao"
              rows={3}
              {...register("descricao")}
              className="mt-2 form-input block w-full rounded-xl py-2 px-2 text-gray-800 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
              placeholder="Ex.: Produto artesanal feito na feira..."
            />
          </div>
          <div className="mb-5">
            <label
              htmlFor="categoria"
              className="block text-xs uppercase text-center rounded-xl mb-2 text-gray-300"
            >
              Categoria
            </label>
            <select
              id="categoria"
              {...register("categoria")}
              onChange={handleCategoriaChange}
              className="mt-2 rounded-xl py-1 px-2 text-gray-7y00 text-center bg-gray-200 bg-opacity-50 form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5"
            >
              <option className="bg-gray-300 text-gray-800" value="">
                Selecione uma categoria
              </option>
              {categorias.map((categoria) => (
                <option
                  className="bg-gray-200 text-gray-800"
                  key={categoria.id}
                  value={categoria.id}
                >
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-8">
            <label
              htmlFor="novaCategoria"
              className="block text-xs uppercase mb-2 text-center text-gray-300"
            >
              Cadastrar nova Categoria
            </label>
            <input
              id="novaCategoria"
              {...register("novaCategoria")}
              onChange={(e) => setNovaCategoria(e.target.value)}
              disabled={categoriaSelecionada !== ""}
              className="mt-2 rounded-xl py-1 px-2 text-gray-600 form-input block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5"
            />
          </div>
          <div className="mb-4">
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent text-sm rounded-xl text-white bg-red-700 hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-indigo active:bg-green-900 transition duration-150 ease-in-out"
            >
              Cadastrar Produto
            </button>
            <div className="mt-10">
              <Link
                to="/Todascategorias"
                className="flex items-center justify-center w-full py-1 px-2 border border-transparent text-xs rounded-xl text-white bg-opacity-15 bg-green-600 hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-indigo active:bg-gray-700 transition duration-150 ease-in-out"
              >
                <FiArrowLeft className="mr-2" />
                Voltar
              </Link>
            </div>
          </div>
        </form>
        {showSuccessModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Sucesso!
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Categoria e produto cadastrado.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      onClick={closeModal}
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {showErrorModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Erro
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Erro ao cadastrar produto. Tente novamente.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      onClick={closeModal}
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NovoProdutoForm;
