import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      const authState = !!session;
      setIsAuthenticated(authState);
      setIsAdmin(authState && session?.user?.email === ADMIN_EMAIL);
      setUser(session?.user || null);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const authState = !!session;
      setIsAuthenticated(authState);
      setIsAdmin(authState && session?.user?.email === ADMIN_EMAIL);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAuthenticated, isAdmin, user, loading };
}
