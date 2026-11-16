import { Link } from "react-router-dom";
export function NotFoundPage() { return <div className="not-found"><b>404</b><h1>Lạc khỏi đường đua</h1><p>Trang bạn đang tìm không tồn tại hoặc đã chuyển vị trí.</p><Link className="button primary" to="/">Về trang chủ</Link></div>; }
