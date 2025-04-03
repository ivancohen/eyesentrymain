import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { SpecialistResponse } from '@/types/specialist';
import { SpecialistService } from '@/services/SpecialistService';
import { Clipboard, ClipboardCheck, Calendar, Mail, Check, Copy, RefreshCw, Send, Key, MessageSquare, Loader2 } from 'lucide-react';
import { EmailService } from '@/services/EmailService';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SpecialistTabProps {
    patientId: string;
    patientName?: string;
}

export const SpecialistTab = ({ patientId, patientName }: SpecialistTabProps) => {
    const [responses, setResponses] = useState<SpecialistResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [accessCode, setAccessCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    // Removed email-related state: emailModalOpen, recipientEmail, sendingEmail
    const { user } = useAuth();

    useEffect(() => {
        fetchResponses();
    }, [patientId]);

    const fetchResponses = async () => {
        try {
            const fetchedResponses = await SpecialistService.getPatientResponses(patientId);
            // Sort responses by date, newest first
            const sortedResponses = fetchedResponses.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setResponses(sortedResponses);
        } catch (error) {
            console.error('Error fetching specialist responses:', error);
            toast.error('Failed to load specialist responses');
        } finally {
            setLoading(false);
        }
    };

    const generateAccessCode = async () => {
        try {
            const code = await SpecialistService.generateAccessCode(patientId);
            if (code) {
                setAccessCode(code);
                toast.success('Access code generated successfully');
            }
        } catch (error) {
            console.error('Error generating access code:', error);
            toast.error('Failed to generate access code');
        }
    };

    const copyAccessLink = async () => {
        if (!accessCode) return;

        const link = `${window.location.origin}/specialist/${accessCode}`;
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            toast.success('Link copied to clipboard');
            setTimeout(() => setCopied(false), 3000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            toast.error('Failed to copy link');
        }
    };

    // Removed handleSendEmail function

    const formatDate = (date: string) => {
        const d = new Date(date);
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(d);
    };

    // Fetch questions to get their display order
    const [questions, setQuestions] = useState<Record<string, number>>({});
    
    useEffect(() => {
        async function fetchQuestionOrder() {
            try {
                const fetchedQuestions = await SpecialistService.getQuestions();
                // Create a map of question ID to display order
                const questionOrderMap = fetchedQuestions.reduce((map, q) => {
                    map[q.id] = q.display_order || 0;
                    return map;
                }, {} as Record<string, number>);
                setQuestions(questionOrderMap);
            } catch (error) {
                console.error('Error fetching question order:', error);
            }
        }
        
        fetchQuestionOrder();
    }, []);
    
    // Group responses by date (YYYY-MM-DD)
    const groupedResponses = responses.reduce((groups, response) => {
        const date = new Date(response.created_at).toISOString().split('T')[0];
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(response);
        return groups;
    }, {} as Record<string, SpecialistResponse[]>);
    
    // Sort responses within each date group by question display order
    Object.keys(groupedResponses).forEach(date => {
        groupedResponses[date].sort((a, b) => {
            const orderA = questions[a.question_id] || 0;
            const orderB = questions[b.question_id] || 0;
            return orderA - orderB;
        });
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Specialist Access</h3>
                    <p className="text-sm text-muted-foreground">
                        Generate and share an access code for specialists to view and respond to this patient's questionnaire.
                    </p>
                </div>
                
                {accessCode ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Input
                                value={`${window.location.origin}/specialist/${accessCode}`}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={copyAccessLink}
                                className="shrink-0"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {/* Removed Email Button */}
                        {/* Kept Refresh Button */}
                        <Button
                            variant="outline"
                            onClick={() => setAccessCode(null)}
                            className="shrink-0"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <Button onClick={generateAccessCode} disabled={loading}>
                        <Key className="h-4 w-4 mr-2" />
                        Generate Access Code
                    </Button>
                )}
            </div>

            {/* Removed Email Dialog */}

            {responses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No specialist responses yet.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedResponses).map(([date, dateResponses]) => (
                        <div key={date} className="space-y-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <h3 className="font-medium">
                                    {formatDate(date)}
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {dateResponses.map((response) => (
                                    <Card key={response.id} className="p-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium">
                                                {response.question?.question}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                {response.response}
                                            </p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}; 