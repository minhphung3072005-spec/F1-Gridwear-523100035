import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { discountPercent, formatMoney } from "../lib/format";
import { useShopStore } from "../stores/shop-store";
import type { ProductCardData } from "../types/api";

export function ProductCard({ product }: { product: ProductCardData }) {
  const wishlist = useShopStore((state) => state.wishlist);
  const toggleWishlist = useShopStore((state) => state.toggleWishlist);
  const liked = wishlist.includes(product.id);
  const discount = discountPercent(product.basePrice, product.salePrice);
  return <article className="product-card">
    <div className="product-media">
      <Link to={`/products/${product.slug}`} aria-label={`Xem ${product.name}`}>
        <img src={product.primaryImage?.urlSnapshot ?? "https://placehold.co/800x900/eeeeee/111111?text=F1+Gridwear"} alt={product.primaryImage?.altText ?? product.name} loading="lazy" />
      </Link>
      <button className={`icon-button wishlist-button ${liked ? "active" : ""}`} onClick={() => toggleWishlist(product.id)} aria-label={liked ? "Bỏ yêu thích" : "Thêm yêu thích"}><Heart size={19} fill={liked ? "currentColor" : "none"} /></button>
      {discount && <span className="sale-badge">-{discount}%</span>}
      {product.totalStock === 0 && <span className="stock-badge">Hết hàng</span>}
    </div>
    <div className="product-info">
      <div className="product-meta"><span>{product.brand.name}</span><span className="rating"><Star size={14} fill="currentColor" /> {product.averageRating || "Mới"}</span></div>
      <Link className="product-name" to={`/products/${product.slug}`}>{product.name}</Link>
      <div className="price-row"><strong>{formatMoney(product.salePrice ?? product.basePrice)}</strong>{product.salePrice && <del>{formatMoney(product.basePrice)}</del>}</div>
      <p className="variant-note">{product.variantCount} lựa chọn · {product.totalStock > 0 ? "Còn hàng" : "Tạm hết hàng"}</p>
    </div>
  </article>;
}
