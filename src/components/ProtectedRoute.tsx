import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdmin } from "../lib/useAdmin";

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAdmin();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-text-muted tracking-widest uppercase text-sm">
        Authenticating...
      </div>
    );
  }

  // Redirect to Auth if not logged in, saving current location for redirection
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" state={{ from: location }} replace />;
}
