import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult } from 'react-beautiful-dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { QuestionService, DropdownOption } from '@/services/QuestionService';
import { toast } from 'sonner';

interface DropdownOptionManagerProps {
  questionId: string;
  onOptionsChange?: (options: DropdownOption[]) => void;
}

const DropdownOptionManager: React.FC<DropdownOptionManagerProps> = ({ 
  questionId,
  onOptionsChange
}) => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOption, setNewOption] = useState({ text: '', value: '', score: 0 });

  // Fetch options when the component mounts or questionId changes
  useEffect(() => {
    const fetchOptions = async () => {
      if (!questionId) return;
      
      setLoading(true);
      try {
        const fetchedOptions = await QuestionService.fetchDropdownOptions(questionId);
        setOptions(fetchedOptions);
        if (onOptionsChange) {
          onOptionsChange(fetchedOptions);
        }
      } catch (error) {
        console.error('Error fetching dropdown options:', error);
        toast.error('Failed to load dropdown options');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [questionId]);

  // Handle drag end event
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(options);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update the display order based on the new positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index + 1
    }));
    
    setOptions(updatedItems);
    
    if (onOptionsChange) {
      onOptionsChange(updatedItems);
    }
    
    // Save the new order to the database
    try {
      // Create an array of updates to send to the server
      const updates = updatedItems.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));
      
      // Update each option with its new display_order
      for (const update of updates) {
        await QuestionService.updateDropdownOption(update.id, { display_order: update.display_order });
      }
      
      toast.success('Option order updated successfully');
    } catch (error) {
      console.error('Error updating option order:', error);
      toast.error('Failed to update option order');
    }
  };

  // Add a new option
  const handleAddOption = async () => {
    if (!newOption.text || !newOption.value) {
      toast.error('Option text and value are required');
      return;
    }
    
    try {
      const createdOption = await QuestionService.createDropdownOption({
        question_id: questionId,
        option_text: newOption.text,
        option_value: newOption.value,
        score: Number(newOption.score) || 0,
        display_order: options.length + 1
      });
      
      setOptions([...options, createdOption]);
      setNewOption({ text: '', value: '', score: 0 });
      
      if (onOptionsChange) {
        onOptionsChange([...options, createdOption]);
      }
      
      toast.success('Option added successfully');
    } catch (error) {
      console.error('Error adding option:', error);
      toast.error('Failed to add option');
    }
  };

  // Delete an option
  const handleDeleteOption = async (optionId: string) => {
    try {
      await QuestionService.deleteDropdownOption(optionId);
      
      const updatedOptions = options.filter(option => option.id !== optionId);
      setOptions(updatedOptions);
      
      if (onOptionsChange) {
        onOptionsChange(updatedOptions);
      }
      
      toast.success('Option deleted successfully');
    } catch (error) {
      console.error('Error deleting option:', error);
      toast.error('Failed to delete option');
    }
  };

  // Update an option
  const handleUpdateOption = async (optionId: string, field: string, value: string | number) => {
    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return { ...option, [field]: value };
      }
      return option;
    });
    
    setOptions(updatedOptions);
    
    if (onOptionsChange) {
      onOptionsChange(updatedOptions);
    }
    
    try {
      const option = options.find(o => o.id === optionId);
      if (!option) return;
      
      await QuestionService.updateDropdownOption(optionId, { 
        [field]: field === 'score' ? Number(value) : value 
      });
    } catch (error) {
      console.error('Error updating option:', error);
      toast.error('Failed to update option');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading options...</div>;
  }

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Dropdown Options</h3>
        
        {/* Drag and drop context for reordering options */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dropdown-options">
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 mb-4"
              >
                {options.map((option, index) => (
                  <Draggable key={option.id} draggableId={option.id} index={index}>
                    {(provided: DraggableProvided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-2 p-2 border rounded-md bg-background"
                      >
                        <div {...provided.dragHandleProps} className="cursor-grab">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
                        <Input
                          value={option.option_text}
                          onChange={(e) => handleUpdateOption(option.id, 'option_text', e.target.value)}
                          placeholder="Option text"
                          className="flex-1"
                        />
                        
                        <Input
                          value={option.option_value}
                          onChange={(e) => handleUpdateOption(option.id, 'option_value', e.target.value)}
                          placeholder="Option value"
                          className="flex-1"
                        />
                        
                        <Input
                          type="number"
                          value={option.score || 0}
                          onChange={(e) => handleUpdateOption(option.id, 'score', e.target.value)}
                          placeholder="Score"
                          className="w-20"
                        />
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOption(option.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        {/* Form for adding new options */}
        <div className="flex items-end gap-2 mt-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Text</label>
            <Input
              value={newOption.text}
              onChange={(e) => setNewOption({ ...newOption, text: e.target.value })}
              placeholder="Option text"
            />
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Value</label>
            <Input
              value={newOption.value}
              onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
              placeholder="Option value"
            />
          </div>
          
          <div className="w-20">
            <label className="text-sm font-medium mb-1 block">Score</label>
            <Input
              type="number"
              value={newOption.score}
              onChange={(e) => setNewOption({ ...newOption, score: Number(e.target.value) || 0 })}
              placeholder="Score"
            />
          </div>
          
          <Button onClick={handleAddOption} className="ml-2">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DropdownOptionManager;