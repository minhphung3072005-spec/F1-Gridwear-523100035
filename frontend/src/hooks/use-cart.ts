import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth-store";
import { useShopStore, type GuestCartItem } from "../stores/shop-store";
import type { Cart } from "../types/api";

export function useCart() {
  const user = useAuthStore((state) => state.user);
  const guestCart = useShopStore((state) => state.guestCart);
  const queryClient = useQueryClient();
  const cartQuery = useQuery({ queryKey: ["cart"], queryFn: () => api.get<{ cart: Cart }>("/cart"), enabled: Boolean(user) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const addMutation = useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) => api.post<{ cart: Cart }>("/cart/items", { variantId, quantity }),
    onSuccess: () => { invalidate(); toast.success("Đã thêm vào giỏ hàng"); },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateMutation = useMutation({ mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => api.patch<{ cart: Cart }>(`/cart/items/${itemId}`, { quantity }), onSuccess: invalidate, onError: (error: Error) => toast.error(error.message) });
  const removeMutation = useMutation({ mutationFn: (itemId: string) => api.delete(`/cart/items/${itemId}`), onSuccess: () => { invalidate(); toast.success("Đã xoá sản phẩm"); }, onError: (error: Error) => toast.error(error.message) });

  const add = async (guestItem: GuestCartItem) => {
    if (user) await addMutation.mutateAsync({ variantId: guestItem.variantId, quantity: guestItem.quantity });
    else { useShopStore.getState().addGuestItem(guestItem); toast.success("Đã lưu vào giỏ hàng"); }
  };
  const count = user ? (cartQuery.data?.cart.summary.itemCount ?? 0) : guestCart.reduce((sum, item) => sum + item.quantity, 0);
  return { user, guestCart, cart: cartQuery.data?.cart, loading: cartQuery.isLoading, count, add, adding: addMutation.isPending, updateMutation, removeMutation };
}
