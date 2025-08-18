import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';

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
  const [roleLoading, setRoleLoading] = useState(false);
  const { logSecurityEvent, logFailedLogin } = useSecurityAudit();

  const getUserRole = async (): Promise<string | null> => {
    if (!user) {
      console.log('AuthContext: No user, returning null role');
      return null;
    }
    
    console.log('AuthContext: Getting role for user:', user.id, user.email);
    setRoleLoading(true);
    
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
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Don't set loading to false yet - wait for role to load
        if (!session?.user) {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Don't set loading to false yet - wait for role to load
      if (!session?.user) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get user role when user changes
  useEffect(() => {
    if (user) {
      console.log('AuthContext: User changed, getting role for:', user.email);
      getUserRole().then((role) => {
        console.log('AuthContext: Role set to:', role);
        setUserRole(role);
        // Now we can set loading to false since we have both user and role
        setLoading(false);
      });
    } else {
      console.log('AuthContext: No user, setting role to null');
      setUserRole(null);
      setLoading(false);
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Log failed login attempt
        await logFailedLogin(email, error.message);
        return { error };
      }
      
      // Log successful login
      await logSecurityEvent({
        action_type: 'login_success',
        resource_type: 'auth',
        risk_level: 'low'
      });
      
      return { error: null };
    } catch (error: any) {
      await logFailedLogin(email, error?.message || 'Unknown error');
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || '',
            role: 'customer' // Set default role as customer
          }
        }
      });
      
      if (error) {
        return { error };
      }

      // If user is created immediately (no email confirmation), assign customer role
      if (data.user && data.session) {
        try {
          // Insert customer role into user_roles table
          await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: 'customer'
            });
        } catch (roleError) {
          console.log('Role assignment will be handled by trigger or on first login');
        }
      }
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    // Log logout before signing out
    if (user) {
      await logSecurityEvent({
        action_type: 'logout',
        resource_type: 'auth',
        risk_level: 'low'
      });
    }
    
    await supabase.auth.signOut();
    setUserRole(null);
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    userRole,
    loading: loading || roleLoading,
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