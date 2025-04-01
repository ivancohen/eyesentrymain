import React, { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner"; // For shadcn toast notifications
import { Button } from "@/components/ui/button"; // Import shadcn Button
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from '@/components/ui/data-table';
import { PlusCircle, ArrowUp, ArrowDown, Edit, Trash2, MoveVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
// Import columns from the same directory
import { columns } from './columns';
import SpecialistQuestionForm from './specialist/SpecialistQuestionForm'; // Corrected import
import { SpecialistService } from '@/services/SpecialistService';

export const SpecialistQuestionManager: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch specialist questions on component mount
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching specialist questions...");
      // Use SpecialistService.getQuestions to get specialist questions
      const data = await SpecialistService.getQuestions();
      console.log("Fetched specialist questions:", data);
      setQuestions(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error fetching specialist questions:', error);
      toast.error(`Error fetching specialist questions: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions, refreshTrigger]);

  // Handle opening the modal for editing or creating
  const handleEdit = (item: any) => {
    setCurrentItem(item);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setCurrentItem(null);
    setIsDialogOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    try {
      console.log("Form submitted with data:", data);
      
      // Prepare the question data
      const questionData = {
        ...data,
        is_active: true,
        display_order: questions.length + 1, // Set the display order
      };
      
      let success = false;
      
      if (currentItem) {
        // Update existing question
        console.log("Updating specialist question:", currentItem.id, questionData);
        success = await SpecialistService.updateQuestion(currentItem.id, questionData);
        if (success) {
          toast.success('Specialist question updated');
        }
      } else {
        // Create new question
        console.log("Creating new specialist question:", questionData);
        success = await SpecialistService.createQuestion(questionData);
        if (success) {
          toast.success('Specialist question created');
        }
      }
      
      if (success) {
        // Refresh the table
        setRefreshTrigger(prev => prev + 1);
        setIsDialogOpen(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error saving specialist question:', error);
      toast.error(`Error saving specialist question: ${errorMessage}`);
    }
  };

  // Handle deleting a question
  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        const success = await SpecialistService.deleteQuestion(id);
        if (success) {
          toast.success("Question deleted successfully");
          setRefreshTrigger(prev => prev + 1);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast.error(`Error deleting question: ${errorMessage}`);
      }
    }
  };

  // Handle moving a question up or down
  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    try {
      // Find the question
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        toast.error("Question not found");
        return;
      }
      
      // Find the current index
      const currentIndex = questions.findIndex(q => q.id === questionId);
      if (currentIndex === -1) {
        toast.error("Question not found in list");
        return;
      }

      // Calculate new index
      let newIndex = currentIndex;
      if (direction === 'up' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < questions.length - 1) {
        newIndex = currentIndex + 1;
      } else {
        // Already at the top or bottom
        return;
      }

      // Get the questions to swap
      const currentQuestion = questions[currentIndex];
      const targetQuestion = questions[newIndex];

      // Swap display orders
      const currentOrder = currentQuestion.display_order;
      const targetOrder = targetQuestion.display_order;

      // Update both questions
      await SpecialistService.updateQuestion(currentQuestion.id, {
        ...currentQuestion,
        display_order: targetOrder
      });
      
      await SpecialistService.updateQuestion(targetQuestion.id, {
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

  // Handle drag and drop reordering
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Only handle reordering within the same droppable
    if (source.droppableId !== destination.droppableId) return;

    // Reorder the questions array
    const reorderedQuestions = [...questions];
    const [removed] = reorderedQuestions.splice(source.index, 1);
    reorderedQuestions.splice(destination.index, 0, removed);

    // Update display_order for all questions
    try {
      // Create updates for all questions with new display_order values
      const updates = reorderedQuestions.map((question, index) => ({
        ...question,
        display_order: index + 1
      }));

      // Update each question
      for (const update of updates) {
        await SpecialistService.updateQuestion(update.id, update);
      }

      toast.success("Question order updated");
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error reordering questions:", error);
      toast.error("Failed to update question order");
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Specialist Questions</h2>
        <Button onClick={handleCreate} className="bg-blue-500 hover:bg-blue-600">
          <PlusCircle size={16} className="mr-2" />
          Create New Specialist Question
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner />
          <span className="ml-3 text-lg">Loading specialist questions...</span>
        </div>
      ) : error ? (
        <div className="text-center p-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => setRefreshTrigger(prev => prev + 1)} className="flex items-center gap-2">
            <span>Try Again</span>
          </Button>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center">
          <h3 className="text-lg font-medium mb-2">No Specialist Questions Found</h3>
          <p className="text-gray-500 mb-4">
            There are no specialist questions in the database yet. Click the button above to create your first specialist question.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Specialist Questions</CardTitle>
            <CardDescription>
              {questions.length} questions available for specialists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="specialist-questions">
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
                        {questions.map((question, index) => (
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
                                  {question.dropdown_options && question.dropdown_options.length > 0 && (
                                    <Badge variant="secondary">Has Options</Badge>
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
                                      disabled={index === questions.length - 1}
                                    >
                                      <ArrowDown size={16} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(question)}
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
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      )}
      {/* Dialog for creating/editing questions */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentItem ? 'Edit Specialist Question' : 'Add Specialist Question'}</DialogTitle>
          </DialogHeader>
          <SpecialistQuestionForm
            currentItem={currentItem}
            onSuccess={handleFormSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
