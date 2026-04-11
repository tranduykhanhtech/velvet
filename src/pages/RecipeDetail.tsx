import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { CheckCircle2, Circle, Heart, Share, Crown, Eye, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { RecipeCard, type Recipe } from "../components/RecipeCard";
import { Skeleton } from "../components/Skeleton";
import { useAdmin } from "../lib/useAdmin";
import toast from "react-hot-toast";

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isPremiumUser, isAdmin, user } = useAdmin();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    async function fetchRecipe() {
      setLoading(true);
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setRecipe({
          ...data,
          ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        });

        // Record unique view (only for logged-in users)
        if (user) {
          await supabase.rpc('record_recipe_view', {
            p_recipe_id: id,
            p_user_id: user.id
          });
          // Re-fetch updated counts
          const { data: updated } = await supabase
            .from('recipes')
            .select('view_count, favorite_count')
            .eq('id', id)
            .single();
          setViewCount(updated?.view_count || data.view_count || 0);
          setFavoriteCount(updated?.favorite_count || data.favorite_count || 0);
        } else {
          setViewCount(data.view_count || 0);
          setFavoriteCount(data.favorite_count || 0);
        }

        // Check if user has favorited
        if (user) {
          const { data: favData } = await supabase
            .from("favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("recipe_id", id)
            .single();

          if (favData) setIsFavorited(true);
        }

        // Fetch Related Recipes
        const { data: related } = await supabase
          .from("recipes")
          .select("*")
          .eq("category", data.category)
          .neq("id", id)
          .limit(3);

        if (related) {
          setRelatedRecipes(related as Recipe[]);
        }
      }
      setLoading(false);
    }
    if (id) fetchRecipe();
  }, [id, user]);

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  const handleShare = async () => {
    const shareData = {
      title: `Velvet: ${recipe?.title}`,
      text: `Discover the exquisite ${recipe?.title} recipe on Velvet!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!", { icon: "🔗" });
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast("Please sign in to save favorites", { icon: "🔒" });
      navigate("/auth", { state: { from: location } });
      return;
    }

    if (isFavoriteLoading || !recipe) return;

    setIsFavoriteLoading(true);
    try {
      if (isFavorited) {
        // Unfavorite
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user?.id)
          .eq("recipe_id", recipe.id);

        if (error) throw error;
        setIsFavorited(false);
        setFavoriteCount(prev => Math.max(0, prev - 1));
        toast.success("Removed from favorites");
      } else {
        // Favorite
        const { error } = await supabase
          .from("favorites")
          .insert({
            user_id: user?.id,
            recipe_id: recipe.id
          });

        if (error) throw error;
        setIsFavorited(true);
        setFavoriteCount(prev => prev + 1);
        toast.success("Saved to favorites!", { icon: "❤️" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update favorite status");
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 w-full">
        <Skeleton className="w-20 h-5 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
          <Skeleton className="w-full aspect-[3/4] md:aspect-[4/5] rounded-[24px]" />
          <div className="flex flex-col space-y-6 pt-4">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-16 w-full max-w-sm rounded" />
            <Skeleton className="h-20 w-full rounded" />
            <div className="flex gap-4 mt-6">
              <Skeleton className="h-12 w-32 rounded-full" />
              <Skeleton className="h-12 w-48 rounded-full" />
            </div>
            <div className="mt-16 space-y-4">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return <div className="flex justify-center py-20 text-text-muted font-serif italic text-xl">"Recipe not found in our cellars."</div>;
  }

  const instructions = recipe.instructions ? recipe.instructions.split('\n').filter(s => s.trim() !== '') : [];
  const canViewPremium = isPremiumUser || isAdmin;
  const isLocked = recipe.is_premium && !canViewPremium;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-brand origin-left z-50 pointer-events-none"
        style={{ scaleX }}
      />
      <div className="max-w-5xl mx-auto px-4 py-12 w-full">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand transition-colors mb-8 cursor-pointer font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 relative">
          {/* Left Column - Image */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-[24px] bg-[#F3EFEA] shadow-md lg:sticky lg:top-32"
            >
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold tracking-widest uppercase text-sm">
                  Velvet Studio
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Content */}
          <div className="flex flex-col relative w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4 mb-5"
            >
              <span className="text-[13px] text-brand font-black tracking-[0.3em] uppercase">
                {recipe.category} {recipe.is_premium && "• Premium"}
              </span>
              <span className="flex items-center gap-4 text-[12px] text-gray-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> {viewCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" /> {favoriteCount.toLocaleString()}
                </span>
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-[62px] font-serif text-text-main leading-[1.1] mb-6 tracking-tight"
            >
              {recipe.title}
            </motion.h1>
            {recipe.description && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-500 font-sans text-lg leading-relaxed mb-10"
              >
                {recipe.description}
              </motion.p>
            )}

            {!isLocked && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-5 mb-14 flex-wrap relative z-10"
              >
                <button
                  onClick={handleShare}
                  className="flex gap-3 items-center bg-gray-50 hover:bg-gray-100 text-gray-600 px-8 py-3 rounded-full text-base font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Share className="w-5 h-5" /> Share
                </button>
                <button
                  onClick={handleToggleFavorite}
                  disabled={isFavoriteLoading}
                  className={`flex gap-3 items-center px-8 py-3 rounded-full text-base font-bold transition-all shadow-md cursor-pointer ${isFavorited
                      ? "bg-brand text-white"
                      : "bg-white border-2 border-gray-100 text-text-main hover:bg-gray-50"
                    }`}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isFavorited ? "fav" : "not-fav"}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [0.8, 1.2, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
                    </motion.div>
                  </AnimatePresence>
                  {isFavorited ? "Saved to Favorites" : "Save to Favorites"}
                </button>
              </motion.div>
            )}

            <div className="relative">
              {isLocked && (
                <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center justify-center py-16 px-8 mt-4 backdrop-blur-md bg-white/80 border border-gray-100 rounded-2xl">
                  <Crown className="w-8 h-8 text-brand/60 mb-5" />
                  <h3 className="font-serif text-2xl text-text-main mb-3 text-center">Premium Exclusive</h3>
                  <p className="text-gray-400 font-sans text-center mb-8 max-w-xs leading-relaxed text-sm">
                    {isAuthenticated
                      ? "This recipe is reserved for Premium members. Upgrade to unlock full ingredients and instructions."
                      : "Sign in and upgrade to Premium to discover this exclusive recipe."
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {!isAuthenticated && (
                      <Link to="/auth" className="text-text-muted hover:text-brand px-8 py-3 rounded-full text-sm font-bold cursor-pointer text-center border border-gray-100 hover:border-brand/20 transition-all">
                        Sign In
                      </Link>
                    )}
                    <Link to="/premium" className="bg-brand text-white px-8 py-3 rounded-full hover:bg-brand-hover transition-all font-bold text-sm cursor-pointer flex items-center gap-2 justify-center">
                      <Crown className="w-3.5 h-3.5" /> Upgrade to Premium
                    </Link>
                  </div>
                </div>
              )}

              <div className={`space-y-16 transition-all ${isLocked ? "blur-xl select-none pointer-events-none opacity-40" : ""}`}>
                {/* Ingredients */}
                <section>
                  <h2 className="text-3xl font-serif text-text-main mb-8 border-b border-gray-50 pb-4">Ingredients</h2>
                  <ul className="space-y-6">
                    {recipe.ingredients?.map((ingredient, idx) => {
                      const isChecked = checkedIngredients.has(idx);
                      return (
                        <motion.li
                          key={idx}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleIngredient(idx)}
                          className="flex items-center gap-5 cursor-pointer group"
                        >
                          <button className="focus:outline-none shrink-0 cursor-pointer">
                            {isChecked ? (
                              <CheckCircle2 className="w-7 h-7 text-brand" />
                            ) : (
                              <Circle className="w-7 h-7 text-gray-200 group-hover:text-brand/50 transition-colors" />
                            )}
                          </button>
                          <span className={`text-xl font-medium transition-colors ${isChecked ? "text-gray-400 line-through" : "text-text-main"}`}>
                            {ingredient}
                          </span>
                        </motion.li>
                      );
                    })}
                  </ul>
                </section>

                {/* Instructions */}
                <section>
                  <h2 className="text-3xl font-serif text-text-main mb-8 border-b border-gray-50 pb-4">Instructions</h2>
                  <div className="space-y-10 lg:space-y-14">
                    {instructions.map((step, idx) => (
                      <div key={idx} className="flex gap-8">
                        <span className="text-3xl font-serif text-brand/30 font-black shrink-0 mt-1 block">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <p className="text-xl text-text-muted leading-relaxed font-medium">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Related Recipes Section */}
        {!isLocked && relatedRecipes.length > 0 && (
          <div className="mt-32 pt-16 border-t border-gray-100 relative z-10 w-full">
            <div className="flex items-center justify-between mb-10 w-full">
              <h2 className="text-2xl font-serif text-text-main flex items-center gap-3">
                More Like This
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10">
              {relatedRecipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
