import { create } from 'zustand';

interface CartState {
  /** Map of productId → quantity */
  items: Record<string, number>;
  /** Total number of items (sum of all quantities) */
  count: number;
  /** Add one unit of a product to the cart */
  addItem: (id: string) => void;
  /** Remove one unit; if qty reaches 0, remove the entry */
  removeItem: (id: string) => void;
  /** Clear the entire cart */
  clearCart: () => void;
}

/**
 * Zustand cart store.
 *
 * RENDER ISOLATION GUARANTEE:
 * - Header badge: useCartStore((s) => s.count)  — re-renders ONLY when count changes
 * - ProductCard:  useCartStore((s) => s.items[id] ?? 0) — re-renders ONLY for that product
 * - All other blocks: subscribe to nothing → never re-render on cart changes
 */
export const useCartStore = create<CartState>((set) => ({
  items: {},
  count: 0,

  addItem: (id) =>
    set((s) => ({
      items: { ...s.items, [id]: (s.items[id] ?? 0) + 1 },
      count: s.count + 1,
    })),

  removeItem: (id) =>
    set((s) => {
      const currentQty = s.items[id] ?? 0;
      if (currentQty <= 1) {
        const { [id]: _removed, ...rest } = s.items;
        return { items: rest, count: Math.max(0, s.count - 1) };
      }
      return {
        items: { ...s.items, [id]: currentQty - 1 },
        count: Math.max(0, s.count - 1),
      };
    }),

  clearCart: () => set({ items: {}, count: 0 }),
}));
