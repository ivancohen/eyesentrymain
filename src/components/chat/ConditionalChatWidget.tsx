import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import ChatWidget from "@/components/chat/ChatWidget";
import { chatbotService } from "@/services/ChatbotService";

// List of routes that should not show the chat widget
const excludedRoutes = [
  // Public routes
  '/login',
  '/register',
  '/reset-password',
  '/reset-confirmation',
  '/pending-approval',
  '/specialist',
  '/specialist-thank-you',
  // Admin routes
  '/admin',
  '/new-admin'
];

// Check if current path is an excluded route
const isExcludedRoute = () => {
  const path = window.location.pathname;
  return excludedRoutes.some(route =>
    path === route ||
    path.startsWith('/specialist/') ||
    path.startsWith('/admin/')
  );
};

export const ConditionalChatWidget = () => {
  const { user, isAdmin } = useAuth();
  
  // Clear chat history when navigating to an excluded route or when the component unmounts
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts
      // If the user is still logged in, clear the chat history
      if (user) {
        chatbotService.clearConversationHistory();
      }
    };
  }, [user]);
  
  // Only show the chat widget if:
  // 1. User is logged in
  // 2. Not on an excluded route
  // 3. User is not an admin
  if (user && !isExcludedRoute() && !isAdmin) {
    return <ChatWidget />;
  }
  
  return null;
};

export default ConditionalChatWidget;