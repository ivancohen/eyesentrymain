import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { SpecialistQuestion, QuestionType } from '@/types/specialist';
import { SpecialistService } from '@/services/SpecialistService';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from '@/components/ui/dialog';

interface SpecialistQuestionFormProps {
    currentItem: Partial<SpecialistQuestion> | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export const SpecialistQuestionForm: React.FC<SpecialistQuestionFormProps> = ({
    currentItem,
    onSuccess,
    onCancel
}) => {
    const [formData, setFormData] = useState<Partial<SpecialistQuestion>>(
        currentItem || {
            question: '',
            question_type: 'text',
            display_order: 0,
            required: false,
            is_active: true,
            dropdown_options: []
        }
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptionsDialog, setShowOptionsDialog] = useState(false);
    const [newOption, setNewOption] = useState('');
    const [dropdownOptions, setDropdownOptions] = useState<string[]>(formData.dropdown_options || []);

    const questionTypes: QuestionType[] = ['text', 'multiline', 'number', 'select'];

    const handleQuestionTypeChange = (value: QuestionType) => {
        setFormData({
            ...formData,
            question_type: value,
            dropdown_options: value === 'select' ? [] : undefined
        });
        if (value === 'select') {
            setShowOptionsDialog(true);
        }
    };

    const handleAddOption = () => {
        if (!newOption.trim()) {
            toast.error('Please enter an option');
            return;
        }
        if (dropdownOptions.includes(newOption.trim())) {
            toast.error('Option already exists');
            return;
        }
        setDropdownOptions([...dropdownOptions, newOption.trim()]);
        setNewOption('');
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = [...dropdownOptions];
        newOptions.splice(index, 1);
        setDropdownOptions(newOptions);
    };

    const handleSaveOptions = () => {
        if (dropdownOptions.length < 2) {
            toast.error('Please add at least two options');
            return;
        }
        setFormData({
            ...formData,
            dropdown_options: dropdownOptions
        });
        setShowOptionsDialog(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddOption();
        }
    };
    
    // Handle drag end event for reordering dropdown options
    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        
        const items = Array.from(dropdownOptions);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        setDropdownOptions(items);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.question || !formData.question_type) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.question_type === 'select' && (!formData.dropdown_options || formData.dropdown_options.length < 2)) {
            toast.error('Please add at least two options for dropdown menu');
            setShowOptionsDialog(true);
            return;
        }

        setIsSubmitting(true);
        try {
            const success = formData.id
                ? await SpecialistService.updateQuestion(formData.id, formData)
                : await SpecialistService.createQuestion(formData);

            if (success) {
                toast.success(formData.id ? 'Question updated' : 'Question created');
                onSuccess();
            }
        } catch (error) {
            console.error('Error saving specialist question:', error);
            toast.error('Failed to save question');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center mb-6">
                    <Button
                        variant="outline"
                        className="mr-4"
                        onClick={onCancel}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Questions
                    </Button>
                    <h2 className="text-xl font-semibold">
                        {currentItem?.id ? 'Edit Question' : 'Add New Question'}
                    </h2>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Question Text *
                            </label>
                            <Input
                                value={formData.question || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        question: e.target.value
                                    })
                                }
                                placeholder="Enter question text"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Question Type *
                            </label>
                            <Select
                                value={formData.question_type}
                                onValueChange={handleQuestionTypeChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select question type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text Input</SelectItem>
                                    <SelectItem value="multiline">Multiline Text</SelectItem>
                                    <SelectItem value="number">Number Input</SelectItem>
                                    <SelectItem value="select">Dropdown Menu</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.question_type === 'select' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Dropdown Options *
                                </label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowOptionsDialog(true)}
                                >
                                    Manage Options ({formData.dropdown_options?.length || 0})
                                </Button>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : (currentItem?.id ? 'Update' : 'Create')}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>

            <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Dropdown Options</DialogTitle>
                        <DialogDescription>
                            Add at least two options for the dropdown menu. Press Enter or click the plus button to add an option.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex space-x-2">
                            <Input
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                placeholder="Enter option text"
                                onKeyPress={handleKeyPress}
                            />
                            <Button type="button" onClick={handleAddOption}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="dropdown-options">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-2 max-h-[200px] overflow-y-auto"
                                    >
                                        {dropdownOptions.map((option, index) => (
                                            <Draggable key={index.toString()} draggableId={index.toString()} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className="flex items-center justify-between bg-muted p-2 rounded"
                                                    >
                                                        <div className="flex items-center">
                                                            <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <span>{option}</span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveOption(index)}
                                                        >
                                                            <X className="h-4 w-4" />
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
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowOptionsDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveOptions}
                            disabled={dropdownOptions.length < 2}
                        >
                            Save Options
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}; 