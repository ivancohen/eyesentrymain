import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { SpecialistQuestion } from '@/types/specialist';
import { SpecialistQuestionTable } from './specialist/SpecialistQuestionTable';
import { SpecialistQuestionForm } from './specialist/SpecialistQuestionForm';

export const SpecialistQuestionManager: React.FC = () => {
    const [viewMode, setViewMode] = useState<'table' | 'form'>('table');
    const [currentItem, setCurrentItem] = useState<Partial<SpecialistQuestion> | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleAddItem = () => {
        setCurrentItem({
            question: '',
            question_type: 'text',
            display_order: 0,
            required: false,
            is_active: true
        });
        setViewMode('form');
    };

    const handleEditItem = (question: SpecialistQuestion) => {
        setCurrentItem(question);
        setViewMode('form');
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

    const renderContent = () => {
        if (viewMode === 'form') {
            return (
                <SpecialistQuestionForm
                    currentItem={currentItem}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Manage Specialist Questions</h2>
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

                <Card>
                    <SpecialistQuestionTable
                        onEdit={handleEditItem}
                        refreshTrigger={refreshTrigger}
                    />
                </Card>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {renderContent()}
        </div>
    );
}; 