import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Crown } from "lucide-react";
import toast from "react-hot-toast";

export function Navbar() {
  const { isAuthenticated, isAdmin, isPremiumUser, user } = useAdmin();
  const navigate = useNavigate();

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";

  const handleSignOut = async () => {
    const toastId = toast.loading("Signing out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("See you soon!", { id: toastId });
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out", { id: toastId });
    }
  };

  return (
    <header className="sticky top-0 w-full h-16 px-4 flex items-center z-50 bg-white/90 backdrop-blur-md border-b border-gray-50">
      <div className="max-w-5xl mx-auto w-full flex justify-between items-center h-full">
        <Link to="/" className="text-[26px] font-serif font-bold text-brand tracking-wide hover:opacity-80 transition-opacity">
          Velvet.
        </Link>
        <nav className="flex gap-4 md:gap-8 text-[15px] font-medium text-text-muted items-center">
          <Link to="/gallery" className="hover:text-brand transition-colors">Gallery</Link>
          {!isPremiumUser && (
            <Link to="/premium" className="hover:text-brand transition-colors hidden sm:flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> Premium
            </Link>
          )}
          <AnimatePresence mode="wait">
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="hidden sm:block"
              >
                <Link to="/studio/add" className="hover:text-brand transition-colors">Submit</Link>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isAuthenticated ? (
              <motion.div 
                key="authed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 md:gap-5 bg-gray-50 px-2.5 py-1.5 md:px-4 md:py-2 rounded-full border border-gray-100"
              >
                <Link to="/favorites" className="hover:text-brand transition-colors shrink-0" title="My Favorites">
                  <Heart className="w-[18px] h-[18px]" />
                </Link>
                
                <span className="flex items-center gap-2.5 text-text-main text-[13px] font-bold border-l border-gray-200 pl-2.5 md:pl-4">
                  {isPremiumUser && (
                    <span className="text-brand" title="Premium Member">
                      <Crown className="w-4 h-4 fill-brand/20" />
                    </span>
                  )}
                  <div className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[11px] uppercase shrink-0">
                    {userDisplayName[0]}
                  </div>
                  <span className="hidden md:inline truncate max-w-[80px]">{userDisplayName}</span>
                </span>
                <button 
                  onClick={handleSignOut} 
                  className="text-gray-400 hover:text-brand transition-colors focus:outline-none cursor-pointer text-[12px] uppercase tracking-tighter font-bold shrink-0"
                >
                  Sign Out
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="unauthed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Link 
                  to="/auth"
                  className="bg-brand text-white px-6 py-2.5 rounded-full text-[13px] font-bold hover:bg-brand-hover transition-all shadow-sm"
                >
                  Sign In
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </header>
  );
}
