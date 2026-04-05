import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function Auth() {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignIn) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate("/");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center py-20 px-4">
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-serif text-text-main leading-tight">Welcome to Velvet</h1>
          <p className="text-text-muted text-base font-medium tracking-wide">
            {isSignIn ? "Enter your credentials to access your account." : "Create a new account to join us."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-500 text-[13px] font-bold rounded-md text-center border border-red-100/50">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-1 py-3 bg-transparent border-b-2 border-gray-100 text-base focus:outline-none focus:border-brand transition-all font-sans text-text-main placeholder:text-gray-300"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-1 py-3 bg-transparent border-b-2 border-gray-100 text-base focus:outline-none focus:border-brand transition-all font-sans text-text-main placeholder:text-gray-300"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white py-4 rounded-md font-bold hover:bg-brand-hover transition-all shadow-sm mt-8 text-base tracking-wide focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Processing..." : (isSignIn ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsSignIn(!isSignIn);
              setError(null);
            }}
            className="text-[15px] text-gray-400 hover:text-brand transition-colors focus:outline-none tracking-wide cursor-pointer font-medium"
          >
            {isSignIn ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
