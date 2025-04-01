import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import ChatbotFAQAdmin from '@/components/admin/ChatbotFAQAdmin';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ChatbotFaqAdminPage = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only allow authenticated admin users
    if (!loading) {
      if (!user) {
        navigate("/login");
        return;
      }
      
      if (!isAdmin) {
        navigate("/");
        return;
      }
    }
  }, [user, isAdmin, loading, navigate]);
  
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen questionnaire-bg">
        <LoadingSpinner />
        <span className="ml-3 questionnaire-text">Loading...</span>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col questionnaire-bg">
      <Navbar showProfile={true} />
      <main className="flex-1 container px-6 py-6 mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50"
            onClick={() => navigate('/new-admin')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Chatbot Knowledge Base Management</h1>
          <div className="w-[120px]"></div> {/* Spacer for centering */}
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <ChatbotFAQAdmin />
        </div>
      </main>
    </div>
  );
};

export default ChatbotFaqAdminPage;