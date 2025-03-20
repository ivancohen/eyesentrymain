import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';

interface Patient {
    id: string;
    name: string;
    // Add other patient fields as needed
}

const Patients = () => {
    const navigate = useNavigate();
    const { user, isAdmin, loading: authLoading } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

        // Fetch patients data
        const fetchPatients = async () => {
            try {
                // TODO: Implement patients data fetching
                // For now, using mock data
                const mockPatients: Patient[] = [
                    { id: '1', name: 'John Doe' },
                    { id: '2', name: 'Jane Smith' },
                    { id: '3', name: 'Bob Johnson' },
                ];
                setPatients(mockPatients);
            } catch (error) {
                console.error('Error fetching patients:', error);
                toast.error('Failed to load patients');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatients();
    }, [user, isAdmin, authLoading, navigate]);

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
                <span className="ml-3">Loading patients...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Patients</h1>
                <p className="text-muted-foreground">
                    View and manage your patients
                </p>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search patients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPatients.map((patient) => (
                    <Card key={patient.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCircle className="h-5 w-5 text-orange-500" />
                                {patient.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                className="w-full"
                                onClick={() => navigate(`/patient/${patient.id}`)}
                            >
                                View Details
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredPatients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No patients found
                </div>
            )}
        </div>
    );
};

export default Patients; 