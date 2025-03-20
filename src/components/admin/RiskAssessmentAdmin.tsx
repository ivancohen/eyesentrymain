'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { riskAssessmentService } from "@/services/RiskAssessmentService";
import type { RiskAssessmentAdvice } from "@/services/RiskAssessmentService";

const RISK_LEVELS = [
  { id: 'low', label: 'Low Risk', color: 'text-green-600' },
  { id: 'moderate', label: 'Moderate Risk', color: 'text-yellow-600' },
  { id: 'high', label: 'High Risk', color: 'text-red-600' }
];

export default function RiskAssessmentAdmin() {
  const [adviceList, setAdviceList] = useState<RiskAssessmentAdvice[]>([]);
  const [formValues, setFormValues] = useState<Record<string, RiskAssessmentAdvice>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAdvice();
  }, []);

  const loadAdvice = async () => {
    try {
      const advice = await riskAssessmentService.getAdvice();
      setAdviceList(advice);
      
      // Initialize form values with current advice
      const initialFormValues: Record<string, RiskAssessmentAdvice> = {};
      
      // Initialize form values for all risk levels
      RISK_LEVELS.forEach(level => {
        const existingAdvice = advice.find(a => a.risk_level === level.id);
        initialFormValues[level.id] = existingAdvice || {
          min_score: 0,
          max_score: 0,
          advice: "",
          risk_level: level.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      setFormValues(initialFormValues);
    } catch (error) {
      console.error("Error loading advice:", error);
      toast.error("Failed to load risk assessment advice");
    }
  };

  const handleInputChange = (levelId: string, field: keyof RiskAssessmentAdvice, value: string | number) => {
    setFormValues(prev => ({
      ...prev,
      [levelId]: {
        ...prev[levelId],
        [field]: field === 'min_score' || field === 'max_score' ? Number(value) || 0 : value || "",
        risk_level: levelId
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Convert form values to advice objects
      const adviceEntries = Object.entries(formValues).map(([level, values]) => ({
        min_score: Number(values.min_score) || 0,
        max_score: Number(values.max_score) || 0,
        advice: values.advice || "",
        risk_level: level
      }));

      // Save each advice entry
      await Promise.all(adviceEntries.map(advice => 
        riskAssessmentService.updateAdvice(advice)
      ));

      toast.success('Risk assessment advice updated successfully');
      await loadAdvice(); // Reload the advice to show updated values
    } catch (error) {
      console.error('Error saving advice:', error);
      toast.error('Failed to update risk assessment advice');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Configuration</CardTitle>
          <CardDescription>
            Configure the score ranges and advice for each risk level. These settings will be used to determine the patient's risk level and provide appropriate recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {RISK_LEVELS.map((level) => {
            const advice = formValues[level.id] || {
              min_score: 0,
              max_score: 0,
              advice: "",
              risk_level: level.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            return (
              <Card key={level.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-medium ${level.color}`}>{level.label}</h3>
                      <div className="text-sm text-muted-foreground">
                        Score Range: {advice.min_score} - {advice.max_score}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Score</Label>
                        <Input
                          type="number"
                          value={advice.min_score}
                          onChange={(e) => handleInputChange(level.id, 'min_score', e.target.value)}
                          min={0}
                          max={10}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Score</Label>
                        <Input
                          type="number"
                          value={advice.max_score}
                          onChange={(e) => handleInputChange(level.id, 'max_score', e.target.value)}
                          min={0}
                          max={10}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Recommendations</Label>
                      <Textarea
                        value={advice.advice}
                        onChange={(e) => handleInputChange(level.id, 'advice', e.target.value)}
                        placeholder={`Enter recommendations for ${level.label.toLowerCase()} risk level`}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Preview</CardTitle>
          <CardDescription>
            This is how the risk assessment results will be displayed to patients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Risk Assessment Complete</h2>
              <p className="text-muted-foreground">Based on the questionnaire responses, we've determined the following:</p>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-md mb-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Total Score:</p>
                <p className="text-2xl font-bold">0-10 points</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Risk Level Categories:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {RISK_LEVELS.map((level) => {
                    const advice = formValues[level.id] || {
                      min_score: 0,
                      max_score: 0
                    };
                    return (
                      <li key={level.id}>
                        <span className={`font-semibold ${level.color}`}>{level.label}:</span> Score of {advice.min_score}-{advice.max_score}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 