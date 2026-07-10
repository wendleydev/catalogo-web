import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { Store, ArrowLeft } from "lucide-react";
import MenuTopo from "../../components/MenuTopo/MenuTopo";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO/SEO";
import {
  CartContext,
  sanitizePhone,
  getBancaTotal,
} from "../../contexts/CartContext";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const UNIT_LABELS = {
  un: "Unidade (un)",
  kg: "Quilo (kg)",
  g: "Grama (g)",
  l: "Litro (l)",
  ml: "Mililitro (ml)",
  dz: "Duzia (dz)",
  maco: "Maco",
  bandeja: "Bandeja",
};

const getUnitLabel = (unitValue) => UNIT_LABELS[unitValue] || UNIT_LABELS.un;

const Carrinho = () => {
  const {
    cart,
    cartTotal,
    setQuantity,
    removeItem,
    clearCart,
    clearBanca,
    setSelectedWhatsapp,
  } = useContext(CartContext);

  const [whatsappAlert, setWhatsappAlert] = useState(null);

  useEffect(() => {
    document.body.classList.add("has-header");
    return () => document.body.classList.remove("has-header");
  }, []);

  const bancasComItens = cart.bancas.filter((banca) => banca.items.length > 0);

  const handleSendOrderToWhatsapp = (banca) => {
    if (!banca.selectedWhatsapp) {
      setWhatsappAlert(banca.bancaId);
      return;
    }

    setWhatsappAlert(null);

    const vendedor = banca.vendedores.find(
      (v) => sanitizePhone(v.whatsapp) === banca.selectedWhatsapp
    );

    const bancaTotal = getBancaTotal(banca);

    const lines = banca.items.map((item) => {
      const subtotal = Number(item.preco || 0) * item.quantity;
      const unidade = getUnitLabel(item.unidade);
      return `• ${item.nome}\n   Qtd: ${item.quantity}\n   Preço: ${formatCurrency(
        item.preco
      )}\n   Unidade: ${unidade}\n   Subtotal: ${formatCurrency(subtotal)}`;
    });

    const message = `Olá ${
      vendedor?.nome || ""
    }! Gostaria de fazer este pedido da banca ${banca.bancaNome || ""}:\n\n${lines.join(
      "\n\n"
    )}\n\nTotal do pedido: ${formatCurrency(bancaTotal)}`;

    const url = `https://api.whatsapp.com/send?phone=${banca.selectedWhatsapp}&text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MenuTopo />
      <SEO
        title="Carrinho"
        description="Carrinho de compras com pedidos separados por banca."
      />
      <section className="max-w-5xl mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Meu Carrinho
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Pedidos agrupados por banca. Cada banca tem seu próprio vendedor no
          WhatsApp.
        </p>

        {bancasComItens.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Seu carrinho está vazio.
            </p>
            <Link
              to="/bancas"
              className="inline-block mt-4 px-5 py-3 rounded-xl bg-green-600 text-white font-semibold"
            >
              Ver bancas
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {bancasComItens.map((banca) => {
              const bancaTotal = getBancaTotal(banca);
              const semVendedor = !banca.selectedWhatsapp;

              return (
                <article
                  key={banca.bancaId}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Store
                        className="text-green-600 dark:text-green-400 shrink-0"
                        size={22}
                      />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {banca.bancaNome || "Banca"}
                        </h2>
                        <Link
                          to={`/bancas/${banca.bancaId}`}
                          className="text-sm text-green-700 dark:text-green-400 hover:underline"
                        >
                          Ver produtos desta banca
                        </Link>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-right">
                      Subtotal: {formatCurrency(bancaTotal)}
                    </p>
                  </header>

                  <div className="p-4 space-y-3">
                    {banca.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {item.nome}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(item.preco)} cada
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {getUnitLabel(item.unidade)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setQuantity(
                                banca.bancaId,
                                item.id,
                                item.quantity - 1
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            aria-label="Diminuir quantidade"
                          >
                            -
                          </button>
                          <span className="min-w-8 text-center text-gray-900 dark:text-gray-100 font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              setQuantity(
                                banca.bancaId,
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            aria-label="Aumentar quantidade"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(banca.bancaId, item.id)}
                            className="ml-2 px-3 py-2 rounded-lg bg-red-500 text-white text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <footer className="px-5 pb-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enviar pedido desta banca para:
                      </label>
                      <select
                        value={banca.selectedWhatsapp}
                        onChange={(e) => {
                          setSelectedWhatsapp(banca.bancaId, e.target.value);
                          setWhatsappAlert(null);
                        }}
                        className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Selecione um vendedor</option>
                        {banca.vendedores
                          .filter((v) => sanitizePhone(v.whatsapp))
                          .map((vendedor) => (
                            <option
                              key={vendedor.id}
                              value={sanitizePhone(vendedor.whatsapp)}
                            >
                              {vendedor.nome} - {vendedor.whatsapp}
                            </option>
                          ))}
                      </select>
                      {whatsappAlert === banca.bancaId && semVendedor && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                          Selecione um vendedor para enviar o pedido desta
                          banca.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                      <button
                        onClick={() => handleSendOrderToWhatsapp(banca)}
                        disabled={semVendedor}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-semibold transition-colors"
                      >
                        <FaWhatsapp size={20} />
                        Enviar pedido desta banca
                      </button>
                      <button
                        onClick={() => clearBanca(banca.bancaId)}
                        className="md:w-auto bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 py-3 px-6 rounded-xl font-semibold"
                      >
                        Limpar esta banca
                      </button>
                    </div>
                  </footer>
                </article>
              );
            })}

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 space-y-4">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Total geral: {formatCurrency(cartTotal)}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/bancas"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
                >
                  <ArrowLeft size={18} />
                  Voltar às bancas
                </Link>
                <button
                  onClick={clearCart}
                  className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl font-semibold"
                >
                  Limpar carrinho inteiro
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default Carrinho;
