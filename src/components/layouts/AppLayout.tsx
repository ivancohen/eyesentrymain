import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navbar from '@/components/Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  navigation: {
    label: string;
    items: {
      icon: React.ReactNode;
      label: string;
      route: string;
      isActive?: boolean;
    }[];
  }[];
  showProfile?: boolean;
  showSettings?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
  navigation,
  showProfile = true,
  showSettings = false,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <LoadingSpinner />
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Navbar navigationItems={navigation} showProfile={showProfile} showSettings={showSettings} />
      <main className="flex-1 container px-6 py-6 mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 animate-slide-up text-blue-800">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground animate-slide-up animation-delay-100">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
};