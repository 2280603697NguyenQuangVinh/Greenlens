import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Leaf, Mail, Lock, ArrowRight } from "lucide-react";
import { login } from "./authService";
import { useAuth } from "@/state/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(email, password);
      setAuth(user, "mock-token");
      navigate("/app");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-green-50 px-6 py-12">
      <div className="flex flex-col items-center mt-10 mb-12">
        <div className="bg-green-500 p-4 rounded-3xl shadow-lg shadow-green-200 mb-4">
          <Leaf size={48} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-black text-green-900">Welcome Back!</h1>
        <p className="text-green-600 font-semibold mt-2 text-lg">Sign in to continue exploring</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-sm mx-auto">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-green-800">Email</span>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="explorer@email.com"
              className="w-full bg-white border-2 border-green-200 rounded-2xl py-3.5 pl-12 pr-4 font-medium outline-none focus:border-green-500"
              required
            />
          </div>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-green-800">Password</span>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full bg-white border-2 border-green-200 rounded-2xl py-3.5 pl-12 pr-4 font-medium outline-none focus:border-green-500"
              required
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
        >
          {isLoading ? "Signing in..." : (
            <>
              Login <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-green-700 font-semibold">
        New explorer?{" "}
        <Link to="/register" className="text-green-500 underline underline-offset-4">
          Create account
        </Link>
      </p>
    </div>
  );
}
