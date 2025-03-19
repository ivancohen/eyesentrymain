import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, List, MoveVertical } from "lucide-react";
import QuestionManager from "./QuestionManager";
import QuestionFormManager from "@/components/questions/QuestionFormManager";
import QuestionTable from "@/components/questions/QuestionTable";
import QuestionOrderManager from "@/components/questions/QuestionOrderManager";
import { useAuth } from "@/contexts/AuthContext";
import { Question, QuestionService } from "@/services/QuestionService";

const EnhancedQuestionManager = () => {
  const { user } = useAuth();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<Question | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'form' | 'scoring' | 'order'>('table');

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

  // Function to edit scores for a specific question
  const handleEditScores = (question: Question) => {
    setViewMode('scoring');
  };

  // Function to return from scoring view
  const handleReturnFromScoring = () => {
    setViewMode('table');
    setRefreshTrigger(prev => prev + 1);
  };

  // Function to manage question order
  const handleManageOrder = () => {
    setViewMode('order');
  };

  // Function to return from order view
  const handleReturnFromOrder = () => {
    setViewMode('table');
    setRefreshTrigger(prev => prev + 1);
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
    } else if (viewMode === 'scoring') {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Manage Question Scoring</h2>
            <Button 
              variant="outline" 
              onClick={handleReturnFromScoring}
              className="flex items-center gap-2"
            >
              <List size={16} />
              <span>Back to Questions</span>
            </Button>
          </div>
          <QuestionManager />
        </div>
      );
    } else if (viewMode === 'order') {
      return (
        <QuestionOrderManager onClose={handleReturnFromOrder} />
      );
    } else {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Questions</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleManageOrder}
                className="flex items-center gap-2"
              >
                <MoveVertical size={16} />
                <span>Manage Order</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setViewMode('scoring')}
                className="flex items-center gap-2"
              >
                <List size={16} />
                <span>Manage Scoring</span>
              </Button>
              <Button 
                onClick={handleAddItem}
                className="flex items-center gap-2"
              >
                <PlusCircle size={16} />
                <span>Add Question</span>
              </Button>
            </div>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-lg border mb-4">
            <h3 className="text-sm font-medium mb-2">Managing Questions</h3>
            <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Add new questions using the "Add Question" button</li>
              <li>Edit existing questions by clicking the "Edit" button</li>
              <li>Manage question order by clicking "Manage Order"</li>
              <li>Manage question scores by clicking "Manage Scoring"</li>
              <li>Questions are grouped by page category for better organization</li>
            </ul>
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
    <div className="animate-fade-in">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Question Management</h2>
        {viewMode !== 'table' && (
          <Button 
            variant="outline" 
            onClick={() => setViewMode('table')}
            className="flex items-center gap-2"
          >
            <List size={16} />
            <span>Back to Question List</span>
          </Button>
        )}
      </div>
      
      {renderContent()}
    </div>
  );
};

export default EnhancedQuestionManager;
