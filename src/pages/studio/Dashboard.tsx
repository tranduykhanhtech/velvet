import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export function StudioDashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (!userId) {
        setLoading(false);
        return;
      }

      // Querying only the status column for efficiency
      const { data, error } = await supabase
        .from("recipes")
        .select("status")
        .eq("author_id", userId);

      if (!error && data) {
        const total = data.length;
        const published = data.filter(r => r.status === 'Published' || !r.status).length;
        const drafts = data.filter(r => r.status === 'Draft').length;

        setStats({ total, published, drafts });
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-4xl md:text-[42px] font-serif text-text-main mb-10 tracking-wide">Dashboard Statistics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-10 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
          <p className="text-sm text-text-muted font-bold font-sans uppercase tracking-[0.2em] mb-5">Total Recipes</p>
          <p className="text-6xl font-serif text-brand">
            {loading ? <span className="animate-pulse">...</span> : stats.total}
          </p>
        </div>
        <div className="bg-white p-10 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
          <p className="text-sm text-text-muted font-bold font-sans uppercase tracking-[0.2em] mb-5 text-green-600/60">Published</p>
          <p className="text-6xl font-serif text-green-600">
            {loading ? <span className="animate-pulse">...</span> : stats.published}
          </p>
        </div>
        <div className="bg-white p-10 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
          <p className="text-sm text-text-muted font-bold font-sans uppercase tracking-[0.2em] mb-5">Drafts</p>
          <p className="text-6xl font-serif text-gray-300">
            {loading ? <span className="animate-pulse">...</span> : stats.drafts}
          </p>
        </div>
      </div>
    </div>
  );
}
