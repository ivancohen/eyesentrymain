import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, ArrowUp, ArrowDown, Edit, Trash2, MoveVertical } from "lucide-react";
import QuestionFormManager from "../questions/QuestionFormManager";
import { useAuth } from "@/contexts/AuthContext";
import { Question, QuestionService } from "@/services/QuestionService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Define the categories and their display names
const CATEGORIES = [
  { id: "patient_info", name: "Patient Information" },
  { id: "family_medication", name: "Family & Medication" },
  { id: "clinical_measurements", name: "Clinical Measurements" },
];

const EnhancedQuestionManager = () => {
  const { user } = useAuth();
  const [currentItem, setCurrentItem] = useState<Question | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'form'>('table');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Group questions by category
  const questionsByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category.id] = questions.filter(q => q.page_category === category.id)
      .sort((a, b) => a.display_order - b.display_order);
    return acc;
  }, {} as Record<string, Question[]>);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await QuestionService.fetchQuestions();
      setQuestions(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load questions";
      setError(errorMessage);
      toast.error("Error loading questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions, refreshTrigger]);

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

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        await QuestionService.deleteQuestion(id);
        toast.success("Question deleted successfully");
        setRefreshTrigger(prev => prev + 1);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete question";
        toast.error(`Error deleting question: ${errorMessage}`);
      }
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

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    try {
      // Find the question and its category
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        toast.error("Question not found");
        return;
      }

      const category = question.page_category;
      const questionsInCategory = questionsByCategory[category] || [];
      
      // Find the current index
      const currentIndex = questionsInCategory.findIndex(q => q.id === questionId);
      if (currentIndex === -1) {
        toast.error("Question not found in category");
        return;
      }

      // Calculate new index
      let newIndex = currentIndex;
      if (direction === 'up' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < questionsInCategory.length - 1) {
        newIndex = currentIndex + 1;
      } else {
        // Already at the top or bottom
        return;
      }

      // Get the questions to swap
      const currentQuestion = questionsInCategory[currentIndex];
      const targetQuestion = questionsInCategory[newIndex];

      // Swap display orders
      const currentOrder = currentQuestion.display_order;
      const targetOrder = targetQuestion.display_order;

      // Update both questions
      await QuestionService.updateQuestion(currentQuestion.id, { 
        ...currentQuestion, 
        display_order: targetOrder 
      });
      
      await QuestionService.updateQuestion(targetQuestion.id, { 
        ...targetQuestion, 
        display_order: currentOrder 
      });

      toast.success("Question order updated");
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error moving question:", error);
      toast.error("Failed to update question order");
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Only handle reordering within the same category
    if (source.droppableId !== destination.droppableId) return;

    const category = source.droppableId;
    const questionsInCategory = [...(questionsByCategory[category] || [])];
    
    // Reorder the questions array
    const [removed] = questionsInCategory.splice(source.index, 1);
    questionsInCategory.splice(destination.index, 0, removed);

    // Update display_order for all questions in the category
    try {
      // Create updates for all questions with new display_order values
      const updates = questionsInCategory.map((question, index) => ({
        ...question,
        display_order: index + 1
      }));

      // Update each question
      for (const update of updates) {
        await QuestionService.updateQuestion(update.id, update);
      }

      toast.success("Question order updated");
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error reordering questions:", error);
      toast.error("Failed to update question order");
    }
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
      if (isLoading) {
        return (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
            <span className="ml-3 text-lg">Loading questions...</span>
          </div>
        );
      }

      if (error) {
        return (
          <div className="text-center p-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => setRefreshTrigger(prev => prev + 1)} className="flex items-center gap-2">
              <span>Try Again</span>
            </Button>
          </div>
        );
      }

      return (
        <div className="space-y-6">
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

          <DragDropContext onDragEnd={handleDragEnd}>
            {CATEGORIES.map(category => (
              <Card key={category.id} className="mb-6">
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>
                    {questionsByCategory[category.id]?.length || 0} questions in this category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={category.id}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]"></TableHead>
                              <TableHead>Question</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Options</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {questionsByCategory[category.id]?.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                  No questions in this category
                                </TableCell>
                              </TableRow>
                            ) : (
                              questionsByCategory[category.id]?.map((question, index) => (
                                <Draggable 
                                  key={question.id} 
                                  draggableId={question.id} 
                                  index={index}
                                >
                                  {(provided) => (
                                    <TableRow 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="group"
                                    >
                                      <TableCell {...provided.dragHandleProps} className="cursor-move">
                                        <MoveVertical size={16} className="text-muted-foreground opacity-50 group-hover:opacity-100" />
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-medium">{question.question}</div>
                                        {question.tooltip && (
                                          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                            {question.tooltip}
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">{question.question_type}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        {question.has_dropdown_options && (
                                          <Badge variant="secondary">Has Options</Badge>
                                        )}
                                        {question.has_conditional_items && (
                                          <Badge variant="secondary" className="ml-1">Conditional</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleMoveQuestion(question.id, 'up')}
                                            disabled={index === 0}
                                          >
                                            <ArrowUp size={16} />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleMoveQuestion(question.id, 'down')}
                                            disabled={index === questionsByCategory[category.id].length - 1}
                                          >
                                            <ArrowDown size={16} />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditItem(question.id)}
                                          >
                                            <Edit size={16} />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteItem(question.id)}
                                          >
                                            <Trash2 size={16} />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            ))}
          </DragDropContext>
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