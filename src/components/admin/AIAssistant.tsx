import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Database, Sparkles, Send, Mic, Square, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { AIAssistantService, AIMessage, AIQueryParams } from "@/services/AIAssistantService";

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

const AIAssistant = () => {
  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // State
  const [activeMode, setActiveMode] = useState<'welcome' | 'chat' | 'dataExplorer'>('welcome');
  const [currentQuery, setCurrentQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string, timestamp?: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
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
        
        setCurrentQuery(transcript);
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
  
  // Function to handle sending a message with AI integration
  const handleSendMessage = async () => {
    if (!currentQuery.trim()) return;
    
    // Add user message
    const userMessage = {
      role: 'user' as const,
      content: currentQuery,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentQuery('');
    setIsProcessing(true);
    
    try {
      // Process with real AI
      const params: AIQueryParams = {
        query: userMessage.content
      };
      
      // Call the AI Assistant Service
      const response = await AIAssistantService.processQuery(params);
      
      // Add assistant message
      const assistantMessage = {
        role: 'assistant' as const,
        content: response.text,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: unknown) {
      console.error("Error processing query:", error);
      const errorText = error instanceof Error ? error.message : "Failed to process your query";
      toast.error(`Error: ${errorText}`);
      
      // Add error message to the chat
      const errorResponseMessage = {
        role: 'assistant' as const,
        content: "I'm sorry, I encountered an error processing your request. Please try again with a different question.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorResponseMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle starting AI chat
  const startAIChat = () => {
    setActiveMode('chat');
    setMessages([{
      role: 'assistant',
      content: 'Hello! I\'m your AI Assistant. How can I help you analyze patient data today?'
    }]);
  };
  
  // Handle starting data explorer
  const startDataExplorer = () => {
    setActiveMode('chat');
    setMessages([{
      role: 'assistant',
      content: 'Welcome to the Data Explorer! You can ask me to query and analyze your patient database. Try asking something like "Show me patients with high risk levels by age group".'
    }]);
  };
  
  // Render the chat interface with voice control
  const renderChatInterface = () => (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Bot className="mr-2 h-5 w-5 text-primary" />
          Clinical AI Assistant
        </CardTitle>
        <CardDescription>
          Ask questions about patient questionnaire data
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden px-4 flex flex-col">
        <ScrollArea className="h-full pr-4 flex-grow mb-4">
          <div className="space-y-4 pt-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    max-w-[80%] p-3 rounded-lg
                    ${message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                    }
                  `}
                >
                  <div className="flex items-center mb-1">
                    {message.role === 'assistant' ? (
                      <Bot size={16} className="mr-2" />
                    ) : (
                      <div className="h-4 w-4 mr-2" />
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex items-center space-x-2 mt-auto">
          <Input
            placeholder="Ask about patient data..."
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isProcessing || isListening}
            className="flex-1"
          />
          <Button 
            type="button"
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
            title={isListening ? "Stop listening" : "Start voice input"}
            disabled={isProcessing}
          >
            {isListening ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Button 
            type="submit" 
            size="icon" 
            disabled={isProcessing || !currentQuery.trim()}
            onClick={handleSendMessage}
          >
            {isProcessing ? (
              <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <Tabs defaultValue="chat" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="chat" className="flex items-center">
          <Bot className="mr-2 h-4 w-4" />
          AI Chat
        </TabsTrigger>
        <TabsTrigger value="data-explorer" className="flex items-center">
          <Database className="mr-2 h-4 w-4" />
          Data Explorer
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat">
        {activeMode === 'welcome' ? (
          <Card className="h-[600px] flex flex-col items-center justify-center text-center p-8">
            <Sparkles className="h-16 w-16 text-primary/30 mb-6" />
            <CardTitle className="text-2xl mb-4">
              AI Assistant
            </CardTitle>
            <CardDescription className="max-w-lg mx-auto text-base mb-6">
              The AI Assistant is now active! It allows you to analyze patient data, generate reports,
              and get insights through natural language conversations.
              <br /><br />
              This component is fully integrated with the Google Gemini API for powerful natural language processing.
            </CardDescription>
            <div className="grid gap-4 max-w-md w-full mx-auto">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">Available Features:</h3>
                <ul className="text-sm text-left list-disc pl-5 space-y-1">
                  <li>Natural language processing for patient data analysis</li>
                  <li>Voice input for hands-free operation</li>
                  <li>Automated report generation and visualization</li>
                  <li>Conversation history and context awareness</li>
                </ul>
              </div>
              <Button className="w-full" onClick={startAIChat}>
                <Bot className="mr-2 h-4 w-4" />
                Start Using AI Assistant
              </Button>
            </div>
          </Card>
        ) : (
          renderChatInterface()
        )}
      </TabsContent>

      <TabsContent value="data-explorer">
        {activeMode === 'welcome' ? (
          <Card className="h-[600px] flex flex-col items-center justify-center text-center p-8">
            <Database className="h-16 w-16 text-primary/30 mb-6" />
            <CardTitle className="text-2xl mb-4">
              Data Explorer Active
            </CardTitle>
            <CardDescription className="max-w-lg mx-auto text-base mb-6">
              The Data Explorer is now enabled! You can analyze patient data through natural language queries
              that are automatically converted to SQL and visualized appropriately.
              <br /><br />
              The implementation uses the Gemini API for SQL generation with security safeguards.
            </CardDescription>
            <div className="grid gap-4 max-w-md w-full mx-auto">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">Example Queries:</h3>
                <ul className="text-sm text-left pl-5 space-y-2">
                  <li className="italic">"How many patients are in each risk level category?"</li>
                  <li className="italic">"Show me patients with high risk levels by age group"</li>
                  <li className="italic">"What percentage of patients report family history of glaucoma?"</li>
                </ul>
              </div>
              <Button className="w-full" onClick={startDataExplorer}>
                <Database className="mr-2 h-4 w-4" />
                Start Using Data Explorer
              </Button>
            </div>
          </Card>
        ) : (
          renderChatInterface()
        )}
      </TabsContent>
    </Tabs>
  );
};

export default AIAssistant;
