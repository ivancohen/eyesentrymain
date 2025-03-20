import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { SpecialistQuestion } from '@/types/specialist';
import { SpecialistService } from '@/services/SpecialistService';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SpecialistQuestionTableProps {
    onEdit: (question: SpecialistQuestion) => void;
    refreshTrigger: number;
}

interface SortableRowProps {
    question: SpecialistQuestion;
    onEdit: (question: SpecialistQuestion) => void;
    onDelete: (id: string) => void;
}

interface OrderUpdate {
    id: string;
    display_order: number;
}

const SortableRow: React.FC<SortableRowProps> = ({ question, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        transform,
        transition,
        setNodeRef,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/50">
            <TableCell>
                <div className="flex items-center gap-2">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab hover:bg-muted rounded p-1"
                    >
                        <DragHandleDots2Icon className="h-4 w-4" />
                    </button>
                    {question.display_order}
                </div>
            </TableCell>
            <TableCell>{question.question}</TableCell>
            <TableCell>{question.question_type}</TableCell>
            <TableCell>{question.required ? 'Yes' : 'No'}</TableCell>
            <TableCell>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => onEdit(question)}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => onDelete(question.id)}
                    >
                        Delete
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};

export const SpecialistQuestionTable: React.FC<SpecialistQuestionTableProps> = ({
    onEdit,
    refreshTrigger
}) => {
    const [questions, setQuestions] = useState<SpecialistQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        })
    );

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const fetchedQuestions = await SpecialistService.getQuestions();
            setQuestions(fetchedQuestions);
        } catch (error) {
            console.error('Error fetching specialist questions:', error);
            toast.error('Failed to load specialist questions');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [refreshTrigger]);

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            const success = await SpecialistService.deleteQuestion(id);
            if (success) {
                toast.success('Question deleted');
                fetchQuestions();
            }
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update display_order values
                const updates: OrderUpdate[] = newItems.map((item, index) => ({
                    id: item.id,
                    display_order: index + 1
                }));

                // Update in database
                SpecialistService.updateQuestionOrder(updates).catch((error) => {
                    console.error('Error updating question order:', error);
                    toast.error('Failed to update question order');
                    fetchQuestions(); // Reload original order on error
                });

                return newItems.map((item, index) => ({
                    ...item,
                    display_order: index + 1
                }));
            });
        }

        setActiveId(null);
    };

    if (isLoading) {
        return <div>Loading questions...</div>;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <SortableContext
                        items={questions.map(q => q.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {questions.map((question) => (
                            <SortableRow
                                key={question.id}
                                question={question}
                                onEdit={onEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </SortableContext>
                </TableBody>
            </Table>
            <DragOverlay>
                {activeId ? (
                    <Table>
                        <TableBody>
                            <SortableRow
                                question={questions.find(q => q.id === activeId)!}
                                onEdit={onEdit}
                                onDelete={handleDelete}
                            />
                        </TableBody>
                    </Table>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}; 