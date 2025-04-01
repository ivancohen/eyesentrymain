'use client';

import React, { useState, useEffect } from 'react';
import { FixedAdminService, ClinicalResource } from '@/services/FixedAdminService';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import ClinicalResourcesTable from '@/components/admin/ClinicalResourcesTable';
import ClinicalResourceForm from '@/components/admin/ClinicalResourceForm';
// import ClinicalResourceForm from '@/components/admin/ClinicalResourceForm';

const ClinicalResourcesAdminPage: React.FC = () => {
  const [resources, setResources] = useState<ClinicalResource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedResource, setSelectedResource] = useState<ClinicalResource | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const data = await FixedAdminService.fetchClinicalResources();
      setResources(data);
    } catch (error) {
      // Error is already handled by toast in the service
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddResource = () => {
    setSelectedResource(null);
    setIsFormOpen(true);
  };

  const handleEditResource = (resource: ClinicalResource) => {
    setSelectedResource(resource);
    setIsFormOpen(true);
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }
    const success = await FixedAdminService.deleteClinicalResource(resourceId);
    if (success) {
      fetchResources(); // Refresh the list
    }
  };

  const handleFormClose = (refresh: boolean) => {
    setIsFormOpen(false);
    setSelectedResource(null);
    if (refresh) {
      fetchResources();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manage Clinical Resources</h1>
        <Button onClick={handleAddResource}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Resource
        </Button>
      </div>

      {isLoading ? (
        <p>Loading resources...</p>
      ) : (
        <ClinicalResourcesTable
          resources={resources}
          onEdit={handleEditResource}
          onDelete={handleDeleteResource}
        />
      )}

      {/* Placeholder for the form modal */}
      {isFormOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
           <div className="bg-white p-6 rounded-lg shadow-lg w-1/2 max-h-[80vh] overflow-y-auto">
             <h2 className="text-xl font-semibold mb-4">{selectedResource ? 'Edit' : 'Add'} Resource</h2>
             <ClinicalResourceForm resource={selectedResource} onClose={handleFormClose} />
             {/* Cancel button is now part of the form */}
            </div>
         </div>
      )}
    </div>
  );
};

export default ClinicalResourcesAdminPage;