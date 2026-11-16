import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, MapPin, Package, Star, Truck, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ErrorState, Spinner } from "../components/ui";
import { api } from "../lib/api";
import { formatDate, formatMoney } from "../lib/format";
import type { Order } from "../types/api";
import { orderStatusLabel } from "./orders-page";

const steps = ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED"];
type OrderItem = Order["items"][number];

export function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [reviewing, setReviewing] = useState<OrderItem | null>(null);
  const orderQuery = useQuery({ queryKey: ["order", orderId], queryFn: () => api.get<{ order: Order }>(`/orders/${orderId}`) });
  const cancel = useMutation({
    mutationFn: () => api.post<{ order: Order }>(`/orders/${orderId}/cancel`, { reason: "Khách hàng yêu cầu huỷ đơn" }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["order", orderId] }); void queryClient.invalidateQueries({ queryKey: ["orders"] }); toast.success("Đơn hàng đã được huỷ và hoàn tồn kho"); },
    onError: (error: Error) => toast.error(error.message),
  });
  if (orderQuery.isLoading) return <div className="page-width page-state"><Spinner label="Đang tải chi tiết đơn" /></div>;
  if (orderQuery.isError || !orderQuery.data) return <div className="page-width page-state"><ErrorState message={(orderQuery.error as Error)?.message ?? "Không tìm thấy đơn hàng"} /></div>;

  const order = orderQuery.data.order;
  const current = steps.indexOf(order.status);
  return <div className="order-detail-page page-width">
    <Link className="back-link" to="/orders"><ChevronLeft /> Quay lại đơn hàng</Link>
    {(location.state as { placed?: boolean } | null)?.placed && <div className="success-banner"><Check /><div><b>Đặt hàng thành công!</b><p>Cảm ơn bạn. Chúng tôi đã tiếp nhận đơn và sẽ sớm xác nhận.</p></div></div>}
    <div className="order-detail-header"><div><span className="eyebrow dark">ORDER DETAIL</span><h1>{order.orderCode}</h1><p>Đặt lúc {formatDate(order.createdAt)}</p></div><span className={`status-pill large ${order.status.toLowerCase()}`}>{orderStatusLabel[order.status]}</span></div>
    {order.status === "CANCELLED" ? <div className="cancelled-track"><Package /><div><b>Đơn hàng đã huỷ</b><p>Tồn kho và mã giảm giá đã được hoàn lại tự động.</p></div></div> : <div className="order-tracker">{steps.map((step, index) => <div className={index <= current ? "complete" : ""} key={step}><i>{index < current ? <Check /> : index + 1}</i><span><b>{orderStatusLabel[step]}</b><small>{order.statusHistory.find((history) => history.toStatus === step) ? formatDate(order.statusHistory.find((history) => history.toStatus === step)!.createdAt) : "Đang chờ"}</small></span></div>)}</div>}
    <div className="order-detail-layout">
      <section className="order-detail-main">
        <div className="order-detail-box"><h2>Sản phẩm</h2>{order.items.map((item) => <div className="detail-order-item" key={item.id}><img src={item.imageUrl ?? "https://placehold.co/180x210/eeeeee/111111?text=Gridwear"} alt={item.productName} /><div><b>{item.productName}</b><span>{item.color} · {item.size}</span><small>SKU: {item.sku}</small>{order.status === "DELIVERED" && (item.review ? <em className="review-submitted"><Star fill="currentColor" />Đã gửi đánh giá {item.review.rating}/5</em> : <button className="review-order-button" onClick={() => setReviewing(item)}><Star />Đánh giá sản phẩm</button>)}</div><span>x{item.quantity}</span><strong>{formatMoney(item.subtotal)}</strong></div>)}</div>
        <div className="order-detail-box info-columns"><div><MapPin /><span><h3>Địa chỉ giao hàng</h3><b>{order.receiverName}</b><p>{order.receiverPhone}<br />{order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}<br />{order.ward}, {order.district}, {order.province}</p></span></div><div><Truck /><span><h3>Thanh toán</h3><b>COD · {order.paymentStatus}</b><p>Thanh toán khi nhận hàng.</p></span></div></div>
      </section>
      <aside className="order-summary order-detail-summary"><h2>Tổng thanh toán</h2><div><span>Tạm tính</span><b>{formatMoney(order.subtotal)}</b></div><div><span>Giảm giá {order.couponCode && `(${order.couponCode})`}</span><b>-{formatMoney(order.discount)}</b></div><div><span>Vận chuyển</span><b>{order.shippingFee ? formatMoney(order.shippingFee) : "Miễn phí"}</b></div><div className="summary-total"><span>Tổng cộng</span><strong>{formatMoney(order.total)}</strong></div>{["PENDING", "CONFIRMED"].includes(order.status) && <button className="button danger full" disabled={cancel.isPending} onClick={() => { if (window.confirm("Bạn chắc chắn muốn huỷ đơn hàng này?")) cancel.mutate(); }}>{cancel.isPending ? "Đang huỷ..." : "Huỷ đơn hàng"}</button>}<p className="support-note">Cần hỗ trợ? Liên hệ <a href="mailto:support@gridwear.vn">support@gridwear.vn</a></p></aside>
    </div>
    {reviewing && <ReviewDialog item={reviewing} onClose={() => setReviewing(null)} onSaved={() => { setReviewing(null); void queryClient.invalidateQueries({ queryKey: ["order", orderId] }); }} />}
  </div>;
}

function ReviewDialog({ item, onClose, onSaved }: { item: OrderItem; onClose: () => void; onSaved: () => void }) {
  const [rating, setRating] = useState(5); const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  const submit = useMutation({ mutationFn: () => api.post("/reviews", { orderItemId: item.id, rating, title: title || null, content: content || null }), onSuccess: () => { toast.success("Đánh giá đã được gửi và đang chờ duyệt"); onSaved(); }, onError: (error: Error) => toast.error(error.message) });
  return <div className="review-dialog-layer"><button aria-label="Đóng" className="review-dialog-backdrop" onClick={onClose} /><section className="review-dialog" role="dialog" aria-modal="true"><header><div><span>ĐÁNH GIÁ SẢN PHẨM</span><h2>{item.productName}</h2></div><button aria-label="Đóng" onClick={onClose}><X /></button></header><form onSubmit={(event) => { event.preventDefault(); submit.mutate(); }}><label>Mức độ hài lòng<div className="review-rating-input">{[1,2,3,4,5].map((value) => <button type="button" aria-label={`${value} sao`} className={value <= rating ? "active" : ""} key={value} onClick={() => setRating(value)}><Star fill="currentColor" /></button>)}</div></label><label>Tiêu đề<input minLength={2} maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Điểm nổi bật của sản phẩm" /></label><label>Nội dung<textarea required minLength={5} maxLength={5000} rows={5} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Chia sẻ cảm nhận thực tế của bạn..." /></label><div><button type="button" className="button secondary" onClick={onClose}>Hủy</button><button className="button primary" disabled={submit.isPending}>{submit.isPending ? "Đang gửi..." : "Gửi đánh giá"}</button></div></form></section></div>;
}
