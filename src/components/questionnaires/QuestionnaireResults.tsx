import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ContributingFactor {
  question: string;
  answer: string;
  score: number;
}

interface QuestionnaireResultsProps {
  score: number;
  riskLevel: string;
  contributing_factors?: ContributingFactor[];
  advice?: string;
}

const QuestionnaireResults = ({ 
  score, 
  riskLevel, 
  contributing_factors = [],
  advice = ""
}: QuestionnaireResultsProps) => {
  const navigate = useNavigate();

  // Determine the color based on risk level
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'text-green-600';
      case 'moderate':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
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

          {/* Total Score */}
          <div className="text-center mb-8">
            <div className="text-6xl font-bold mb-2">{score}</div>
            <div className={`text-2xl font-semibold ${getRiskColor(riskLevel)}`}>
              {riskLevel} Risk
            </div>
          </div>

          {/* Contributing Factors */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold mb-4">Contributing Factors</h3>
            {contributing_factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">{factor.question}</h4>
                  <p className="text-sm text-muted-foreground">
                    Selected: {factor.answer}
                  </p>
                </div>
                <div className="text-lg font-semibold text-primary">
                  +{factor.score}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations Dialog */}
          <div className="mb-8">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Info className="mr-2 h-4 w-4" />
                  View Recommendations
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Risk Assessment Recommendations</DialogTitle>
                  <DialogDescription>
                    Based on the {riskLevel.toLowerCase()} risk level, here are the recommended actions:
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {advice || "No specific recommendations available at this time."}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Back Button */}
          <div className="mt-8 flex justify-center">
            <Button onClick={() => navigate("/questionnaires")} className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Questionnaires
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionnaireResults;
