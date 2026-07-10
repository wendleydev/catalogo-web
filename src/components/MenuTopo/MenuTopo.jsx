import { useState, useContext, useCallback, useMemo } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { Menu, Home, Info, MapPin, Settings, Clock } from "lucide-react";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useFeiraStatus } from "./hooks";
import Logo from "./Logo";
import FeiraStatus from "./ContagemRegressiva";
import MenuDesktop from "./MenuDesktop";
import MenuMobile from "./MenuMobile";
import ThemeToggleEnhanced from "../ThemeToggleEnhanced";
import { CartContext } from "../../contexts/CartContext";

/**
 * Componente principal do MenuTopo
 */
const MenuTopo = () => {
  const { timeRemaining, feiraAberta } = useFeiraStatus();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);

  // Define os itens do menu baseado no papel do usuário
  const menuItems = useMemo(
    () => [
      { to: "/paginaprincipal", icon: Home, label: "Início" },
      { to: "/historia", icon: Info, label: "História" },
      { to: "/localizacao", icon: MapPin, label: "Localização" },
      ...(user?.role === "admin"
        ? [{ to: "/admin", icon: Settings, label: "Admin" }]
        : []),
    ],
    [user?.role]
  );

  const toggleMobileMenu = useCallback(
    () => setIsMobileMenuOpen((prev) => !prev),
    []
  );
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const toggleUserMenu = useCallback(
    () => setIsUserMenuOpen((prev) => !prev),
    []
  );

  return (
    <>
      <header className="bg-gradient-to-r from-emerald-700 via-green-600 to-green-700 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 shadow-lg fixed top-0 left-0 right-0 z-40">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Logo />

            {/* Status da Feira */}
            <div className="hidden md:block">
              <FeiraStatus
                feiraAberta={feiraAberta}
                timeRemaining={timeRemaining}
              />
            </div>

            {/* Status da Feira Mobile */}
            <div className="md:hidden">
              <div className="flex items-center space-x-2">
                <Clock className="text-white" size={16} aria-hidden="true" />
                <span className="text-white text-xs font-medium">
                  {feiraAberta ? "Aberta" : "Fechada"}
                </span>
              </div>
            </div>

            {/* Navegação Desktop */}
            <MenuDesktop
              menuItems={menuItems}
              user={user}
              isUserMenuOpen={isUserMenuOpen}
              toggleUserMenu={toggleUserMenu}
            />

            {/* Toggle de Tema - Alinhado com os itens de navegação */}
            <div className="hidden lg:block">
              <ThemeToggleEnhanced variant="button" />
            </div>

            {/* Botão do menu mobile */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Abrir menu de navegação"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu size={24} aria-hidden="true" />
            </button>
          </div>
        </section>
      </header>

      {/* Menu Mobile */}
      <MenuMobile
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        menuItems={menuItems}
      />

      <Link
        to="/carrinho"
        className="fixed top-20 right-4 z-50 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-full shadow-2xl transition-all"
        aria-label="Ir para o carrinho"
      >
        <ShoppingBag size={18} />
        <span className="hidden sm:inline font-semibold text-sm">Carrinho</span>
        <span className="min-w-6 h-6 rounded-full bg-white text-green-700 text-xs font-bold flex items-center justify-center px-1">
          {cartCount}
        </span>
      </Link>
    </>
  );
};

export default MenuTopo; 