import { useState, useCallback, useMemo } from 'react';
import {
  type CaseParams,
  type CalcResult,
  type Dependent,
  calculateCompensation,
  getStandards,
  getAvailableProvinces,
  getAvailableYears,
  calcVictimCompensationYears,
} from '../utils/compensation-calculator';
import { exportCompensationTable } from '../utils/office-utils';
import { getErrorMessage } from '../utils/error';

const DEFAULT_PARAMS: CaseParams = {
  province: '湖北省',
  year: '2026',
  residentType: 'urban',
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

  const calculate = useCallback(() => {
    const standards = getStandards(params.province, params.year);
    if (!standards) {
      setError(`未找到 ${params.province} ${params.year} 年的标准数据，请检查 src/data/compensation-standards.json`);
      return;
    }
    try {
      setError('');
      const res = calculateCompensation(params, standards);
      setResult(res);
    } catch (err: unknown) {
      setError('计算出错: ' + getErrorMessage(err));
    }
  }, [params]);

  // ── 导出到 Word ───────────────────────────────────────────────

  const exportToWord = useCallback(async () => {
    if (!result) return;
    setIsExporting(true);
    setError('');
    try {
      await exportCompensationTable(result.items, {
        province: params.province,
        year: params.year,
        residentType: params.residentType,
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
    calculate,
    exportToWord,
    reset,
    availableProvinces,
    availableYears,
    autoCompensationYears,
  };
}
