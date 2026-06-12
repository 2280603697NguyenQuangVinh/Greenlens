import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/redux/authStore";
import { isAuthenticated } from "@/services/tokenStorage";

export default function ProtectedRoute() {
  const { isAuthenticated: authState } = useAuth();
  const location = useLocation();
  const allowed = authState || isAuthenticated();

  if (!allowed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
