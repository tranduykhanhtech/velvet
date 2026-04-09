import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false);
  const [premiumPlan, setPremiumPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkPremium = async (userId: string) => {
      const { data } = await supabase
        .from('premium_subscriptions')
        .select('plan, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      if (mounted && data) {
        setIsPremiumUser(true);
        setPremiumPlan(data.plan);
      }
    };

    const processSession = async (session: any) => {
      if (!mounted) return;
      const authState = !!session;
      const isAdminUser = authState && session?.user?.email === ADMIN_EMAIL;
      
      setIsAuthenticated(authState);
      setIsAdmin(isAdminUser);
      setUser(session?.user || null);

      if (isAdminUser) {
        // Admin tự động có quyền Premium
        setIsPremiumUser(true);
        setPremiumPlan('admin');
      } else if (authState && session?.user?.id) {
        await checkPremium(session.user.id);
      } else {
        setIsPremiumUser(false);
        setPremiumPlan(null);
      }
      
      setLoading(false);
    };

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await processSession(session);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Reset premium state on auth change before re-checking
      if (mounted) {
        setIsPremiumUser(false);
        setPremiumPlan(null);
      }
      processSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAuthenticated, isAdmin, isPremiumUser, premiumPlan, user, loading };
}
