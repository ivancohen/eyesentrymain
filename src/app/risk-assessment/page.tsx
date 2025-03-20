'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { riskAssessmentService, RiskAssessmentResult } from '@/services/RiskAssessmentService';
import { useSearchParams } from 'next/navigation';

export default function RiskAssessmentPage() {
  const [result, setResult] = useState<RiskAssessmentResult | null>(null);
  const searchParams = useSearchParams();
  const answers = JSON.parse(searchParams.get('answers') || '{}');

  useEffect(() => {
    const calculateRisk = async () => {
      try {
        const riskResult = await riskAssessmentService.calculateRiskScore(answers);
        setResult(riskResult);
      } catch (error) {
        console.error('Failed to calculate risk score:', error);
      }
    };

    if (Object.keys(answers).length > 0) {
      calculateRisk();
    }
  }, [answers]);

  if (!result) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading risk assessment...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Risk Assessment Results</h1>

      {/* Total Score */}
      <Card>
        <CardHeader>
          <CardTitle>Total Risk Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {result.totalScore}
          </div>
        </CardContent>
      </Card>

      {/* Contributing Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Contributing Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.contributingFactors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-medium">{factor.questionText}</h3>
                  <p className="text-sm text-muted-foreground">
                    Selected: {factor.selectedValue}
                  </p>
                </div>
                <div className="text-lg font-semibold text-primary">
                  +{factor.score}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advice */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p>{result.advice}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 