import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SiteLayout } from "./components/site-layout";
import { Spinner } from "./components/ui";
import { useAuthStore } from "./stores/auth-store";

const HomePage = lazy(() => import("./pages/home-page").then((module) => ({ default: module.HomePage })));
const ProductsPage = lazy(() => import("./pages/products-page").then((module) => ({ default: module.ProductsPage })));
const ProductDetailPage = lazy(() => import("./pages/product-detail-page").then((module) => ({ default: module.ProductDetailPage })));
const CartPage = lazy(() => import("./pages/cart-page").then((module) => ({ default: module.CartPage })));
const CheckoutPage = lazy(() => import("./pages/checkout-page").then((module) => ({ default: module.CheckoutPage })));
const OrdersPage = lazy(() => import("./pages/orders-page").then((module) => ({ default: module.OrdersPage })));
const OrderDetailPage = lazy(() => import("./pages/order-detail-page").then((module) => ({ default: module.OrderDetailPage })));
const WishlistPage = lazy(() => import("./pages/wishlist-page").then((module) => ({ default: module.WishlistPage })));
const AuthPage = lazy(() => import("./pages/auth-page").then((module) => ({ default: module.AuthPage })));
const NotFoundPage = lazy(() => import("./pages/not-found-page").then((module) => ({ default: module.NotFoundPage })));
const AdminLayout = lazy(() => import("./components/admin/admin-layout").then((module) => ({ default: module.AdminLayout })));
const AdminDashboardPage = lazy(() => import("./pages/admin/dashboard-page").then((module) => ({ default: module.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import("./pages/admin/products-page").then((module) => ({ default: module.AdminProductsPage })));
const AdminTaxonomyPage = lazy(() => import("./pages/admin/taxonomy-page").then((module) => ({ default: module.AdminTaxonomyPage })));
const AdminInventoryPage = lazy(() => import("./pages/admin/inventory-page").then((module) => ({ default: module.AdminInventoryPage })));
const AdminOrdersPage = lazy(() => import("./pages/admin/orders-page").then((module) => ({ default: module.AdminOrdersPage })));
const AdminCustomersPage = lazy(() => import("./pages/admin/customers-page").then((module) => ({ default: module.AdminCustomersPage })));
const AdminReviewsPage = lazy(() => import("./pages/admin/reviews-page").then((module) => ({ default: module.AdminReviewsPage })));
const AdminCouponsPage = lazy(() => import("./pages/admin/coupons-page").then((module) => ({ default: module.AdminCouponsPage })));

function ScrollToTop() { const { pathname } = useLocation(); useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]); return null; }
function Protected({ children }: { children: React.ReactNode }) { const user = useAuthStore((state) => state.user); const ready = useAuthStore((state) => state.ready); const location = useLocation(); if (!ready) return <div className="page-state"><Spinner /></div>; return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />; }
function AdminRoute({ children }: { children: React.ReactNode }) { const user = useAuthStore((state) => state.user); const ready = useAuthStore((state) => state.ready); const location = useLocation(); if (!ready) return <div className="page-state"><Spinner /></div>; if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />; return user.role === "ADMIN" ? children : <Navigate to="/" replace />; }

export default function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  useEffect(() => { void bootstrap(); }, [bootstrap]);
  return <><ScrollToTop /><Suspense fallback={<div className="page-state"><Spinner label="Đang tải trang" /></div>}><Routes><Route element={<SiteLayout />}><Route path="/" element={<HomePage />} /><Route path="/products" element={<ProductsPage />} /><Route path="/products/:slug" element={<ProductDetailPage />} /><Route path="/cart" element={<CartPage />} /><Route path="/wishlist" element={<WishlistPage />} /><Route path="/checkout" element={<Protected><CheckoutPage /></Protected>} /><Route path="/orders" element={<Protected><OrdersPage /></Protected>} /><Route path="/orders/:orderId" element={<Protected><OrderDetailPage /></Protected>} /></Route><Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}><Route index element={<AdminDashboardPage />} /><Route path="products" element={<AdminProductsPage />} /><Route path="categories" element={<AdminTaxonomyPage kind="categories" />} /><Route path="brands" element={<AdminTaxonomyPage kind="brands" />} /><Route path="inventory" element={<AdminInventoryPage />} /><Route path="orders" element={<AdminOrdersPage />} /><Route path="customers" element={<AdminCustomersPage />} /><Route path="reviews" element={<AdminReviewsPage />} /><Route path="coupons" element={<AdminCouponsPage />} /></Route><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="*" element={<NotFoundPage />} /></Routes></Suspense></>;
}
