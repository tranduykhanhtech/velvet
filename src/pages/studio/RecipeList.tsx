import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Edit, Trash2, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Need to match updated schema which includes status
interface RecipeTableRow {
  id: string;
  title: string;
  category: string;
  created_at: string;
  status: string;
  image_url: string;
  is_premium: boolean;
}

export function RecipeList() {
  const [recipes, setRecipes] = useState<RecipeTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRecipes = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRecipes(data as RecipeTableRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email !== import.meta.env.VITE_ADMIN_EMAIL) {
       toast.error("Unauthorized: This action is for Admin only.");
       return;
    }

    const recipeToDelete = recipes.find(r => r.id === id);

    try {
      // 1. Xóa ảnh trong Storage nếu có
      if (recipeToDelete?.image_url) {
        let fileName = "";
        
        if (recipeToDelete.image_url.includes('recipe-images/')) {
          // Trích xuất fileName từ URL (định dạng thông thường của publicUrl: .../recipe-images/filename)
          const parts = recipeToDelete.image_url.split('recipe-images/');
          fileName = parts[parts.length - 1];
        } else if (!recipeToDelete.image_url.startsWith('http')) {
          // Nếu image_url chỉ lưu path tương đối
          fileName = recipeToDelete.image_url;
        }

        if (fileName) {
          await supabase.storage.from('recipe-images').remove([fileName]);
        }
      }

      // 2. Xóa record trong Database
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
      
      setRecipes(recipes.filter(r => r.id !== id));
      toast.success("Recipe and image deleted successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete.");
    }
  };

  const getImageUrl = (pathOrUrl?: string) => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    const { data } = supabase.storage.from("recipe-images").getPublicUrl(pathOrUrl);
    return data.publicUrl;
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-10 w-full">
        <div>
          <h1 className="text-4xl md:text-[42px] font-serif text-text-main mb-3">My Recipes</h1>
          <p className="text-text-muted text-base font-medium border-gray-200">Manage all your Velvet creations.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-gray-100 text-sm text-gray-500 font-sans tracking-[0.2em] uppercase font-bold">
                <th className="px-6 py-5 font-bold w-20">Image</th>
                <th className="px-6 py-5 font-bold">Title</th>
                <th className="px-6 py-5 font-bold">Access</th>
                <th className="px-6 py-5 font-bold">Date</th>
                <th className="px-6 py-5 font-bold">Status</th>
                <th className="px-6 py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-medium">Loading recipes...</td>
                </tr>
              ) : recipes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 block font-medium">No recipes found. Start creating!</td>
                </tr>
              ) : (
                recipes.map((recipe) => (
                  <tr key={recipe.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                        {recipe.image_url ? (
                          <img 
                            src={getImageUrl(recipe.image_url)} 
                            alt={recipe.title}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-gray-400">No Img</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-serif text-text-main text-xl leading-tight">{recipe.title}</p>
                      <p className="text-[11px] text-brand font-bold tracking-[0.2em] uppercase mt-1.5">{recipe.category}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex px-3 py-1.5 text-[11px] rounded-full flex items-center gap-2 font-black tracking-widest uppercase ${
                        recipe.is_premium
                          ? 'bg-brand/10 text-brand' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {recipe.is_premium ? <><Crown className="w-3.5 h-3.5" /> Premium</> : "Public"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[15px] font-medium text-text-muted">
                      {new Date(recipe.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex px-3 py-1 text-[13px] rounded-md font-bold tracking-wide ${
                        recipe.status === 'Published' || !recipe.status 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {recipe.status || 'Published'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex gap-4 justify-end items-center">
                        <button onClick={() => navigate(`/studio/edit/${recipe.id}`)} className="text-gray-400 hover:text-brand transition-colors p-1.5 cursor-pointer" title="Edit">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          className="text-gray-400 hover:text-red-500 transition-colors p-1.5 cursor-pointer"
                          onClick={() => handleDelete(recipe.id, recipe.title)}
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
