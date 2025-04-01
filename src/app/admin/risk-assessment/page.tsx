'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QUESTIONNAIRE_PAGES } from '@/constants/questionnaireConstants';
// Removed RiskAssessmentConfig import as it's no longer used here
import { riskAssessmentService, RiskAssessmentAdvice } from '@/services/RiskAssessmentService';
import { useToast } from '@/components/ui/use-toast';

export default function RiskAssessmentAdmin() {
  // Removed configurations state
  const [advice, setAdvice] = useState<RiskAssessmentAdvice[]>([]);
  const [newAdvice, setNewAdvice] = useState({ min_score: 0, max_score: 0, advice: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Only fetch advice list now
      const adviceList = await riskAssessmentService.getAdvice();
      setAdvice(adviceList);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load risk assessment configuration',
        variant: 'destructive'
      });
    }
  };

  // REMOVED handleConfigUpdate function as config is no longer managed here

  const handleAdviceUpdate = async (advice: RiskAssessmentAdvice) => {
    try {
      await riskAssessmentService.updateAdvice(advice);
      await loadData();
      toast({
        title: 'Success',
        description: 'Risk assessment advice updated'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update risk assessment advice',
        variant: 'destructive'
      });
    }
  };

  const handleAdviceAdd = async () => {
    try {
      await riskAssessmentService.updateAdvice(newAdvice);
      setNewAdvice({ min_score: 0, max_score: 0, advice: '' });
      await loadData();
      toast({
        title: 'Success',
        description: 'Risk assessment advice added'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add risk assessment advice',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Risk Assessment Configuration</h1>

      {/* REMOVED Question Scores Card - Scores are now managed in Question Management */}

      {/* Risk Assessment Advice */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Advice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add new advice */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Min Score</Label>
                <Input
                  type="number"
                  value={newAdvice.min_score}
                  onChange={e => setNewAdvice({ ...newAdvice, min_score: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Max Score</Label>
                <Input
                  type="number"
                  value={newAdvice.max_score}
                  onChange={e => setNewAdvice({ ...newAdvice, max_score: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAdviceAdd}>Add Advice</Button>
              </div>
            </div>

            {/* Existing advice */}
            <div className="space-y-4">
              {advice.map(item => (
                <div key={item.id} className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Score Range</Label>
                    <div className="text-sm text-muted-foreground">
                      {item.min_score} - {item.max_score}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label>Advice</Label>
                    <Textarea
                      value={item.advice}
                      onChange={e => handleAdviceUpdate({ ...item, advice: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 