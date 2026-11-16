import { create } from "zustand";

export type GuestCartItem = { variantId: string; quantity: number; stock: number; unitPrice: number; sku: string; size: string; color: string; productId: string; productName: string; productSlug: string; imageUrl: string | null };

type ShopState = {
  guestCart: GuestCartItem[]; wishlist: string[];
  addGuestItem: (item: GuestCartItem) => void;
  updateGuestQuantity: (variantId: string, quantity: number) => void;
  removeGuestItem: (variantId: string) => void;
  clearGuestCart: () => void;
  toggleWishlist: (productId: string) => void;
};

const stored = <T>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; } };
const persist = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

export const useShopStore = create<ShopState>((set) => ({
  guestCart: stored<GuestCartItem[]>("f1_guest_cart", []),
  wishlist: stored<string[]>("f1_wishlist", []),
  addGuestItem: (incoming) => set((state) => {
    const existing = state.guestCart.find((item) => item.variantId === incoming.variantId);
    const guestCart = existing
      ? state.guestCart.map((item) => item.variantId === incoming.variantId ? { ...item, quantity: Math.min(item.quantity + incoming.quantity, incoming.stock) } : item)
      : [...state.guestCart, incoming];
    persist("f1_guest_cart", guestCart); return { guestCart };
  }),
  updateGuestQuantity: (variantId, quantity) => set((state) => {
    const guestCart = state.guestCart.map((item) => item.variantId === variantId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) } : item);
    persist("f1_guest_cart", guestCart); return { guestCart };
  }),
  removeGuestItem: (variantId) => set((state) => { const guestCart = state.guestCart.filter((item) => item.variantId !== variantId); persist("f1_guest_cart", guestCart); return { guestCart }; }),
  clearGuestCart: () => { persist("f1_guest_cart", []); set({ guestCart: [] }); },
  toggleWishlist: (productId) => set((state) => { const wishlist = state.wishlist.includes(productId) ? state.wishlist.filter((id) => id !== productId) : [...state.wishlist, productId]; persist("f1_wishlist", wishlist); return { wishlist }; }),
}));
