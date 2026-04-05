import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Heart, Share, Lock, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { type Recipe } from "../components/RecipeCard";
import { useAdmin } from "../lib/useAdmin";
import toast from "react-hot-toast";

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAdmin();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

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
        
        // 1. Kiểm tra xem user đã yêu thích món này chưa
        if (user) {
          const { data: favData } = await supabase
            .from("favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("recipe_id", id)
            .single();
          
          if (favData) setIsFavorited(true);
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
      text: `Khám phá công thức pha chế ${recipe?.title} chuyên nghiệp tại Velvet!`,
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
      toast("Vui lòng đăng nhập để lưu món yêu thích", { icon: "🔒" });
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
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
        <p className="text-text-muted text-sm tracking-widest uppercase">Blending your selection...</p>
      </div>
    );
  }

  if (!recipe) {
    return <div className="flex justify-center py-20 text-text-muted font-serif italic text-xl">"Recipe not found in our cellars."</div>;
  }

  const instructions = recipe.instructions ? recipe.instructions.split('\n').filter(s => s.trim() !== '') : [];
  const isLocked = recipe.is_premium && !isAuthenticated;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 w-full">
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
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[13px] text-brand font-black tracking-[0.3em] uppercase mb-5"
          >
            {recipe.category} {recipe.is_premium && "• Premium"}
          </motion.p>
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
              className={`flex gap-3 items-center px-8 py-3 rounded-full text-base font-bold transition-all shadow-md cursor-pointer ${
                isFavorited 
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

          <div className="relative">
            {isLocked && (
              <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center justify-center pt-20 pb-28 px-10 mt-4 backdrop-blur-xl bg-white/70 border border-gray-100 shadow-2xl rounded-[32px]">
                 <div className="bg-brand/10 p-6 rounded-full mb-8">
                   <Lock className="w-10 h-10 text-brand" />
                 </div>
                 <h3 className="font-serif text-[32px] text-text-main mb-4 text-center tracking-wide leading-tight">Masterpiece Exclusive</h3>
                 <p className="text-gray-500 font-sans text-center mb-10 max-w-sm leading-relaxed text-base font-medium">
                   This secret recipe is reserved for the Velvet inner circle. Sign in to unlock the full craft.
                 </p>
                 <Link to="/auth" className="bg-brand text-white px-12 py-4 rounded-full hover:bg-brand-hover tracking-[0.05em] transition-all font-black text-sm shadow-lg cursor-pointer">
                   Sign In to Unlock
                 </Link>
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
    </div>
  );
}
