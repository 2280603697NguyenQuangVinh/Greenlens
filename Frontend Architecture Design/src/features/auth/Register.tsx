import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { register } from "./authService";
import { useAuth } from "@/state/authStore";
import { AuthLayout } from "@/shared/components/AuthLayout";
import { UnderlineField } from "@/shared/components/UnderlineField";
import { isAuthenticated } from "@/services/tokenStorage";
import { AvatarCustomizer, type AvatarData } from "@/shared/components/AvatarCustomizer";

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setIsLoading(true);
    try {
      const user = await register(email, password, username);
      setRegisteredUser(user);
      setShowAvatarCustomizer(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSave = (avatar: AvatarData) => {
    if (registeredUser) {
      setAuth({ ...registeredUser, avatar }, "mock-token");
      navigate("/app", { replace: true });
    }
  };

  const handleAvatarSkip = () => {
    if (registeredUser) {
      setAuth(registeredUser, "mock-token");
      navigate("/app", { replace: true });
    }
  };

  const handleAvatarCancel = () => {
    setShowAvatarCustomizer(false);
  };

  return (
    <>
      <AuthLayout subtitle="Đăng ký để tiếp tục">
        <form onSubmit={handleSubmit}>
          <UnderlineField
            label="Tên Đăng Nhập"
            value={username}
            onChange={setUsername}
            placeholder="Phúc"
            required
          />
          <UnderlineField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="abc@gmail.com"
            required
          />
          <UnderlineField
            label="Mật Khẩu"
            value={password}
            onChange={setPassword}
            showToggle
            required
          />
          <UnderlineField
            label="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={setConfirmPassword}
            showToggle
            required
          />

          {error && (
            <p className="text-red-500 text-sm font-semibold text-center mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg bg-gradient-to-r from-[#4ade80] via-[#34d399] to-[#2dd4bf] shadow-lg shadow-green-200/80 active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {isLoading ? "Đang đăng ký..." : "Đăng Ký"}
          </button>

          <p className="text-center mt-8 text-sm font-semibold text-slate-600">
            <Link to="/login" className="text-slate-800 hover:text-green-600 underline-offset-2 hover:underline">
              Đã có tài khoản?
            </Link>
          </p>
        </form>
      </AuthLayout>

      {showAvatarCustomizer && (
        <AvatarCustomizer
          onSave={handleAvatarSave}
          onCancel={handleAvatarCancel}
          onSkip={handleAvatarSkip}
          showSkip={true}
        />
      )}
    </>
  );
}
