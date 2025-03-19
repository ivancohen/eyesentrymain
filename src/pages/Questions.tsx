
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Database, Shield } from "lucide-react";
import { Question, QuestionService } from "@/services/QuestionService";
import PageHeader from "@/components/PageHeader";
import QuestionFormManager from "@/components/questions/QuestionFormManager";
import QuestionTable from "@/components/questions/QuestionTable";
import LoadingSpinner from "@/components/LoadingSpinner";

const Questions = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check authentication status on mount and when it changes
  useEffect(() => {
    console.log("Questions page: Authentication check", { 
      userExists: !!user, 
      isAdmin, 
      authLoading 
    });

    if (authLoading) {
      // Still loading authentication, wait
      return;
    }

    if (!user) {
      // Not logged in, redirect to login
      console.log("Questions page: Not logged in, redirecting to login");
      toast.error("Please log in to access this page");
      navigate("/login");
      return;
    }

    if (!isAdmin) {
      // Not admin, redirect to dashboard
      console.log("Questions page: User not admin, redirecting to dashboard");
      toast.error("You don't have permission to access the Questions page");
      navigate("/dashboard");
      return;
    }

    // User is admin and authenticated, allowed access
    console.log("Questions page: User is admin, allowing access");
  }, [user, isAdmin, authLoading, navigate]);

  // If still checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-3 text-lg">Checking authentication status...</span>
        </div>
      </div>
    );
  }

  // If authentication check is complete but no user, or user is not admin,
  // return null as the useEffect will handle the redirect
  if (!user || !isAdmin) {
    return null;
  }

  const handleAddItem = () => {
    setCurrentItem(null);
    setIsFormVisible(true);
  };

  const handleEditItem = (id: string) => {
    setIsLoading(true);
    QuestionService.fetchQuestions()
      .then(questions => {
        const question = questions.find(q => q.id === id);
        if (question) {
          setCurrentItem(question);
          setIsFormVisible(true);
        }
      })
      .catch(error => {
        console.error("Error fetching question for edit:", error);
        toast.error("Failed to load question details");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsFormVisible(false);
    setCurrentItem(null);
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setCurrentItem(null);
  };

  const handleTableRefresh = () => {
    // This is called after the table refreshes its data
    console.log("Table data refreshed");
  };

  // If we reach this point, the user is admin and the page should be shown
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-4 mb-8 animate-fade-in">
        <PageHeader
          title="Questions"
          icon={<Database size={20} />}
          description="Manage questions and their responses."
          iconDescription={<Shield size={16} className="text-primary" />}
        />

        {isLoading ? (
          <div className="flex justify-center mt-8">
            <LoadingSpinner />
          </div>
        ) : isFormVisible ? (
          <QuestionFormManager
            currentItem={currentItem}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            userId={user?.id || ""}
          />
        ) : (
          <QuestionTable
            onAdd={handleAddItem}
            onEdit={handleEditItem}
            onRefresh={handleTableRefresh}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>
    </div>
  );
};

export default Questions;
