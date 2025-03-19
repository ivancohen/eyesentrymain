import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AIAssistant from "@/components/admin/AIAssistant";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AIAssistantPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-4 mb-8 animate-fade-in">
        <div className="mb-4 flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold ml-2">AI Data Assistant</h1>
        </div>

        <AIAssistant />
      </main>
    </div>
  );
};

export default AIAssistantPage;
