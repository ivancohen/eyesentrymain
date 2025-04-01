import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PatientQuestionnaire from "@/pages/PatientQuestionnaire.enhanced";
import Questionnaires from "@/pages/Questionnaires";
import NotFound from "@/pages/NotFound";
import NewAdmin from "@/pages/NewAdmin";
import Doctor from "@/pages/Doctor";
import FaqAdmin from "@/pages/admin/FaqAdmin";
import ChatbotFaqAdmin from "@/pages/admin/ChatbotFaqAdmin";
import ConditionalChatWidget from "@/components/chat/ConditionalChatWidget";
import UserProfile from "@/pages/UserProfile";
import PasswordReset from "@/pages/PasswordReset";
import ResetConfirmation from "@/pages/ResetConfirmation";
import PendingApproval from "@/pages/PendingApproval";
import AIAssistantPage from "@/pages/AIAssistantPage";
import SpecialistQuestionnaire from "@/pages/SpecialistQuestionnaire";
import SpecialistThankYou from "@/pages/SpecialistThankYou";
import { AuthProvider } from "@/contexts/AuthContext";
import "./App.css";

function App() {
  
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route path="/reset-confirmation" element={<ResetConfirmation />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        
        {/* Specialist routes - no auth required */}
        <Route path="/specialist" element={<SpecialistQuestionnaire />} />
        <Route path="/specialist/:code" element={<SpecialistQuestionnaire />} />
        <Route path="/specialist-thank-you" element={<SpecialistThankYou />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/questionnaire" element={<PatientQuestionnaire />} />
        <Route path="/questionnaires" element={<Questionnaires />} />
        <Route path="/new-admin" element={<NewAdmin />} />
        <Route path="/admin/faq" element={<FaqAdmin />} />
        <Route path="/admin/chatbot-faq" element={<ChatbotFaqAdmin />} />
        <Route path="/doctor" element={<Doctor />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />

        {/* Legacy redirects */}
        <Route path="/admin" element={<Navigate to="/new-admin" replace />} />
        <Route path="/user-profile" element={<Navigate to="/profile" replace />} />

        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors />
      
      {/* Global Chat Widget - conditionally rendered based on auth status and route */}
      <ConditionalChatWidget />
    </AuthProvider>
  );
}

export default App;
