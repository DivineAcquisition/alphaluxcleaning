import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  getUserRole: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getUserRole = async (): Promise<string | null> => {
    if (!user) {
      console.log('AuthContext: No user, returning null role');
      return null;
    }
    
    console.log('AuthContext: Getting role for user:', user.id, user.email);
    
    // Handle universal admin users
    if (user.id === 'admin-user') {
      console.log('AuthContext: Universal admin user detected');
      if (user.email?.includes('admin')) {
        return 'admin';
      } else if (user.email?.includes('manager')) {
        return 'office_manager';
      }
      return 'admin'; // Default to admin
    }
    
    try {
      const { data, error } = await supabase
        .rpc('get_user_role', { _user_id: user.id });
      
      console.log('AuthContext: get_user_role response:', { data, error });
      
      if (error) {
        console.error('Error getting user role:', error);
        return null;
      }
      
      console.log('AuthContext: User role retrieved:', data);
      return data;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check for universal admin session in localStorage
    const checkUniversalAdmin = () => {
      const adminSession = localStorage.getItem('universal-admin-session');
      if (adminSession) {
        try {
          const { user: mockUser, session: mockSession } = JSON.parse(adminSession);
          console.log('AuthContext: Found universal admin session:', mockUser.email);
          setUser(mockUser);
          setSession(mockSession);
          setLoading(false);
          return true;
        } catch (error) {
          console.error('Error parsing universal admin session:', error);
          localStorage.removeItem('universal-admin-session');
        }
      }
      return false;
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, session?.user?.email);
        
        // Don't override universal admin session with null session
        if (!session && localStorage.getItem('universal-admin-session')) {
          console.log('AuthContext: Preserving universal admin session');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // First check for universal admin, then fallback to Supabase session
    if (!checkUniversalAdmin()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('AuthContext: Initial session check:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  // Get user role when user changes
  useEffect(() => {
    if (user) {
      console.log('AuthContext: User changed, getting role for:', user.email);
      getUserRole().then((role) => {
        console.log('AuthContext: Role set to:', role);
        setUserRole(role);
      });
    } else {
      console.log('AuthContext: No user, setting role to null');
      setUserRole(null);
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
        }
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    // Clear universal admin session
    localStorage.removeItem('universal-admin-session');
    await supabase.auth.signOut();
    setUserRole(null);
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    getUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}