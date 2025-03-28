import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { QuestionService } from '@/services/QuestionService';
import DropdownOptionManager from '../questions/DropdownOptionManager';
import { toast } from 'sonner';

interface QuestionOptionManagerProps {
  questionId?: string;
}

const QuestionOptionManager: React.FC<QuestionOptionManagerProps> = ({ 
  questionId 
}) => {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dropdown-options");

  // Fetch question details when questionId changes
  useEffect(() => {
    const fetchQuestionDetails = async () => {
      if (!questionId) {
        setQuestion(null);
        return;
      }
      
      setLoading(true);
      try {
        // Fetch the question details
        const questions = await QuestionService.fetchQuestions();
        const foundQuestion = questions.find(q => q.id === questionId);
        
        if (foundQuestion) {
          setQuestion(foundQuestion);
        } else {
          toast.error('Question not found');
        }
      } catch (error) {
        console.error('Error fetching question details:', error);
        toast.error('Failed to load question details');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionDetails();
  }, [questionId]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (!questionId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Select a question to manage its options
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {question ? question.question : 'Question Options'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="dropdown-options">Dropdown Options</TabsTrigger>
            <TabsTrigger value="conditional-items">Conditional Items</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dropdown-options">
            <DropdownOptionManager questionId={questionId} />
          </TabsContent>
          
          <TabsContent value="conditional-items">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Conditional items management coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default QuestionOptionManager;