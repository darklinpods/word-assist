import { useState, useCallback, useMemo } from 'react';
import {
  type CaseParams,
  type CalcResult,
  type Dependent,
  type ProvinceYearStandards,
  calculateCompensation,
  getStandards,
  getAvailableProvinces,
  getAvailableYears,
  calcVictimCompensationYears,
} from '../utils/compensation-calculator';
import { applyExtractedCalculatorParams } from '../utils/compensation-prefill';
import { exportCompensationTable, getDocumentText } from '../utils/office-utils';
import { extractCalculatorParamsFromComplaint } from '../services/ai';
import { getErrorMessage } from '../utils/error';

const DEFAULT_PARAMS: CaseParams = {
  province: '湖北省',
  year: '2026',
  caseType: 'injury',
  victimAge: 40,
  disabilityLevel: 10,
  compensationYearsOverride: null,

  medicalExpense: 0,
  hospitalizationDays: 0,
  nutritionDays: 0,

  lostWageMode: 'standard',
  lostWageDays: 0,
  monthlyIncome: 0,

  nursingDays: 0,
  nursingPersons: 1,

  transportFee: 0,
  assessmentFee: 0,
  assistiveDeviceFee: 0,
  mentalDistressFee: 0,

  dependents: [],
};

export function useCompensationCalculator() {
  const [params, setParams] = useState<CaseParams>(DEFAULT_PARAMS);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [prefillWarnings, setPrefillWarnings] = useState<string[]>([]);
  const [prefilledFields, setPrefilledFields] = useState<string[]>([]);

  const availableProvinces = useMemo(() => getAvailableProvinces(), []);
  const availableYears = useMemo(() => getAvailableYears(params.province), [params.province]);

  const autoCompensationYears = useMemo(
    () => calcVictimCompensationYears(params.victimAge, null),
    [params.victimAge]
  );

  /** 更新任意顶层参数字段 */
  const updateParam = useCallback(<K extends keyof CaseParams>(key: K, value: CaseParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setResult(null);
    setError('');
  }, []);

  /** 切换省份时同步重置年份为该省最新年份 */
  const updateProvince = useCallback((province: string) => {
    const years = getAvailableYears(province);
    setParams(prev => ({ ...prev, province, year: years[0] ?? prev.year }));
    setResult(null);
    setError('');
  }, []);

  // ── 被扶养人 CRUD ────────────────────────────────────────────

  const addDependent = useCallback(() => {
    const newDep: Dependent = {
      id: `dep_${Date.now()}`,
      name: '',
      age: 8,
      otherSupporters: 0,
    };
    setParams(prev => ({ ...prev, dependents: [...prev.dependents, newDep] }));
    setResult(null);
  }, []);

  const removeDependent = useCallback((id: string) => {
    setParams(prev => ({ ...prev, dependents: prev.dependents.filter(d => d.id !== id) }));
    setResult(null);
  }, []);

  const updateDependent = useCallback(<K extends keyof Dependent>(id: string, key: K, value: Dependent[K]) => {
    setParams(prev => ({
      ...prev,
      dependents: prev.dependents.map(d => (d.id === id ? { ...d, [key]: value } : d)),
    }));
    setResult(null);
  }, []);

  // ── 计算 ──────────────────────────────────────────────────────

  const runCalculation = useCallback((nextParams: CaseParams, standards: ProvinceYearStandards): CalcResult => {
    return calculateCompensation(nextParams, standards);
  }, []);

  const calculate = useCallback(() => {
    const standards = getStandards(params.province, params.year);
    if (!standards) {
      setError(`未找到 ${params.province} ${params.year} 年的标准数据，请检查 src/data/compensation-standards.json`);
      return;
    }
    try {
      setError('');
      const res = runCalculation(params, standards);
      setResult(res);
    } catch (err: unknown) {
      setError('计算出错: ' + getErrorMessage(err));
    }
  }, [params, runCalculation]);

  const prefillFromComplaint = useCallback(async () => {
    setIsPrefilling(true);
    setError('');
    setPrefillWarnings([]);
    setPrefilledFields([]);
    try {
      const text = await getDocumentText();
      if (!text.trim()) {
        throw new Error('当前 Word 文档没有可读取的正文内容。');
      }

      const extracted = await extractCalculatorParamsFromComplaint(text);
      const prefill = applyExtractedCalculatorParams(params, extracted);
      const standards = getStandards(prefill.params.province, prefill.params.year);
      if (!standards) {
        throw new Error(`未找到 ${prefill.params.province} ${prefill.params.year} 年的标准数据，请检查 src/data/compensation-standards.json`);
      }

      const calculated = runCalculation(prefill.params, standards);
      setParams(prefill.params);
      setResult(calculated);
      setPrefillWarnings(prefill.warnings);
      setPrefilledFields(prefill.appliedFields);
    } catch (err: unknown) {
      setError('自动填入失败: ' + getErrorMessage(err));
      setResult(null);
    } finally {
      setIsPrefilling(false);
    }
  }, [params, runCalculation]);

  // ── 导出到 Word ───────────────────────────────────────────────

  const exportToWord = useCallback(async () => {
    if (!result) return;
    setIsExporting(true);
    setError('');
    try {
      await exportCompensationTable(result.items, {
        province: params.province,
        year: params.year,
        caseType: params.caseType,
        total: result.total,
      });
    } catch (err: unknown) {
      setError('导出失败: ' + getErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  }, [result, params]);

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setResult(null);
    setError('');
    setPrefillWarnings([]);
    setPrefilledFields([]);
  }, []);

  return {
    params,
    updateParam,
    updateProvince,
    addDependent,
    removeDependent,
    updateDependent,
    result,
    error,
    isExporting,
    isPrefilling,
    prefillWarnings,
    prefilledFields,
    calculate,
    prefillFromComplaint,
    exportToWord,
    reset,
    availableProvinces,
    availableYears,
    autoCompensationYears,
  };
}
