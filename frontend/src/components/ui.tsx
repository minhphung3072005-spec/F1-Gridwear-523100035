import type { ReactNode } from "react";
import { AlertCircle, PackageOpen } from "lucide-react";

export function Spinner({ label = "Đang tải" }: { label?: string }) {
  return <div className="state-block"><span className="spinner" /><span>{label}</span></div>;
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><PackageOpen size={38} strokeWidth={1.5} /><h2>{title}</h2><p>{text}</p>{action}</div>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="empty-state error-state"><AlertCircle size={38} /><h2>Đã có lỗi xảy ra</h2><p>{message}</p>{retry && <button className="button secondary" onClick={retry}>Thử lại</button>}</div>;
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return <div className="product-grid">{Array.from({ length: count }, (_, index) => <div className="product-skeleton" key={index}><div /><span /><span /></div>)}</div>;
}
