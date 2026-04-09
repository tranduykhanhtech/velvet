import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, User, Mail, Edit3, Check, X, LogOut, ArrowLeft, Trash2, Heart, Eye, KeyRound, BookOpen } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import toast from "react-hot-toast";

interface FavRecipe {
  recipe_id: string;
  recipes: {
    id: string;
    title: string;
    image_url: string;
    category: string;
  };
}

export function Profile() {
  const { isAuthenticated, isPremiumUser, isAdmin, user, loading } = useAdmin();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(true);

  // Stats
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [recentFavorites, setRecentFavorites] = useState<FavRecipe[]>([]);

  // Password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth", { state: { from: { pathname: "/profile" } } });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
    }
  }, [user]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Subscription
      const { data: sub } = await supabase
        .from("premium_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setSubscription(sub);
      setSubLoading(false);

      // Total favorites
      const { count: favCount } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setTotalFavorites(favCount || 0);

      // Total unique views
      const { count: viewCount } = await supabase
        .from("recipe_views")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setTotalViews(viewCount || 0);

      // Recent 3 favorites with recipe info
      const { data: recentFavs } = await supabase
        .from("favorites")
        .select("recipe_id, recipes(id, title, image_url, category)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (recentFavs) setRecentFavorites(recentFavs as unknown as FavRecipe[]);
    }
    if (user) fetchData();
  }, [user]);

  const getImageUrl = (pathOrUrl?: string) => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http")) return pathOrUrl;
    const { data } = supabase.storage.from("recipe-images").getPublicUrl(pathOrUrl);
    return data.publicUrl;
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() },
      });
      if (error) throw error;
      toast.success("Profile updated!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated!");
      setNewPassword("");
      setShowPasswordForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your Premium subscription?")) return;
    try {
      const { error } = await supabase
        .from("premium_subscriptions")
        .update({ status: "cancelled" })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Subscription cancelled");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel subscription");
    }
  };

  const handleChangePlan = async (newPlan: string) => {
    if (subscription?.plan === newPlan) return;
    try {
      const { error } = await supabase
        .from("premium_subscriptions")
        .update({
          plan: newPlan,
          started_at: new Date().toISOString(),
          expires_at: newPlan === "yearly"
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success(`Switched to ${newPlan} plan!`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to change plan");
    }
  };

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

  if (loading || !user) {
    return (
      <div className="flex-grow flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex-grow flex flex-col py-12 md:py-16 px-4">
      <div className="max-w-2xl mx-auto w-full">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand transition-colors mb-8 cursor-pointer font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5 mb-10"
        >
          <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center text-2xl font-serif font-bold uppercase shrink-0">
            {(displayName || "U")[0]}
          </div>
          <div>
            <h1 className="text-2xl font-serif text-text-main flex items-center gap-2">
              {displayName || "User"}
              {isPremiumUser && (
                <span className="text-brand" title="Premium Member">
                  <Crown className="w-5 h-5 fill-brand/20" />
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-400 font-medium">Member since {memberSince}</p>
          </div>
        </motion.div>

        {/* Activity Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="grid grid-cols-3 gap-4 mb-10"
        >
          <div className="border border-gray-100 rounded-2xl p-5 text-center">
            <Heart className="w-4 h-4 text-brand mx-auto mb-2" />
            <p className="text-2xl font-serif text-text-main">{totalFavorites}</p>
            <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-1">Favorites</p>
          </div>
          <div className="border border-gray-100 rounded-2xl p-5 text-center">
            <Eye className="w-4 h-4 text-brand mx-auto mb-2" />
            <p className="text-2xl font-serif text-text-main">{totalViews}</p>
            <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-1">Viewed</p>
          </div>
          <div className="border border-gray-100 rounded-2xl p-5 text-center">
            <BookOpen className="w-4 h-4 text-brand mx-auto mb-2" />
            <p className="text-2xl font-serif text-text-main">{isPremiumUser ? "Premium" : "Free"}</p>
            <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-1">Plan</p>
          </div>
        </motion.div>

        {/* Recent Favorites */}
        {recentFavorites.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold tracking-[0.3em] uppercase text-brand">Recent Favorites</h2>
              <Link to="/favorites" className="text-[12px] text-gray-400 hover:text-brand transition-colors font-medium">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {recentFavorites.map((fav) => (
                <Link
                  key={fav.recipe_id}
                  to={`/recipe/${fav.recipes.id}`}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-[#F3EFEA]"
                >
                  {fav.recipes.image_url ? (
                    <img
                      src={getImageUrl(fav.recipes.image_url)}
                      alt={fav.recipes.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px] font-bold tracking-widest uppercase">
                      Velvet
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-[11px] font-bold line-clamp-1">{fav.recipes.title}</p>
                    <p className="text-white/60 text-[9px] uppercase tracking-wider">{fav.recipes.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Personal Info */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="mb-10"
        >
          <h2 className="text-[11px] font-bold tracking-[0.3em] uppercase text-brand mb-5">Personal Info</h2>
          <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50">
            {/* Email */}
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Email</p>
                  <p className="text-sm text-text-main font-medium">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Display Name</p>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="text-sm text-text-main font-medium border-b-2 border-brand/30 focus:border-brand outline-none bg-transparent py-1 w-full transition-colors"
                        autoFocus
                      />
                      <button onClick={handleSaveName} disabled={saving} className="text-brand hover:text-brand-hover transition-colors shrink-0">
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setIsEditing(false); setDisplayName(user.user_metadata?.full_name || user.email?.split("@")[0] || ""); }}
                        className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-text-main font-medium">{displayName}</p>
                  )}
                </div>
              </div>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-brand transition-colors shrink-0">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Password */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Password</p>
                    <p className="text-sm text-text-main font-medium">••••••••</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="text-gray-400 hover:text-brand transition-colors shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              {showPasswordForm && (
                <div className="flex items-center gap-2 mt-3 pl-7">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className="text-sm text-text-main font-medium border-b-2 border-brand/30 focus:border-brand outline-none bg-transparent py-1 flex-1 transition-colors"
                    autoFocus
                  />
                  <button onClick={handleChangePassword} disabled={changingPassword} className="text-brand hover:text-brand-hover transition-colors shrink-0">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setShowPasswordForm(false); setNewPassword(""); }} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Subscription */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-10"
        >
          <h2 className="text-[11px] font-bold tracking-[0.3em] uppercase text-brand mb-5">Subscription</h2>
          <div className="border border-gray-100 rounded-2xl p-6">
            {subLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            ) : isAdmin ? (
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-brand" />
                <div>
                  <p className="text-sm font-bold text-text-main">Admin Access</p>
                  <p className="text-[12px] text-gray-400">Full premium access as administrator</p>
                </div>
              </div>
            ) : subscription && subscription.status === "active" ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-brand" />
                    <div>
                      <p className="text-sm font-bold text-text-main flex items-center gap-2">
                        Premium
                        <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {subscription.plan}
                        </span>
                      </p>
                      <p className="text-[12px] text-gray-400">
                        Started {new Date(subscription.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {subscription.expires_at && (
                          <> · Renews {new Date(subscription.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleChangePlan("monthly")}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      subscription.plan === "monthly"
                        ? "bg-brand text-white"
                        : "bg-gray-50 text-gray-400 hover:text-brand hover:bg-gray-100"
                    }`}
                  >
                    Monthly — $1.99
                  </button>
                  <button
                    onClick={() => handleChangePlan("yearly")}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      subscription.plan === "yearly"
                        ? "bg-brand text-white"
                        : "bg-gray-50 text-gray-400 hover:text-brand hover:bg-gray-100"
                    }`}
                  >
                    Yearly — $14.99
                  </button>
                </div>

                <button
                  onClick={handleCancelSubscription}
                  className="flex items-center gap-2 text-[12px] text-gray-400 hover:text-red-500 transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Cancel subscription
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-text-main">Free Plan</p>
                  <p className="text-[12px] text-gray-400">Upgrade to unlock exclusive recipes</p>
                </div>
                <button
                  onClick={() => navigate("/premium")}
                  className="bg-brand text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-hover transition-all flex items-center gap-2"
                >
                  <Crown className="w-3.5 h-3.5" /> Upgrade
                </button>
              </div>
            )}
          </div>
        </motion.section>

        {/* Sign Out */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-red-500 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </motion.section>
      </div>
    </div>
  );
}
