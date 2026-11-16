import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/product-card";
import { EmptyState, ErrorState, SkeletonGrid } from "../components/ui";
import { catalogService } from "../services/catalog";

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = Object.fromEntries(params.entries());
  const products = useQuery({ queryKey: ["products", query], queryFn: () => catalogService.products(query) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: catalogService.categories });
  const brands = useQuery({ queryKey: ["brands"], queryFn: catalogService.brands });
  const sizes = useQuery({ queryKey: ["sizes"], queryFn: catalogService.sizes });
  const colors = useQuery({ queryKey: ["colors"], queryFn: catalogService.colors });

  const update = (key: string, value?: string) => { const next = new URLSearchParams(params); if (!value) next.delete(key); else next.set(key, value); if (key !== "page") next.set("page", "1"); setParams(next); };
  const toggleCsv = (key: string, value: string) => { const values = new Set((params.get(key) ?? "").split(",").filter(Boolean)); values.has(value) ? values.delete(value) : values.add(value); update(key, [...values].join(",")); };
  const selected = (key: string, value: string) => (params.get(key) ?? "").split(",").includes(value);
  const clear = () => setParams(params.get("q") ? { q: params.get("q")! } : {});
  const activeCount = ["brand", "category", "sizes", "colors", "minPrice", "maxPrice", "inStock"].filter((key) => params.has(key)).length;

  return <div className="catalog-page page-width">
    <div className="catalog-title"><span className="eyebrow dark">THE PADDOCK STORE</span><h1>{params.get("q") ? `Kết quả cho “${params.get("q")}”` : "Tất cả sản phẩm"}</h1><p>{products.data?.pagination.totalItems ?? 0} thiết kế dành cho nhịp sống tốc độ.</p></div>
    <div className="catalog-toolbar"><button className="button filter-trigger" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={18} /> Bộ lọc {activeCount > 0 && <em>{activeCount}</em>}</button><span>{products.data?.pagination.totalItems ?? 0} sản phẩm</span><label>Sắp xếp<select value={`${params.get("sortBy") ?? "newest"}:${params.get("sortOrder") ?? "desc"}`} onChange={(event) => { const [sortBy, sortOrder] = event.target.value.split(":"); const next = new URLSearchParams(params); next.set("sortBy", sortBy); next.set("sortOrder", sortOrder); next.set("page", "1"); setParams(next); }}><option value="newest:desc">Mới nhất</option><option value="popular:desc">Bán chạy</option><option value="rating:desc">Đánh giá cao</option><option value="price:asc">Giá thấp đến cao</option><option value="price:desc">Giá cao đến thấp</option><option value="name:asc">Tên A-Z</option></select></label></div>
    <div className="catalog-layout">
      <aside className={filtersOpen ? "filters open" : "filters"}>
        <div className="filter-header"><h2>Bộ lọc</h2><button className="icon-button mobile-only" onClick={() => setFiltersOpen(false)}><X /></button></div>
        <FilterGroup title="Danh mục">{categories.data?.items.map((item) => <Check key={item.id} label={`${item.name} (${item._count.products})`} checked={selected("category", item.slug)} onChange={() => toggleCsv("category", item.slug)} />)}</FilterGroup>
        <FilterGroup title="Đội đua">{brands.data?.items.map((item) => <Check key={item.id} label={item.name} checked={selected("brand", item.slug)} onChange={() => toggleCsv("brand", item.slug)} />)}</FilterGroup>
        <FilterGroup title="Kích thước"><div className="option-chips">{sizes.data?.items.map((item) => <button className={selected("sizes", item.slug) ? "active" : ""} key={item.id} onClick={() => toggleCsv("sizes", item.slug)}>{item.name}</button>)}</div></FilterGroup>
        <FilterGroup title="Màu sắc"><div className="color-options">{colors.data?.items.map((item) => <button className={selected("colors", item.slug) ? "active" : ""} key={item.id} onClick={() => toggleCsv("colors", item.slug)}><i style={{ background: item.hexCode }} />{item.name}</button>)}</div></FilterGroup>
        <FilterGroup title="Khoảng giá"><div className="price-inputs"><input inputMode="numeric" placeholder="Từ" value={params.get("minPrice") ?? ""} onChange={(event) => update("minPrice", event.target.value)} /><span>—</span><input inputMode="numeric" placeholder="Đến" value={params.get("maxPrice") ?? ""} onChange={(event) => update("maxPrice", event.target.value)} /></div></FilterGroup>
        <Check label="Chỉ hiện sản phẩm còn hàng" checked={params.get("inStock") === "true"} onChange={() => update("inStock", params.get("inStock") === "true" ? undefined : "true")} />
        <button className="clear-filters" onClick={clear}>Xoá tất cả bộ lọc</button>
      </aside>
      <section className="catalog-results">
        {products.isLoading ? <SkeletonGrid count={8} /> : products.isError ? <ErrorState message={(products.error as Error).message} retry={() => void products.refetch()} /> : products.data?.items.length === 0 ? <EmptyState title="Không tìm thấy sản phẩm" text="Hãy thử một từ khoá hoặc bộ lọc khác." action={<button className="button secondary" onClick={clear}>Đặt lại bộ lọc</button>} /> : <div className="product-grid catalog-grid">{products.data?.items.map((product) => <ProductCard product={product} key={product.id} />)}</div>}
        {products.data && products.data.pagination.totalPages > 1 && <div className="pagination"><button disabled={!products.data.pagination.hasPreviousPage} onClick={() => update("page", String(products.data!.pagination.page - 1))}><ChevronLeft /></button>{Array.from({ length: products.data.pagination.totalPages }, (_, index) => index + 1).map((page) => <button className={page === products.data!.pagination.page ? "active" : ""} onClick={() => update("page", String(page))} key={page}>{page}</button>)}<button disabled={!products.data.pagination.hasNextPage} onClick={() => update("page", String(products.data!.pagination.page + 1))}><ChevronRight /></button></div>}
      </section>
    </div>
    {filtersOpen && <button className="filter-backdrop" onClick={() => setFiltersOpen(false)} aria-label="Đóng bộ lọc" />}
  </div>;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) { return <div className="filter-group"><h3>{title}</h3>{children}</div>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) { return <label className="check-row"><input type="checkbox" checked={checked} onChange={onChange} /><span>{label}</span></label>; }
