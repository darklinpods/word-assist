/**
 * 交通事故人身损害赔偿 —— 纯函数计算引擎
 * 无副作用，可独立测试，不依赖 AI API。
 */
import standardsJson from '../data/compensation-standards.json';

// ─── 数据类型 ────────────────────────────────────────────────

export interface ProvinceYearStandards {
  resident_disposable_income: number;
  resident_consumption_expenditure: number;
  /** 服务业年平均工资，用于误工费省标准 & 丧葬费 */
  service_industry_annual_wage: number;
  /** 护工日标准（元/天）= service_industry_annual_wage / 365 */
  nursing_daily_rate: number;
  meal_allowance_daily: number;
  nutrition_daily: number;
}

export type CaseType = 'injury' | 'death';
export type LostWageMode = 'actual' | 'standard' | 'none';

export interface Dependent {
  id: string;
  name: string;
  age: number;
  /** 其他共同承担扶养义务的人数（不含本案被侵权人） */
  otherSupporters: number;
}

export interface CaseParams {
  province: string;
  year: string;
  caseType: CaseType;

  // 伤者
  victimAge: number;
  /** 伤残等级 1-10，null = 无伤残（仅伤情无伤残等级），死亡案件忽略此字段 */
  disabilityLevel: number | null;
  /** 覆盖自动推算的赔偿年限，null = 按年龄自动推算 */
  compensationYearsOverride: number | null;

  // 医疗
  medicalExpense: number;
  hospitalizationDays: number;
  nutritionDays: number;

  // 误工
  lostWageMode: LostWageMode;
  lostWageDays: number;
  monthlyIncome: number;

  // 护理
  nursingDays: number;
  nursingPersons: number;

  // 其他直接录入项
  transportFee: number;
  assessmentFee: number;
  assistiveDeviceFee: number;
  mentalDistressFee: number;

  // 被扶养人列表
  dependents: Dependent[];
}

export interface CalcLineItem {
  key: string;
  type: string;
  amount: number;
  formula: string;
  note: string;
  /** false = 该项不适用或用户未填写，导出时跳过 */
  enabled: boolean;
}

export interface CalcResult {
  items: CalcLineItem[];
  total: number;
}

// ─── 标准数据访问 ────────────────────────────────────────────

const data = standardsJson as {
  provinces: Record<string, Record<string, ProvinceYearStandards>>;
};

export function getAvailableProvinces(): string[] {
  return Object.keys(data.provinces);
}

export function getAvailableYears(province: string): string[] {
  const p = data.provinces[province];
  if (!p) return [];
  return Object.keys(p).sort().reverse();
}

export function getStandards(province: string, year: string): ProvinceYearStandards | null {
  return data.provinces?.[province]?.[year] ?? null;
}

// ─── 年限推算 ─────────────────────────────────────────────────

/** 受害者（残疾/死亡）的赔偿年限 */
export function calcVictimCompensationYears(age: number, override: number | null): number {
  if (override !== null && override > 0) return override;
  if (age < 60) return 20;
  if (age < 75) return 75 - age;
  return 5;
}

/** 被扶养人的赔偿年限 */
function calcDependentYears(age: number): number {
  if (age < 18) return 18 - age;
  if (age < 60) return 20;
  if (age < 75) return 75 - age;
  return 5;
}

// ─── 主计算函数 ───────────────────────────────────────────────

export function calculateCompensation(
  params: CaseParams,
  standards: ProvinceYearStandards
): CalcResult {
  const baseIncome = standards.resident_disposable_income;
  const baseConsumption = standards.resident_consumption_expenditure;
  const compYears = calcVictimCompensationYears(params.victimAge, params.compensationYearsOverride);
  const items: CalcLineItem[] = [];

  // 1. 死亡赔偿金 / 残疾赔偿金 / 不适用
  if (params.caseType === 'death') {
    const amount = r(baseIncome * compYears);
    items.push({
      key: 'death_compensation',
      type: '死亡赔偿金',
      amount,
      formula: `${baseIncome} 元/年 × ${compYears} 年`,
      note: `居民人均可支配收入（${params.province} ${params.year}）`,
      enabled: true,
    });
  } else if (params.disabilityLevel !== null) {
    const coef = (11 - params.disabilityLevel) * 0.1;
    const amount = r(baseIncome * coef * compYears);
    items.push({
      key: 'disability_compensation',
      type: '残疾赔偿金',
      amount,
      formula: `${baseIncome} 元/年 × ${(coef * 100).toFixed(0)}% × ${compYears} 年`,
      note: `居民人均可支配收入，${params.disabilityLevel}级伤残（系数 ${(coef * 100).toFixed(0)}%）`,
      enabled: true,
    });
  } else {
    items.push(disabled('disability_compensation', '残疾赔偿金', '无伤残等级，不适用'));
  }

  // 2. 医疗费
  items.push({
    key: 'medical_expense',
    type: '医疗费',
    amount: params.medicalExpense,
    formula: '凭发票据实',
    note: '医院正式发票 + 费用清单',
    enabled: params.medicalExpense > 0,
  });

  // 3. 护理费
  if (params.nursingDays > 0) {
    const daily = standards.nursing_daily_rate;
    const amount = r(daily * params.nursingDays * params.nursingPersons);
    items.push({
      key: 'nursing_fee',
      type: '护理费',
      amount,
      formula: `${daily} 元/天 × ${params.nursingDays} 天 × ${params.nursingPersons} 人`,
      note: `服务业年平均工资日标准（${standards.service_industry_annual_wage} ÷ 365）`,
      enabled: true,
    });
  } else {
    items.push(disabled('nursing_fee', '护理费', '未填写护理天数'));
  }

  // 4. 误工费
  if (params.lostWageMode === 'none' || params.lostWageDays === 0) {
    items.push(disabled('lost_wage', '误工费', '不主张或未填写'));
  } else if (params.lostWageMode === 'actual' && params.monthlyIncome > 0) {
    const daily = r(params.monthlyIncome / 30, 4);
    const amount = r(daily * params.lostWageDays);
    items.push({
      key: 'lost_wage',
      type: '误工费',
      amount,
      formula: `${params.monthlyIncome} 元/月 ÷ 30天 × ${params.lostWageDays} 天`,
      note: '按实际月收入计算',
      enabled: true,
    });
  } else {
    // 省标准：服务业年平均工资
    const annualWage = standards.service_industry_annual_wage;
    const daily = r(annualWage / 365, 4);
    const amount = r(daily * params.lostWageDays);
    items.push({
      key: 'lost_wage',
      type: '误工费',
      amount,
      formula: `${annualWage} 元/年 ÷ 365天 × ${params.lostWageDays} 天`,
      note: `按服务业年平均工资标准（${params.province} ${params.year}）`,
      enabled: true,
    });
  }

  // 5. 住院伙食补助费
  if (params.hospitalizationDays > 0) {
    const amount = r(standards.meal_allowance_daily * params.hospitalizationDays);
    items.push({
      key: 'meal_allowance',
      type: '住院伙食补助费',
      amount,
      formula: `${standards.meal_allowance_daily} 元/天 × ${params.hospitalizationDays} 天`,
      note: '省住院伙食补助标准',
      enabled: true,
    });
  } else {
    items.push(disabled('meal_allowance', '住院伙食补助费', '未填写住院天数'));
  }

  // 6. 营养费
  if (params.nutritionDays > 0) {
    const amount = r(standards.nutrition_daily * params.nutritionDays);
    items.push({
      key: 'nutrition_fee',
      type: '营养费',
      amount,
      formula: `${standards.nutrition_daily} 元/天 × ${params.nutritionDays} 天`,
      note: '省营养费参考标准（以医嘱为前提）',
      enabled: true,
    });
  } else {
    items.push(disabled('nutrition_fee', '营养费', '未填写营养期'));
  }

  // 7. 交通费
  items.push({
    key: 'transport_fee',
    type: '交通费',
    amount: params.transportFee,
    formula: '凭票或酌情',
    note: '就医往返交通票据',
    enabled: params.transportFee > 0,
  });

  // 8. 精神损害抚慰金（需有伤残/死亡）
  const canClaimMental = params.caseType === 'death' || params.disabilityLevel !== null;
  items.push({
    key: 'mental_distress',
    type: '精神损害抚慰金',
    amount: canClaimMental ? params.mentalDistressFee : 0,
    formula: '酌情主张',
    note: canClaimMental
      ? `以${params.caseType === 'death' ? '死亡' : '构成伤残'}为前提，法院酌情裁量`
      : '无伤残等级或死亡，不适用',
    enabled: canClaimMental && params.mentalDistressFee > 0,
  });

  // 9. 被扶养人生活费
  if (params.dependents.length > 0) {
    const subItems = params.dependents.map(dep => {
      const years = calcDependentYears(dep.age);
      const totalSupporters = dep.otherSupporters + 1;
      const amount = r((baseConsumption / totalSupporters) * years);
      return { dep, years, totalSupporters, amount };
    });
    const totalAmount = r(subItems.reduce((s, d) => s + d.amount, 0));
    const formulaStr = subItems
      .map(
        d =>
          `${d.dep.name || '被扶养人'}：${baseConsumption}÷${d.totalSupporters}人×${d.years}年=${d.amount.toFixed(2)}元`
      )
      .join('；');
    items.push({
      key: 'dependents_fee',
      type: '被扶养人生活费',
      amount: totalAmount,
      formula: formulaStr,
      note: `居民人均消费性支出，共 ${params.dependents.length} 名被扶养人`,
      enabled: true,
    });
  } else {
    items.push(disabled('dependents_fee', '被扶养人生活费', '无被扶养人'));
  }

  // 10. 残疾辅助器具费（仅伤残案件）
  if (params.caseType === 'injury') {
    items.push({
      key: 'assistive_device',
      type: '残疾辅助器具费',
      amount: params.assistiveDeviceFee,
      formula: '凭辅具评估报告据实',
      note: '需提供康复辅具配置评估报告',
      enabled: params.assistiveDeviceFee > 0,
    });
  }

  // 11. 鉴定费
  items.push({
    key: 'assessment_fee',
    type: '鉴定费',
    amount: params.assessmentFee,
    formula: '凭票据实报',
    note: '司法鉴定机构收费票据',
    enabled: params.assessmentFee > 0,
  });

  // 12. 丧葬费（仅死亡案件）
  if (params.caseType === 'death') {
    const monthlyWage = r(standards.service_industry_annual_wage / 12);
    const amount = r(monthlyWage * 6);
    items.push({
      key: 'funeral_fee',
      type: '丧葬费',
      amount,
      formula: `${standards.service_industry_annual_wage} 元/年 ÷ 12 × 6 个月`,
      note: '服务业年平均工资月标准 × 6 个月',
      enabled: true,
    });
  }

  const total = r(items.filter(i => i.enabled).reduce((s, i) => s + i.amount, 0));
  return { items, total };
}

// ─── 内部工具 ─────────────────────────────────────────────────

function r(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals));
}

function disabled(key: string, type: string, note: string): CalcLineItem {
  return { key, type, amount: 0, formula: '—', note, enabled: false };
}
