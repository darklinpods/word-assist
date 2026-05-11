import type { ExtractedCalculatorParams } from '../types/compensation-extraction';
import type { CaseParams, Dependent } from './compensation-calculator';
import { getAvailableProvinces, getAvailableYears } from './compensation-calculator';

export interface CompensationPrefillResult {
  params: CaseParams;
  warnings: string[];
  appliedFields: string[];
}

export function applyExtractedCalculatorParams(
  currentParams: CaseParams,
  extracted: ExtractedCalculatorParams
): CompensationPrefillResult {
  const next: CaseParams = { ...currentParams };
  const warnings = [...extracted.warnings];
  const appliedFields: string[] = [];

  if (extracted.province !== undefined) {
    if (getAvailableProvinces().includes(extracted.province)) {
      next.province = extracted.province;
      const years = getAvailableYears(next.province);
      if (!years.includes(next.year)) {
        next.year = years[0] ?? next.year;
      }
      appliedFields.push('省份');
    } else {
      warnings.push(`识别到省份“${extracted.province}”，但标准库暂不支持，已保留当前省份。`);
    }
  }

  if (extracted.year !== undefined) {
    const years = getAvailableYears(next.province);
    if (years.includes(extracted.year)) {
      next.year = extracted.year;
      appliedFields.push('年份');
    } else {
      warnings.push(`识别到年份“${extracted.year}”，但 ${next.province} 标准库暂无该年份，已保留当前年份。`);
    }
  }

  applyValue(next, appliedFields, 'caseType', extracted.caseType, '案件类型');
  applyNonNegativeNumber(next, appliedFields, 'victimAge', extracted.victimAge, '年龄');
  applyDisabilityLevel(next, appliedFields, extracted.disabilityLevel, warnings);
  applyNonNegativeNumber(next, appliedFields, 'medicalExpense', extracted.medicalExpense, '医疗费');
  applyNonNegativeNumber(next, appliedFields, 'hospitalizationDays', extracted.hospitalizationDays, '住院天数');
  applyNonNegativeNumber(next, appliedFields, 'nutritionDays', extracted.nutritionDays, '营养期天数');
  applyNonNegativeNumber(next, appliedFields, 'lostWageDays', extracted.lostWageDays, '误工天数');
  applyNonNegativeNumber(next, appliedFields, 'monthlyIncome', extracted.monthlyIncome, '月收入');
  applyNonNegativeNumber(next, appliedFields, 'nursingDays', extracted.nursingDays, '护理天数');
  applyNonNegativeNumber(next, appliedFields, 'nursingPersons', extracted.nursingPersons, '护理人数');
  applyNonNegativeNumber(next, appliedFields, 'transportFee', extracted.transportFee, '交通费');
  applyNonNegativeNumber(next, appliedFields, 'assessmentFee', extracted.assessmentFee, '鉴定费');
  applyNonNegativeNumber(next, appliedFields, 'assistiveDeviceFee', extracted.assistiveDeviceFee, '残疾辅助器具费');
  applyNonNegativeNumber(next, appliedFields, 'mentalDistressFee', extracted.mentalDistressFee, '精神损害抚慰金');

  if (extracted.monthlyIncome !== undefined && extracted.monthlyIncome > 0) {
    next.lostWageMode = 'actual';
  } else if (extracted.lostWageDays !== undefined && extracted.lostWageDays > 0) {
    next.lostWageMode = 'standard';
  }

  if (next.caseType === 'death') {
    next.disabilityLevel = null;
  }

  if (extracted.dependents !== undefined) {
    next.dependents = extracted.dependents
      .filter(dep => dep.age >= 0)
      .map((dep, index): Dependent => ({
        id: `dep_${Date.now()}_${index}`,
        name: dep.name,
        age: dep.age,
        otherSupporters: Math.max(0, dep.otherSupporters),
      }));
    appliedFields.push('被扶养人');
  }

  if (appliedFields.length === 0) {
    warnings.push('未能从诉状中识别出可直接填入计算器的字段。');
  }

  return {
    params: next,
    warnings: unique(warnings),
    appliedFields: unique(appliedFields),
  };
}

function applyValue<K extends keyof CaseParams>(
  params: CaseParams,
  appliedFields: string[],
  key: K,
  value: CaseParams[K] | undefined,
  label: string
): void {
  if (value === undefined) return;
  params[key] = value;
  appliedFields.push(label);
}

function applyNonNegativeNumber<K extends keyof CaseParams>(
  params: CaseParams,
  appliedFields: string[],
  key: K,
  value: number | undefined,
  label: string
): void {
  if (value === undefined) return;
  params[key] = Math.max(0, value) as CaseParams[K];
  appliedFields.push(label);
}

function applyDisabilityLevel(
  params: CaseParams,
  appliedFields: string[],
  value: number | null | undefined,
  warnings: string[]
): void {
  if (value === undefined) return;
  if (value === null) {
    params.disabilityLevel = null;
    appliedFields.push('伤残等级');
    return;
  }
  if (Number.isInteger(value) && value >= 1 && value <= 10) {
    params.disabilityLevel = value;
    appliedFields.push('伤残等级');
    return;
  }
  warnings.push(`识别到伤残等级“${value}”，但伤残等级必须为 1-10，已忽略。`);
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}
