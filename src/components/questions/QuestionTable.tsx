
import { useState, useEffect } from "react";
import { Question, QuestionService } from "@/services/QuestionService";
import { QUESTION_COLUMNS } from "@/constants/questionConstants";
import DataTable from "@/components/DataTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface QuestionTableProps {
  onAdd: () => void;
  onEdit: (id: string) => void;
  onRefresh: () => void;
  refreshTrigger?: number;
}

const QuestionTable = ({ 
  onAdd, 
  onEdit, 
  onRefresh,
  refreshTrigger = 0
}: QuestionTableProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [refreshTrigger]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await QuestionService.fetchQuestions();
      setQuestions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load questions");
      toast.error("Error loading questions. Please try again.");
    } finally {
      setIsLoading(false);
      onRefresh();
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        const success = await QuestionService.deleteQuestion(id);
        if (success) {
          fetchQuestions();
        }
      } catch (err: any) {
        toast.error(`Error deleting question: ${err.message}`);
      }
    }
  };

  // Format questions data for display
  const formattedQuestions = questions.map(question => {
    // Format page category for display
    let displayCategory = question.page_category || "Uncategorized";
    
    // Convert from value to readable format
    if (displayCategory === "patient_info") {
      displayCategory = "Patient Information";
    } else if (displayCategory === "family_medication") {
      displayCategory = "Family & Medication";
    } else if (displayCategory === "clinical_measurements") {
      displayCategory = "Clinical Measurements";
    }
    
    return {
      ...question,
      page_category: displayCategory,
      created_at: new Date(question.created_at).toLocaleDateString()
    };
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchQuestions} className="flex items-center gap-2">
          <RefreshCw size={16} />
          <span>Try Again</span>
        </Button>
      </div>
    );
  }

  return (
    <DataTable
      data={formattedQuestions}
      columns={QUESTION_COLUMNS}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={handleDeleteItem}
    />
  );
};

export default QuestionTable;
