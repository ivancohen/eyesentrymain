// Script to directly fix the RiskAssessmentAdmin component display issues
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function directFixRiskAssessmentAdmin() {
  try {
    console.log("=".repeat(80));
    console.log("DIRECT FIX FOR RISK ASSESSMENT ADMIN DISPLAY ISSUES");
    console.log("=".repeat(80));
    
    // Step 1: Fix the RiskAssessmentAdmin.tsx file
    console.log("\n1️⃣ Fixing RiskAssessmentAdmin.tsx...");
    
    const adminPath = path.join(__dirname, 'src', 'components', 'admin', 'RiskAssessmentAdmin.tsx');
    
    // Create a backup of the current file
    const adminBackupPath = path.join(__dirname, 'src', 'components', 'admin', `RiskAssessmentAdmin.tsx.direct-fix-backup-${Date.now()}`);
    
    if (fs.existsSync(adminPath)) {
      fs.copyFileSync(adminPath, adminBackupPath);
      console.log(`✅ Created backup at ${adminBackupPath}`);
    } else {
      console.error("❌ RiskAssessmentAdmin.tsx not found");
      process.exit(1);
    }
    
    // Read the current content
    const adminContent = fs.readFileSync(adminPath, 'utf8');
    
    // Create a completely new version of the component
    const newAdminContent = `'use client';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdvice();
  }, []);

  const loadAdvice = async () => {
    try {
      setIsLoading(true);
      console.log("Loading advice...");
      
      const advice = await riskAssessmentService.getAdvice();
      console.log("Loaded advice:", advice);
      setAdviceList(advice);
      
      // Initialize form values with current advice
      const initialFormValues: Record<string, RiskAssessmentAdvice> = {};
      
      // Initialize form values for all risk levels
      RISK_LEVELS.forEach(level => {
        // Case-insensitive matching for risk levels
        const existingAdvice = advice.find(a => 
          (a.risk_level?.toLowerCase() === level.id.toLowerCase()) ||
          (a.risk_level_normalized?.toLowerCase() === level.id.toLowerCase())
        );
        
        console.log(\`Risk level \${level.id}: \${existingAdvice ? 'Found' : 'Not found'}\`, existingAdvice);
        
        initialFormValues[level.id] = existingAdvice || {
          min_score: level.id === 'low' ? 0 : level.id === 'moderate' ? 3 : 6,
          max_score: level.id === 'low' ? 2 : level.id === 'moderate' ? 5 : 100,
          advice: "",
          risk_level: level.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      console.log("Setting form values:", initialFormValues);
      setFormValues(initialFormValues);
    } catch (error) {
      console.error("Error loading advice:", error);
      toast.error("Failed to load risk assessment advice");
      
      // Set default values even on error
      const defaultValues: Record<string, RiskAssessmentAdvice> = {};
      RISK_LEVELS.forEach(level => {
        defaultValues[level.id] = {
          min_score: level.id === 'low' ? 0 : level.id === 'moderate' ? 3 : 6,
          max_score: level.id === 'low' ? 2 : level.id === 'moderate' ? 5 : 100,
          advice: "",
          risk_level: level.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      setFormValues(defaultValues);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (levelId: string, field: keyof RiskAssessmentAdvice, value: string | number) => {
    console.log(\`Changing \${field} for \${levelId} to \${value}\`);
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
        id: values.id, // Include ID if it exists
        min_score: Number(values.min_score) || 0,
        max_score: Number(values.max_score) || 0,
        advice: values.advice || "",
        risk_level: level
      }));
      
      console.log("Saving advice entries:", adviceEntries);

      // Save each advice entry
      const results = await Promise.all(adviceEntries.map(advice => 
        riskAssessmentService.updateAdvice(advice)
      ));
      
      console.log("Save results:", results);

      toast.success('Risk assessment advice updated successfully');
      await loadAdvice(); // Reload the advice to show updated values
    } catch (error) {
      console.error('Error saving advice:', error);
      toast.error('Failed to update risk assessment advice');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment Configuration</CardTitle>
            <CardDescription>
              Loading risk assessment configuration...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              min_score: level.id === 'low' ? 0 : level.id === 'moderate' ? 3 : 6,
              max_score: level.id === 'low' ? 2 : level.id === 'moderate' ? 5 : 100,
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
                      <h3 className={\`text-lg font-medium \${level.color}\`}>{level.label}</h3>
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
                          max={100}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Recommendations</Label>
                      <Textarea
                        value={advice.advice || ""}
                        onChange={(e) => handleInputChange(level.id, 'advice', e.target.value)}
                        placeholder={\`Enter recommendations for \${level.label.toLowerCase()} risk level\`}
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
              
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Risk Level Categories:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {RISK_LEVELS.map((level) => {
                    const advice = formValues[level.id] || {
                      min_score: 0,
                      max_score: 0
                    };
                    return (
                      <li key={level.id}>
                        <span className={\`font-semibold \${level.color}\`}>{level.label}:</span> Score of {advice.min_score}-{advice.max_score}
                      </li>
                    );
                  })}
                </ul>
              </div>
              
              {/* Added section to show recommendations preview */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Sample Recommendations:</p>
                {RISK_LEVELS.map((level) => {
                  const advice = formValues[level.id] || { advice: "" };
                  return (
                    <div key={\`preview-\${level.id}\`} className="mb-4 border-l-2 pl-3" style={{ borderColor: level.color === 'text-green-600' ? 'green' : level.color === 'text-yellow-600' ? 'orange' : 'red' }}>
                      <p className={\`font-semibold \${level.color} mb-1\`}>{level.label} Recommendations:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {advice.advice || "No specific recommendations set for this risk level."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}`;
    
    // Write the new content
    fs.writeFileSync(adminPath, newAdminContent);
    console.log("✅ Completely replaced RiskAssessmentAdmin.tsx with new implementation");
    
    console.log("\n=".repeat(80));
    console.log("🎉 DIRECT FIX COMPLETED!");
    console.log("=".repeat(80));
    console.log("\nThe risk assessment configuration should now properly display");
    console.log("and allow editing of the risk levels and recommendations.");
    
  } catch (error) {
    console.error("\n❌ Error applying direct fix:", error);
    process.exit(1);
  }
}

// Run the function
directFixRiskAssessmentAdmin()
  .then(() => {
    console.log("\nDirect fix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during direct fix:", err);
    process.exit(1);
  });