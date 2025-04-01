import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import ChatWidget from "@/components/chat/ChatWidget";
import { chatbotService } from "@/services/ChatbotService";

// List of public routes that should not show the chat widget
const publicRoutes = [
  '/login',
  '/register',
  '/reset-password',
  '/reset-confirmation',
  '/pending-approval',
  '/specialist',
  '/specialist-thank-you'
];

// Check if current path is a public route
const isPublicRoute = () => {
  const path = window.location.pathname;
  return publicRoutes.some(route =>
    path === route || path.startsWith('/specialist/')
  );
};

export const ConditionalChatWidget = () => {
  const { user } = useAuth();
  
  // Clear chat history when navigating to a public route or when the component unmounts
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts
      // If the user is still logged in, clear the chat history
      if (user) {
        chatbotService.clearConversationHistory();
      }
    };
  }, [user]);
  
  // Only show the chat widget if the user is logged in and not on a public route
  if (user && !isPublicRoute()) {
    return <ChatWidget />;
  }
  
  return null;
};

export default ConditionalChatWidget;