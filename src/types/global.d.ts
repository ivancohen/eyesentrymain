// src/types/global.d.ts
import { RiskAssessmentAdvice } from '@/services/RiskAssessmentService'; // Adjust path if needed

declare global {
  interface Window {
    ADVICE_DEBUG?: RiskAssessmentAdvice[];
  }
}

// This empty export statement makes the file a module
export {};