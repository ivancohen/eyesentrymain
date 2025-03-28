import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import QuestionManager from "./QuestionManager";
import QuestionFormManager from "@/components/questions/QuestionFormManager";
import QuestionTable from "@/components/questions/QuestionTable";
import { useAuth } from "@/contexts/AuthContext";
import { Question, QuestionService } from "@/services/QuestionService";

const EnhancedQuestionManager = () => {
  const { user } = useAuth();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<Question | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'form'>('table');

  const handleAddItem = () => {
    setCurrentItem(null);
    setViewMode('form');
  };

  const handleEditItem = async (id: string) => {
    try {
      // Fetch the questions to find the one with the matching ID
      const questions = await QuestionService.fetchQuestions();
      const questionToEdit = questions.find(q => q.id === id);

      if (questionToEdit) {
        console.log("Editing question:", questionToEdit);
        setCurrentItem(questionToEdit);
      } else {
        console.error("Question not found with ID:", id);
        setCurrentItem({ id } as Question); // Fallback to just the ID
      }

      setViewMode('form');
    } catch (error) {
      console.error("Error fetching question for editing:", error);
      // Fallback to just the ID if there's an error
      setCurrentItem({ id } as Question);
      setViewMode('form');
    }
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setViewMode('table');
    setCurrentItem(null);
  };

  const handleFormCancel = () => {
    setViewMode('table');
    setCurrentItem(null);
  };

  const handleTableRefresh = () => {
    console.log("Question table refreshed");
  };

  // Render the appropriate component based on viewMode
  const renderContent = () => {
    if (viewMode === 'form') {
      return (
        <QuestionFormManager
          currentItem={currentItem}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          userId={user?.id || ""}
        />
      );
    } else {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Questions</h2>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddItem}
                className="flex items-center gap-2"
              >
                <PlusCircle size={16} />
                <span>Add Question</span>
              </Button>
            </div>
          </div>
          
          <QuestionTable
            onAdd={handleAddItem}
            onEdit={handleEditItem}
            onRefresh={handleTableRefresh}
            refreshTrigger={refreshTrigger}
          />
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      {renderContent()}
    </div>
  );
};

export default EnhancedQuestionManager;
