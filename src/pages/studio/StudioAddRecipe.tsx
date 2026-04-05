import { useState, useCallback, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Plus, X, UploadCloud, Crown } from "lucide-react";
import toast from "react-hot-toast";

interface IngredientInput {
  name: string;
  amount: string;
}

interface RecipeFormValues {
  title: string;
  category: string;
  is_premium: boolean;
  ingredients: IngredientInput[];
  instructions: string;
  status: string;
}

export function StudioAddRecipe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<RecipeFormValues>({
    defaultValues: {
      category: "Coffee",
      status: "Published",
      is_premium: false,
      ingredients: [{ name: "", amount: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients"
  });

  const isPremium = watch("is_premium");

  useEffect(() => {
    if (isEditing && id) {
      async function fetchRecipe() {
        const { data, error } = await supabase.from('recipes').select('*').eq('id', id).single();
        if (data && !error) {
          const mappedIngredients = (data.ingredients || []).map((ing: string) => {
            const spaceIdx = ing.indexOf(' ');
            if (spaceIdx === -1) return { amount: '', name: ing };
            return { amount: ing.substring(0, spaceIdx), name: ing.substring(spaceIdx + 1) };
          });

          if (mappedIngredients.length === 0) mappedIngredients.push({ name: '', amount: '' });

          reset({
            title: data.title,
            category: data.category,
            is_premium: !!data.is_premium,
            status: data.status,
            instructions: data.instructions,
            ingredients: mappedIngredients
          });

          if (data.image_url) {
            setExistingImageUrl(data.image_url);
            if (data.image_url.startsWith("http")) {
              setImagePreview(data.image_url);
            } else {
              const { data: publicUrlData } = supabase.storage.from("recipe-images").getPublicUrl(data.image_url);
              setImagePreview(publicUrlData.publicUrl);
            }
          }
        } else {
          toast.error("Không tìm thấy công thức.");
          navigate('/studio/recipes');
        }
      }
      fetchRecipe();
    }
  }, [id, isEditing, reset, navigate]);

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${e.target.scrollHeight}px`;
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: RecipeFormValues) => {
    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Updating recipe..." : "Saving your masterpiece...");
    try {
      // 1. Lấy thông tin user hiện tại (getUser() an toàn hơn getSession() cho RLS)
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Vui lòng đăng nhập để thực hiện hành động này.");
      }

      // 2. Bảo mật chặt ở frontend (Admin Check)
      if (user.email !== import.meta.env.VITE_ADMIN_EMAIL) {
        throw new Error("Unauthorized: Hành động này chỉ dành cho Admin.");
      }

      let finalImageUrl = existingImageUrl;

      if (imageFile) {
        if (isEditing && existingImageUrl) {
          let oldFileName = "";
          if (existingImageUrl.includes('recipe-images/')) {
            const parts = existingImageUrl.split('recipe-images/');
            oldFileName = parts[parts.length - 1];
          } else if (!existingImageUrl.startsWith('http')) {
            oldFileName = existingImageUrl;
          }
          if (oldFileName) {
            await supabase.storage.from('recipe-images').remove([oldFileName]);
          }
        }

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }

      const ingredientsList = data.ingredients.map(i => `${i.amount.trim()} ${i.name.trim()}`).filter(i => i.trim() !== "");

      const payload = {
        title: data.title,
        category: data.category,
        is_premium: Boolean(data.is_premium), // Đảm bảo luôn là boolean
        ingredients: ingredientsList,
        instructions: data.instructions,
        image_url: finalImageUrl,
        status: data.status,
        author_id: user.id
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('recipes')
          .update(payload)
          .eq('id', id);

        if (updateError) throw updateError;
        toast.success("Masterpiece Updated!", { id: toastId });
      } else {
        const { error: insertError } = await supabase
          .from('recipes')
          .insert([payload]);

        if (insertError) throw insertError;
        toast.success("Masterpiece Published!", { id: toastId });
      }

      if (!isEditing) {
        reset();
        setImageFile(null);
        setImagePreview(null);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      } else {
        navigate('/studio/recipes');
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save recipe.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl md:text-[42px] font-serif text-text-main mb-3">
          {isEditing ? "Edit Masterpiece" : "Create a New Masterpiece"}
        </h1>
        <p className="text-text-muted text-base font-medium tracking-wide">
          {isEditing ? "Refine your recipe details." : "Share your craft to the Velvet collection."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <Input
              placeholder="Recipe Title"
              className="text-3xl md:text-4xl font-serif py-3 font-medium border-t-0 border-l-0 border-r-0 border-b border-gray-200"
              {...register("title", { required: true })}
            />
            {errors.title && <span className="text-brand text-[13px] font-bold mt-2 block">Title is required</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
            <div className="space-y-2.5">
              <label className="text-[13px] font-bold font-sans text-gray-500 uppercase tracking-[0.2em] block">Category</label>
              <select
                {...register("category")}
                className="w-full bg-transparent border-b border-gray-300 py-3.5 text-lg text-text-main focus:outline-none focus:border-brand transition-colors appearance-none font-medium"
              >
                <option value="Coffee">Coffee</option>
                <option value="Cocktail">Cocktail</option>
                <option value="Juice">Juice</option>
                <option value="Smoothie">Smoothie</option>
                <option value="Tea">Tea</option>
              </select>
            </div>

            {/* Premium Toggle */}
            <div className="space-y-3.5 pb-2">
              <label className="text-[13px] font-bold font-sans text-gray-500 uppercase tracking-[0.2em] block">Access Level</label>
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="sr-only" {...register("is_premium")} />
                  <div className={`block w-14 h-7 rounded-full transition-colors ${isPremium ? 'bg-brand' : 'bg-gray-200'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${isPremium ? 'transform translate-x-7' : ''}`}></div>
                </div>
                <div className="text-[15px] font-bold flex items-center gap-2.5 transition-colors">
                  <Crown className={`w-5 h-5 ${isPremium ? "text-brand" : "text-gray-400"}`} />
                  <span className={isPremium ? "text-brand" : "text-gray-500"}>Exclusive Content (Premium)</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Dropzone Image Upload */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-5">
          <label className="text-[13px] font-bold font-sans text-gray-500 uppercase tracking-[0.2em] block">Cover Image</label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex justify-center items-center w-full aspect-[21/9] rounded-xl border-2 border-dashed transition-all overflow-hidden ${isDragging ? "border-brand bg-brand/5" : "border-gray-200 hover:border-brand/50 bg-[#FAFAFA]"
              }`}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <UploadCloud className={`w-10 h-10 mb-5 ${isDragging ? "text-brand" : "text-gray-400"}`} />
                <p className="text-base font-bold text-gray-600 mb-1.5">Drag and drop your image here</p>
                <p className="text-[13px] text-gray-400 font-medium">or click to browse from your computer</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Dynamic Ingredients List */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <label className="text-[13px] font-bold font-sans text-gray-500 uppercase tracking-[0.2em] block">Ingredients</label>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-5 items-center group">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                  {index + 1}
                </div>
                <div className="grid grid-cols-3 gap-5 w-full">
                  <Input
                    placeholder="Nguyên liệu (vd: Espresso)"
                    className="col-span-2 py-3 text-base"
                    {...register(`ingredients.${index}.name` as const, { required: true })}
                  />
                  <Input
                    placeholder="Định lượng (vd: 30ml)"
                    className="col-span-1 py-3 text-base"
                    {...register(`ingredients.${index}.amount` as const, { required: true })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="cursor-pointer text-gray-300 hover:text-brand p-2.5 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => append({ name: "", amount: "" })}
            className="flex gap-2.5 items-center cursor-pointer text-base font-bold text-brand hover:text-brand-hover p-2 transition-colors focus:outline-none"
          >
            <Plus className="w-5 h-5" /> Add Ingredient
          </button>
        </div>

        {/* Dynamic Auto-Resizing Instructions */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-5">
          <label className="text-[13px] font-bold font-sans text-gray-500 uppercase tracking-[0.2em] block">Instructions</label>
          <textarea
            {...register("instructions", { required: true })}
            ref={(e) => {
              register("instructions").ref(e);
              textareaRef.current = e;
            }}
            onChange={(e) => {
              register("instructions").onChange(e);
              handleInputResize(e);
            }}
            placeholder="Step 1: Brew the coffee...&#10;Step 2: Add milk..."
            className="w-full bg-transparent border-b border-gray-200 py-4 text-lg text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-brand transition-colors resize-none overflow-hidden min-h-[120px] font-medium"
          />
          {errors.instructions && <span className="text-brand text-[13px] font-bold mt-2 block">Instructions are required</span>}
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#CC5500] cursor-pointer text-white px-12 py-4 rounded-md text-lg font-bold hover:bg-[#B34A00] transition-all shadow-md focus:outline-none disabled:opacity-50"
          >
            {isSubmitting ? "Publishing..." : isEditing ? "Update Masterpiece" : "Publish Masterpiece"}
          </button>
        </div>
      </form>
    </div>
  );
}
