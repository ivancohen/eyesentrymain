import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  isDoctor?: boolean;
  isPendingApproval?: boolean;
  avatarUrl?: string | null;
  doctorName?: string | null;
  phoneNumber?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  address?: string | null;
  specialty?: string | null;
}

interface RegisterResult {
  error?: AuthError;
  data?: {
    user: SupabaseUser | null;
    session: Session | null;
  };
}

interface DoctorApprovalStatus {
  isPending: boolean;
  isDoctor: boolean;
}

interface AuthErrorResponse {
  error_code?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  register: (email: string, password: string, userData: {
    name: string;
    doctorName?: string;
    phoneNumber?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    address?: string;
    specialty?: string;
    requestRole?: string;
  }) => Promise<RegisterResult | undefined>;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  error?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TIMEOUT = 10000; // 10 seconds
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Add a global flag to track initialization
let isGlobalAuthInitialized = false;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const sessionRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const adminCheckRef = useRef<boolean | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get the current URL origin for redirects
  const currentOrigin = window.location.origin;

  // Function to clear timeouts and subscriptions
  const cleanup = () => {
    if (sessionRefreshRef.current) {
      clearInterval(sessionRefreshRef.current);
      sessionRefreshRef.current = null;
    }
  };

  // Function to refresh session
  const refreshSession = async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (newSession) {
        setSession(newSession);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  const updateUserProfile = async (sessionUser: SupabaseUser): Promise<User> => {
    try {
      const userMetadata = sessionUser.app_metadata || {};
      const userEmail = sessionUser.email || '';
      
      // Method 1: Check if role is admin in app_metadata
      const isAdminByRole = userMetadata.role === 'admin';
      
      // Method 2: Check against hardcoded admin emails
      const adminEmails = [
        'ivan.s.cohen@gmail.com',
        // Add other admin emails here as needed
      ];
      const isAdminByEmail = adminEmails.includes(userEmail);
      
      // Method 3: Check against profiles table is_admin flag
      let isAdminInProfile = false;
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (!error && profile) {
          isAdminInProfile = profile.is_admin === true;
        }
      } catch (profileError) {
        console.error("Error fetching profile:", profileError);
      }

      // Combine all admin checks
      const isAdmin = isAdminByRole || isAdminByEmail || isAdminInProfile;

      // Check if user is a doctor and get approval status
      const { isPending, isDoctor } = await checkDoctorApprovalStatus(sessionUser.id);
      
      // Create and return user profile
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || '',
        isAdmin: isAdmin,
        isDoctor: isDoctor,
        isPendingApproval: isPending,
        avatarUrl: sessionUser.user_metadata?.avatarUrl || null,
        doctorName: sessionUser.user_metadata?.doctorName || null,
        phoneNumber: sessionUser.user_metadata?.phoneNumber || null,
        streetAddress: sessionUser.user_metadata?.streetAddress || null,
        city: sessionUser.user_metadata?.city || null,
        state: sessionUser.user_metadata?.state || null,
        zipCode: sessionUser.user_metadata?.zipCode || null,
        address: sessionUser.user_metadata?.address || null,
        specialty: sessionUser.user_metadata?.specialty || null,
      };
    } catch (error) {
      console.error("Error in updateUserProfile:", error);
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || '',
        isAdmin: false,
        isDoctor: false,
        isPendingApproval: false,
        avatarUrl: null
      };
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (mounted) {
          setLoading(true);
          setAuthError(null);
        }
        
        // Check for confirmation hash in the URL (for email confirmations)
        if (location.hash.includes('type=signup')) {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            toast.error("Failed to confirm email. Please try again.");
          } else if (data.session) {
            toast.success("Email confirmed successfully! You are now logged in.");
          }
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          const userProfile = await updateUserProfile(session.user);
          setUser(userProfile);
          setSession(session);

          // Set up session refresh
          sessionRefreshRef.current = setInterval(refreshSession, SESSION_REFRESH_INTERVAL);
        } else if (mounted) {
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setAuthError("Failed to initialize authentication");
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
    
    return () => {
      mounted = false;
      cleanup();
    };
  }, [location.hash]);

  const register = async (
    email: string, 
    password: string, 
    userData: {
      name: string;
      doctorName?: string;
      phoneNumber?: string;
      streetAddress?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      address?: string;
      specialty?: string;
      requestRole?: string;
    }
  ): Promise<RegisterResult | undefined> => {
    setLoading(true);
    try {
      console.log("Registering user with email:", email);
      
      // Determine if this is a doctor registration
      const isDocRegistration = !!userData.doctorName || userData.requestRole === 'doctor';
      
      // If this is a doctor registration, make sure requestRole is set
      if (isDocRegistration && !userData.requestRole) {
        userData.requestRole = 'doctor';
      }
      
      // Generate formatted address if we have the components
      let formattedAddress = userData.address || '';
      if (userData.streetAddress && userData.city && userData.state) {
        formattedAddress = `${userData.streetAddress}, ${userData.city}, ${userData.state}`;
        if (userData.zipCode) {
          formattedAddress += ` ${userData.zipCode}`;
        }
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            doctorName: userData.doctorName,
            phoneNumber: userData.phoneNumber,
            streetAddress: userData.streetAddress,
            city: userData.city,
            state: userData.state,
            zipCode: userData.zipCode,
            address: formattedAddress || userData.address,
            specialty: userData.specialty,
            requestRole: userData.requestRole || 'patient',
          },
          emailRedirectTo: `${currentOrigin}/login`,
        },
      });

      if (error) {
        console.error("Registration error:", error);
        return { error };
      }
      
      console.log("Registration successful, confirmation email sent");
      
      // If this is a doctor registration, create a doctor_approvals record and notify admins
      if (isDocRegistration && data?.user) {
        try {
          // Notify admins about the new doctor registration
          await notifyAdminsAboutNewDoctor(
            data.user.id,
            userData.doctorName || userData.name,
            email
          );
          
          // For doctors, we need to sign them out immediately after registration
          // to prevent auto-login, since they need approval first
          console.log("Doctor registration detected, signing out to prevent auto-login");
          await supabase.auth.signOut();
          
          // Clear local user and session state
          setUser(null);
          setSession(null);
        } catch (notifyError) {
          console.error("Error notifying admins or signing out:", notifyError);
          
          // Still try to sign out even if notification failed
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
        }
      }
      
      return { data };
    } catch (error: unknown) {
      console.error("Unexpected registration error:", error);
      
      if (error && typeof error === 'object' && 'error_code' in error) {
        const authError = new Error((error as AuthErrorResponse).message || 'Registration failed') as AuthError;
        authError.code = (error as AuthErrorResponse).error_code || 'unknown';
        return { error: authError };
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("Login attempt for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log("Login successful, data:", {
        session: data.session ? {
          user: {
            id: data.session.user.id,
            email: data.session.user.email,
            role: data.session.user.role
          }
        } : null,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          metadata: data.user.user_metadata
        } : null
      });
      
      if (data.user) {
        console.log("Login successful, fetching user profile");
        const userProfile = await updateUserProfile(data.user);
        console.log("User profile after login:", userProfile);
        setUser(userProfile);
        setSession(data.session);
        return userProfile;
      }
      return null;
    } catch (error: unknown) {
      console.error("Login error in context:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google login removed

  // Helper to redirect based on role and approval status
  const redirectBasedOnRole = () => {
    // If user is admin, redirect to admin page
    if (user?.isAdmin) {
      navigate('/new-admin');
      return;
    }
    
    // If user is a doctor pending approval, redirect to pending approval page
    if (user?.isDoctor && user.isPendingApproval) {
      navigate('/pending-approval');
      return;
    }
    
    // If user is an approved doctor, redirect to doctor dashboard
    if (user?.isDoctor && !user.isPendingApproval) {
      navigate('/doctor');
      return;
    }
    
    // Otherwise, redirect to regular dashboard (patient)
    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error((error as AuthErrorResponse).message || 'Logout failed');
      } else {
        toast.error('Logout failed');
      }
    }
  };

  // Function to check if a user is a doctor pending approval
  const checkDoctorApprovalStatus = async (userId: string): Promise<DoctorApprovalStatus> => {
    try {
      // Check approval status using the doctor approval status function
      const { data, error } = await supabase
        .rpc('check_doctor_approval_status', {
          p_user_id: userId
        }) as unknown as { 
          data: { status: string | null } | null, 
          error: Error | null 
        };

      if (error) {
        console.error("Error checking doctor approval status:", error);
        return { isPending: false, isDoctor: false };
      }

      if (data && data.status) {
        if (data.status === "pending") {
          return { isPending: true, isDoctor: true };
        } else if (data.status === "approved") {
          return { isPending: false, isDoctor: true };
        } else {
          // Status is rejected or other
          return { isPending: false, isDoctor: false };
        }
      }

      // If doctor_approvals record doesn't exist, check metadata for doctor flag
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user data:", userError);
        return { isPending: false, isDoctor: false };
      }

      const isDocRegistration = 
        userData.user?.user_metadata?.doctorName || 
        userData.user?.user_metadata?.requestRole === 'doctor' ||
        userData.user?.app_metadata?.role === 'doctor';

      return { isPending: isDocRegistration, isDoctor: isDocRegistration };
    } catch (error) {
      console.error("Error in checkDoctorApprovalStatus:", error);
      return { isPending: false, isDoctor: false };
    }
  };

  // Function to notify admins about new doctor registration
  const notifyAdminsAboutNewDoctor = async (userId: string, doctorName: string, email: string) => {
    try {
      console.log("Notifying admins about new doctor registration:", {userId, doctorName, email});
      
      // Get admin emails from profiles
      const { data: admins, error: adminsError } = await supabase
        .from('profiles')
        .select('email')
        .eq('is_admin', true);
      
      if (adminsError) {
        console.error("Error fetching admin emails:", adminsError);
        return;
      }
      
      if (!admins || admins.length === 0) {
        console.warn("No admin users found to notify");
        return;
      }
      
      // Call the notify_admins function if available
      const { error: notifyError } = await supabase.rpc('notify_admins_new_doctor', {
        p_doctor_id: userId,
        p_doctor_name: doctorName || email,
        p_doctor_email: email,
        p_admin_emails: admins.map(a => a.email).filter(Boolean)
      });
      
      if (notifyError) {
        console.error("Error notifying admins:", notifyError);
      } else {
        console.log("Admin notification sent successfully");
      }
    } catch (error) {
      console.error("Error in notifyAdminsAboutNewDoctor:", error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session,
        loading, 
        register, 
        login,
        logout,
        isAdmin: user?.isAdmin || false,
        error: authError || undefined
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
