import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize, Maximize, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { chatbotService, ChatMessage } from '@/services/ChatbotService';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

// Add type definitions for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  item(index: number): SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: Event) => void;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }
}

// Suggested questions for the chatbot
const SUGGESTED_QUESTIONS = [
  "How do I measure intraocular pressure accurately?",
  "What equipment is recommended for tonometry?",
  "How do I interpret the cup-to-disc ratio?",
  "How does steroid use affect glaucoma risk?",
  "How should I assess family history of glaucoma?",
  "How do I explain risk scores to patients?"
];

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { user } = useAuth();
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [previousUser, setPreviousUser] = useState<any>(user);
  
  // Load conversation history once when user is available
  useEffect(() => {
    if (user && !hasLoadedHistory) {
      loadConversationHistory();
    }
  }, [user, hasLoadedHistory]);
  
  // Clear messages when user logs out
  useEffect(() => {
    // If we had a user before, but now we don't (logged out)
    if (previousUser && !user) {
      // Clear messages in component state
      setMessages([]);
      setHasLoadedHistory(false);
      setIsOpen(false);
      setHasInteracted(false);
      
      // Also clear conversation history in the database
      chatbotService.clearConversationHistory();
    }
    
    setPreviousUser(user);
  }, [user]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Clear chat history when the session ends (browser tab closes or refreshes)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear chat history in local storage
      chatbotService.clearConversationHistory();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Start voice recognition
  const startVoiceRecognition = () => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results);
        const transcript = results
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setMessage(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.start();
      setIsListening(true);
      
      toast.info("Listening... Speak your question");
    } else {
      toast.error("Voice recognition not supported in your browser");
    }
  };
  
  // Stop voice recognition
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };
  
  const loadConversationHistory = async () => {
    try {
      // Reset the conversation to a fresh state with welcome message
      await chatbotService.resetConversation();
      
      // Get the reset conversation with welcome message
      const conversation = await chatbotService.getConversationHistory();
      
      if (conversation && conversation.messages && conversation.messages.length > 0) {
        setMessages(conversation.messages);
      } else {
        // Fallback welcome message if something went wrong
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm your EyeSentry assistant. I can help you with questions about the glaucoma risk assessment questionnaire.

How can I assist you today?`,
          timestamp: new Date().toISOString()
        };
        
        setMessages([welcomeMessage]);
      }
      
      setHasLoadedHistory(true);
    } catch (error) {
      console.error("Error loading conversation history:", error);
      setHasLoadedHistory(true);
    }
  };
  
  const handleSendMessage = async (text = message) => {
    // If text is provided (from suggestion click), use that, otherwise use message state
    const messageToSend = text !== message ? text : message;
    
    // Check if we have a message to send
    if (!messageToSend.trim()) return;
    
    // Hide suggestions after first message
    setShowSuggestions(false);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    
    try {
      // Get response from service
      const response = await chatbotService.sendMessage(messageToSend);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
    // Mark that the user has interacted with the chat
    setHasInteracted(true);
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  // Render the chat button when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 flex flex-col items-end z-50">
        <Button
          onClick={toggleChat}
          className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 p-2 flex items-center justify-center gap-2 pr-4"
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Chat Assistant</span>
        </Button>
      </div>
    );
  }
  
  // Render the chat widget when open
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isMinimized ? 'pointer-events-none' : ''}`}>
      {/* Backdrop - only shown when not minimized */}
      {!isMinimized && (
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleChat}
        />
      )}
      
      {/* Chat window */}
      <div
        className={`relative bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-300 max-w-2xl w-full mx-4 ${
          isMinimized
            ? 'w-72 h-16 fixed bottom-4 right-4 pointer-events-auto'
            : 'h-[80vh] max-h-[600px] min-w-[500px]'
        }`}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 bg-blue-800">
            <MessageCircle className="h-3 w-3" />
          </Avatar>
          <span className="font-medium text-sm">EyeSentry Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMinimize}
            className="h-6 w-6 text-white hover:bg-blue-700 rounded-full p-0"
          >
            {isMinimized ? <Maximize className="h-3 w-3" /> : <Minimize className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleChat}
            className="h-6 w-6 text-white hover:bg-blue-700 rounded-full p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Messages area - only shown when not minimized */}
      {!isMinimized && (
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="text-sm prose prose-sm max-w-none">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            {/* Suggested questions */}
            {showSuggestions && messages.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 font-medium">Suggested questions:</p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-left justify-start h-auto py-1.5 text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer shadow-sm"
                      onClick={() => handleSendMessage(question)}
                    >
                      <span className="flex items-center w-full">
                        <span className="mr-1.5 text-blue-500 font-bold">→</span>
                        <span className="flex-1 truncate">{question}</span>
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}
      
      {/* Input area - only shown when not minimized */}
      {!isMinimized && (
        <div className="p-3 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (message.trim()) {
                handleSendMessage();
              }
            }}
            className="flex gap-2"
          >
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 text-sm"
              disabled={isLoading || isListening}
            />
            <Button
              type="button"
              size="sm"
              variant={isListening ? "destructive" : "outline"}
              onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
              title={isListening ? "Stop listening" : "Start voice input"}
              disabled={isLoading}
              className="px-3"
            >
              {isListening ? (
                <Square className="h-3.5 w-3.5" />
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 px-3"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
      </div>
    </div>
  );
};

// Make sure to export the component as default
export { ChatWidget as default };