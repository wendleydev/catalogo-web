/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from "react";
import { FiUpload, FiTrash, FiArrowLeft } from "react-icons/fi";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
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
import defaultProfileImage from "../../../assets/perfil.webp";

const NovoVendedorSchema = yup.object().shape({
  nome: yup.string().required("O nome do vendedor é obrigatório."),
  cidade: yup.string().required("A cidade do vendedor é obrigatória."),
  whatsapp: yup
    .string()
    .required("O Telefone é obrigatório")
    .matches(/^\d{9,12}$/, "Número de telefone inválido."),
});

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
      required
    />
  </label>
);

const NovoVendedorForm = () => {
  // Adicionar classe has-header para espaçamento do MenuTopo
  useEffect(() => {
    document.body.classList.add('has-header');
    return () => {
      document.body.classList.remove('has-header');
    };
  }, []);

  const { user } = useContext(AuthContext);
  const [bancas, setBancas] = useState([]);
  const [novaBanca, setNovaBanca] = useState("");
  const [vendedorCadastrado, setVendedorCadastrado] = useState("");
  const [imagemVendedor, setImagemVendedor] = useState(null);
  const [bancaSelecionada, setBancaSelecionada] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(NovoVendedorSchema),
  });

  useEffect(() => {
    const getBancas = async () => {
      try {
        const bancasSnapshot = await getDocs(collection(db, "bancas"));
        const bancasData = bancasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBancas(bancasData);
      } catch (error) {
        console.error("Erro ao buscar bancas:", error);
      }
    };

    getBancas();
  }, []);

  const ImagePreview = ({ item, onDelete }) => (
    <div className="w-full h-32 mt-1 mb-2 flex items-center justify-center relative">
      <button className="absolute" onClick={() => onDelete(item)}>
        <FiTrash size={28} color="#FFF" />
      </button>
      <div className="rounded-full overflow-hidden w-36 h-36">
        <img
          src={item.previewUrl || defaultProfileImage}
          className="w-full h-full object-cover"
          alt="Imagem do vendedor"
        />
      </div>
    </div>
  );

  const handleOptimizedUpload = async (optimizedImages) => {
    if (optimizedImages.length > 0) {
      const optimizedImage = optimizedImages[0];
      setImagemVendedor(optimizedImage.optimized);
      
      toast.success(`Imagem otimizada! ${optimizedImage.compressionRatio}% menor que o original.`);
      
      console.log('Imagem otimizada:', {
        originalSize: `${(optimizedImage.originalSize / 1024).toFixed(1)}KB`,
        optimizedSize: `${(optimizedImage.size / 1024).toFixed(1)}KB`,
        compressionRatio: `${optimizedImage.compressionRatio}%`,
        format: optimizedImage.format
      });
    }
  };

  const handleDeleteVendedorImage = () => {
    setImagemVendedor(null);
  };

  const handleBancaChange = (e) => {
    setBancaSelecionada(e.target.value);
    setNovaBanca("");
  };

  const onSubmit = async (data) => {
    try {
      if (!user) throw new Error("Usuário não autenticado.");

      let bancaId = bancaSelecionada ? bancaSelecionada : "";
      let imagemVendedorUrl = "";

      if (imagemVendedor) {
        const uidImageVendedor = uuidV4();
        const reader = new FileReader();
        reader.readAsDataURL(imagemVendedor);
        reader.onload = async () => {
          const base64Image = reader.result;
          imagemVendedorUrl = base64Image;
          submitVendedorData(
            data,
            bancaId,
            imagemVendedorUrl,
            uidImageVendedor
          );

          if (!data.novaBanca) {
            setBancaSelecionada("");
          }
        };
      } else {
        submitVendedorData(data, bancaId, imagemVendedorUrl);

        if (!data.novaBanca) {
          setBancaSelecionada("");
        }
      }
    } catch (error) {
      console.error("Erro ao cadastrar vendedor:", error);
      toast.error("Erro ao cadastrar vendedor. Tente novamente.");
    }
  };

  const submitVendedorData = async (
    data,
    bancaId,
    imagemVendedorUrl,
    uidImageVendedor = ""
  ) => {
    try {
      if (!bancaSelecionada && data.novaBanca !== "") {
        const bancaRef = await addDoc(collection(db, "bancas"), {
          nome: data.novaBanca,
        });
        bancaId = bancaRef.id;
        const bancasSnapshot = await getDocs(collection(db, "bancas"));
        const bancasData = bancasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBancas(bancasData);
      }

      const vendedoresBancaSnapshot = await getDocs(
        collection(db, `bancas/${bancaId}/vendedores`)
      );
      const numeroVendedoresBanca = vendedoresBancaSnapshot.size;

      if (numeroVendedoresBanca >= 3) {
        setModalMessage(
          "Você atingiu o limite máximo de 3 vendedores por banca. Não é possível adicionar mais vendedores ou exclua um vendedor"
        );
        setIsModalOpen(true);
        return;
      }

      const vendedor = {
        nome: data.nome.toUpperCase(),
        banca: bancaId,
        cidade: data.cidade,
        whatsapp: data.whatsapp,
        created: new Date(),
        owner: user.name,
        uid: user.uid,
        images: imagemVendedorUrl
          ? [
              {
                uid: user.uid,
                name: uidImageVendedor,
                url: imagemVendedorUrl,
              },
            ]
          : [],
      };

      await addDoc(collection(db, `bancas/${bancaId}/vendedores`), vendedor);

      setVendedorCadastrado(data.nome);
      setModalMessage("Perfil cadastrado com sucesso!");
      setIsModalOpen(true);

      reset();
      setImagemVendedor(null);
      console.log("Vendedor cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao cadastrar vendedor:", error);
      toast.error("Erro ao cadastrar vendedor. Tente novamente.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage("");
  };

  return (
    <div
      className="bg-cover bg-center text-sm text-gray-200 relative min-h-screen"
      style={{ backgroundImage: `url(${fundo})` }}
    >
      <SEO
        title="Cadastro de Vendedor"
        description="Página para cadastrar novos vendedores no sistema."
      />
      <div className="bg-gray-700 min-h-screen bg-opacity-65 h-full relative z-10">
        <MenuTopo />
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-md mx-auto p-8 rounded-xl mt-2 bg-gray-800 bg-opacity-80 shadow-md"
        >
          <h2 className="text-sm font-semibold text-center uppercase mb-4">
            Cadastro de Vendedor
          </h2>
          <div className="-mb-20 mt-6">
            <div className="space-y-2 w-full h-56">
              {imagemVendedor ? (
                <ImagePreview
                  item={{ previewUrl: URL.createObjectURL(imagemVendedor) }}
                  onDelete={handleDeleteVendedorImage}
                />
              ) : (
                <div className="flex justify-center">
                  <OptimizedImageUpload
                    onUpload={handleOptimizedUpload}
                    multiple={false}
                    maxFiles={1}
                    maxFileSize={500 * 1024} // 500KB para perfil
                    showPreview={false}
                    showProgress={true}
                    className="w-full max-w-xs"
                  />
                  <p className="mt-2 text-xs text-gray-300 text-center">
                    Tamanho máximo da foto: 500KB.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="mb-5">
            <label
              htmlFor="nome"
              className="block text-xs uppercase mb-2 text-center text-gray-300"
            >
              Nome do Vendedor
            </label>
            <input
              type="text"
              id="nome"
              {...register("nome")}
              className={`form-input block w-full rounded-xl py-1 px-2 text-center text-xs text-gray-600 transition duration-150 ease-in-out sm:text-sm sm:leading-5 ${
                errors.nome ? "border-red-500" : ""
              }`}
              aria-invalid={errors.nome ? "true" : "false"}
            />
            {errors.nome && (
              <p className="mt-1 text-xs text-red-500">{errors.nome.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="mb-5">
              <label
                htmlFor="cidade"
                className="block text-xs uppercase mb-2 text-center text-gray-300"
              >
                Cidade
              </label>
              <input
                type="text"
                id="cidade"
                {...register("cidade")}
                className={`form-input block w-full rounded-xl py-1 px-2 text-center text-xs text-gray-600 transition duration-150 ease-in-out sm:text-sm sm:leading-5 ${
                  errors.cidade ? "border-red-500" : ""
                }`}
                aria-invalid={errors.cidade ? "true" : "false"}
              />
              {errors.cidade && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.cidade.message}
                </p>
              )}
            </div>
            <div className="mb-5">
              <label
                htmlFor="whatsapp"
                className="block text-xs uppercase mb-2 text-center text-gray-300"
              >
                Número (WhatsApp)
              </label>
              <input
                type="text"
                id="whatsapp"
                {...register("whatsapp")}
                className={`form-input block w-full rounded-xl py-1 px-2 text-center text-xs text-gray-600 transition duration-150 ease-in-out sm:text-sm sm:leading-5 ${
                  errors.whatsapp ? "border-red-500" : ""
                }`}
                aria-invalid={errors.whatsapp ? "true" : "false"}
              />
              {errors.whatsapp && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.whatsapp.message}
                </p>
              )}
            </div>
          </div>
          <div className="mb-5">
            <label
              htmlFor="banca"
              className="block text-xs uppercase text-center rounded-xl mb-2 text-gray-300"
            >
              Banca
            </label>
            <select
              id="banca"
              {...register("banca")}
              onChange={handleBancaChange}
              className="mt-2 rounded-xl py-1 px-2 text-gray-700 text-center bg-gray-200 bg-opacity-50 form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5"
            >
              <option className="bg-gray-300 text-gray-800" value="">
                Selecione uma banca
              </option>
              {bancas.map((banca) => (
                <option
                  className="bg-gray-200 text-gray-800"
                  key={banca.id}
                  value={banca.id}
                >
                  {banca.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-8">
            <label
              htmlFor="novaBanca"
              className="block text-xs uppercase mb-2 text-center text-gray-300"
            >
              Cadastrar nova Banca
            </label>
            <input
              id="novaBanca"
              {...register("novaBanca")}
              onChange={(e) => setNovaBanca(e.target.value)}
              disabled={bancaSelecionada !== ""}
              className={`mt-2 rounded-xl py-1 px-2 text-gray-600 form-input block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 ${
                errors.novaBanca ? "border-red-500" : ""
              }`}
              aria-invalid={errors.novaBanca ? "true" : "false"}
            />
            {errors.novaBanca && (
              <p className="mt-1 text-xs text-red-500">
                {errors.novaBanca.message}
              </p>
            )}
          </div>
          <div className="mb-4">
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent text-sm rounded-xl text-white bg-red-700 hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-indigo active:bg-green-900 transition duration-150 ease-in-out"
            >
              Cadastrar Vendedor
            </button>
          </div>
          <div className="mt-10">
            <Link
              to="/bancas"
              className="flex items-center justify-center w-full py-1 px-2 border border-transparent text-xs rounded-xl text-white bg-opacity-15 bg-green-600 hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-indigo active:bg-gray-700 transition duration-150 ease-in-out"
            >
              <FiArrowLeft className="mr-2" />
              Voltar
            </Link>
          </div>
        </form>

        {/* Modal para sucesso no cadastro*/}
        {modalMessage === "Perfil cadastrado com sucesso!" && (
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
                      Mensagem
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{modalMessage}</p>
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

        {/* Modal para limite de vendedores atingido*/}
        {modalMessage ===
          "Você atingiu o limite máximo de 3 vendedores por banca. Não é possível adicionar mais vendedores a esta banca" && (
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
                      <p className="text-sm text-gray-500">{modalMessage}</p>
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

        {/* Modal para erro no cadastro */}
        {modalMessage === "Erro ao cadastrar vendedor. Tente novamente." && (
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
                        Erro ao cadastrar vendedor. Tente novamente.
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
        {/* Modal para limite de bancas atingido */}
        {bancas.length >= 33 && (
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
                      Limite de bancas atingido
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Você atingiu o limite máximo de 33 bancas. Para
                        adicionar uma nova banca, exclua uma das bancas
                        existentes.
                      </p>
                    </div>
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

export default NovoVendedorForm;
