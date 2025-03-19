import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  ageRanges?: string[];
  races?: string[];
  riskLevels?: string[];
  period?: 'day' | 'week' | 'month';
  monthsBack?: number;
}

export interface RiskFactorDistribution {
  factor: string;
  count: number;
  percentage: number;
}

export interface RiskLevelDistribution {
  risk_level: string;
  count: number;
  percentage: number;
}

export interface AgeDistribution {
  age_range: string;
  count: number;
  percentage: number;
}

export interface RaceDistribution {
  race: string;
  count: number;
  percentage: number;
}

export interface SubmissionTrend {
  time_period: string;
  count: number;
}

export interface QuestionnaireSummary {
  total_count: number;
  avg_score: number;
  month_over_month_change: number | null;
}

export interface RiskFactorCorrelation {
  factor1: string;
  factor2: string;
  correlation_count: number;
  percentage: number;
}

export interface AnonymizedQuestionnaireData {
  id: string;
  age: string;
  race: string;
  family_glaucoma: boolean;
  ocular_steroid: boolean;
  steroid_type: string | null;
  intravitreal: boolean;
  intravitreal_type: string | null;
  systemic_steroid: boolean;
  systemic_steroid_type: string | null;
  iop_baseline: boolean;
  vertical_asymmetry: boolean;
  vertical_ratio: boolean;
  total_score: number;
  risk_level: string;
  created_at: string;
  [key: string]: string | number | boolean | null; // Index signature for flexible access
}

class AnalyticsService {
  /**
   * Get a summary of questionnaire data (total count, average score, month-over-month change)
   */
  async getQuestionnaireSummary(filters?: FilterOptions): Promise<QuestionnaireSummary> {
    try {
      const { data, error } = await supabase.rpc('get_questionnaire_summary', {
        start_date: filters?.startDate,
        end_date: filters?.endDate,
        age_ranges: filters?.ageRanges,
        races: filters?.races,
        risk_levels: filters?.riskLevels
      });

      if (error) throw error;
      return data[0] as QuestionnaireSummary;
    } catch (error) {
      console.error('Error fetching questionnaire summary:', error);
      toast.error('Failed to fetch questionnaire summary');
      return {
        total_count: 0,
        avg_score: 0,
        month_over_month_change: null
      };
    }
  }

  /**
   * Get risk factor distribution (percentage of questionnaires with each risk factor)
   */
  async getRiskFactorDistribution(filters?: FilterOptions): Promise<RiskFactorDistribution[]> {
    try {
      const { data, error } = await supabase.rpc('get_risk_factor_distribution', {
        start_date: filters?.startDate,
        end_date: filters?.endDate,
        age_ranges: filters?.ageRanges,
        races: filters?.races
      });

      if (error) throw error;
      return data as RiskFactorDistribution[];
    } catch (error) {
      console.error('Error fetching risk factor distribution:', error);
      toast.error('Failed to fetch risk factor distribution');
      return [];
    }
  }

  /**
   * Get risk level distribution (percentage of questionnaires in each risk level)
   */
  async getRiskLevelDistribution(filters?: FilterOptions): Promise<RiskLevelDistribution[]> {
    try {
      const { data, error } = await supabase.rpc('get_risk_level_distribution', {
        start_date: filters?.startDate,
        end_date: filters?.endDate,
        age_ranges: filters?.ageRanges,
        races: filters?.races
      });

      if (error) throw error;
      return data as RiskLevelDistribution[];
    } catch (error) {
      console.error('Error fetching risk level distribution:', error);
      toast.error('Failed to fetch risk level distribution');
      return [];
    }
  }

  /**
   * Get age distribution (percentage of questionnaires in each age range)
   */
  async getAgeDistribution(filters?: FilterOptions): Promise<AgeDistribution[]> {
    try {
      const { data, error } = await supabase.rpc('get_age_distribution', {
        start_date: filters?.startDate,
        end_date: filters?.endDate,
        races: filters?.races,
        risk_levels: filters?.riskLevels
      });

      if (error) throw error;
      return data as AgeDistribution[];
    } catch (error) {
      console.error('Error fetching age distribution:', error);
      toast.error('Failed to fetch age distribution');
      return [];
    }
  }

  /**
   * Get race distribution (percentage of questionnaires in each race category)
   */
  async getRaceDistribution(filters?: FilterOptions): Promise<RaceDistribution[]> {
    try {
      const { data, error } = await supabase.rpc('get_race_distribution', {
        start_date: filters?.startDate,
        end_date: filters?.endDate,
        age_ranges: filters?.ageRanges,
        risk_levels: filters?.riskLevels
      });

      if (error) throw error;
      return data as RaceDistribution[];
    } catch (error) {
      console.error('Error fetching race distribution:', error);
      toast.error('Failed to fetch race distribution');
      return [];
    }
  }

  /**
   * Get submission trend (number of submissions over time)
   */
  async getSubmissionTrend(filters?: FilterOptions): Promise<SubmissionTrend[]> {
    try {
      const { data, error } = await supabase.rpc('get_submission_trend', {
        period: filters?.period || 'month',
        months_back: filters?.monthsBack || 6,
        age_ranges: filters?.ageRanges,
        races: filters?.races,
        risk_levels: filters?.riskLevels
      });

      if (error) throw error;
      return data as SubmissionTrend[];
    } catch (error) {
      console.error('Error fetching submission trend:', error);
      toast.error('Failed to fetch submission trend');
      return [];
    }
  }

  /**
   * Get risk factor correlation data (for heatmap visualization)
   */
  async getRiskFactorCorrelation(filters?: FilterOptions): Promise<RiskFactorCorrelation[]> {
    try {
      const { data, error } = await supabase.rpc('get_risk_factor_correlation', {
        start_date: filters?.startDate,
        end_date: filters?.endDate,
        age_ranges: filters?.ageRanges,
        races: filters?.races
      });

      if (error) throw error;
      return data as RiskFactorCorrelation[];
    } catch (error) {
      console.error('Error fetching risk factor correlation:', error);
      toast.error('Failed to fetch risk factor correlation');
      return [];
    }
  }

  /**
   * Get anonymized questionnaire data for detailed analysis
   */
  async getAnonymizedQuestionnaireData(filters?: FilterOptions): Promise<AnonymizedQuestionnaireData[]> {
    try {
      const { data, error } = await supabase.rpc('get_anonymized_questionnaire_data', {
        start_date: filters?.startDate,
        end_date: filters?.endDate,
        age_ranges: filters?.ageRanges,
        races: filters?.races,
        risk_levels: filters?.riskLevels
      });

      if (error) throw error;
      return data as AnonymizedQuestionnaireData[];
    } catch (error) {
      console.error('Error fetching anonymized questionnaire data:', error);
      toast.error('Failed to fetch questionnaire data');
      return [];
    }
  }

  /**
   * Export anonymized questionnaire data as CSV
   */
  async exportQuestionnaireDataToCsv(filters?: FilterOptions): Promise<string> {
    try {
      const data = await this.getAnonymizedQuestionnaireData(filters);
      
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }
      
      // Create CSV header from first data object keys, excluding sensitive fields
      const headerFields = Object.keys(data[0])
        .filter(key => key !== 'id' && key !== 'first_name' && key !== 'last_name');
      
      const csvHeader = headerFields.join(',');
      
      // Create CSV rows
      const csvRows = data.map(row => {
        return headerFields.map(field => {
          const value = row[field as keyof typeof row];
          // Handle different types of values
          if (value === null || value === undefined) {
            return '';
          } else if (typeof value === 'string') {
            // Escape quotes and wrap in quotes if contains comma or quotes
            return `"${value.replace(/"/g, '""')}"`;
          } else {
            return String(value);
          }
        }).join(',');
      });
      
      // Combine header and rows
      const csvContent = [csvHeader, ...csvRows].join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('Error exporting questionnaire data:', error);
      toast.error('Failed to export questionnaire data');
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
