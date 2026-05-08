import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import {
  MapPin,
  ChevronDown,
  X,
  Edit3,
  Trash2,
  Users,
  Save,
} from "lucide-react";
import PropTypes from "prop-types";
import OptimizedImage from "../OptimizedImage/OptimizedImage";
import defaultProfileImage from "../../assets/perfil.webp";

/**
 * Componente reutilizável para exibir cards de bancas
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.banca - Dados da banca
 * @param {number} props.index - Índice para animação
 * @param {boolean} props.showAdminControls - Se deve mostrar controles de admin
 * @param {boolean} props.showVendedoresDropdown - Se deve mostrar dropdown de vendedores
 * @param {Function} props.onEditBanca - Função para editar banca (admin)
 * @param {Function} props.onDeleteBanca - Função para deletar banca (admin)
 * @param {Function} props.onEditVendedor - Função para editar vendedor (admin)
 * @param {Function} props.onDeleteVendedor - Função para deletar vendedor (admin)
 * @param {Function} props.onSelectVendedores - Função para selecionar vendedores
 * @param {string} props.selectedBanca - ID da banca selecionada
 * @param {string} props.whatsappMessage - Mensagem personalizada para WhatsApp
 * @param {string} props.acessarBancaText - Texto do botão "Acessar Banca"
 * @param {string} props.verVendedoresText - Texto do botão "Ver Vendedores"
 * @param {string} props.fecharVendedoresText - Texto do botão "Fechar Vendedores"
 */
const BancaCard = ({
  banca,
  index = 0,
  showAdminControls = false,
  showVendedoresDropdown = true,
  onEditBanca,
  onDeleteBanca,
  onEditVendedor,
  onDeleteVendedor,
  onSelectVendedores,
  selectedBanca,
  whatsappMessage = "Olá! Vi sua banca no site da Feira de Buritizeiro e fiquei interessado!",
  acessarBancaText = "Acessar Banca",
  verVendedoresText = "Ver Vendedores",
  fecharVendedoresText = "Fechar Vendedores",
}) => {
  const [isVendedoresOpen, setIsVendedoresOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState(null);
  const [editVendedorName, setEditVendedorName] = useState("");
  const [editVendedorCity, setEditVendedorCity] = useState("");
  const vendedoresRef = useRef(null);

  // Imagem padrão para vendedores
  const defaultVendedorImage = defaultProfileImage;

  // Vendedor principal (primeiro da lista)
  const vendedorPrincipal = banca.vendedores?.[0];

  // Vendedores adicionais (excluindo o primeiro)
  const vendedoresAdicionais = banca.vendedores?.slice(1) || [];

  // Função para alternar dropdown de vendedores
  const handleToggleVendedores = () => {
    if (onSelectVendedores) {
      onSelectVendedores(selectedBanca === banca.id ? null : banca.id);
    } else {
      setIsVendedoresOpen(!isVendedoresOpen);
    }
  };

  // Verificar se o dropdown está aberto
  const isDropdownOpen = onSelectVendedores
    ? selectedBanca === banca.id
    : isVendedoresOpen;

  // Função para iniciar edição de vendedor
  const handleStartEditVendedor = (vendedor) => {
    setEditingVendedor(vendedor.id);
    setEditVendedorName(vendedor.nome);
    setEditVendedorCity(vendedor.cidade);
  };

  // Função para salvar edição de vendedor
  const handleSaveEditVendedor = (vendedor) => {
    if (editVendedorName.trim() && editVendedorCity.trim()) {
      onEditVendedor?.(
        banca.id,
        vendedor.id,
        editVendedorName.trim(),
        editVendedorCity.trim()
      );
      setEditingVendedor(null);
      setEditVendedorName("");
      setEditVendedorCity("");
    }
  };

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setEditingVendedor(null);
    setEditVendedorName("");
    setEditVendedorCity("");
  };

  // Click outside para fechar dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        vendedoresRef.current &&
        !vendedoresRef.current.contains(event.target)
      ) {
        if (onSelectVendedores) {
          onSelectVendedores(null);
        } else {
          setIsVendedoresOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onSelectVendedores]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
    >
      {/* Cabeçalho da Banca */}
      <div className="p-4 mt-2 text-center relative">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-left drop-shadow-lg text-lg font-semibold uppercase text-gray-800 dark:text-gray-100">
            {banca.nome}
          </h2>
          {(banca.produtos?.length || 0) > 5 && (
            <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              ⭐ Mais Produtos
            </div>
          )}
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-3">
          {banca.produtos?.length || 0} produto
          {(banca.produtos?.length || 0) !== 1 ? "s" : ""} disponível
          {(banca.produtos?.length || 0) !== 1 ? "s" : ""}
        </p>
        <div className="w-16 h-1 bg-gray-200 dark:bg-gray-600 mx-auto rounded-full"></div>

        {/* Controles de Admin */}
        {showAdminControls && (
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={() => onEditBanca?.(banca)}
              className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 transition-all duration-300 transform hover:scale-105"
              title="Editar Banca"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => onDeleteBanca?.(banca)}
              className="w-8 h-8 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 transition-all duration-300 transform hover:scale-105"
              title="Excluir Banca"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <div className="p-4 -mt-4">
        {vendedorPrincipal ? (
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl flex flex-col items-center justify-center relative"
            >
              {/* Avatar do Vendedor */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-blue-300 rounded-full blur-lg"></div>
                <img
                  src={
                    vendedorPrincipal.images?.[0]?.url || defaultVendedorImage
                  }
                  alt={vendedorPrincipal.nome}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultVendedorImage;
                  }}
                  className="relative w-28 h-28 rounded-full object-cover shadow-xs border-white dark:border-gray-700"
                />
              </div>

              {/* Informações do Vendedor */}
              {editingVendedor === vendedorPrincipal.id ? (
                // Modo de edição para vendedor principal
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    value={editVendedorName}
                    onChange={(e) => setEditVendedorName(e.target.value)}
                    className="w-full text-base border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    placeholder="Nome do vendedor"
                  />
                  <input
                    type="text"
                    value={editVendedorCity}
                    onChange={(e) => setEditVendedorCity(e.target.value)}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    placeholder="Cidade do vendedor"
                  />
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => handleSaveEditVendedor(vendedorPrincipal)}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded-lg text-white text-xs font-medium transition-colors"
                      title="Salvar"
                    >
                      <Save size={12} className="inline mr-1" />
                      Salvar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-500 hover:bg-gray-600 rounded-lg text-white text-xs font-medium transition-colors"
                      title="Cancelar"
                    >
                      <X size={12} className="inline mr-1" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo de visualização para vendedor principal
                <div className="relative">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 -mt-2 text-xl mb-2 text-center">
                    {vendedorPrincipal.nome}
                  </h4>

                  <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm flex items-center justify-center space-x-1">
                    <MapPin size={10} />
                    <span>{vendedorPrincipal.cidade}</span>
                  </p>

                  {/* Controles de admin para vendedor principal */}
                  {showAdminControls && (
                    <div className="flex justify-center space-x-2 mt-2">
                      <button
                        onClick={() =>
                          handleStartEditVendedor(vendedorPrincipal)
                        }
                        className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 transition-all duration-300 transform hover:scale-105"
                        title="Editar Vendedor"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() =>
                          onDeleteVendedor?.({
                            bancaId: banca.id,
                            id: vendedorPrincipal.id,
                          })
                        }
                        className="w-8 h-8 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 transition-all duration-300 transform hover:scale-105"
                        title="Excluir Vendedor"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Botão WhatsApp */}
              {vendedorPrincipal.whatsapp &&
                editingVendedor !== vendedorPrincipal.id && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${
                      vendedorPrincipal.whatsapp
                    }&text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm space-x-2 mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FaWhatsapp size={18} />
                    <span>Conversar no WhatsApp</span>
                  </a>
                )}
            </motion.div>
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            Nenhum vendedor disponível nesta banca.
          </p>
        )}

        {/* Botões de Ação */}
        <div className="relative">
          <div className="flex space-x-4 mt-4">
            {/* Botão Acessar Banca */}
            <Link
              to={`/bancas/${banca.id}`}
              className="inline-flex text-xs items-center font-medium bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 shadow-xl py-3 rounded-xl hover:from-pink-600 hover:to-red-600 duration-300 focus:outline-none focus:shadow-outline transition-colors mr-2"
            >
              {acessarBancaText}
            </Link>

            {/* Botão Ver Vendedores */}
            {showVendedoresDropdown && (
              <button
                type="button"
                className="flex-1 text-xs bg-gradient-to-r font-medium from-gray-700 to-gray-800 dark:from-gray-600 dark:to-gray-700 text-white py-2 px-4 rounded-xl hover:from-gray-800 hover:to-gray-900 dark:hover:from-gray-500 dark:hover:to-gray-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={handleToggleVendedores}
              >
                <span className="mr-2">
                  {isDropdownOpen ? fecharVendedoresText : verVendedoresText}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>

          {/* Dropdown de Vendedores Adicionais */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                ref={vendedoresRef}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="absolute top-full ring-1 ring-gray-300 dark:ring-gray-600 ml-5 mt-2 max-h-60 w-64 bg-gray-100 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors rounded-xl shadow-xl z-10"
              >
                {/* Cabeçalho do Dropdown */}
                <div className="flex bg-gradient-to-t from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 justify-end py-1 px-1 rounded-t-xl">
                  <button
                    onClick={handleToggleVendedores}
                    className="text-gray-600 dark:text-gray-400 w-6 h-6 flex items-center justify-center hover:text-gray-900 dark:hover:text-gray-100 rounded-full bg-gray-100 dark:bg-gray-600 text-sm font-bold"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Conteúdo do Dropdown */}
                {vendedoresAdicionais.length > 0 ? (
                  <ul className="list-none">
                    {vendedoresAdicionais.map((vendedor) => (
                      <li
                        key={vendedor.id}
                        className="px-4 py-3 items-center relative"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <OptimizedImage
                              src={
                                vendedor.images?.[0]?.url ||
                                defaultVendedorImage
                              }
                              alt={`Imagem de perfil de ${vendedor.nome}`}
                              className="object-cover w-12 h-12 rounded-full"
                              lazy={true}
                              fallback={defaultVendedorImage}
                            />
                            <div className="flex-1 min-w-0">
                              {editingVendedor === vendedor.id ? (
                                // Modo de edição
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editVendedorName}
                                    onChange={(e) =>
                                      setEditVendedorName(e.target.value)
                                    }
                                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-600"
                                    placeholder="Nome do vendedor"
                                  />
                                  <input
                                    type="text"
                                    value={editVendedorCity}
                                    onChange={(e) =>
                                      setEditVendedorCity(e.target.value)
                                    }
                                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-600"
                                    placeholder="Cidade do vendedor"
                                  />
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() =>
                                        handleSaveEditVendedor(vendedor)
                                      }
                                      className="w-6 h-6 bg-green-500 hover:bg-green-600 rounded flex items-center justify-center text-white text-xs"
                                      title="Salvar"
                                    >
                                      <Save size={12} />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="w-6 h-6 bg-gray-500 hover:bg-gray-600 rounded flex items-center justify-center text-white text-xs"
                                      title="Cancelar"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Modo de visualização
                                <div>
                                  <div className="text-sm font-bold truncate text-gray-900 dark:text-gray-100">
                                    {vendedor.nome}
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400 text-xs flex items-center space-x-1">
                                    <MapPin size={10} />
                                    <span className="truncate">
                                      {vendedor.cidade}
                                    </span>
                                  </div>
                                  {showAdminControls && (
                                    <div className="flex space-x-1 mt-1">
                                      <button
                                        onClick={() =>
                                          handleStartEditVendedor(vendedor)
                                        }
                                        className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs"
                                        title="Editar Vendedor"
                                      >
                                        <Edit3 size={10} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          onDeleteVendedor?.({
                                            bancaId: banca.id,
                                            id: vendedor.id,
                                          })
                                        }
                                        className="w-6 h-6 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded flex items-center justify-center text-red-600 dark:text-red-400 text-xs"
                                        title="Excluir Vendedor"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Botão WhatsApp para vendedor adicional */}
                          {vendedor.whatsapp &&
                            editingVendedor !== vendedor.id && (
                              <a
                                href={`https://api.whatsapp.com/send?phone=${
                                  vendedor.whatsapp
                                }&text=${encodeURIComponent(whatsappMessage)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                title="Conversar no WhatsApp"
                              >
                                <FaWhatsapp size={18} />
                              </a>
                            )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <div className="text-gray-500 dark:text-gray-400 mb-2">
                      <Users size={24} className="mx-auto mb-2" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      Nenhum outro vendedor disponível nesta banca.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Apenas o vendedor principal está ativo.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

BancaCard.propTypes = {
  banca: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    produtos: PropTypes.array,
    vendedores: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        nome: PropTypes.string.isRequired,
        cidade: PropTypes.string.isRequired,
        whatsapp: PropTypes.string,
        images: PropTypes.arrayOf(
          PropTypes.shape({
            url: PropTypes.string.isRequired,
          })
        ),
      })
    ),
  }).isRequired,
  index: PropTypes.number,
  showAdminControls: PropTypes.bool,
  showVendedoresDropdown: PropTypes.bool,
  onEditBanca: PropTypes.func,
  onDeleteBanca: PropTypes.func,
  onEditVendedor: PropTypes.func,
  onDeleteVendedor: PropTypes.func,
  onSelectVendedores: PropTypes.func,
  selectedBanca: PropTypes.string,
  whatsappMessage: PropTypes.string,
  acessarBancaText: PropTypes.string,
  verVendedoresText: PropTypes.string,
  fecharVendedoresText: PropTypes.string,
};

BancaCard.defaultProps = {
  index: 0,
  showAdminControls: false,
  showVendedoresDropdown: true,
  whatsappMessage:
    "Olá! Vi sua banca no site da Feira de Buritizeiro e fiquei interessado!",
  acessarBancaText: "Acessar Banca",
  verVendedoresText: "Ver Vendedores",
  fecharVendedoresText: "Fechar Vendedores",
};

export default BancaCard;
