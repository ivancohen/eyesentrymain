import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield, Settings, ChevronDown, Home, Bell } from "lucide-react";
import AdminNotifications from "@/components/admin/AdminNotifications";
import { useLocation } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  navigationItems?: {
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

const Navbar = ({ navigationItems = [], showProfile = true, showSettings = false }: NavbarProps) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Flatten all navigation items for the top navbar
  const allNavItems = navigationItems.flatMap(group => group.items);

  return (
    <nav className="bg-white px-6 py-4 w-full flex items-center justify-between shadow-md">
      <div className="flex items-center">
        <Link to="/" className="flex items-center gap-0">
          <img
            src={logoImage}
            alt="Eye Sentry Logo"
            className="h-16"
          />
          <span className="sr-only">Eye Sentry</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-2 mr-4">
              <User size={18} className="text-blue-700" />
              <span className="text-sm font-medium text-blue-700">{user.name || 'User'}</span>
              {isAdmin && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full ml-2">
                  Admin
                </span>
              )}
            </div>

            {/* Mobile navigation dropdown - only show if explicitly needed */}
            {navigationItems && navigationItems.length > 0 && allNavItems.length > 0 && (
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-50">
                      Menu <ChevronDown size={16} className="ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {navigationItems.map((group, groupIndex) => (
                      <React.Fragment key={groupIndex}>
                        <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                        <DropdownMenuGroup>
                          {group.items.map((item, itemIndex) => (
                            <DropdownMenuItem
                              key={itemIndex}
                              onClick={() => navigate(item.route)}
                              className={item.isActive ? 'bg-blue-50' : ''}
                            >
                              {item.icon}
                              <span className="ml-2">{item.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                        {groupIndex < navigationItems.length - 1 && <DropdownMenuSeparator />}
                      </React.Fragment>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <div className="flex gap-4 items-center">
              {/* Notification bell for admin users */}
              {isAdmin && (
                <div className="mr-2">
                  <AdminNotifications />
                </div>
              )}
              
              {/* Dashboard button - always show when not on dashboard */}
              {location.pathname !== (isAdmin ? '/new-admin' : '/dashboard') && (
                <Link to={isAdmin ? "/new-admin" : "/dashboard"}>
                  <Button variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-50">
                    {isAdmin ? (
                      <>
                        <Shield size={16} className="mr-1" />
                        Admin Dashboard
                      </>
                    ) : (
                      <>
                        <Home size={16} className="mr-1" />
                        Dashboard
                      </>
                    )}
                  </Button>
                </Link>
              )}

              {showProfile && (
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-50">
                    <User size={16} className="mr-1" />
                    Profile
                  </Button>
                </Link>
              )}

              {showSettings && (
                <Link to="/settings">
                  <Button variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-50">
                    <Settings size={16} className="mr-1" />
                    Settings
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-blue-500 hover:bg-blue-50 flex items-center gap-1"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-50">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
