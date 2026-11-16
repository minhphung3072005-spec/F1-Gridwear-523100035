import { Bell, Boxes, ChartNoAxesCombined, ChevronRight, ClipboardList, FolderTree, LogOut, Menu, MessageSquareText, PackageSearch, Search, Tags, TicketPercent, Users, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";

const links = [
  ["/admin", "Dashboard", ChartNoAxesCombined], ["/admin/products", "Sản phẩm", PackageSearch], ["/admin/categories", "Danh mục", FolderTree],
  ["/admin/brands", "Thương hiệu", Tags], ["/admin/inventory", "Tồn kho", Boxes], ["/admin/orders", "Đơn hàng", ClipboardList],
  ["/admin/customers", "Khách hàng", Users], ["/admin/reviews", "Đánh giá", MessageSquareText], ["/admin/coupons", "Mã giảm giá", TicketPercent],
] as const;

export function AdminLayout() {
  const [open, setOpen] = useState(false); const location = useLocation(); const navigate = useNavigate();
  const user = useAuthStore((state) => state.user); const logout = useAuthStore((state) => state.logout);
  const current = [...links].reverse().find(([path]) => location.pathname === path || location.pathname.startsWith(`${path}/`))?.[1] ?? "Quản trị";
  const signOut = async () => { await logout(); navigate("/login", { replace: true }); };
  return <div className="admin-shell">
    {open && <button className="admin-backdrop" aria-label="Đóng menu" onClick={() => setOpen(false)} />}
    <aside className={`admin-sidebar ${open ? "open" : ""}`}>
      <div className="admin-brand"><b>F1</b><span>GRIDWEAR<small>CONTROL ROOM</small></span><button aria-label="Đóng menu" onClick={() => setOpen(false)}><X /></button></div>
      <nav>{links.map(([path, label, Icon]) => <NavLink key={path} end={path === "/admin"} to={path} onClick={() => setOpen(false)}><Icon /><span>{label}</span><ChevronRight /></NavLink>)}</nav>
      <button className="admin-logout" onClick={signOut}><LogOut />Đăng xuất</button>
    </aside>
    <div className="admin-workspace">
      <header className="admin-header"><button className="admin-menu" aria-label="Mở menu" onClick={() => setOpen(true)}><Menu /></button><div className="admin-global-search"><Search /><input aria-label="Tìm kiếm nhanh" placeholder="Tìm nhanh sản phẩm, SKU, đơn hàng..." /></div><button className="admin-icon" aria-label="Thông báo"><Bell /><i /></button><div className="admin-profile"><span>{user?.fullName?.slice(0, 1).toUpperCase()}</span><div><b>{user?.fullName}</b><small>Quản trị viên</small></div></div></header>
      <main className="admin-main"><div className="admin-breadcrumb"><span>Quản trị</span><ChevronRight /> <b>{current}</b></div><Outlet /></main>
    </div>
  </div>;
}
