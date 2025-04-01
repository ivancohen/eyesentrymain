import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Search, Bot, User, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category_id: string;
}

const CATEGORIES = [
  "All",
  "Questionnaire",
  "Eye Pressure",
  "Steroids",
  "Equipment",
  "Diagnosis",
  "Treatment",
  "General"
];

const ChatbotFAQ: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch chat history and FAQs on component mount
  useEffect(() => {
    if (user) {
      fetchChatHistory();
    }
    fetchFaqs();
  }, [user]);

  // Filter FAQs when search term or category changes
  useEffect(() => {
    filterFaqs();
  }, [searchTerm, activeCategory, faqs]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching chat history:", error);
        return;
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error("Error in fetchChatHistory:", error);
    }
  };

  const fetchFaqs = async () => {
    try {
      // Try to fetch FAQs with error handling
      try {
        const { data, error } = await supabase
          .from('chatbot_faqs')
          .select('*');
        
        if (!error) {
          setFaqs(data || []);
          return;
        }
      } catch (e) {
        // Silently continue to fallback
      }
      
      // If the above fails, set empty array
      setFaqs([]);
    } catch (error) {
      console.error("Error in fetchFaqs:", error);
    }
  };

  const filterFaqs = () => {
    let filtered = faqs;
    
    // Filter by category
    if (activeCategory !== 'All') {
      filtered = filtered.filter(faq => faq.category_id === activeCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        faq => 
          faq.question.toLowerCase().includes(term) || 
          faq.answer.toLowerCase().includes(term)
      );
    }
    
    setFilteredFaqs(filtered);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !user) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    
    try {
      // Save user message to database
      const { data: userMessageData, error: userMessageError } = await supabase
        .from('chatbot_history')
        .insert({
          user_id: user.id,
          role: 'user',
          content: userMessage
        })
        .select()
        .single();
      
      if (userMessageError) {
        console.error("Error saving user message:", userMessageError);
        toast.error("Failed to send message");
        setIsLoading(false);
        return;
      }
      
      // Add user message to state
      setMessages(prev => [...prev, userMessageData]);
      
      // Generate AI response
      const response = await generateResponse(userMessage);
      
      // Save AI response to database
      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from('chatbot_history')
        .insert({
          user_id: user.id,
          role: 'assistant',
          content: response
        })
        .select()
        .single();
      
      if (aiMessageError) {
        console.error("Error saving AI message:", aiMessageError);
        toast.error("Failed to receive response");
        setIsLoading(false);
        return;
      }
      
      // Add AI message to state
      setMessages(prev => [...prev, aiMessageData]);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const generateResponse = async (userMessage: string): Promise<string> => {
    // In a real implementation, this would call an LLM API like OpenAI
    // For now, we'll use a simple FAQ matching approach
    
    // First, try to find a direct match in the FAQs
    const lowerUserMessage = userMessage.toLowerCase();
    
    // Check if the message is a question about a specific FAQ
    for (const faq of faqs) {
      if (
        lowerUserMessage.includes(faq.question.toLowerCase()) ||
        (lowerUserMessage.includes('?') && 
         faq.question.toLowerCase().includes(lowerUserMessage.replace('?', '')))
      ) {
        return faq.answer;
      }
    }
    
    // If no direct match, look for keyword matches
    const keywords = [
      { terms: ['questionnaire', 'form', 'survey'], category: 'Questionnaire' },
      { terms: ['pressure', 'iop', 'tonometer', 'mmhg'], category: 'Eye Pressure' },
      { terms: ['steroid', 'corticosteroid', 'prednisone', 'dexamethasone'], category: 'Steroids' },
      { terms: ['equipment', 'device', 'tool', 'measure'], category: 'Equipment' },
      { terms: ['diagnosis', 'glaucoma', 'condition', 'disease'], category: 'Diagnosis' },
      { terms: ['treatment', 'therapy', 'medication', 'drops'], category: 'Treatment' },
      { terms: ['risk', 'score', 'assessment', 'evaluation'], category: 'General' }
    ];
    
    for (const keyword of keywords) {
      if (keyword.terms.some(term => lowerUserMessage.includes(term))) {
        // Find FAQs in this category
        const categoryFaqs = faqs.filter(faq => faq.category_id === keyword.category);
        if (categoryFaqs.length > 0) {
          // Return a random FAQ from this category
          const randomFaq = categoryFaqs[Math.floor(Math.random() * categoryFaqs.length)];
          return `Based on your question about ${keyword.category.toLowerCase()}: ${randomFaq.answer}`;
        }
      }
    }
    
    // Default response if no matches found
    return "I don't have specific information about that. Please try asking about the questionnaire, eye pressure measurements, steroids, equipment, diagnosis, or treatment recommendations. If you need more detailed information, please consult with your healthcare provider.";
  };

  const handleFaqClick = (question: string) => {
    setInput(question);
    setIsChatOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearChat = async () => {
    if (!user) return;
    
    if (!confirm("Are you sure you want to clear your chat history?")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('chatbot_history')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Error clearing chat history:", error);
        toast.error("Failed to clear chat history");
        return;
      }
      
      setMessages([]);
      toast.success("Chat history cleared");
    } catch (error) {
      console.error("Error in clearChat:", error);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <Bot className="h-5 w-5 mr-2 text-blue-500" />
          Eye Sentry Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="chat" onClick={() => setIsChatOpen(true)}>
              Chat
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="faq" className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="h-[50px] whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {CATEGORIES.map(category => (
                  <Badge
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No FAQs found matching your criteria
                  </div>
                ) : (
                  filteredFaqs.map((faq) => (
                    <div key={faq.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div 
                        className="font-medium cursor-pointer hover:text-blue-600"
                        onClick={() => handleFaqClick(faq.question)}
                      >
                        {faq.question}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {faq.answer.length > 150 
                          ? `${faq.answer.substring(0, 150)}... `
                          : faq.answer
                        }
                        {faq.answer.length > 150 && (
                          <span 
                            className="text-blue-600 cursor-pointer"
                            onClick={() => handleFaqClick(faq.question)}
                          >
                            Read more
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {faq.category_id}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="chat" className="space-y-4">
            {user ? (
              <>
                <div className="flex justify-end">
                  {messages.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearChat}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Chat
                    </Button>
                  )}
                </div>
                
                <ScrollArea className="h-[350px] pr-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <Bot className="h-12 w-12 text-blue-500 mb-4" />
                      <h3 className="text-lg font-medium">How can I help you today?</h3>
                      <p className="text-muted-foreground mt-2">
                        Ask me any questions about the questionnaire, eye pressure, steroids, or treatment recommendations.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`flex gap-3 max-w-[80%] ${
                              message.role === 'user'
                                ? 'flex-row-reverse'
                                : 'flex-row'
                            }`}
                          >
                            <Avatar className={message.role === 'user' ? 'bg-blue-100' : 'bg-green-100'}>
                              <AvatarFallback>
                                {message.role === 'user' ? (
                                  <User className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Bot className="h-4 w-4 text-green-500" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`rounded-lg p-3 ${
                                message.role === 'user'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Type your question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
                <h3 className="text-lg font-medium">Please log in to use the chat</h3>
                <p className="text-muted-foreground mt-2">
                  You need to be logged in to ask questions and view your chat history.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ChatbotFAQ;