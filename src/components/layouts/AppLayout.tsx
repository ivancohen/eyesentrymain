import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LogOut, Home, User, Settings } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center p-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold select-none">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div className="ml-2 overflow-hidden group-data-[collapsible=icon]:hidden">
                <div className="text-sm font-medium truncate">{user.name || user.email}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {user?.is_admin ? 'Admin' : 'Doctor'}
                </div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {navigation.map((group, index) => (
              <SidebarGroup key={index}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item, itemIndex) => (
                    <SidebarMenuItem key={itemIndex}>
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={item.isActive}
                        onClick={() => navigate(item.route)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarMenu>
                {showProfile && (
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Profile" onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {showSettings && (
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Settings" onClick={() => navigate('/settings')}>
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center justify-between p-4 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              <span>EyeSentry</span>
              <span>v1.0.0</span>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2 animate-slide-up">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground animate-slide-up animation-delay-100">
                  {subtitle}
                </p>
              )}
            </div>
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}; 