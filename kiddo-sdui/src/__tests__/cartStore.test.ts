import { useCartStore } from '../store/cartStore';

const reset = () => useCartStore.setState({ items: {}, count: 0 });

describe('cartStore — render-isolation-friendly reducer', () => {
  beforeEach(reset);

  it('adds items and tracks per-id quantity + total count', () => {
    const { addItem } = useCartStore.getState();
    addItem('p1');
    addItem('p1');
    addItem('p2');

    const s = useCartStore.getState();
    expect(s.items).toEqual({ p1: 2, p2: 1 });
    expect(s.count).toBe(3);
  });

  it('removes one unit and deletes the entry when it hits zero', () => {
    const { addItem, removeItem } = useCartStore.getState();
    addItem('p1');
    addItem('p1');
    removeItem('p1'); // 2 → 1
    expect(useCartStore.getState().items.p1).toBe(1);

    removeItem('p1'); // 1 → 0, entry removed
    expect(useCartStore.getState().items.p1).toBeUndefined();
    expect(useCartStore.getState().count).toBe(0);
  });

  it('never lets count go negative', () => {
    useCartStore.getState().removeItem('ghost');
    expect(useCartStore.getState().count).toBe(0);
  });

  it('clearCart empties everything', () => {
    const { addItem, clearCart } = useCartStore.getState();
    addItem('p1');
    addItem('p2');
    clearCart();
    expect(useCartStore.getState()).toMatchObject({ items: {}, count: 0 });
  });
});
