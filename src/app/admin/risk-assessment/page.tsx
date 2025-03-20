'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QUESTIONNAIRE_PAGES } from '@/constants/questionnaireConstants';
import { riskAssessmentService, RiskAssessmentConfig, RiskAssessmentAdvice } from '@/services/RiskAssessmentService';
import { useToast } from '@/components/ui/use-toast';

export default function RiskAssessmentAdmin() {
  const [configurations, setConfigurations] = useState<RiskAssessmentConfig[]>([]);
  const [advice, setAdvice] = useState<RiskAssessmentAdvice[]>([]);
  const [newAdvice, setNewAdvice] = useState({ min_score: 0, max_score: 0, advice: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configs, adviceList] = await Promise.all([
        riskAssessmentService.getConfigurations(),
        riskAssessmentService.getAdvice()
      ]);
      setConfigurations(configs);
      setAdvice(adviceList);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load risk assessment configuration',
        variant: 'destructive'
      });
    }
  };

  const handleConfigUpdate = async (config: Partial<RiskAssessmentConfig>) => {
    try {
      await riskAssessmentService.updateConfiguration(config);
      await loadData();
      toast({
        title: 'Success',
        description: 'Risk assessment configuration updated'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update risk assessment configuration',
        variant: 'destructive'
      });
    }
  };

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

      {/* Question Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Question Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {QUESTIONNAIRE_PAGES.flat().map(question => (
              <div key={question.id} className="space-y-2">
                <h3 className="font-medium">{question.text}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {question.options?.map(option => {
                    const config = configurations.find(
                      c => c.question_id === question.id && c.option_value === option.value
                    );
                    return (
                      <div key={option.value} className="flex items-center gap-2">
                        <Label className="w-32">{option.label}</Label>
                        <Input
                          type="number"
                          value={config?.score || 0}
                          onChange={e => handleConfigUpdate({
                            question_id: question.id,
                            option_value: option.value,
                            score: parseInt(e.target.value) || 0
                          })}
                          className="w-24"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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