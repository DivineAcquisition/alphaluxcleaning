import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AdminAuthContextType {
  user: User | null;
  adminRole: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setUser(null);
        setAdminRole(null);
        return;
      }

      setUser(session.user);

      // Check admin status via the guard function
      const { data, error } = await supabase.functions.invoke('admin-auth-guard');
      
      if (error || !data) {
        console.error('Admin check failed:', error);
        setAdminRole(null);
        return;
      }

      setAdminRole(data.role);
    } catch (error) {
      console.error('Admin status check failed:', error);
      setUser(null);
      setAdminRole(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdminRole(null);
  };

  useEffect(() => {
    // Check initial auth state
    checkAdminStatus().finally(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setAdminRole(null);
        } else if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          await checkAdminStatus();
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AdminAuthContext.Provider value={{
      user,
      adminRole,
      loading,
      signOut,
      checkAdminStatus
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}