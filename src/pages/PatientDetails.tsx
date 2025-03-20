import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PatientCard } from '@/components/patient/PatientCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';

interface Patient {
    id: string;
    name: string;
    // Add other patient fields as needed
}

const PatientDetails = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { user, isAdmin, loading: authLoading } = useAuth();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check authentication
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        // Check if user is admin
        if (!authLoading && isAdmin) {
            navigate('/new-admin');
            return;
        }

        // Fetch patient data
        const fetchPatient = async () => {
            if (!patientId) return;

            try {
                // TODO: Implement patient data fetching
                // For now, using mock data
                const mockPatient: Patient = {
                    id: patientId,
                    name: "John Doe", // Replace with actual patient name
                };
                setPatient(mockPatient);
            } catch (error) {
                console.error('Error fetching patient:', error);
                toast.error('Failed to load patient data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatient();
    }, [patientId, user, isAdmin, authLoading, navigate]);

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
                <span className="ml-3">Loading patient details...</span>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Patient not found</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6">
            <PatientCard patientId={patient.id} patientName={patient.name} />
        </div>
    );
};

export default PatientDetails; 