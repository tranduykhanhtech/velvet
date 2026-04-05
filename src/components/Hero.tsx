import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gallery?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    navigate(`/gallery?q=${encodeURIComponent(tag)}`);
  };

  return (
    <section className="relative py-12 px-4 mx-auto max-w-5xl flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl space-y-3"
      >
        <h1 className="text-4xl md:text-[62px] font-serif text-text-main leading-[1.1] tracking-tight">
          Discover the Art of Elevating Your Drink
        </h1>
      </motion.div>

      <form 
        onSubmit={handleSearch}
        className="w-full max-w-2xl mt-10 relative group"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
            <Search className="h-6 w-6 text-gray-400 group-focus-within:text-brand transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes..."
            className="w-full pl-14 pr-32 h-[66px] bg-gray-50 border border-transparent rounded-full text-base shadow-md focus:outline-none focus:ring-2 focus:ring-brand/10 focus:bg-white focus:border-brand/20 transition-all font-sans text-text-main placeholder:text-gray-400"
          />
          <div className="absolute inset-y-2 right-2 flex items-center">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-brand hover:bg-brand-hover text-white px-8 h-full rounded-full text-base font-bold transition-all shadow-sm cursor-pointer"
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
        className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-6 text-[13px] text-text-muted font-medium"
      >
        <span className="text-gray-400 uppercase tracking-widest text-[11px] pt-0.5">Popular:</span>
        <button 
          onClick={() => handleTagClick("Old Fashioned")} 
          className="hover:text-brand transition-all cursor-pointer border-b border-transparent hover:border-brand/30"
        >
          Old Fashioned
        </button>
        <button 
          onClick={() => handleTagClick("Espresso Martini")} 
          className="hover:text-brand transition-all cursor-pointer border-b border-transparent hover:border-brand/30"
        >
          Espresso Martini
        </button>
        <button 
          onClick={() => handleTagClick("Negroni")} 
          className="hover:text-brand transition-all cursor-pointer border-b border-transparent hover:border-brand/30"
        >
          Negroni
        </button>
      </motion.div>
    </section>
  );
}
