import { Navigate, Outlet } from "react-router-dom";
import { useAdmin } from "../lib/useAdmin";

export function AdminRoute() {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-text-muted tracking-widest uppercase text-sm">Loading Workspace...</div>;
  }

  // Redirect to Home if not an admin (based on VITE_ADMIN_EMAIL flag). 
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
