import { ChevronLeft, ChevronRight, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ProductCard } from "../components/product-card";
import { ErrorState, Spinner } from "../components/ui";
import { useCart } from "../hooks/use-cart";
import { effectiveVariantPrice, formatMoney } from "../lib/format";
import { catalogService } from "../services/catalog";
import { useShopStore } from "../stores/shop-store";

export function ProductDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const productQuery = useQuery({ queryKey: ["product", slug], queryFn: () => catalogService.product(slug) });
  const related = useQuery({ queryKey: ["related", slug], queryFn: () => catalogService.related(slug) });
  const [imageIndex, setImageIndex] = useState(0);
  const [colorId, setColorId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { add, adding } = useCart();
  const wishlist = useShopStore((state) => state.wishlist);
  const toggleWishlist = useShopStore((state) => state.toggleWishlist);
  const product = productQuery.data?.product;

  const colors = useMemo(() => product ? [...new Map(product.variants.map((variant) => [variant.color.id, variant.color])).values()] : [], [product]);
  const sizes = useMemo(() => product ? [...new Map(product.variants.map((variant) => [variant.size.id, variant.size])).values()] : [], [product]);
  const variant = product?.variants.find((item) => item.color.id === colorId && item.size.id === sizeId);

  useEffect(() => {
    if (!product || colorId) return;
    const initial = product.variants.find((item) => item.stock > 0) ?? product.variants[0];
    if (initial) { setColorId(initial.color.id); setSizeId(initial.size.id); }
  }, [product, colorId]);

  useEffect(() => { setQuantity(1); }, [variant?.id]);

  if (productQuery.isLoading) return <div className="page-width page-state"><Spinner label="Đang chuẩn bị sản phẩm" /></div>;
  if (productQuery.isError || !product) return <div className="page-width page-state"><ErrorState message={(productQuery.error as Error)?.message ?? "Không tìm thấy sản phẩm"} /></div>;
  const unitPrice = variant ? effectiveVariantPrice(variant, product) : product.salePrice ?? product.basePrice;
  const liked = wishlist.includes(product.id);
  const addItem = async (buyNow = false) => {
    if (!variant) { toast.error("Vui lòng chọn màu và kích thước"); return; }
    if (variant.stock === 0) { toast.error("Biến thể này đang hết hàng"); return; }
    await add({ variantId: variant.id, quantity, stock: variant.stock, unitPrice, sku: variant.sku, size: variant.size.name, color: variant.color.name, productId: product.id, productName: product.name, productSlug: product.slug, imageUrl: product.images[0]?.urlSnapshot ?? null });
    if (buyNow) navigate("/cart");
  };

  return <div className="product-detail page-width">
    <div className="breadcrumbs"><Link to="/">Trang chủ</Link><span>/</span><Link to="/products">Sản phẩm</Link><span>/</span><b>{product.name}</b></div>
    <div className="detail-grid">
      <div className="gallery">
        <div className="gallery-thumbs">{product.images.map((image, index) => <button className={index === imageIndex ? "active" : ""} key={image.id} onClick={() => setImageIndex(index)}><img src={image.urlSnapshot} alt={image.altText ?? product.name} /></button>)}</div>
        <div className="gallery-main"><img src={product.images[imageIndex]?.urlSnapshot ?? "https://placehold.co/1000x1100/eeeeee/111111?text=Gridwear"} alt={product.images[imageIndex]?.altText ?? product.name} /><div className="gallery-arrows"><button onClick={() => setImageIndex((imageIndex - 1 + product.images.length) % product.images.length)}><ChevronLeft /></button><button onClick={() => setImageIndex((imageIndex + 1) % product.images.length)}><ChevronRight /></button></div></div>
      </div>
      <div className="detail-info">
        <span className="eyebrow dark">{product.brand.name} · {product.category.name}</span>
        <h1>{product.name}</h1>
        <div className="detail-rating"><span><Star size={17} fill="currentColor" /> {product.ratingSummary.average || "Mới"}</span><a href="#reviews">{product.ratingSummary.count} đánh giá</a></div>
        <div className="detail-price"><strong>{formatMoney(unitPrice)}</strong>{product.salePrice && <del>{formatMoney(product.basePrice)}</del>}</div>
        <p className="detail-lead">{product.shortDescription ?? "Thiết kế motorsport cao cấp với phom dáng hiện đại và chất liệu thoải mái."}</p>

        <div className="selector"><div className="selector-label"><b>Màu sắc</b><span>{variant?.color.name ?? "Chọn màu"}</span></div><div className="color-swatches">{colors.map((color) => <button className={colorId === color.id ? "active" : ""} key={color.id} onClick={() => { setColorId(color.id); const available = product.variants.find((item) => item.color.id === color.id && item.size.id === sizeId) ?? product.variants.find((item) => item.color.id === color.id); if (available) setSizeId(available.size.id); }} title={color.name}><i style={{ background: color.hexCode }} /></button>)}</div></div>
        <div className="selector"><div className="selector-label"><b>Kích thước</b><button>Hướng dẫn chọn size</button></div><div className="size-options">{sizes.map((size) => { const option = product.variants.find((item) => item.color.id === colorId && item.size.id === size.id); return <button disabled={!option || option.stock === 0} className={sizeId === size.id ? "active" : ""} key={size.id} onClick={() => setSizeId(size.id)}>{size.name}</button>; })}</div></div>
        <div className={`availability ${variant?.stock ? "in-stock" : "out-stock"}`}><i />{variant ? variant.stock > 0 ? `Còn ${variant.stock} sản phẩm · SKU ${variant.sku}` : "Biến thể này đã hết hàng" : "Chọn biến thể để xem tồn kho"}</div>
        <div className="purchase-row"><div className="quantity-control"><button disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}><Minus /></button><span>{quantity}</span><button disabled={!variant || quantity >= variant.stock} onClick={() => setQuantity(quantity + 1)}><Plus /></button></div><button className="button primary grow" disabled={!variant?.stock || adding} onClick={() => void addItem()}><ShoppingBag size={18} />{adding ? "Đang thêm..." : "Thêm vào giỏ"}</button><button className={`icon-button detail-wishlist ${liked ? "active" : ""}`} onClick={() => toggleWishlist(product.id)}><Heart fill={liked ? "currentColor" : "none"} /></button></div>
        <button className="button secondary full" disabled={!variant?.stock || adding} onClick={() => void addItem(true)}>Mua ngay</button>
        <div className="detail-assurance"><div><Truck /><span><b>Giao hàng toàn quốc</b><small>Dự kiến 2-5 ngày làm việc</small></span></div><div><ShieldCheck /><span><b>Mua sắm an tâm</b><small>Đổi trả trong vòng 14 ngày</small></span></div></div>
        <details open><summary>Chi tiết sản phẩm</summary><p>{product.description ?? product.shortDescription ?? "Sản phẩm thời trang motorsport dành cho người hâm mộ F1."}</p></details>
      </div>
    </div>

    <section className="reviews-section" id="reviews"><div className="section-heading"><div><span className="eyebrow dark">REVIEWS</span><h2>Đánh giá từ khách hàng</h2></div><div className="rating-large"><b>{product.ratingSummary.average.toFixed(1)}</b><span><span>★★★★★</span><small>{product.ratingSummary.count} đánh giá đã xác minh</small></span></div></div>{product.reviews.length ? <div className="review-grid">{product.reviews.slice(0, 3).map((review) => <article key={review.id}><div className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div><h3>{review.title ?? "Sản phẩm tuyệt vời"}</h3><p>{review.content ?? "Khách hàng đã đánh giá sản phẩm này."}</p><span>{review.user.fullName} · Đã mua hàng</span></article>)}</div> : <p className="muted">Chưa có đánh giá. Hãy là người đầu tiên chia sẻ trải nghiệm.</p>}</section>
    {related.data?.items.length ? <section className="section related-section"><div className="section-heading"><div><span className="eyebrow dark">YOU MAY ALSO LIKE</span><h2>Sản phẩm liên quan</h2></div></div><div className="product-grid">{related.data.items.slice(0, 4).map((item) => <ProductCard product={item} key={item.id} />)}</div></section> : null}
  </div>;
}
