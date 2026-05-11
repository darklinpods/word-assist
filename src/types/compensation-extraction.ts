import type { CaseType } from '../utils/compensation-calculator';

export interface ExtractedDependent {
  name: string;
  age: number;
  otherSupporters: number;
}

export interface ExtractedCalculatorParams {
  province?: string;
  year?: string;
  caseType?: CaseType;
  victimAge?: number;
  disabilityLevel?: number | null;
  medicalExpense?: number;
  hospitalizationDays?: number;
  nutritionDays?: number;
  lostWageDays?: number;
  monthlyIncome?: number;
  nursingDays?: number;
  nursingPersons?: number;
  transportFee?: number;
  assessmentFee?: number;
  assistiveDeviceFee?: number;
  mentalDistressFee?: number;
  dependents?: ExtractedDependent[];
  warnings: string[];
}
