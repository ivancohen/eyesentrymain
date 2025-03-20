import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import { SpecialistService } from '@/services/SpecialistService';
import { SpecialistQuestionnaireForm } from '@/components/specialist/SpecialistQuestionnaireForm';

const SpecialistQuestionnaire = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [isValidating, setIsValidating] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [accessCode, setAccessCode] = useState(code || '');

    const validateAccessCode = async () => {
        if (!accessCode) {
            toast.error('Please enter an access code');
            return;
        }

        setIsValidating(true);
        try {
            const validatedPatientId = await SpecialistService.validateAccessCode(accessCode);
            if (validatedPatientId) {
                setPatientId(validatedPatientId);
                setIsValidated(true);
            } else {
                toast.error('Invalid or expired access code');
                // If code was in URL, clear it
                if (code) {
                    navigate('/specialist', { replace: true });
                }
            }
        } catch (error) {
            console.error('Error validating access code:', error);
            toast.error('Failed to validate access code');
            // If code was in URL, clear it
            if (code) {
                navigate('/specialist', { replace: true });
            }
        } finally {
            setIsValidating(false);
        }
    };

    // If access code is provided in URL or state, validate it automatically
    React.useEffect(() => {
        if (accessCode && !isValidated && !isValidating) {
            validateAccessCode();
        }
    }, [accessCode]);

    if (isValidating) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <div className="flex items-center">
                    <LoadingSpinner />
                    <span className="ml-3 text-lg">Validating access code...</span>
                </div>
            </div>
        );
    }

    if (!isValidated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md p-6 space-y-4">
                    <h1 className="text-2xl font-bold text-center">Specialist Access</h1>
                    <p className="text-center text-muted-foreground">
                        Please enter the access code provided to you to submit your specialist assessment.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <Input
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="Enter access code"
                                className="text-center text-xl tracking-wider"
                            />
                        </div>
                        <Button
                            onClick={validateAccessCode}
                            className="w-full"
                            disabled={isValidating}
                        >
                            Continue
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto py-8">
                <SpecialistQuestionnaireForm
                    patientId={patientId!}
                    accessCode={accessCode}
                />
            </div>
        </div>
    );
};

export default SpecialistQuestionnaire; 