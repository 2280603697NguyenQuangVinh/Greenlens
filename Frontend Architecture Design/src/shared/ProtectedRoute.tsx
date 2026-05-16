import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/state/authStore";
import { isAuthenticated } from "@/services/tokenStorage";

export default function ProtectedRoute() {
  const { isAuthenticated: authState } = useAuth();

  if (!authState && !isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
