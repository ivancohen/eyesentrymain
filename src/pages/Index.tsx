
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const Index = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-3">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/a9fbc3f2-7b88-4043-889e-a3abacb6805c.png" 
              alt="Eye Sentry Logo" 
              className="h-24 md:h-32"
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Eye Sentry
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Assessing Glaucoma Risk - A powerful platform for eye health management
          </p>

          <div className="flex flex-wrap gap-4 justify-center mt-6">
            {user ? (
              <Button asChild size="lg" className="animate-fade-in">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="animate-fade-in">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="animate-fade-in animation-delay-200">
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-24">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Eye Sentry. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
