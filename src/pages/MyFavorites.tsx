import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface FavoriteRecipe {
  id: string; // ID of the favorite record
  recipe: {
    id: string;
    title: string;
    category: string;
    image_url: string;
    is_premium: boolean;
    description: string;
  };
}

export function MyFavorites() {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .select(`
        id,
        recipe:recipes (
          id,
          title,
          category,
          image_url,
          is_premium,
          description
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFavorites(data as any);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (e: React.MouseEvent, favoriteId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const { error } = await supabase.from("favorites").delete().eq("id", favoriteId);
    if (!error) {
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      toast.success("Removed from your library.");
    }
  };

  const getImageUrl = (pathOrUrl?: string) => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    const { data } = supabase.storage.from("recipe-images").getPublicUrl(pathOrUrl);
    return data.publicUrl;
  };

  return (
    <div className="flex-grow flex flex-col py-8 px-4">
      <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col">
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 text-brand mb-3">
            <Heart className="w-5 h-5 fill-brand" />
            <span className="text-[11px] font-black tracking-[0.3em] uppercase">Your Library</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-text-main">Saved Selection</h1>
          <p className="mt-3 text-sm text-text-muted font-medium tracking-wide max-w-lg mx-auto italic">
            "A curation of your finest spirits and handcrafted discoveries."
          </p>
        </header>

        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center py-24 gap-6">
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
            <p className="text-gray-400 text-[13px] font-bold tracking-[0.2em] uppercase">Fetching collection...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {favorites.length > 0 ? (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
              >
                {favorites.map((fav) => (
                  <motion.div
                    key={fav.id}
                    layout
                    className="group relative flex flex-col gap-4"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#F3EFEA] cursor-pointer shadow-sm" onClick={() => navigate(`/recipe/${fav.recipe.id}`)}>
                      {fav.recipe.image_url ? (
                        <img
                          src={getImageUrl(fav.recipe.image_url)}
                          alt={fav.recipe.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] font-bold tracking-widest uppercase">
                          Velvet.
                        </div>
                      )}

                      {/* Action Button: Unfavorite */}
                      <button
                        onClick={(e) => handleRemoveFavorite(e, fav.id)}
                        className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2.5 rounded-full text-brand shadow-md hover:bg-brand hover:text-white transition-all cursor-pointer z-20"
                        title="Remove"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

                      {fav.recipe.is_premium && (
                        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-brand shadow-md">
                          Exclusive
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 px-1">
                      <div className="flex justify-between items-start gap-4">
                        <Link
                          to={`/recipe/${fav.recipe.id}`}
                          className="font-serif text-[26px] leading-tight tracking-tight text-text-main group-hover:text-brand transition-colors line-clamp-2"
                        >
                          {fav.recipe.title}
                        </Link>
                        <span className="text-[10px] text-gray-400 font-bold font-sans tracking-[0.2em] uppercase mt-2 shrink-0">
                          {fav.recipe.category}
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-400 font-medium line-clamp-2 leading-relaxed">
                        {fav.recipe.description || "You've saved this handcrafted discovery."}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-grow flex flex-col items-center justify-center py-12 space-y-5"
              >
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Heart className="w-6 h-6 text-gray-200" />
                </div>
                <div className="space-y-1.5 text-center">
                  <p className="text-2xl font-serif text-text-main italic">
                    "Your selection is currently empty."
                  </p>
                </div>
                <Link
                  to="/gallery"
                  className="bg-brand text-white px-10 py-3 rounded-full text-[13px] font-bold hover:bg-brand-hover transition-all shadow-md"
                >
                  Explore Collection
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
