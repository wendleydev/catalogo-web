import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Private from "./routes/Private";
import AdminRoute from "./routes/AdminRoute";
import ScrollTopo from "./components/ScrollTopo";

// Páginas públicas
import Home from "./Pages/Home/Home";
import Historia from "./Pages/Historia/Historia";
import Localizacao from "./Pages/Localizacao/localizacao";
import PaginaPrincipal from "./Pages/PaginaPrincipal/PaginaPrincipal";
import Login from "./Pages/Login/Login";
import Registro from "./Pages/Registro/Registro";
import TodasCategorias from "./Pages/Categorias/Todascategorias/Todascategorias";
import ProdutosPorCategoria from "./Pages/Categorias/ProdutosPorCategoria/ProdutosPorCategoria";
import Bancas from "./Pages/Perfis/Bancas/Bancas";
import Vendedor from "./Pages/Perfis/Vendedor/Vendedor";
import Avaliacao from "./Pages/Avaliacao/Avaliacao";
import Resultados from "./Pages/Avaliacao/Resultados";
import NotFound from "./Pages/NotFound/NotFound";
import ImageOptimizationExample from "./examples/ImageOptimizationExample";
import Carrinho from "./Pages/Carrinho/Carrinho";
import { CartProvider } from "./contexts/CartContext";

// Páginas protegidas
import Novo from "./Pages/Categorias/Novo/Novo";
import NovoPerfil from "./Pages/Perfis/NovoPerfil/NovoPerfil";
import Admin from "./Pages/Admin/Admin";

/**
 * Componente principal de rotas da aplicação
 */
const Rotas = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollTopo />

        <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/historia" element={<Historia />} />
        <Route path="/localizacao" element={<Localizacao />} />
        <Route path="/paginaprincipal" element={<PaginaPrincipal />} />
        <Route path="/todascategorias" element={<TodasCategorias />} />
        <Route path="/categorias/:idCategoria" element={<ProdutosPorCategoria />} />
        <Route path="/bancas" element={<Bancas />} />
        <Route path="/bancas/:bancaId" element={<Vendedor />} />
        <Route path="/avaliacao" element={<Avaliacao />} />
        <Route path="/resultados" element={<Resultados />} />
        <Route path="/carrinho" element={<Carrinho />} />

        {/* Rotas Protegidas - Requerem Autenticação */}
        <Route
          path="/novo"
          element={
            <Private>
              <Novo />
            </Private>
          }
        />
        <Route
          path="/novoperfil"
          element={
            <Private>
              <NovoPerfil />
            </Private>
          }
        />

        {/* Rotas de Administrador - Requerem Role Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route
          path="/otimizacao-imagens"
          element={
            <AdminRoute>
              <ImageOptimizationExample />
            </AdminRoute>
          }
        />

        {/* Rota 404 - Deve ser sempre a última */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
};

export default Rotas;
