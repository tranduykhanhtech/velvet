import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export interface Recipe {
  id: string;
  title: string;
  category: string;
  description?: string;
  image_url: string;
  author_id?: string;
  ingredients?: string[];
  instructions?: string;
  is_premium?: boolean;
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group relative flex flex-col gap-3"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-100">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-[#F3EFEA]">
            No Image
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-brand font-medium tracking-wider uppercase">
          {recipe.category}
        </p>
        <h3 className="font-serif text-xl mt-1 text-text-main group-hover:text-brand transition-colors">
          {recipe.title}
        </h3>
      </div>
      <Link
        to={`/recipe/${recipe.id}`}
        className="absolute inset-0 z-10 focus:outline-none"
      >
        <span className="sr-only">View {recipe.title}</span>
      </Link>
    </motion.div>
  );
}
