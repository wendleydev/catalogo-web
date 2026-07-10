import { createContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const STORAGE_KEY = "feira_cart_v2";
const LEGACY_STORAGE_KEY = "feira_cart_v1";

const initialCart = { bancas: [] };

const CartContext = createContext({
  cart: initialCart,
  cartCount: 0,
  cartTotal: 0,
  addItem: () => {},
  setQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  clearBanca: () => {},
  setSelectedWhatsapp: () => {},
  updateBancaContext: () => {},
});

const sanitizePhone = (phone) =>
  String(phone || "")
    .replace(/\D/g, "")
    .replace(/^0+/, "");

const getDefaultWhatsapp = (vendedores) => {
  const vendedor = vendedores?.find((v) => sanitizePhone(v.whatsapp));
  return sanitizePhone(vendedor?.whatsapp) || "";
};

const createBancaGroup = ({ bancaId, bancaNome, vendedores, items = [] }) => ({
  bancaId,
  bancaNome: bancaNome || "",
  vendedores: vendedores || [],
  selectedWhatsapp: getDefaultWhatsapp(vendedores),
  items,
});

const migrateStoredCart = (raw) => {
  if (raw?.bancas) return { bancas: raw.bancas };

  if (raw?.bancaId) {
    const banca = createBancaGroup({
      bancaId: raw.bancaId,
      bancaNome: raw.bancaNome,
      vendedores: raw.vendedores,
      items: raw.items || [],
    });

    if (raw.selectedWhatsapp) {
      banca.selectedWhatsapp = sanitizePhone(raw.selectedWhatsapp);
    }

    return { bancas: [banca] };
  }

  return initialCart;
};

const loadCartFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateStoredCart(JSON.parse(raw));

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) return migrateStoredCart(JSON.parse(legacy));
  } catch {
    // ignora dados corrompidos
  }
  return initialCart;
};

const getBancaTotal = (banca) =>
  banca.items.reduce(
    (acc, item) => acc + Number(item.preco || 0) * item.quantity,
    0
  );

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(loadCartFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const updateBancaContext = ({ bancaId, bancaNome, vendedores }) => {
    if (!bancaId) return;

    setCart((prev) => {
      const index = prev.bancas.findIndex((b) => b.bancaId === bancaId);
      if (index === -1) return prev;

      const bancas = [...prev.bancas];
      const current = bancas[index];
      bancas[index] = {
        ...current,
        bancaNome: bancaNome || current.bancaNome,
        vendedores: vendedores?.length ? vendedores : current.vendedores,
      };
      return { bancas };
    });
  };

  const addItem = ({ bancaId, bancaNome, vendedores, item }) => {
    if (!bancaId || !item?.id) return;

    setCart((prev) => {
      const bancas = [...prev.bancas];
      const index = bancas.findIndex((b) => b.bancaId === bancaId);

      if (index === -1) {
        const newBanca = createBancaGroup({ bancaId, bancaNome, vendedores });
        bancas.push({
          ...newBanca,
          items: [{ ...item, quantity: 1 }],
        });
        return { bancas };
      }

      const current = { ...bancas[index] };
      current.bancaNome = bancaNome || current.bancaNome;
      current.vendedores = vendedores?.length ? vendedores : current.vendedores;

      if (!current.selectedWhatsapp) {
        current.selectedWhatsapp = getDefaultWhatsapp(current.vendedores);
      }

      const existing = current.items.find((i) => i.id === item.id);
      current.items = existing
        ? current.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...current.items, { ...item, quantity: 1 }];

      bancas[index] = current;
      return { bancas };
    });
  };

  const setQuantity = (bancaId, itemId, quantity) => {
    setCart((prev) => {
      const bancas = prev.bancas
        .map((banca) => {
          if (banca.bancaId !== bancaId) return banca;

          if (quantity <= 0) {
            return {
              ...banca,
              items: banca.items.filter((i) => i.id !== itemId),
            };
          }

          return {
            ...banca,
            items: banca.items.map((i) =>
              i.id === itemId ? { ...i, quantity } : i
            ),
          };
        })
        .filter((banca) => banca.items.length > 0);

      return { bancas };
    });
  };

  const removeItem = (bancaId, itemId) => {
    setCart((prev) => ({
      bancas: prev.bancas
        .map((banca) =>
          banca.bancaId === bancaId
            ? { ...banca, items: banca.items.filter((i) => i.id !== itemId) }
            : banca
        )
        .filter((banca) => banca.items.length > 0),
    }));
  };

  const clearBanca = (bancaId) => {
    setCart((prev) => ({
      bancas: prev.bancas.filter((banca) => banca.bancaId !== bancaId),
    }));
  };

  const clearCart = () => setCart(initialCart);

  const setSelectedWhatsapp = (bancaId, phone) => {
    setCart((prev) => ({
      bancas: prev.bancas.map((banca) =>
        banca.bancaId === bancaId
          ? { ...banca, selectedWhatsapp: sanitizePhone(phone) }
          : banca
      ),
    }));
  };

  const cartCount = useMemo(
    () =>
      cart.bancas.reduce(
        (acc, banca) =>
          acc + banca.items.reduce((sum, item) => sum + item.quantity, 0),
        0
      ),
    [cart.bancas]
  );

  const cartTotal = useMemo(
    () => cart.bancas.reduce((acc, banca) => acc + getBancaTotal(banca), 0),
    [cart.bancas]
  );

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      cartTotal,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      clearBanca,
      setSelectedWhatsapp,
      updateBancaContext,
    }),
    [cart, cartCount, cartTotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { CartContext, CartProvider, sanitizePhone, getBancaTotal };
