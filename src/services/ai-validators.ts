import type { PartyExtraction } from '../types/parties';
import type { ExtractedCalculatorParams } from '../types/compensation-extraction';
import type { CaseType } from '../utils/compensation-calculator';
import type { ClaimItemExtracted } from '../utils/compensation-rules';
import type { EvidenceRawResult, EvidenceStatus } from '../utils/evidence-rules';

type JsonRecord = Record<string, unknown>;

const EVIDENCE_STATUSES: EvidenceStatus[] = ['present', 'weak', 'missing'];
const CASE_TYPES: CaseType[] = ['injury', 'death'];

export function parseClaimItems(content: string): ClaimItemExtracted[] {
  const value = parseJson(content, '索赔要素');
  assertArray(value, '索赔要素');

  return value.map((item, index) => {
    const path = `索赔要素[${index}]`;
    assertRecord(item, path);

    const claim: ClaimItemExtracted = {
      type: readString(item, 'type', path),
      user_amount: readNumber(item, 'user_amount', path),
    };

    assignOptionalNumber(claim, item, 'disability_level', path);
    assignOptionalNumber(claim, item, 'years_claimed', path);
    assignOptionalNumber(claim, item, 'days_claimed', path);
    assignOptionalNumber(claim, item, 'daily_rate', path);
    assignOptionalNumber(claim, item, 'yearly_rate', path);

    const components = item.components;
    if (components !== undefined) {
      assertArray(components, `${path}.components`);
      claim.components = components.map((component, componentIndex) => {
        assertNumber(component, `${path}.components[${componentIndex}]`);
        return component;
      });
    }

    return claim;
  });
}

export function parseEvidenceResults(content: string): EvidenceRawResult[] {
  const value = parseJson(content, '证据核查结果');
  assertArray(value, '证据核查结果');

  return value.map((item, index) => {
    const path = `证据核查结果[${index}]`;
    assertRecord(item, path);
    const status = readString(item, 'status', path);
    if (!isEvidenceStatus(status)) {
      throw new Error(`${path}.status 必须是 present、weak 或 missing。`);
    }

    return {
      id: readString(item, 'id', path),
      status,
      note: readString(item, 'note', path),
    };
  });
}

export function parsePartyExtraction(content: string): PartyExtraction {
  const value = parseJson(content, '当事人信息');
  assertRecord(value, '当事人信息');

  return {
    plaintiffsNatural: readStringArray(value, 'plaintiffsNatural', '当事人信息'),
    defendantsNatural: readStringArray(value, 'defendantsNatural', '当事人信息'),
    defendantsLegal: readStringArray(value, 'defendantsLegal', '当事人信息'),
    defendantsInsurance: readStringArray(value, 'defendantsInsurance', '当事人信息'),
    thirdPartyLegal: readStringArray(value, 'thirdPartyLegal', '当事人信息'),
    claimsText: readString(value, 'claimsText', '当事人信息'),
    accidentFacts: readString(value, 'accidentFacts', '当事人信息'),
    liabilityDetermination: readString(value, 'liabilityDetermination', '当事人信息'),
    insuranceInfo: readString(value, 'insuranceInfo', '当事人信息'),
    otherFacts: readStringArray(value, 'otherFacts', '当事人信息'),
    claimsList: readString(value, 'claimsList', '当事人信息'),
  };
}

export function parseCalculatorParams(content: string): ExtractedCalculatorParams {
  const value = parseJson(content, '赔偿计算参数');
  assertRecord(value, '赔偿计算参数');

  const params: ExtractedCalculatorParams = {
    warnings: readStringArray(value, 'warnings', '赔偿计算参数'),
  };

  assignOptionalExtractedString(params, value, 'province', '赔偿计算参数');
  assignOptionalExtractedString(params, value, 'year', '赔偿计算参数');
  assignOptionalCaseType(params, value, 'caseType', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'victimAge', '赔偿计算参数');
  assignOptionalNullableDisabilityLevel(params, value, 'disabilityLevel', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'medicalExpense', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'hospitalizationDays', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'nutritionDays', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'lostWageDays', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'monthlyIncome', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'nursingDays', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'nursingPersons', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'transportFee', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'assessmentFee', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'assistiveDeviceFee', '赔偿计算参数');
  assignOptionalExtractedNumber(params, value, 'mentalDistressFee', '赔偿计算参数');

  const dependents = value.dependents;
  if (dependents !== undefined) {
    assertArray(dependents, '赔偿计算参数.dependents');
    params.dependents = dependents.map((item, index) => {
      const path = `赔偿计算参数.dependents[${index}]`;
      assertRecord(item, path);
      return {
        name: readString(item, 'name', path),
        age: readNumber(item, 'age', path),
        otherSupporters: readNumber(item, 'otherSupporters', path),
      };
    });
  }

  return params;
}

function parseJson(content: string, label: string): unknown {
  try {
    return JSON.parse(content) as unknown;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`模型返回的${label}不是有效 JSON: ${message}`);
  }
}

function readString(record: JsonRecord, key: string, path: string): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw new Error(`${path}.${key} 必须是字符串。`);
  }
  return value;
}

function readNumber(record: JsonRecord, key: string, path: string): number {
  const value = record[key];
  assertNumber(value, `${path}.${key}`);
  return value;
}

function readStringArray(record: JsonRecord, key: string, path: string): string[] {
  const value = record[key];
  assertArray(value, `${path}.${key}`);
  return value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(`${path}.${key}[${index}] 必须是字符串。`);
    }
    return item;
  });
}

function assignOptionalNumber(
  target: ClaimItemExtracted,
  record: JsonRecord,
  key: keyof Pick<
    ClaimItemExtracted,
    'disability_level' | 'years_claimed' | 'days_claimed' | 'daily_rate' | 'yearly_rate'
  >,
  path: string
): void {
  const value = record[key];
  if (value === undefined) return;
  assertNumber(value, `${path}.${key}`);
  target[key] = value;
}

function assignOptionalExtractedString(
  target: ExtractedCalculatorParams,
  record: JsonRecord,
  key: 'province' | 'year',
  path: string
): void {
  const value = record[key];
  if (value === undefined) return;
  if (typeof value !== 'string') {
    throw new Error(`${path}.${key} 必须是字符串。`);
  }
  target[key] = value;
}

function assignOptionalExtractedNumber(
  target: ExtractedCalculatorParams,
  record: JsonRecord,
  key: keyof Pick<
    ExtractedCalculatorParams,
    | 'victimAge'
    | 'medicalExpense'
    | 'hospitalizationDays'
    | 'nutritionDays'
    | 'lostWageDays'
    | 'monthlyIncome'
    | 'nursingDays'
    | 'nursingPersons'
    | 'transportFee'
    | 'assessmentFee'
    | 'assistiveDeviceFee'
    | 'mentalDistressFee'
  >,
  path: string
): void {
  const value = record[key];
  if (value === undefined) return;
  assertNumber(value, `${path}.${key}`);
  target[key] = value;
}

function assignOptionalCaseType(
  target: ExtractedCalculatorParams,
  record: JsonRecord,
  key: 'caseType',
  path: string
): void {
  const value = record[key];
  if (value === undefined) return;
  if (typeof value !== 'string' || !CASE_TYPES.includes(value as CaseType)) {
    throw new Error(`${path}.${key} 必须是 injury 或 death。`);
  }
  target[key] = value as CaseType;
}

function assignOptionalNullableDisabilityLevel(
  target: ExtractedCalculatorParams,
  record: JsonRecord,
  key: 'disabilityLevel',
  path: string
): void {
  const value = record[key];
  if (value === undefined) return;
  if (value === null) {
    target[key] = null;
    return;
  }
  assertNumber(value, `${path}.${key}`);
  target[key] = value;
}

function assertRecord(value: unknown, path: string): asserts value is JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} 必须是对象。`);
  }
}

function assertArray(value: unknown, path: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} 必须是数组。`);
  }
}

function assertNumber(value: unknown, path: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${path} 必须是有效数字。`);
  }
}

function isEvidenceStatus(value: string): value is EvidenceStatus {
  return EVIDENCE_STATUSES.includes(value as EvidenceStatus);
}
