import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Check, Star, Zap } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$1.99",
    period: "/mo",
    description: "Perfect for trying Premium",
    badge: null,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$14.99",
    period: "/yr",
    description: "Save 37% — less than $1.25/mo",
    badge: "Best Value",
  },
];

const FREE_FEATURES = [
  "Browse public recipe collection",
  "Save up to 5 favorites",
  "Share recipes with friends",
  "Basic search & filters",
];

const PREMIUM_FEATURES = [
  "Everything in Free, plus:",
  "Unlock all Exclusive recipes",
  "Full ingredients & step-by-step guides",
  "Unlimited favorites",
  "Premium badge on your profile",
  "Early access to new recipes",
  "Ad-free browsing experience",
];

export function Premium() {
  const { isAuthenticated, isPremiumUser, premiumPlan, user } = useAdmin();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      toast("Please sign in before upgrading", { icon: "🔒" });
      navigate("/auth", { state: { from: { pathname: "/premium" } } });
      return;
    }

    if (isPremiumUser) {
      toast.success("You are already a Premium member!", { icon: "✦" });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("premium_subscriptions")
        .insert({
          user_id: user.id,
          plan: selectedPlan,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: selectedPlan === "yearly"
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      toast.success("Welcome to Velvet Premium! ✦", {
        duration: 4000,
      });

      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      if (err.message?.includes("duplicate") || err.code === "23505") {
        toast.error("You already have a Premium subscription.");
      } else {
        toast.error(err.message || "Unable to upgrade. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col py-16 md:py-20 px-4">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 text-brand text-[11px] font-bold tracking-[0.3em] uppercase mb-6">
            <Crown className="w-3.5 h-3.5" />
            Velvet Premium
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-text-main leading-tight tracking-tight mb-4">
            Unlock the Full Craft
          </h1>
          <p className="text-base text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
            Access every exclusive recipe, detailed ingredients and professional brewing guides.
          </p>
        </motion.div>

        {/* Already Premium */}
        {isPremiumUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12 border border-gray-100 rounded-2xl p-10 text-center"
          >
            <Crown className="w-8 h-8 text-brand mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-text-main mb-2">You are a Premium Member</h2>
            <p className="text-gray-400 text-sm font-medium">
              Current plan: <span className="text-brand font-bold uppercase">{premiumPlan}</span>
            </p>
          </motion.div>
        )}

        {/* Pricing Cards */}
        {!isPremiumUser && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            {/* Free */}
            <div className="border border-gray-100 rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-serif text-text-main mb-1">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-serif text-text-main">$0</span>
                  <span className="text-sm text-gray-400">/forever</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Browse the basic collection</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm text-gray-500">
                    <Check className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="bg-gray-50 text-gray-400 py-3 rounded-xl text-center text-sm font-medium">
                Current plan
              </div>
            </div>

            {/* Premium Plans */}
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative border-2 rounded-2xl p-8 flex flex-col cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? "border-brand"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-serif text-text-main mb-1 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-brand" />
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-serif text-text-main">{plan.price}</span>
                    <span className="text-sm text-gray-400">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {PREMIUM_FEATURES.map((f, i) => (
                    <li key={i} className="flex gap-3 items-start text-sm text-gray-500">
                      <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className={`flex items-center justify-center rounded-xl py-3 text-sm font-bold transition-all ${
                  selectedPlan === plan.id
                    ? "bg-brand text-white"
                    : "bg-gray-50 text-gray-400"
                }`}>
                  {selectedPlan === plan.id ? (
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Selected
                    </span>
                  ) : (
                    "Select"
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* CTA */}
        {!isPremiumUser && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="bg-brand text-white px-14 py-4 rounded-xl text-base font-bold hover:bg-brand-hover transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : `Upgrade to Premium — ${PLANS.find(p => p.id === selectedPlan)?.price}${PLANS.find(p => p.id === selectedPlan)?.period}`}
            </button>
            <p className="text-sm text-gray-400 mt-4">
              Cancel anytime. No commitment.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
