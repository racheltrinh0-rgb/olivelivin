import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  productColorId?: string;
  colorName?: string;
  colorHex?: string;
}

interface CartContextValue {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nha_cart_v1";

/**
 * Normalize legacy image URLs saved in the cart.
 * Keep relative paths and external image URLs unchanged.
 */
function normalizeCartImage(image: string | null | undefined): string | null {
  if (!image?.trim()) return null;

  const trimmed = image.trim();

  // Migrate URLs from the previous Supabase project to the current project.
  return trimmed.replace(
    "https://fpalovqxiqaispxabsum.supabase.co",
    "https://fgulxfspmekccfsqftxi.supabase.co",
  );
}

function normalizeStoredCartItem(item: CartItem): CartItem {
  return {
    ...item,
    image: normalizeCartImage(item.image),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(
            parsed.map((item) => normalizeStoredCartItem(item as CartItem)),
          );
        }
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      add: (item, qty = 1) =>
        setItems((previous) => {
          const existing = previous.find(
            (product) =>
              product.id === item.id &&
              product.productColorId === item.productColorId,
          );

          if (existing) {
            return previous.map((product) =>
              product.id === item.id &&
              product.productColorId === item.productColorId
                ? { ...product, quantity: product.quantity + qty }
                : product,
            );
          }

          return [
            ...previous,
            {
              ...item,
              image: normalizeCartImage(item.image),
              quantity: qty,
            },
          ];
        }),
      remove: (id) =>
        setItems((previous) => previous.filter((item) => item.id !== id)),
      setQuantity: (id, qty) =>
        setItems((previous) =>
          qty <= 0
            ? previous.filter((item) => item.id !== id)
            : previous.map((item) =>
                item.id === id ? { ...item, quantity: qty } : item,
              ),
        ),
      clear: () => setItems([]),
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    }),
    [items],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
