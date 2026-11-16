import { ArrowRight, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ProductCard } from "../components/product-card";
import { SkeletonGrid } from "../components/ui";
import { catalogService } from "../services/catalog";

export function HomePage() {
  const featured = useQuery({ queryKey: ["products", "featured"], queryFn: () => catalogService.featured(8) });
  const newest = useQuery({ queryKey: ["products", "newest"], queryFn: () => catalogService.products({ limit: 4, sortBy: "newest" }) });
  const popular = useQuery({ queryKey: ["products", "popular"], queryFn: () => catalogService.products({ limit: 4, sortBy: "popular" }) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: catalogService.categories });

  return <>
    <section className="hero">
      <img src="/assets/gridwear-hero.png" alt="Bộ sưu tập thời trang motorsport tại đường đua" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <span className="eyebrow">SPRING / SUMMER 2026</span>
        <h1>F1 GRIDWEAR</h1>
        <p>Phong cách đường đua, được thiết kế cho mọi ngày.</p>
        <div className="hero-actions"><Link className="button primary" to="/products">Khám phá bộ sưu tập <ArrowRight size={18} /></Link><Link className="text-link light" to="/products?sortBy=popular">Xem sản phẩm bán chạy</Link></div>
      </div>
    </section>

    <section className="service-strip page-width">
      <div><Truck /><span><b>Miễn phí giao hàng</b><small>Đơn hàng từ 2 triệu</small></span></div>
      <div><RotateCcw /><span><b>Đổi trả 14 ngày</b><small>Đơn giản, nhanh chóng</small></span></div>
      <div><ShieldCheck /><span><b>Thanh toán an toàn</b><small>Bảo mật thông tin</small></span></div>
      <div><PackageCheck /><span><b>Kiểm tra tồn kho thật</b><small>Theo từng size và màu</small></span></div>
    </section>

    <section className="section page-width">
      <div className="section-heading"><div><span className="eyebrow dark">SHOP BY CATEGORY</span><h2>Trang phục cho mọi chặng đua</h2></div><Link className="text-link" to="/products">Xem tất cả <ArrowRight size={16} /></Link></div>
      <div className="category-grid">
        {categories.data?.items.slice(0, 4).map((category, index) => <Link className={`category-tile tile-${index + 1}`} key={category.id} to={`/products?category=${category.slug}`}>
          <img src={category.imageUrl ?? "https://placehold.co/900x700/202020/ffffff?text=Gridwear"} alt={category.name} />
          <div><span>{category._count.products} sản phẩm</span><h3>{category.name}</h3><em>Khám phá <ArrowRight size={15} /></em></div>
        </Link>)}
      </div>
    </section>

    <ProductSection title="Được chọn cho bạn" eyebrow="FEATURED DROP" data={featured.data?.items} loading={featured.isLoading} link="/products?featured=true" />

    <section className="campaign-band">
      <div className="campaign-copy"><span className="eyebrow">RACE WEEK ESSENTIALS</span><h2>Nhịp đua không dừng<br />khi rời khỏi đường pit.</h2><p>Những lớp áo gọn nhẹ, phom dáng sắc nét và chi tiết lấy cảm hứng từ kỹ thuật đua.</p><Link className="button light-button" to="/products?category=jackets">Mua jackets <ArrowRight size={18} /></Link></div>
      <div className="campaign-stats"><div><b>7</b><span>Đội đua</span></div><div><b>50</b><span>Biến thể</span></div><div><b>14</b><span>Ngày đổi trả</span></div></div>
    </section>

    <ProductSection title="Mới vào paddock" eyebrow="NEW ARRIVALS" data={newest.data?.items} loading={newest.isLoading} link="/products?sortBy=newest" />
    <ProductSection title="Dẫn đầu bảng xếp hạng" eyebrow="BEST SELLERS" data={popular.data?.items} loading={popular.isLoading} link="/products?sortBy=popular" />

    <section className="newsletter-band page-width"><div><span className="eyebrow dark">GRIDWEAR CLUB</span><h2>Đừng bỏ lỡ tín hiệu xuất phát.</h2><p>Ưu đãi dành riêng, sản phẩm mới và câu chuyện hậu trường.</p></div><form onSubmit={(event) => event.preventDefault()}><input type="email" required placeholder="Nhập email của bạn" /><button className="button primary">Tham gia ngay</button></form></section>
  </>;
}

function ProductSection({ title, eyebrow, data, loading, link }: { title: string; eyebrow: string; data?: Parameters<typeof ProductCard>[0]["product"][]; loading: boolean; link: string }) {
  return <section className="section page-width"><div className="section-heading"><div><span className="eyebrow dark">{eyebrow}</span><h2>{title}</h2></div><Link className="text-link" to={link}>Xem tất cả <ArrowRight size={16} /></Link></div>{loading ? <SkeletonGrid /> : <div className="product-grid">{data?.slice(0, 4).map((product) => <ProductCard product={product} key={product.id} />)}</div>}</section>;
}
