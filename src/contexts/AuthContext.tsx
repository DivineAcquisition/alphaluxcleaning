
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Admin email list - centralized configuration
const ADMIN_EMAILS = [
  'admin1@bayareacleaningpros.com',
  'ellie@bayareacleaningpros.com',
  'divineacquisition.io@gmail.com'
];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Determine if user is admin based on email
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;

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
          // Determine role based on email
          const email = session.user.email;
          if (email && ADMIN_EMAILS.includes(email)) {
            setUserRole('super_admin');
            // Ensure admin role is set in database
            try {
              await supabase
                .from('user_roles')
                .upsert({ 
                  user_id: session.user.id, 
                  role: 'super_admin' 
                }, { 
                  onConflict: 'user_id,role' 
                });
            } catch (error) {
              console.log('Role assignment will be handled by database functions');
            }
          } else {
            setUserRole('customer');
          }
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const email = session.user.email;
        if (email && ADMIN_EMAILS.includes(email)) {
          setUserRole('super_admin');
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
    loading,
    signIn,
    signOut,
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
