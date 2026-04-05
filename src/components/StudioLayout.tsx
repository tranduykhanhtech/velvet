import { Link, Outlet, useLocation } from "react-router-dom";
import { CopyPlus, LayoutDashboard, Settings, Library, LogOut } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { supabase } from "../lib/supabase";

export function StudioLayout() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/studio", icon: LayoutDashboard },
    { name: "My Recipes", path: "/studio/recipes", icon: Library },
    { name: "Add New", path: "/studio/add", icon: CopyPlus },
    { name: "Settings", path: "/studio/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] font-sans selection:bg-brand/20 selection:text-brand">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#CC5500',
            color: '#fff',
            borderRadius: '4px',
            fontFamily: 'Inter, sans-serif',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#CC5500',
          },
        }}
      />
      {/* Sidebar */}
      <aside className="w-64 bg-[#FFFFFF] border-r border-gray-100 flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-8">
          <Link to="/" className="text-2xl font-serif font-bold text-brand tracking-wide block mb-12">
            Velvet.
            <span className="block text-xs font-sans text-gray-400 font-normal uppercase tracking-widest mt-1">Studio</span>
          </Link>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${isActive
                      ? "bg-brand/5 text-brand"
                      : "text-gray-500 hover:text-brand hover:bg-brand/5"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-100">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-gray-500 hover:text-brand hover:bg-brand/5 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex justify-center">
        <div className="max-w-4xl w-full p-8 md:p-12 lg:px-16">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
