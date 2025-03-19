
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield } from "lucide-react";
import { useLocation } from "react-router-dom";

const Navbar = () => {
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

  return (
    <nav className="glass-panel px-6 py-4 w-full flex items-center justify-between mb-8">
      <div className="flex items-center">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/a9fbc3f2-7b88-4043-889e-a3abacb6805c.png" 
            alt="Eye Sentry Logo" 
            className="h-10"
          />
          <span className="sr-only">Eye Sentry</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-2 mr-4">
              <User size={18} />
              <span className="text-sm font-medium">{user.name || 'User'}</span>
              {isAdmin && (
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full ml-2">
                  Admin
                </span>
              )}
            </div>

            <div className="flex gap-4">
              {/* Navigation buttons depend on user role */}
              {location.pathname !== (isAdmin ? '/new-admin' : '/dashboard') && (
                <Link to={isAdmin ? "/new-admin" : "/dashboard"}>
                  <Button variant="outline" size="sm" className="hover-lift">
                    {isAdmin ? (
                      <>
                        <Shield size={16} className="mr-1" />
                        Admin Dashboard
                      </>
                    ) : (
                      "Dashboard"
                    )}
                  </Button>
                </Link>
              )}

              <Link to="/profile">
                <Button variant="outline" size="sm" className="hover-lift">
                  <User size={16} className="mr-1" />
                  Profile
                </Button>
              </Link>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="hover-lift flex items-center gap-1"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="outline" size="sm" className="hover-lift">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="hover-lift">
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
