import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ProductCard } from "../components/product-card";
import { EmptyState, SkeletonGrid } from "../components/ui";
import { catalogService } from "../services/catalog";
import { useShopStore } from "../stores/shop-store";

export function WishlistPage() {
  const wishlist = useShopStore((state) => state.wishlist);
  const products = useQuery({ queryKey: ["wishlist-products", wishlist], queryFn: () => catalogService.products({ limit: 100 }), enabled: wishlist.length > 0 });
  const items = products.data?.items.filter((product) => wishlist.includes(product.id)) ?? [];
  return <div className="wishlist-page page-width"><div className="page-heading"><span className="eyebrow dark">SAVED FOR LATER</span><h1>Danh sách yêu thích</h1><p>Những thiết kế bạn muốn quay lại đường pit để xem thêm.</p></div>{!wishlist.length ? <EmptyState title="Chưa có sản phẩm yêu thích" text="Nhấn biểu tượng trái tim trên sản phẩm để lưu lại tại đây." action={<Link className="button primary" to="/products">Khám phá sản phẩm</Link>} /> : products.isLoading ? <SkeletonGrid /> : <div className="product-grid">{items.map((product) => <ProductCard product={product} key={product.id} />)}</div>}</div>;
}
