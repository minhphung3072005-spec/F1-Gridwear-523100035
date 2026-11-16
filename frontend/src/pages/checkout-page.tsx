import { zodResolver } from "@hookform/resolvers/zod";
import { Check, MapPin, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Spinner } from "../components/ui";
import { api } from "../lib/api";
import { formatMoney } from "../lib/format";
import type { Address, Cart, Order } from "../types/api";

const addressSchema = z.object({ recipientName: z.string().min(2), phone: z.string().min(8), line1: z.string().min(3), line2: z.string().optional(), ward: z.string().min(1), district: z.string().min(1), province: z.string().min(1), postalCode: z.string().optional(), isDefault: z.boolean() });
type AddressForm = z.infer<typeof addressSchema>;

export function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponPreview, setCouponPreview] = useState<{ code: string; subtotal: number; discount: number; shippingFee: number; total: number } | null>(null);
  const [note, setNote] = useState("");
  const cart = useQuery({ queryKey: ["cart"], queryFn: () => api.get<{ cart: Cart }>("/cart") });
  const addresses = useQuery({ queryKey: ["addresses"], queryFn: () => api.get<{ items: Address[] }>("/addresses") });
  const defaultAddress = addresses.data?.items.find((item) => item.isDefault)?.id ?? addresses.data?.items[0]?.id;
  const chosenAddress = selectedAddress || defaultAddress || "";
  const couponMutation = useMutation({ mutationFn: (code: string) => api.post<{ preview: typeof couponPreview extends infer T ? NonNullable<T> : never }>("/coupons/validate", { code }), onSuccess: (data) => { setCouponPreview(data.preview); setCoupon(data.preview.code); toast.success("Mã giảm giá đã được áp dụng"); }, onError: (error: Error) => { setCouponPreview(null); toast.error(error.message); } });
  const checkoutMutation = useMutation({ mutationFn: () => api.post<{ order: Order; replayed: boolean }>("/orders", { shippingAddressId: chosenAddress, ...(couponPreview ? { couponCode: couponPreview.code } : {}), paymentMethod: "COD", note: note || undefined }, { "Idempotency-Key": crypto.randomUUID() }), onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ["cart"] }); toast.success("Đặt hàng thành công"); navigate(`/orders/${data.order.id}`, { replace: true, state: { placed: true } }); }, onError: (error: Error) => toast.error(error.message) });

  if (cart.isLoading || addresses.isLoading) return <div className="page-width page-state"><Spinner label="Đang chuẩn bị thanh toán" /></div>;
  if (!cart.data?.cart.items.length) { navigate("/cart", { replace: true }); return null; }
  const subtotal = cart.data.cart.summary.subtotal;
  const shipping = couponPreview?.shippingFee ?? (subtotal >= 2_000_000 ? 0 : 50_000);
  const discount = couponPreview?.discount ?? 0;

  return <div className="checkout-page page-width"><div className="page-heading"><span className="eyebrow dark">SECURE CHECKOUT</span><h1>Thanh toán</h1><p>Hoàn tất thông tin để đưa đơn hàng vào đường đua.</p></div><div className="checkout-layout"><div className="checkout-main">
    <section className="checkout-section"><div className="checkout-section-title"><span>1</span><div><h2>Địa chỉ giao hàng</h2><p>Chọn địa chỉ đã lưu hoặc thêm địa chỉ mới.</p></div></div><div className="address-grid">{addresses.data?.items.map((address) => <button className={`address-card ${chosenAddress === address.id ? "active" : ""}`} key={address.id} onClick={() => setSelectedAddress(address.id)}><div><MapPin /><span>{address.isDefault && "Mặc định"}</span></div><b>{address.recipientName}</b><p>{address.phone}</p><p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.ward}, {address.district}, {address.province}</p>{chosenAddress === address.id && <i><Check /></i>}</button>)}<button className="address-card add-address" onClick={() => setShowAddressForm(!showAddressForm)}><Plus /><b>Thêm địa chỉ mới</b><p>Lưu cho các đơn hàng sau</p></button></div>{showAddressForm && <NewAddressForm onCreated={(id) => { setSelectedAddress(id); setShowAddressForm(false); void queryClient.invalidateQueries({ queryKey: ["addresses"] }); }} />}</section>
    <section className="checkout-section"><div className="checkout-section-title"><span>2</span><div><h2>Phương thức thanh toán</h2><p>Thanh toán an toàn khi nhận hàng.</p></div></div><label className="payment-option active"><input type="radio" checked readOnly /><span><b>Thanh toán khi nhận hàng (COD)</b><small>Kiểm tra kiện hàng trước khi thanh toán cho đơn vị vận chuyển.</small></span><em>COD</em></label></section>
    <section className="checkout-section"><div className="checkout-section-title"><span>3</span><div><h2>Ghi chú</h2><p>Tuỳ chọn dành cho đơn vị giao hàng.</p></div></div><textarea maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ví dụ: gọi trước khi giao..." /></section>
  </div><aside className="checkout-summary"><h2>Đơn hàng của bạn</h2><div className="checkout-products">{cart.data.cart.items.map((item) => <div key={item.id}><div className="checkout-product-image"><img src={item.product.image?.urlSnapshot ?? "https://placehold.co/160x180/eeeeee/111111?text=Gridwear"} alt={item.product.name} /><span>{item.quantity}</span></div><p><b>{item.product.name}</b><span>{item.variant.color.name} · {item.variant.size.name}</span></p><strong>{formatMoney(item.lineTotal)}</strong></div>)}</div><div className="coupon-form"><input value={coupon} onChange={(event) => { setCoupon(event.target.value.toUpperCase()); setCouponPreview(null); }} placeholder="Mã giảm giá" /><button disabled={!coupon.trim() || couponMutation.isPending} onClick={() => couponMutation.mutate(coupon)}>{couponMutation.isPending ? "..." : "Áp dụng"}</button></div>{couponPreview && <div className="coupon-applied"><Check /> Đã áp dụng {couponPreview.code}<button onClick={() => { setCouponPreview(null); setCoupon(""); }}>Xoá</button></div>}<div className="summary-lines"><div><span>Tạm tính</span><b>{formatMoney(subtotal)}</b></div><div><span>Giảm giá</span><b className="discount-text">-{formatMoney(discount)}</b></div><div><span>Vận chuyển</span><b>{shipping ? formatMoney(shipping) : "Miễn phí"}</b></div></div><div className="summary-total"><span>Tổng thanh toán</span><strong>{formatMoney(subtotal - discount + shipping)}</strong></div><button className="button primary full" disabled={!chosenAddress || checkoutMutation.isPending} onClick={() => checkoutMutation.mutate()}>{checkoutMutation.isPending ? "Đang đặt hàng..." : "Đặt hàng COD"}</button><small>Bằng việc đặt hàng, bạn đồng ý với điều khoản mua hàng và chính sách bảo mật.</small></aside></div></div>;
}

function NewAddressForm({ onCreated }: { onCreated: (id: string) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddressForm>({ resolver: zodResolver(addressSchema), defaultValues: { isDefault: false } });
  const submit = async (data: AddressForm) => { try { const result = await api.post<{ address: Address }>("/addresses", { ...data, line2: data.line2 || null, postalCode: data.postalCode || null }); toast.success("Đã lưu địa chỉ"); onCreated(result.address.id); } catch (error) { toast.error((error as Error).message); } };
  return <form className="address-form" onSubmit={handleSubmit(submit)}><label>Người nhận<input {...register("recipientName")} />{errors.recipientName && <em>Vui lòng nhập họ tên</em>}</label><label>Số điện thoại<input {...register("phone")} />{errors.phone && <em>Số điện thoại chưa hợp lệ</em>}</label><label className="wide">Địa chỉ chi tiết<input {...register("line1")} placeholder="Số nhà, tên đường" /></label><label>Phường / Xã<input {...register("ward")} /></label><label>Quận / Huyện<input {...register("district")} /></label><label>Tỉnh / Thành phố<input {...register("province")} /></label><label className="check-row wide"><input type="checkbox" {...register("isDefault")} /> Đặt làm địa chỉ mặc định</label><button className="button primary" disabled={isSubmitting}>Lưu địa chỉ</button></form>;
}
