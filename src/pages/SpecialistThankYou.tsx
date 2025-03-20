import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const SpecialistThankYou = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md p-6 space-y-4">
                <div className="flex flex-col items-center text-center space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <h1 className="text-2xl font-bold">Thank You</h1>
                    <p className="text-muted-foreground">
                        Your specialist assessment has been submitted successfully.
                        The patient's care team will be notified of your responses.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        You can now close this window.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default SpecialistThankYou; 