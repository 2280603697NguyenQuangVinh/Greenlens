import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { login } from "./authService";
import { useAuth } from "@/state/authStore";
import { AuthLayout } from "@/shared/components/AuthLayout";
import { UnderlineField } from "@/shared/components/UnderlineField";
import { isAuthenticated } from "@/services/tokenStorage";
import { useEffect } from "react";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(email, password);
      setAuth(user, "mock-token");
      navigate("/app", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Đăng nhập để tiếp tục">
      <form onSubmit={handleSubmit}>
        <UnderlineField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="abc@gmail.com"
          required
        />
        <UnderlineField
          label="Password"
          value={password}
          onChange={setPassword}
          showToggle
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg bg-gradient-to-r from-[#4ade80] via-[#34d399] to-[#2dd4bf] shadow-lg shadow-green-200/80 active:scale-[0.98] transition-transform disabled:opacity-70 mt-2"
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
        </button>

        <div className="flex justify-between mt-8 text-sm font-semibold">
          <Link to="/register" className="text-slate-700 hover:text-green-600">
            Tạo tài khoản
          </Link>
          <button type="button" className="text-slate-500 hover:text-green-600">
            Quên mật khẩu?
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
