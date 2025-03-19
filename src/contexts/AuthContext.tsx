import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
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
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get the current URL origin for redirects
  const currentOrigin = window.location.origin;

  // Function to check if a user is a doctor pending approval
  const checkDoctorApprovalStatus = async (userId: string): Promise<{ isPending: boolean, isDoctor: boolean }> => {
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

  const updateUserProfile = async (sessionUser: SupabaseUser) => {
    try {
      console.log("Fetching profile for user:", sessionUser.id);
      
      // Initialize admin status determination flags for better tracking
      const userMetadata = sessionUser.app_metadata || {};
      const userEmail = sessionUser.email || '';
      
      // Method 1: Check if role is admin in app_metadata
      const isAdminByRole = userMetadata.role === 'admin';
      console.log("Admin by role:", isAdminByRole);
      
      // Method 2: Check against hardcoded admin emails
      // Add all admin emails here
      const adminEmails = [
        'ivan.s.cohen@gmail.com',
        // Add other admin emails here as needed
      ];
      const isAdminByEmail = adminEmails.includes(userEmail);
      console.log("Admin by email match:", isAdminByEmail);
      
      // Set initial admin status based on the first two checks
      let isUserAdmin = isAdminByRole || isAdminByEmail;
      
      // Method 3: Check against profiles table is_admin flag
      try {
        // First try to fetch from profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (!error && profile) {
          console.log("Profile found:", profile);
          
          // Method 3: Check is_admin flag in profile
          const isAdminInProfile = profile.is_admin === true;
          console.log("Admin by profile flag:", isAdminInProfile);
          
          // Update admin status if profile says they're an admin
          isUserAdmin = isUserAdmin || isAdminInProfile;
          console.log("Final admin status:", isUserAdmin);
          
          // Check if user is a doctor and get approval status
          const { isPending, isDoctor } = await checkDoctorApprovalStatus(sessionUser.id);
          
          // Create and return user profile with admin status
          return {
            id: sessionUser.id,
            email: userEmail,
            name: profile.name || sessionUser.user_metadata?.name || '',
            isAdmin: isUserAdmin,
            isDoctor: isDoctor,
            isPendingApproval: isPending,
            avatarUrl: profile.avatar_url,
            doctorName: sessionUser.user_metadata?.doctorName || null,
            phoneNumber: sessionUser.user_metadata?.phoneNumber || null,
            streetAddress: sessionUser.user_metadata?.streetAddress || null,
            city: sessionUser.user_metadata?.city || null,
            state: sessionUser.user_metadata?.state || null,
            zipCode: sessionUser.user_metadata?.zipCode || null,
            address: sessionUser.user_metadata?.address || null,
            specialty: sessionUser.user_metadata?.specialty || null,
          };
        }
      } catch (profileError) {
        console.error("Error fetching profile (continuing):", profileError);
      }

      // If we couldn't get a profile, check doctor status separately
      const { isPending, isDoctor } = await checkDoctorApprovalStatus(sessionUser.id);
            
      // If we couldn't get a profile, at least we have the admin status
      // from the first two checks (role and email)
      console.log("Using default user info with admin status:", isUserAdmin);
      return {
        id: sessionUser.id,
        email: userEmail,
        name: sessionUser.user_metadata?.name || userEmail.split('@')[0] || '',
        isAdmin: isUserAdmin,
        isDoctor: isDoctor,
        isPendingApproval: isPending,
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
      };
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initial auth check");
        setLoading(true);
        
        // Check for confirmation hash in the URL (for email confirmations)
        if (location.hash.includes('type=signup')) {
          console.log("Detected confirmation hash in URL");
          // Let Supabase Auth handle the token in the URL
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            toast.error("Failed to confirm email. Please try again.");
            console.error("Email confirmation error:", error);
          } else if (data.session) {
            toast.success("Email confirmed successfully! You are now logged in.");
          }
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("Initial session found, user data:", {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role
          });
          
          const userProfile = await updateUserProfile(session.user);
          console.log("Initial user profile:", userProfile);
          setUser(userProfile);
          setSession(session);
        } else {
          console.log("No initial session found");
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          console.log("Auth state changed, event:", _event, "session:", newSession ? "exists" : "null");
          
          try {
            setLoading(true);
            setSession(newSession);
            
            if (newSession?.user) {
              console.log("Session user data:", {
                id: newSession.user.id,
                email: newSession.user.email,
                role: newSession.user.role,
                metadata: newSession.user.user_metadata
              });
              
              const userProfile = await updateUserProfile(newSession.user);
              console.log("Setting user profile:", userProfile);
              setUser(userProfile);
            } else {
              console.log("No session, clearing user");
              setUser(null);
            }
          } catch (error) {
            console.error("Error in auth state change handler:", error);
            setUser(null);
          } finally {
            setLoading(false);
          }
        }
      );

      return subscription;
    };

    initializeAuth().then(() => {
      const subscription = setupAuthListener();
      
      return () => {
        subscription?.unsubscribe();
      };
    });
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
    } catch (error: any) {
      console.error("Unexpected registration error:", error);
      
      if (error.error_code) {
        return { 
          error: error as AuthError
        };
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
    } catch (error: any) {
      console.error("Login error in context:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      // For Google OAuth, we don't know if the user is admin before login
      // So we'll redirect to a helper page that checks and redirects
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // We use the same redirect for all users since we don't know if they're admin yet
          // The actual redirection to admin/dashboard will happen after auth state change
          redirectTo: `${currentOrigin}/dashboard`,
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Google login failed');
      throw error;
    }
  };

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
    } catch (error: any) {
      toast.error(error.message || 'Logout failed');
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
        loginWithGoogle,
        logout, 
        isAdmin: user?.isAdmin || false 
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
