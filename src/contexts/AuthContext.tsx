
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Company configuration
const COMPANY_ID = '550e8400-e29b-41d4-a716-446655440000';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isContractor: boolean;
  isCustomer: boolean;
  loading: boolean;
  companyId: string;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  getUserRole: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Role-based boolean flags
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isContractor = userRole === 'contractor';
  const isCustomer = userRole === 'customer';

  // Set session timeout for 2 hours
  useEffect(() => {
    if (session) {
      const sessionTimeout = setTimeout(() => {
        toast({
          title: "Session Expired",
          description: "Please sign in again for security.",
        });
        signOut();
      }, 2 * 60 * 60 * 1000); // 2 hours

      return () => clearTimeout(sessionTimeout);
    }
  }, [session]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'User:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Get role from database
          setTimeout(async () => {
            try {
              const { data, error } = await supabase.rpc('get_user_role', {
                _user_id: session.user.id,
                _company_id: COMPANY_ID
              });
              
              if (!error && data) {
                setUserRole(data);
              } else {
                // Default to customer if no role found
                setUserRole('customer');
                // Create customer role
                await supabase
                  .from('user_roles')
                  .upsert({ 
                    user_id: session.user.id, 
                    role: 'customer',
                    company_id: COMPANY_ID
                  }, { 
                    onConflict: 'user_id,role,company_id' 
                  });
              }
            } catch (error) {
              console.log('Error getting user role:', error);
              setUserRole('customer');
            }
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Get role from database immediately
        const { data, error } = await supabase.rpc('get_user_role', {
          _user_id: session.user.id,
          _company_id: COMPANY_ID
        });
        
        if (!error && data) {
          setUserRole(data);
        } else {
          setUserRole('customer');
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Welcome Back!",
        description: "Successfully signed in.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Welcome!",
        description: "Please check your email to confirm your account.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign Up Error", 
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const getUserRole = async (): Promise<string | null> => {
    if (!user) return null;
    return userRole;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setUser(null);
    setSession(null);
    
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });
  };

  const value = {
    user,
    session,
    userRole,
    isAdmin,
    isManager,
    isContractor,
    isCustomer,
    loading,
    companyId: COMPANY_ID,
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
