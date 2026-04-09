import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight, Crown, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";

interface FeaturedRecipe {
  id: string;
  title: string;
  category: string;
  image_url: string;
  is_premium?: boolean;
}

const CATEGORIES = [
  { name: "Coffee", emoji: "☕" },
  { name: "Cocktail", emoji: "🍸" },
  { name: "Tea", emoji: "🍵" },
  { name: "Smoothie", emoji: "🥤" },
  { name: "Juice", emoji: "🧃" },
];

export function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [featured, setFeatured] = useState<FeaturedRecipe[]>([]);
  const { isPremiumUser } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFeatured() {
      // 1. Fetch all recipes
      const { data: recipes } = await supabase
        .from("recipes")
        .select("id, title, category, image_url, is_premium");

      if (!recipes || recipes.length === 0) return;

      // 2. Fetch favorite counts per recipe
      const { data: favCounts } = await supabase
        .from("favorites")
        .select("recipe_id");

      // 3. Count favorites per recipe
      const countMap: Record<string, number> = {};
      if (favCounts) {
        for (const fav of favCounts) {
          countMap[fav.recipe_id] = (countMap[fav.recipe_id] || 0) + 1;
        }
      }

      // 4. Sort: most liked first, random tiebreaker for equal counts
      const sorted = recipes
        .map((r) => ({ ...r, favCount: countMap[r.id] || 0 }))
        .sort((a, b) => {
          if (b.favCount !== a.favCount) return b.favCount - a.favCount;
          return Math.random() - 0.5; // random if equal
        })
        .slice(0, 6);

      setFeatured(sorted);
    }
    fetchFeatured();
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gallery?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTagClick = (tag: string) => {
    navigate(`/gallery?q=${encodeURIComponent(tag)}`);
  };

  const getImageUrl = (pathOrUrl?: string) => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http")) return pathOrUrl;
    const { data } = supabase.storage.from("recipe-images").getPublicUrl(pathOrUrl);
    return data.publicUrl;
  };

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 px-4 mx-auto max-w-5xl flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <div className="text-[11px] font-bold tracking-[0.4em] uppercase text-brand mb-6">
            Crafted with Passion
          </div>
          <h1 className="text-4xl md:text-[58px] font-serif text-text-main leading-[1.1] tracking-tight mb-5">
            Discover the Art of<br />Elevating Your Drink
          </h1>
          <p className="text-gray-400 text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed">
            Explore handcrafted recipes from world-class baristas and mixologists.
          </p>
        </motion.div>

        <form
          onSubmit={handleSearch}
          className="w-full max-w-xl mt-10 relative group"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
              <Search className="h-5 w-5 text-gray-300 group-focus-within:text-brand transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-13 pr-28 h-14 bg-gray-50 border border-gray-100 rounded-full text-[15px] focus:outline-none focus:ring-2 focus:ring-brand/10 focus:bg-white focus:border-brand/20 transition-all font-sans text-text-main placeholder:text-gray-300"
            />
            <div className="absolute inset-y-1.5 right-1.5 flex items-center">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-brand hover:bg-brand-hover text-white px-7 h-full rounded-full text-sm font-bold transition-all cursor-pointer"
              >
                Search
              </motion.button>
            </div>
          </motion.div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-5 text-[13px] text-gray-400 font-medium"
        >
          <span className="text-gray-300 uppercase tracking-widest text-[10px] pt-0.5">Popular:</span>
          {["Old Fashioned", "Espresso Martini", "Negroni"].map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="hover:text-brand transition-all cursor-pointer border-b border-transparent hover:border-brand/30"
            >
              {tag}
            </button>
          ))}
        </motion.div>
      </section>

      {/* Categories Strip */}
      <section className="border-y border-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-center gap-6 md:gap-12 flex-wrap">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => navigate(`/gallery?q=${cat.name}`)}
                className="flex items-center gap-2.5 text-sm font-medium text-gray-400 hover:text-brand transition-all cursor-pointer group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                {cat.name}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      {featured.length > 0 && (
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand block mb-2">Fresh from the bar</span>
                <h2 className="text-3xl md:text-4xl font-serif text-text-main">Latest Recipes</h2>
              </div>
              <Link
                to="/gallery"
                className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-brand transition-colors"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
              {featured.map((recipe, i) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="group relative"
                >
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-[#F3EFEA]">
                    {recipe.image_url ? (
                      <img
                        src={getImageUrl(recipe.image_url)}
                        alt={recipe.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] font-bold tracking-widest uppercase">
                        Velvet
                      </div>
                    )}
                    {recipe.is_premium && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase text-brand flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Exclusive
                      </div>
                    )}
                  </div>
                  <div className="mt-3 px-0.5">
                    <p className="text-[10px] text-brand font-bold tracking-[0.2em] uppercase">{recipe.category}</p>
                    <h3 className="font-serif text-lg text-text-main group-hover:text-brand transition-colors mt-0.5 line-clamp-1">
                      {recipe.title}
                    </h3>
                  </div>
                  <Link to={`/recipe/${recipe.id}`} className="absolute inset-0 z-10">
                    <span className="sr-only">View {recipe.title}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="md:hidden mt-8 text-center">
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-brand transition-colors"
              >
                View all recipes <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Premium CTA */}
      {!isPremiumUser && (
        <section className="py-16 md:py-20 px-4 border-t border-gray-50">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16"
            >
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-brand text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Premium
                </div>
                <h2 className="text-3xl md:text-4xl font-serif text-text-main mb-3 leading-tight">
                  Unlock Exclusive Recipes
                </h2>
                <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-md">
                  Get access to premium recipes with detailed ingredients, professional guides, and early access to new content.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  to="/premium"
                  className="inline-flex items-center gap-2.5 bg-brand text-white px-10 py-4 rounded-xl text-sm font-bold hover:bg-brand-hover transition-all cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  Start at $1.99/mo
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}
