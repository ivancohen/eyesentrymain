
import { useState, useEffect } from "react";
import { ConditionalItem, Question, QuestionService } from "@/services/QuestionService";
import { CONDITIONAL_ITEM_FIELDS, generateScoreOptions } from "@/constants/questionConstants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataForm from "@/components/DataForm";
import { Plus, AlertCircle, Trash, Award } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ConditionalItemsManagerProps {
  questionId: string;
  hasScore?: boolean;
}

const ConditionalItemsManager = ({ questionId, hasScore = false }: ConditionalItemsManagerProps) => {
  const [items, setItems] = useState<ConditionalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentItem, setCurrentItem] = useState<ConditionalItem | null>(null);
  
  // Create a modified version of the fields that includes the score field when necessary
  const getFormFields = () => {
    const fields = [...CONDITIONAL_ITEM_FIELDS];
    
    // Find the score field and modify its condition
    const scoreField = fields.find(field => field.key === 'score');
    if (scoreField) {
      // We'll handle the condition in the component rather than the field definition
      delete scoreField.condition;
      
      // Only show the score field if hasScore is true
      if (!hasScore) {
        return fields.filter(field => field.key !== 'score');
      }
    }
    
    return fields;
  };

  useEffect(() => {
    if (questionId) {
      loadConditionalItems();
    }
  }, [questionId]);

  const loadConditionalItems = async () => {
    setIsLoading(true);
    try {
      const items = await QuestionService.fetchConditionalItems(questionId);
      setItems(items);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setCurrentItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: ConditionalItem) => {
    setCurrentItem(item);
    setShowForm(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this conditional item?")) {
      setIsLoading(true);
      try {
        const success = await QuestionService.deleteConditionalItem(id);
        if (success) {
          toast.success("Conditional item deleted successfully");
          loadConditionalItems();
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFormSubmit = async (formData: Record<string, any>) => {
    setIsLoading(true);
    try {
      const itemData: Partial<ConditionalItem> = {
        ...formData,
        question_id: questionId,
        id: currentItem?.id,
      };

      const success = await QuestionService.saveConditionalItem(itemData);
      if (success) {
        toast.success(currentItem ? "Conditional item updated" : "Conditional item added");
        setShowForm(false);
        loadConditionalItems();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mt-6 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Conditional Items</h2>
        <Button onClick={handleAddItem} className="hover-lift">
          <Plus size={16} className="mr-2" />
          Add Conditional Item
        </Button>
      </div>

      {showForm ? (
        <DataForm
          title={currentItem ? "Edit Conditional Item" : "Add Conditional Item"}
          fields={getFormFields()}
          initialData={currentItem || {}}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isLoading}
        />
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No conditional items have been added yet. Click "Add Conditional Item" to create one.
              </AlertDescription>
            </Alert>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="hover:bg-secondary/10 transition-colors">
                <CardHeader className="flex flex-row items-start justify-between p-4">
                  <div>
                    <CardTitle className="text-md">
                      {item.condition_type}: {item.condition_value}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditItem(item)}
                      className="h-8 w-8 p-0"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 w-8 p-0"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-muted-foreground mb-2">Response: {item.response_message}</p>
                  {hasScore && (
                    <div className="flex items-center gap-1">
                      <Award size={16} className="text-amber-500" />
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700">
                        Score: {item.score || 0} points
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ConditionalItemsManager;
