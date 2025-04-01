import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import { SpecialistQuestion, SpecialistSubmission } from '@/types/specialist';
import { SpecialistService } from '@/services/SpecialistService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SpecialistQuestionnaireFormProps {
    patientId: string;
    accessCode: string;
}

export const SpecialistQuestionnaireForm: React.FC<SpecialistQuestionnaireFormProps> = ({
    patientId,
    accessCode
}) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [questions, setQuestions] = useState<SpecialistQuestion[]>([]);
    const [responses, setResponses] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const fetchedQuestions = await SpecialistService.getQuestions();
            setQuestions(fetchedQuestions);
        } catch (error) {
            console.error('Error fetching specialist questions:', error);
            toast.error('Failed to load questions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required questions
        const unansweredRequired = questions.filter(q => 
            q.required && (!responses[q.id] || responses[q.id].trim() === '')
        );

        if (unansweredRequired.length > 0) {
            toast.error(`Please answer all required questions (${unansweredRequired.length} remaining)`);
            return;
        }

        setIsSubmitting(true);
        try {
            const submission: SpecialistSubmission = {
                patient_id: patientId,
                access_code: accessCode,
                responses: questions.map(q => ({
                    question_id: q.id,
                    response: responses[q.id] || ''
                }))
            };

            const success = await SpecialistService.submitSpecialistResponses(submission);
            if (success) {
                toast.success('Responses submitted successfully');
                // Show a thank you message and redirect after a delay
                setTimeout(() => {
                    navigate('/specialist-thank-you');
                }, 2000);
            } else {
                toast.error('Failed to submit responses');
            }
        } catch (error) {
            console.error('Error submitting responses:', error);
            toast.error('Failed to submit responses');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderQuestionInput = (question: SpecialistQuestion) => {
        switch (question.question_type) {
            case 'select':
                return (
                    <Select
                        value={responses[question.id] || ''}
                        onValueChange={(value) => setResponses(prev => ({
                            ...prev,
                            [question.id]: value
                        }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                            {question.dropdown_options?.map((option, index) => (
                                <SelectItem key={index} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'text':
                return (
                    <Input
                        value={responses[question.id] || ''}
                        onChange={(e) => setResponses(prev => ({
                            ...prev,
                            [question.id]: e.target.value
                        }))}
                        placeholder="Enter your answer"
                        required={question.required}
                    />
                );
            case 'multiline':
                return (
                    <Textarea
                        value={responses[question.id] || ''}
                        onChange={(e) => setResponses(prev => ({
                            ...prev,
                            [question.id]: e.target.value
                        }))}
                        placeholder="Enter your answer"
                        required={question.required}
                    />
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={responses[question.id] || ''}
                        onChange={(e) => setResponses(prev => ({
                            ...prev,
                            [question.id]: e.target.value
                        }))}
                        placeholder="Enter a number"
                        required={question.required}
                    />
                );
            default:
                return (
                    <Input
                        value={responses[question.id] || ''}
                        onChange={(e) => setResponses(prev => ({
                            ...prev,
                            [question.id]: e.target.value
                        }))}
                        placeholder="Enter your answer"
                        required={question.required}
                    />
                );
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
                <span className="ml-3">Loading questions...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
            <Card className="p-6">
                <div className="flex flex-col items-center mb-8">
                    <img
                        src="/logo.png"
                        alt="EyeSentry Logo"
                        className="w-full max-w-md h-auto mb-6"
                    />
                    <h1 className="text-2xl font-bold text-center">Specialist Assessment Form</h1>
                </div>
                
                <div className="space-y-6">
                    {questions.map((question) => (
                        <div key={question.id} className="space-y-2">
                            <label className="block text-sm font-medium">
                                {question.question}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {renderQuestionInput(question)}
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                    </Button>
                </div>
            </Card>
        </form>
    );
}; 