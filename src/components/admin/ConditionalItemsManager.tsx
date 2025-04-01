import React, { useState, useEffect } from 'react';
import { Question, ConditionalItem, QuestionService } from '@/services/QuestionService'; // Assuming types are exported
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from 'lucide-react';
import { toast } from "sonner";

interface ConditionalItemsManagerProps {
  questionId: string; // The ID of the question these conditions apply TO
}

const ConditionalItemsManager: React.FC<ConditionalItemsManagerProps> = ({ questionId }) => {
  const [conditionalItems, setConditionalItems] = useState<ConditionalItem[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- State for the 'Add New Rule' form ---
  const [newParentQuestionId, setNewParentQuestionId] = useState<string>('');
  const [newRequiredValue, setNewRequiredValue] = useState<string>('');
  const [newDisplayMode, setNewDisplayMode] = useState<'show' | 'hide' | 'disable'>('show');
  // TODO: Add state for dynamically loading parent question options based on newParentQuestionId

  useEffect(() => {
    // Fetch existing conditional items for this question and all questions for the dropdown
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Implement QuestionService.fetchConditionalItems(questionId)
        // const items = await QuestionService.fetchConditionalItems(questionId);
        // setConditionalItems(items);
        console.warn(`ConditionalItemsManager: fetchConditionalItems for ${questionId} not implemented yet.`);
        setConditionalItems([]); // Placeholder

        // Fetch all questions for the parent dropdown
        const questions = await QuestionService.fetchQuestions();
        // Filter out the current question itself from the list of potential parents
        setAllQuestions(questions.filter(q => q.id !== questionId));

      } catch (err) {
        console.error("Error fetching data for ConditionalItemsManager:", err);
        setError("Failed to load conditional logic data.");
        toast.error("Failed to load conditional logic data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [questionId]);

  const handleAddRule = async () => {
    if (!newParentQuestionId || !newRequiredValue) {
        toast.error("Please select a parent question and specify a required value.");
        return;
    }
    // TODO: Implement saving logic using QuestionService.saveConditionalItem
    console.warn("ConditionalItemsManager: handleAddRule not implemented yet.");
    const newItemData: Partial<ConditionalItem> = {
        question_id: questionId,
        parent_question_id: newParentQuestionId,
        required_value: newRequiredValue,
        display_mode: newDisplayMode,
    };
    toast.info(`Would save rule: ${JSON.stringify(newItemData)}`);
    // Reset form after mock save
    setNewParentQuestionId('');
    setNewRequiredValue('');
    setNewDisplayMode('show');
  };

  const handleDeleteRule = async (itemId: string) => {
    // TODO: Implement deletion logic using QuestionService.deleteConditionalItem
    console.warn(`ConditionalItemsManager: handleDeleteRule for ${itemId} not implemented yet.`);
    toast.info(`Would delete rule ID: ${itemId}`);
  };

  if (isLoading) {
    return <div>Loading conditional rules...</div>;
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  return (
    <div className="mt-6 border-t pt-6 space-y-4">
      <h3 className="text-lg font-medium">Conditional Display Logic</h3>
      <p className="text-sm text-muted-foreground">
        Define rules to show, hide, or disable this question based on answers to other questions.
      </p>

      {/* List Existing Rules */}
      <div className="space-y-2">
        <Label>Existing Rules:</Label>
        {conditionalItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No conditional rules defined for this question.</p>
        ) : (
          conditionalItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
              <span className="text-sm">
                {/* TODO: Display parent question text instead of ID */}
                If Question <span className="font-mono text-xs">{item.parent_question_id}</span> is <span className="font-medium">{item.required_value}</span>, then <span className="font-medium">{item.display_mode}</span> this question.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => item.id && handleDeleteRule(item.id)}
                disabled={!item.id} // Disable if ID is missing (shouldn't happen)
                className="text-destructive"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Add New Rule Form */}
      <div className="space-y-3 border-t pt-4">
         <Label>Add New Rule:</Label>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Parent Question */}
            <div>
                <Label htmlFor="parent-question">Parent Question</Label>
                <Select value={newParentQuestionId} onValueChange={setNewParentQuestionId}>
                    <SelectTrigger id="parent-question" className="mt-1">
                        <SelectValue placeholder="Select parent question..." />
                    </SelectTrigger>
                    <SelectContent>
                        {allQuestions.map(q => (
                            <SelectItem key={q.id} value={q.id}>
                                {q.question} ({q.id.substring(0, 8)}) {/* Show text and part of ID */}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Required Value */}
            <div>
                <Label htmlFor="required-value">Required Parent Answer</Label>
                {/* TODO: Make this a dropdown based on selected parent question's options */}
                <Input
                    id="required-value"
                    value={newRequiredValue}
                    onChange={(e) => setNewRequiredValue(e.target.value)}
                    placeholder="Enter required value (e.g., 'yes')"
                    className="mt-1"
                    disabled={!newParentQuestionId} // Disable until parent is selected
                />
            </div>

            {/* Display Mode */}
            <div>
                <Label htmlFor="display-mode">Action</Label>
                <Select value={newDisplayMode} onValueChange={(v) => setNewDisplayMode(v as 'show' | 'hide' | 'disable')}>
                    <SelectTrigger id="display-mode" className="mt-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="show">Show this question</SelectItem>
                        <SelectItem value="hide">Hide this question</SelectItem>
                        <SelectItem value="disable">Disable this question</SelectItem>
                    </SelectContent>
                </Select>
            </div>
         </div>
         <Button onClick={handleAddRule} size="sm" className="mt-2">
            <Plus size={16} className="mr-1" /> Add Rule
         </Button>
      </div>
    </div>
  );
};

export default ConditionalItemsManager;