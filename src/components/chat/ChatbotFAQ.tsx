import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Removed AvatarImage as it's not used
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Search, Bot, User, X, Mic, Square } from "lucide-react"; // Added Mic, Square
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { faqService, FaqCategory } from "@/services/FaqService"; // Import FaqService and FaqCategory
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Added Dialog imports

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
  // Optional: Add category name if you want to store it directly after fetching
  // category_name?: string;
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
  const [isListening, setIsListening] = useState(false); // State for voice input
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false); // State for FAQ dialog
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [faqCategories, setFaqCategories] = useState<FaqCategory[]>([]); // State for categories
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Fetch chat history and FAQs on component mount
  useEffect(() => {
    if (user) {
      fetchChatHistory();
    }
    fetchFaqs();
    fetchCategories(); // Fetch categories on mount
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

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
          .select('*'); // Removed order by category_id here, can sort client-side if needed

        if (!error) {
          setFaqs(data || []);
          return;
        } else {
           console.error("Error fetching FAQs:", error); // Log error if query fails
        }
      } catch (e) {
        console.error("Exception fetching FAQs:", e);
        // Silently continue to fallback
      }

      // If the above fails, set empty array
      setFaqs([]);
    } catch (error) {
      console.error("Error in fetchFaqs:", error);
    }
  };

  // Fetch FAQ Categories
  const fetchCategories = async () => {
    try {
      const categories = await faqService.getCategories();
      setFaqCategories(categories);
    } catch (error) {
      console.error("Error fetching FAQ categories:", error);
      // Handle error if needed, maybe show a toast
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
    // Simple FAQ matching approach
    const lowerUserMessage = userMessage.toLowerCase().replace(/[?.,!]/g, ''); // Normalize user input

    // 1. Stricter Direct Match: Check if FAQ question closely matches user query based on word overlap
    let bestMatch: FAQ | null = null;
    let highestScore = 0;
    const userWords = new Set(lowerUserMessage.split(' ').filter(w => w.length > 2)); // Ignore short/common words

    if (userWords.size === 0) { // Handle cases where user input is too short after filtering
        return "Please provide more details in your question.";
    }

    for (const faq of faqs) {
      const lowerFaqQuestion = faq.question.toLowerCase().replace(/[?.,!]/g, '');
      const faqWords = new Set(lowerFaqQuestion.split(' ').filter(w => w.length > 2));
      let score = 0;

      // Calculate overlap score
      userWords.forEach(word => {
        if (faqWords.has(word)) {
          score++;
        }
      });

      // Bonus for significant overlap or specific keywords
      if (score > 0) {
         // Give higher weight if more than half the user's words match
         if (score >= Math.ceil(userWords.size / 2)) {
             score += 2;
         }
         // Bonus for specific important terms if present in both
         if ((userWords.has('iop') && faqWords.has('iop')) || (userWords.has('measure') && faqWords.has('measure'))) {
             score += 2;
         }
         if ((userWords.has('steroid') && faqWords.has('steroid'))) {
             score += 2;
         }
      }


      if (score > highestScore && score > 0) { // Require at least one word overlap
        highestScore = score;
        bestMatch = faq;
      }
    }

    // If we found a reasonably good match (score > 1, adjust threshold as needed)
    if (bestMatch && highestScore > 1) {
      console.log(`Direct match found (Score: ${highestScore}): ${bestMatch.question}`);
      return bestMatch.answer;
    }

    // 2. Keyword Category Match (Fallback if no good direct match)
    console.log("No strong direct match, trying keyword category match...");
    const keywords = [
      // Assuming category_id in DB matches these strings:
      { terms: ['questionnaire', 'form', 'survey'], category_id: 'Questionnaire' },
      { terms: ['pressure', 'iop', 'tonometer', 'mmhg'], category_id: 'Eye Pressure' },
      { terms: ['steroid', 'corticosteroid', 'prednisone', 'dexamethasone'], category_id: 'Steroids' },
      { terms: ['equipment', 'device', 'tool', 'measure'], category_id: 'Equipment' },
      { terms: ['diagnosis', 'glaucoma', 'condition', 'disease'], category_id: 'Diagnosis' },
      { terms: ['treatment', 'therapy', 'medication', 'drops'], category_id: 'Treatment' },
      { terms: ['risk', 'score', 'assessment', 'evaluation'], category_id: 'General' }
    ];

    for (const keyword of keywords) {
      if (keyword.terms.some(term => lowerUserMessage.includes(term))) {
        const categoryFaqs = faqs.filter(faq => faq.category_id === keyword.category_id);
        if (categoryFaqs.length > 0) {
          // Try to find the best match within the category using word overlap score
          let bestCategoryMatch: FAQ | null = null;
          let highestCategoryScore = 0;

          categoryFaqs.forEach(faq => {
              const lowerFaqQuestion = faq.question.toLowerCase().replace(/[?.,!]/g, '');
              const faqWords = new Set(lowerFaqQuestion.split(' ').filter(w => w.length > 2));
              let score = 0;
              userWords.forEach(word => {
                  if (faqWords.has(word)) {
                      score++;
                  }
              });
              if (score > highestCategoryScore) {
                  highestCategoryScore = score;
                  bestCategoryMatch = faq;
              }
          });

          // Return the best match in the category if found, otherwise fallback to random
          if (bestCategoryMatch && highestCategoryScore > 0) {
             console.log(`Keyword category match found (Best in category: ${keyword.category_id}): ${bestCategoryMatch.question}`);
             return `Regarding ${keyword.category_id.toLowerCase()}, here's some information: ${bestCategoryMatch.answer}`;
          } else {
             const randomFaq = categoryFaqs[Math.floor(Math.random() * categoryFaqs.length)];
             console.log(`Keyword category match found (Random in category: ${keyword.category_id}): ${randomFaq.question}`);
             return `Regarding ${keyword.category_id.toLowerCase()}, here's some information: ${randomFaq.answer}`;
          }
        }
      }
    }

    // 3. Default Response
    console.log("No relevant FAQ found.");
    return "I couldn't find a specific answer for that in the knowledge base. Please try rephrasing your question or ask about common topics like the questionnaire, eye pressure, steroids, equipment, diagnosis, or treatment.";
  };

  // Modified to open dialog instead of setting input
  const handleFaqClick = (faq: FAQ) => {
    setSelectedFaq(faq);
    setIsFaqDialogOpen(true);
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

  // Start voice recognition
  const startVoiceRecognition = () => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor();

      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true; // Get results as user speaks
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results);
        const transcript = results
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        setInput(transcript); // Update the input field
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: Event) => {
        console.error("Speech recognition error:", event);
        toast.error("Speech recognition error. Please try again.");
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

  return (
    <> {/* Wrap component in Fragment */}
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
                          onClick={() => handleFaqClick(faq)} // Use updated handler
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
                              onClick={() => handleFaqClick(faq)} // Use updated handler
                            >
                              Read more
                            </span>
                          )}
                        </div>
                        {/* Category ID badge removed */}
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
                        <p className="text-muted-foreground mt-2 mb-4"> {/* Added margin-bottom */}
                          Ask me any questions about the questionnaire, eye pressure, steroids, or treatment recommendations.
                        </p>
                        {/* Add Example Prompts */}
                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => setInput("What is IOP?")}>What is IOP?</Button>
                          <Button variant="outline" size="sm" onClick={() => setInput("Tell me about steroid use.")}>Tell me about steroid use.</Button>
                          <Button variant="outline" size="sm" onClick={() => setInput("How does the questionnaire work?")}>How does the questionnaire work?</Button>
                        </div>
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
                      disabled={isLoading || isListening} // Disable input while listening
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
                      disabled={isLoading || !input.trim()}
                      className="px-3 bg-blue-600 hover:bg-blue-700" // Added styling
                    >
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

      {/* FAQ Details Dialog */}
      <Dialog open={isFaqDialogOpen} onOpenChange={setIsFaqDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedFaq?.question}</DialogTitle>
            <DialogDescription>
              Category: {faqCategories.find(cat => cat.id === selectedFaq?.category_id)?.name || selectedFaq?.category_id || 'Unknown'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] mt-4 pr-6">
            <div className="whitespace-pre-wrap text-sm">
              {selectedFaq?.answer}
            </div>
          </ScrollArea>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsFaqDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatbotFAQ;