import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, Spinner } from "../components/ui";
import { api } from "../lib/api";
import { formatDate, formatMoney } from "../lib/format";
import type { Order, Pagination } from "../types/api";

const statuses = ["", "PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"];
const statusLabel: Record<string, string> = { PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận", SHIPPING: "Đang giao", DELIVERED: "Đã giao", CANCELLED: "Đã huỷ" };

export function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const orders = useQuery({ queryKey: ["orders", status], queryFn: () => api.get<{ items: Order[]; pagination: Pagination }>(`/orders?limit=20${status ? `&status=${status}` : ""}`) });
  return <div className="orders-page page-width"><div className="page-heading"><span className="eyebrow dark">MY GRID</span><h1>Đơn hàng của tôi</h1><p>Theo dõi mọi đơn hàng từ lúc xuất phát đến khi về đích.</p></div><div className="order-tabs">{statuses.map((item) => <button className={item === status ? "active" : ""} key={item || "all"} onClick={() => setParams(item ? { status: item } : {})}>{item ? statusLabel[item] : "Tất cả"}</button>)}</div>{orders.isLoading ? <Spinner label="Đang tải đơn hàng" /> : orders.isError ? <ErrorState message={(orders.error as Error).message} /> : !orders.data?.items.length ? <EmptyState title="Chưa có đơn hàng" text="Khi bạn đặt hàng, hành trình đơn hàng sẽ xuất hiện tại đây." action={<Link className="button primary" to="/products">Mua sắm ngay</Link>} /> : <div className="order-list">{orders.data.items.map((order) => <article className="order-card" key={order.id}><header><div><span>Mã đơn hàng</span><b>{order.orderCode}</b></div><div><span>Ngày đặt</span><b>{formatDate(order.createdAt)}</b></div><span className={`status-pill ${order.status.toLowerCase()}`}>{statusLabel[order.status]}</span></header><div className="order-preview">{order.items.slice(0, 3).map((item) => <div key={item.id}><img src={item.imageUrl ?? "https://placehold.co/130x150/eeeeee/111111?text=Gridwear"} alt={item.productName} /><p><b>{item.productName}</b><span>{item.color} · {item.size} · SL {item.quantity}</span></p></div>)}{order.items.length > 3 && <span className="more-items">+{order.items.length - 3}</span>}</div><footer><div><span>Tổng thanh toán</span><strong>{formatMoney(order.total)}</strong></div><Link className="button secondary" to={`/orders/${order.id}`}>Xem chi tiết <ChevronRight size={17} /></Link></footer></article>)}</div>}</div>;
}

export const orderStatusLabel = statusLabel;
