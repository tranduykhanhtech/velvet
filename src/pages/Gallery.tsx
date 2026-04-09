import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { Search, X, Loader2, Eye, Heart } from "lucide-react";

export interface Recipe {
  id: string;
  title: string;
  category: string;
  description?: string;
  image_url: string;
  author_id?: string;
  is_premium?: boolean;
  view_count?: number;
  favorite_count?: number;
}

const CATEGORIES = ["All", "Coffee", "Cocktail", "Tea", "Juice", "Smoothie"];

export function Gallery({ compact = false }: { compact?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);

  // Debounce logic for internal search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== query) {
        if (searchInput.trim()) {
          setSearchParams({ q: searchInput.trim() });
        } else {
          searchParams.delete("q");
          setSearchParams(searchParams);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, query, setSearchParams, searchParams]);

  // Sync internal input with URL if changed externally (e.g. back button or tag click)
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("recipes").select("*").order("created_at", { ascending: false });

    // Category Filter
    if (activeCategory !== "All") {
      q = q.eq("category", activeCategory);
    }

    // Text Search Filter
    if (query) {
      // Searching in title OR instructions (using instructions since description might be null)
      // Or if you have a description column, add it. 
      // Also searching category names and ingredients if stored as text or JSONB
      // Supabase .or() requires a string of conditions
      q = q.or(`title.ilike.%${query}%,instructions.ilike.%${query}%,category.ilike.%${query}%`);
    }

    const { data, error } = await q;
    if (!error && data) {
      setRecipes(data as Recipe[]);
    }
    setLoading(false);
  }, [activeCategory, query]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const clearSearch = () => {
    setSearchInput("");
    searchParams.delete("q");
    setSearchParams(searchParams);
    setActiveCategory("All");
  };

  const getImageUrl = (pathOrUrl?: string) => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    const { data } = supabase.storage.from("recipe-images").getPublicUrl(pathOrUrl);
    return data.publicUrl;
  };

  return (
    <div className={compact ? "pb-8" : "flex-grow flex flex-col py-4"}>
      <div className="max-w-5xl mx-auto px-4 w-full flex-grow flex flex-col">
        {!compact ? (
          <div className="mb-10 text-center space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-serif text-text-main">Our Collection</h1>
              <p className="text-text-muted font-light tracking-wide max-w-lg mx-auto text-base">
                Explore our curated selection of fine beverages and spirits.
              </p>
            </div>

            {/* Search Bar in Gallery */}
            <div className="max-w-xl mx-auto relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-brand transition-colors" />
              </div>
              <input 
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search recipes..."
                className="w-full pl-14 pr-14 h-15 bg-gray-50 border border-transparent rounded-full text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/10 focus:bg-white transition-all font-sans text-text-main"
              />
              {searchInput && ( 
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute inset-y-0 right-5 flex items-center text-gray-400 hover:text-brand transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center items-center">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    // Clear search when switching category to avoid empty results
                    if (searchInput) {
                      setSearchInput("");
                      searchParams.delete("q");
                      setSearchParams(searchParams);
                    }
                  }}
                  className={`text-[12px] font-bold font-sans tracking-[0.2em] uppercase transition-colors focus:outline-none cursor-pointer ${activeCategory === cat
                      ? "text-brand border-b-2 border-brand pb-1.5"
                      : "text-gray-400 hover:text-brand"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Home page specific heading if compact */}
        {compact && (
          <div className="mb-8 border-b border-gray-50 pb-4">
            <div className="flex items-center gap-5">
              <span className="text-[11px] uppercase tracking-[0.35em] text-brand font-black">The Collection</span>
              <div className="h-[1px] flex-grow bg-gray-100" />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center py-16 gap-6">
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
            <p className="text-gray-400 text-[13px] font-bold tracking-[0.2em] uppercase">Fetching recipes...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {recipes.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
              > 
                {recipes.map((recipe) => (
                  <motion.div
                    key={recipe.id}
                    layout
                    className="group relative flex flex-col gap-4"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#F3EFEA] hover-scale-wrapper shadow-sm">
                      {recipe.image_url ? (
                        <img
                          src={getImageUrl(recipe.image_url)}
                          alt={recipe.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] font-bold tracking-widest uppercase">
                          Velvet Studio
                        </div>
                      )}

                      {recipe.is_premium && (
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-brand shadow-md flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                          Exclusive
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 px-1">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-serif text-[26px] leading-tight tracking-tight text-text-main group-hover:text-brand transition-colors line-clamp-2">
                          {recipe.title}
                        </h3>
                        <span className="text-[10px] text-gray-400 font-bold font-sans tracking-[0.2em] uppercase mt-2 shrink-0">
                          {recipe.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {(recipe.view_count || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" /> {(recipe.favorite_count || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/recipe/${recipe.id}`}
                      className="absolute inset-0 z-10 focus:outline-none"
                    >
                      <span className="sr-only">View {recipe.title}</span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-grow flex flex-col items-center justify-center py-10 space-y-4"
              >
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Search className="w-6 h-6 text-gray-300" />
                </div>
                <div className="space-y-1.5 text-center">
                  <p className="text-2xl font-serif text-text-main italic">
                    "No recipes found in our cellars."
                  </p>
                </div>
                <button
                  onClick={clearSearch}
                  className="bg-brand text-white px-10 py-3 rounded-full text-[13px] font-bold hover:bg-brand-hover transition-all shadow-md"
                >
                  Clear Search
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
