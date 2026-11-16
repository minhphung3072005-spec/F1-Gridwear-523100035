import { Heart, LogOut, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/use-cart";
import { useAuthStore } from "../stores/auth-store";
import { useShopStore } from "../stores/shop-store";

export function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const wishlistCount = useShopStore((state) => state.wishlist.length);
  const { count } = useCart();
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); if (search.trim()) { navigate(`/products?q=${encodeURIComponent(search.trim())}`); setSearchOpen(false); } };

  return <div className="site-shell">
    <div className="announcement">Miễn phí giao hàng cho đơn từ 2.000.000đ <span>Đổi trả trong 14 ngày</span></div>
    <header className="site-header">
      <div className="header-inner">
        <button className="icon-button mobile-only" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu">{menuOpen ? <X /> : <Menu />}</button>
        <Link to="/" className="brand-mark"><b>F1</b><span>GRIDWEAR</span></Link>
        <nav className={menuOpen ? "main-nav open" : "main-nav"}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Trang chủ</NavLink>
          <NavLink to="/products" onClick={() => setMenuOpen(false)}>Sản phẩm</NavLink>
          <NavLink to="/products?category=jackets" onClick={() => setMenuOpen(false)}>Jackets</NavLink>
          <NavLink to="/products?category=caps" onClick={() => setMenuOpen(false)}>Phụ kiện</NavLink>
          <NavLink to="/products?sortBy=popular" onClick={() => setMenuOpen(false)}>Bán chạy</NavLink>
        </nav>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Tìm kiếm"><Search /></button>
          <Link className="icon-button count-button" to="/wishlist" aria-label="Yêu thích"><Heart /><em>{wishlistCount}</em></Link>
          <Link className="icon-button count-button" to="/cart" aria-label="Giỏ hàng"><ShoppingBag /><em>{count}</em></Link>
          {user ? <div className="account-menu"><Link className="icon-button" to="/orders" title={user.fullName}><UserRound /></Link><button className="icon-button" onClick={() => void logout()} title="Đăng xuất"><LogOut /></button></div> : <Link className="login-link" to="/login">Đăng nhập</Link>}
        </div>
      </div>
      {searchOpen && <form className="search-panel" onSubmit={submitSearch}><Search size={20} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo sản phẩm, đội đua, SKU..." /><button type="submit">Tìm kiếm</button></form>}
    </header>
    <main><Outlet /></main>
    <footer className="site-footer">
      <div className="footer-grid">
        <div><Link to="/" className="brand-mark inverse"><b>F1</b><span>GRIDWEAR</span></Link><p>Trang phục motorsport dành cho những người sống cùng nhịp đua.</p></div>
        <div><h3>Mua sắm</h3><Link to="/products">Tất cả sản phẩm</Link><Link to="/products?sortBy=popular">Bán chạy</Link><Link to="/wishlist">Danh sách yêu thích</Link></div>
        <div><h3>Hỗ trợ</h3><Link to="/orders">Theo dõi đơn hàng</Link><a href="mailto:support@gridwear.vn">Liên hệ</a><span>Đổi trả & giao hàng</span></div>
        <div><h3>Gridwear Club</h3><p>Nhận tin về bộ sưu tập mới và ưu đãi paddock.</p><div className="newsletter"><input placeholder="Email của bạn" /><button>Đăng ký</button></div></div>
      </div>
      <div className="footer-bottom"><span>© 2026 F1 Gridwear</span><span>Thiết kế tại Việt Nam · Thanh toán an toàn</span></div>
    </footer>
  </div>;
}
