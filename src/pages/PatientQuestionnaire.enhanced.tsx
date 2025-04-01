import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import QuestionnaireContainer from "@/components/questionnaires/QuestionnaireContainer.enhanced";

const PatientQuestionnaire = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // If still checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col questionnaire-bg">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-3 text-lg questionnaire-text">Checking authentication status...</span>
        </div>
      </div>
    );
  }

  // If no user is logged in, redirect to login
  if (!user) {
    navigate("/login");
    return null;
  }

  return <QuestionnaireContainer user={user} />;
};

export default PatientQuestionnaire;