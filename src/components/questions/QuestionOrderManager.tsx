import { useState, useEffect } from "react";
import { Question, QuestionService } from "@/services/QuestionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUp, ArrowDown, MoveVertical, Layers } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

interface QuestionOrderManagerProps {
  onClose: () => void;
}

const QuestionOrderManager = ({ onClose }: QuestionOrderManagerProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("patient_info");
  const [categories, setCategories] = useState<string[]>([]);
  const [movingQuestion, setMovingQuestion] = useState<string | null>(null);

  // Category display names
  const categoryNames: Record<string, string> = {
    "patient_info": "Patient Information",
    "family_medication": "Family & Medication History",
    "clinical_measurements": "Clinical Measurements"
  };

  // Load questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  // Fetch questions from the database
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const allQuestions = await QuestionService.fetchQuestions();
      setQuestions(allQuestions);

      // Check if display_order column exists
      const hasDisplayOrder = allQuestions.some(q => q.display_order !== undefined);
      if (!hasDisplayOrder && allQuestions.length > 0) {
        console.warn("display_order column not found. Please run the SQL script in supabase/ultra_simple_admin.sql");
        toast.warning("Please run the SQL script to add the display_order column first", {
          duration: 5000
        });
      }

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(allQuestions.map(q => q.page_category || "")))
        .filter(category => category !== "");

      // Set default categories if none found
      if (uniqueCategories.length === 0) {
        setCategories(["patient_info", "family_medication", "clinical_measurements"]);
      } else {
        setCategories(uniqueCategories);
        // Set the first category as selected
        if (uniqueCategories.length > 0 && !selectedCategory) {
          setSelectedCategory(uniqueCategories[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  };

  // Get questions for the selected category
  const getQuestionsForCategory = () => {
    return questions
      .filter(q => q.page_category === selectedCategory)
      .sort((a, b) => {
        // If display_order is not available, fall back to created_at
        if (a.display_order === undefined || b.display_order === undefined) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        const orderA = a.display_order || 0;
        const orderB = b.display_order || 0;
        return orderA - orderB;
      });
  };

  // Move a question up in the order
  const handleMoveUp = async (questionId: string) => {
    setMovingQuestion(questionId);
    try {
      // Check if the SQL script has been run
      const question = questions.find(q => q.id === questionId);
      if (question && question.display_order === undefined) {
        toast.error("Please run the SQL script to add the display_order column first");
        console.error("display_order column not found. Please run the SQL script in supabase/ultra_simple_admin.sql");
        return;
      }

      const success = await QuestionService.moveQuestionUp(questionId);
      if (success) {
        toast.success("Question moved up successfully");
        fetchQuestions();
      }
    } catch (error) {
      console.error("Error moving question up:", error);
      toast.error("Failed to move question up");
    } finally {
      setMovingQuestion(null);
    }
  };

  // Move a question down in the order
  const handleMoveDown = async (questionId: string) => {
    setMovingQuestion(questionId);
    try {
      // Check if the SQL script has been run
      const question = questions.find(q => q.id === questionId);
      if (question && question.display_order === undefined) {
        toast.error("Please run the SQL script to add the display_order column first");
        console.error("display_order column not found. Please run the SQL script in supabase/ultra_simple_admin.sql");
        return;
      }

      const success = await QuestionService.moveQuestionDown(questionId);
      if (success) {
        toast.success("Question moved down successfully");
        fetchQuestions();
      }
    } catch (error) {
      console.error("Error moving question down:", error);
      toast.error("Failed to move question down");
    } finally {
      setMovingQuestion(null);
    }
  };

  // Move a question to a different category
  const handleMoveToCategory = async (questionId: string, newCategory: string) => {
    setMovingQuestion(questionId);
    try {
      // Check if the SQL script has been run
      const question = questions.find(q => q.id === questionId);
      if (question && question.display_order === undefined) {
        toast.error("Please run the SQL script to add the display_order column first");
        console.error("display_order column not found. Please run the SQL script in supabase/ultra_simple_admin.sql");
        return;
      }

      const success = await QuestionService.moveQuestionToCategory(questionId, newCategory);
      if (success) {
        toast.success(`Question moved to ${categoryNames[newCategory] || newCategory}`);
        fetchQuestions();
      }
    } catch (error) {
      console.error("Error moving question to category:", error);
      toast.error("Failed to move question to category");
    } finally {
      setMovingQuestion(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const categoryQuestions = getQuestionsForCategory();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Question Order</CardTitle>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Category</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-72">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {categoryNames[category] || category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-4 font-medium text-sm py-2 px-4 bg-secondary/20 rounded-md">
            <div>Question</div>
            <div className="flex items-center gap-2">Actions</div>
          </div>

          {categoryQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No questions found in this category
            </div>
          ) : (
            categoryQuestions.map((question, index) => (
              <div
                key={question.id}
                className="grid grid-cols-[1fr_auto] gap-4 items-center py-3 px-4 bg-secondary/5 rounded-md hover:bg-secondary/10 transition-colors"
              >
                <div className="font-medium truncate">{question.question}</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveUp(question.id)}
                    disabled={index === 0 || movingQuestion !== null}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowUp size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveDown(question.id)}
                    disabled={index === categoryQuestions.length - 1 || movingQuestion !== null}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowDown size={16} />
                  </Button>
                  <Select
                    onValueChange={(value) => handleMoveToCategory(question.id, value)}
                    disabled={movingQuestion !== null}
                  >
                    <SelectTrigger className="h-8 w-8 p-0">
                      <MoveVertical size={16} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>
                        Move to category
                      </SelectItem>
                      {categories
                        .filter(cat => cat !== selectedCategory)
                        .map(category => (
                          <SelectItem key={category} value={category}>
                            {categoryNames[category] || category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 bg-secondary/10 p-4 rounded-md">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Layers size={16} />
            Question Categories
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            Questions are organized into these categories which correspond to pages in the patient questionnaire:
          </p>
          <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
            <li><strong>Patient Information</strong> (page_category: patient_info)</li>
            <li><strong>Family & Medication History</strong> (page_category: family_medication)</li>
            <li><strong>Clinical Measurements</strong> (page_category: clinical_measurements)</li>
          </ul>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <h4 className="text-sm font-medium text-amber-800 mb-1">Important Note</h4>
            <p className="text-xs text-amber-700">
              Before using this feature you must run the SQL script to add the display_order column to the questions table.
              The script is located at: <code className="bg-amber-100 px-1 py-0.5 rounded">supabase/ultra_simple_admin.sql</code>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionOrderManager;
