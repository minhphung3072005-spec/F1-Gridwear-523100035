import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState, Spinner } from "../components/ui";
import { useCart } from "../hooks/use-cart";
import { formatMoney } from "../lib/format";
import { useShopStore } from "../stores/shop-store";

export function CartPage() {
  const navigate = useNavigate();
  const { user, cart, guestCart, loading, updateMutation, removeMutation } = useCart();
  const updateGuest = useShopStore((state) => state.updateGuestQuantity);
  const removeGuest = useShopStore((state) => state.removeGuestItem);
  const items = user ? (cart?.items ?? []) : guestCart;
  const subtotal = user ? (cart?.summary.subtotal ?? 0) : guestCart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = subtotal >= 2_000_000 ? 0 : 50_000;

  if (loading) return <div className="page-width page-state"><Spinner label="Đang tải giỏ hàng" /></div>;
  if (!items.length) return <div className="page-width page-state"><EmptyState title="Giỏ hàng đang trống" text="Khám phá bộ sưu tập mới nhất và chọn thiết kế dành cho bạn." action={<Link className="button primary" to="/products">Bắt đầu mua sắm</Link>} /></div>;

  return <div className="cart-page page-width">
    <div className="page-heading"><span className="eyebrow dark">YOUR BAG</span><h1>Giỏ hàng</h1><p>{items.length} sản phẩm đang chờ bạn.</p></div>
    <div className="cart-layout">
      <section className="cart-items">
        {user ? cart!.items.map((item) => <article className="cart-item" key={item.id}><Link to={`/products/${item.product.slug}`}><img src={item.product.image?.urlSnapshot ?? "https://placehold.co/300x360/eeeeee/111111?text=Gridwear"} alt={item.product.name} /></Link><div className="cart-item-info"><div><span>{item.variant.sku}</span><Link to={`/products/${item.product.slug}`}>{item.product.name}</Link><p>{item.variant.color.name} · {item.variant.size.name}</p>{!item.isAvailable && <em>{item.availabilityCode === "INSUFFICIENT_STOCK" ? "Số lượng vượt tồn kho" : "Sản phẩm không khả dụng"}</em>}</div><div className="cart-item-bottom"><div className="quantity-control small"><button disabled={item.quantity <= 1} onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}><Minus /></button><span>{item.quantity}</span><button disabled={item.quantity >= item.variant.stock} onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}><Plus /></button></div><strong>{formatMoney(item.lineTotal)}</strong><button className="remove-button" onClick={() => removeMutation.mutate(item.id)}><Trash2 size={17} /> Xoá</button></div></div></article>) : guestCart.map((item) => <article className="cart-item" key={item.variantId}><Link to={`/products/${item.productSlug}`}><img src={item.imageUrl ?? "https://placehold.co/300x360/eeeeee/111111?text=Gridwear"} alt={item.productName} /></Link><div className="cart-item-info"><div><span>{item.sku}</span><Link to={`/products/${item.productSlug}`}>{item.productName}</Link><p>{item.color} · {item.size}</p></div><div className="cart-item-bottom"><div className="quantity-control small"><button disabled={item.quantity <= 1} onClick={() => updateGuest(item.variantId, item.quantity - 1)}><Minus /></button><span>{item.quantity}</span><button disabled={item.quantity >= item.stock} onClick={() => updateGuest(item.variantId, item.quantity + 1)}><Plus /></button></div><strong>{formatMoney(item.unitPrice * item.quantity)}</strong><button className="remove-button" onClick={() => removeGuest(item.variantId)}><Trash2 size={17} /> Xoá</button></div></div></article>)}
        <Link className="continue-shopping" to="/products">← Tiếp tục mua sắm</Link>
      </section>
      <aside className="order-summary"><h2>Tóm tắt đơn hàng</h2><div><span>Tạm tính</span><b>{formatMoney(subtotal)}</b></div><div><span>Vận chuyển</span><b>{shipping === 0 ? "Miễn phí" : formatMoney(shipping)}</b></div><p>{shipping > 0 ? `Mua thêm ${formatMoney(2_000_000 - subtotal)} để được miễn phí giao hàng.` : "Đơn hàng của bạn được miễn phí giao hàng."}</p><div className="summary-total"><span>Tổng dự kiến</span><strong>{formatMoney(subtotal + shipping)}</strong></div>{!user && <div className="guest-note"><ShoppingBag size={18} /><span>Giỏ hàng sẽ được đồng bộ sau khi bạn đăng nhập.</span></div>}<button className="button primary full" disabled={Boolean(user && cart?.summary.hasUnavailableItems)} onClick={() => navigate(user ? "/checkout" : "/login", { state: { from: "/checkout" } })}>Tiến hành thanh toán <ArrowRight size={18} /></button><small>Thuế đã bao gồm. Phí vận chuyển được xác nhận khi checkout.</small></aside>
    </div>
  </div>;
}
