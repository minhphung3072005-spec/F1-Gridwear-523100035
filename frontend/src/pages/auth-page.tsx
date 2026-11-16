import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth-store";
import { useShopStore } from "../stores/shop-store";

const loginSchema = z.object({ email: z.string().email("Email chưa hợp lệ"), password: z.string().min(1, "Vui lòng nhập mật khẩu") });
const registerSchema = z.object({ fullName: z.string().min(2, "Tên cần ít nhất 2 ký tự"), email: z.string().email("Email chưa hợp lệ"), password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự").regex(/[A-Za-z]/, "Cần ít nhất một chữ cái").regex(/[0-9]/, "Cần ít nhất một chữ số") });
type AuthForm = { fullName?: string; email: string; password: string };

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const registerUser = useAuthStore((state) => state.register);
  const guestCart = useShopStore((state) => state.guestCart);
  const clearGuestCart = useShopStore((state) => state.clearGuestCart);
  const navigate = useNavigate();
  const location = useLocation();
  const schema = mode === "login" ? loginSchema : registerSchema;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthForm>({ resolver: zodResolver(schema) });

  const submit = async (data: AuthForm) => {
    try {
      const user = mode === "login" ? await login(data.email, data.password) : await registerUser(data.fullName!, data.email, data.password);
      if (user.role === "CUSTOMER" && guestCart.length) {
        try { await api.post("/cart/merge", { items: guestCart.map((item) => ({ variantId: item.variantId, quantity: item.quantity })) }); clearGuestCart(); } catch (error) { toast.error(`Đăng nhập thành công, nhưng chưa thể đồng bộ giỏ: ${(error as Error).message}`); }
      }
      toast.success(mode === "login" ? "Chào mừng bạn trở lại" : "Tài khoản đã được tạo");
      const from = (location.state as { from?: string } | null)?.from;
      navigate(user.role === "ADMIN" ? "/admin" : from ?? "/", { replace: true });
    } catch (error) { toast.error((error as Error).message); }
  };

  return <div className="auth-page">
    <div className="auth-visual"><img src="/assets/gridwear-hero.png" alt="Gridwear motorsport collection" /><div><span className="eyebrow">GRIDWEAR MEMBERS</span><h2>Vào pit.<br />Ra đường đua.</h2><p>Lưu giỏ hàng, theo dõi đơn và nhận ưu đãi dành riêng cho thành viên.</p></div></div>
    <section className="auth-form-wrap"><div className="auth-form"><Link to="/" className="brand-mark"><b>F1</b><span>GRIDWEAR</span></Link><span className="eyebrow dark">{mode === "login" ? "WELCOME BACK" : "JOIN THE GRID"}</span><h1>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h1><p>{mode === "login" ? "Tiếp tục hành trình mua sắm của bạn." : "Trở thành thành viên Gridwear chỉ trong một phút."}</p>
      <form onSubmit={handleSubmit(submit)}>
        {mode === "register" && <label>Họ và tên<input autoComplete="name" {...register("fullName")} placeholder="Nguyễn Minh Anh" />{errors.fullName && <em>{errors.fullName.message}</em>}</label>}
        <label>Email<input type="email" autoComplete="email" {...register("email")} placeholder="you@example.com" />{errors.email && <em>{errors.email.message}</em>}</label>
        <label>Mật khẩu<div className="password-input"><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password")} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button></div>{errors.password && <em>{errors.password.message}</em>}</label>
        {mode === "login" && <div className="form-help"><label><input type="checkbox" /> Ghi nhớ đăng nhập</label><button type="button">Quên mật khẩu?</button></div>}
        <button className="button primary full" disabled={isSubmitting}>{isSubmitting ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}<ArrowRight size={18} /></button>
      </form>
      <div className="demo-account">Demo customer: <b>minhanh@example.com</b> / <b>Customer@123</b></div>
      <p className="auth-switch">{mode === "login" ? "Chưa có tài khoản?" : "Đã là thành viên?"} <Link to={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}</Link></p>
    </div></section>
  </div>;
}
