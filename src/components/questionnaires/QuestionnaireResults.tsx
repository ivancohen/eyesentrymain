
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

interface QuestionnaireResultsProps {
  score: number;
  riskLevel: string;
}

const QuestionnaireResults = ({ score, riskLevel }: QuestionnaireResultsProps) => {
  const navigate = useNavigate();
  
  // Function to get the appropriate color class based on risk level
  const getRiskColorClass = () => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return "text-red-600 font-bold";
      case 'medium':
      case 'moderate':
        return "text-yellow-600 font-bold";
      case 'low':
        return "text-green-600 font-bold";
      default:
        return "text-blue-600 font-bold";
    }
  };
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <FileText size={20} />
          Questionnaire Results
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold mb-2">Risk Assessment Complete</h2>
          <p className="text-muted-foreground">Based on the questionnaire responses, we've determined the following:</p>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-md mb-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Total Score:</p>
            <p className="text-2xl font-bold">{score} points</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Risk Level:</p>
            <p className={`text-2xl ${getRiskColorClass()}`}>{riskLevel}</p>
          </div>
        </div>
        
        <div className="text-sm mb-6">
          <p className="mb-2">Risk Level Categories:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="text-green-600 font-semibold">Low Risk:</span> Score of 0</li>
            <li><span className="text-yellow-600 font-semibold">Moderate Risk:</span> Score of 2</li>
            <li><span className="text-red-600 font-semibold">High Risk:</span> Score of 4 or higher</li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={16} />
            Return to Dashboard
          </Button>
          
          <Button 
            onClick={() => navigate("/questionnaires")}
          >
            View All Questionnaires
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionnaireResults;
