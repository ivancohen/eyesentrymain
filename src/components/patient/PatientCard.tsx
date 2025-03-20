import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpecialistTab } from './SpecialistTab';

interface PatientCardProps {
    patientId: string;
    patientName: string;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patientId, patientName }) => {
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{patientName}</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
                        <TabsTrigger value="specialist">Specialist</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Patient Overview</h3>
                            {/* Add patient overview content here */}
                        </div>
                    </TabsContent>
                    <TabsContent value="questionnaire">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Questionnaire Responses</h3>
                            {/* Add questionnaire content here */}
                        </div>
                    </TabsContent>
                    <TabsContent value="specialist">
                        <SpecialistTab patientId={patientId} />
                    </TabsContent>
                    <TabsContent value="history">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Patient History</h3>
                            {/* Add patient history content here */}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}; 