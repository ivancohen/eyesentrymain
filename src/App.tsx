import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PatientQuestionnaire from "@/pages/PatientQuestionnaire";
import Questionnaires from "@/pages/Questionnaires";
import NotFound from "@/pages/NotFound";
import NewAdmin from "@/pages/NewAdmin";
import Doctor from "@/pages/Doctor";
import UserProfile from "@/pages/UserProfile";
import PasswordReset from "@/pages/PasswordReset";
import ResetConfirmation from "@/pages/ResetConfirmation";
import PendingApproval from "@/pages/PendingApproval";
import AIAssistantPage from "@/pages/AIAssistantPage";
import SpecialistQuestionnaire from "@/pages/SpecialistQuestionnaire";
import SpecialistThankYou from "@/pages/SpecialistThankYou";
import QuestionnaireEdit from "@/components/questionnaires/QuestionnaireEdit";
import { AuthProvider } from "@/contexts/AuthContext";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/questionnaire" element={<PatientQuestionnaire />} />
        <Route path="/questionnaire/edit/:id" element={<QuestionnaireEdit />} />
        <Route path="/questionnaires" element={<Questionnaires />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route path="/reset-confirmation" element={<ResetConfirmation />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        {/* Redirect old admin path to new admin */}
        <Route path="/admin" element={<Navigate to="/new-admin" replace />} />
        <Route path="/new-admin" element={<NewAdmin />} />
        <Route path="/doctor" element={<Doctor />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        {/* Specialist routes - no auth required */}
        <Route path="/specialist" element={<SpecialistQuestionnaire />} />
        <Route path="/specialist/:code" element={<SpecialistQuestionnaire />} />
        <Route path="/specialist-thank-you" element={<SpecialistThankYou />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors />
    </AuthProvider>
  );
}

export default App;
