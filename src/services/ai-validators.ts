import type {
  ElementalComplaintDraft,
  LegalEntity,
  NaturalPerson,
} from '../document-generator/complaint/types';
import { createDocumentItemId } from '../document-generator/complaint/types';
import { normalizeComplaintPartyRoles } from '../document-generator/complaint/party-role-normalization';
import type { EvidenceRawResult, EvidenceStatus } from '../utils/evidence-rules';

type JsonRecord = Record<string, unknown>;

const EVIDENCE_STATUSES: EvidenceStatus[] = ['present', 'weak', 'missing'];

export function parseElementalComplaintDraft(content: string): ElementalComplaintDraft {
  const value = parseJson(content, '要素式起诉状信息');
  assertRecord(value, '要素式起诉状信息');

  return normalizeComplaintPartyRoles({
    plaintiffsNatural: readObjectArray(value, 'plaintiffsNatural', '要素式起诉状信息', parseNaturalPerson),
    defendantsNatural: readObjectArray(value, 'defendantsNatural', '要素式起诉状信息', parseNaturalPerson),
    defendantsLegal: readObjectArray(value, 'defendantsLegal', '要素式起诉状信息', parseLegalEntity),
    defendantsInsurance: readObjectArray(value, 'defendantsInsurance', '要素式起诉状信息', parseLegalEntity),
    thirdPartyLegal: readObjectArray(value, 'thirdPartyLegal', '要素式起诉状信息', parseLegalEntity),
    claimsText: readString(value, 'claimsText', '要素式起诉状信息'),
    accidentFacts: readString(value, 'accidentFacts', '要素式起诉状信息'),
    liabilityDetermination: readString(value, 'liabilityDetermination', '要素式起诉状信息'),
    insuranceInfo: readString(value, 'insuranceInfo', '要素式起诉状信息'),
    otherFacts: readStringArray(value, 'otherFacts', '要素式起诉状信息'),
    claimsList: readString(value, 'claimsList', '要素式起诉状信息'),
  });
}

export function parseEvidenceResults(content: string): EvidenceRawResult[] {
  const value = parseJson(content, '证据核查结果');
  assertArray(value, '证据核查结果');

  return value.map((item, index) => {
    const path = `证据核查结果[${index}]`;
    assertRecord(item, path);
    const status = readString(item, 'status', path);
    if (!EVIDENCE_STATUSES.includes(status as EvidenceStatus)) {
      throw new Error(`${path}.status 必须是 present、weak 或 missing。`);
    }
    return {
      id: readString(item, 'id', path),
      status: status as EvidenceStatus,
      note: readString(item, 'note', path),
    };
  });
}

function parseNaturalPerson(record: JsonRecord, path: string, index: number): NaturalPerson {
  return {
    id: createDocumentItemId(`natural-${index}`),
    name: readString(record, 'name', path),
    gender: readString(record, 'gender', path),
    nationality: readString(record, 'nationality', path),
    birthDate: readString(record, 'birthDate', path),
    address: readString(record, 'address', path),
    idNumber: readString(record, 'idNumber', path),
    phone: readString(record, 'phone', path),
  };
}

function parseLegalEntity(record: JsonRecord, path: string, index: number): LegalEntity {
  return {
    id: createDocumentItemId(`legal-${index}`),
    name: readString(record, 'name', path),
    address: readString(record, 'address', path),
    creditCode: readString(record, 'creditCode', path),
    entityType: readString(record, 'entityType', path),
    contact: readString(record, 'contact', path),
    legalRepresentative: readString(record, 'legalRepresentative', path),
  };
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
  if (typeof value !== 'string') throw new Error(`${path}.${key} 必须是字符串。`);
  return value;
}

function readStringArray(record: JsonRecord, key: string, path: string): string[] {
  const value = record[key];
  assertArray(value, `${path}.${key}`);
  return value.map((item, index) => {
    if (typeof item !== 'string') throw new Error(`${path}.${key}[${index}] 必须是字符串。`);
    return item;
  });
}

function readObjectArray<T>(
  record: JsonRecord,
  key: string,
  path: string,
  parser: (record: JsonRecord, itemPath: string, index: number) => T,
): T[] {
  const value = record[key];
  assertArray(value, `${path}.${key}`);
  return value.map((item, index) => {
    const itemPath = `${path}.${key}[${index}]`;
    assertRecord(item, itemPath);
    return parser(item, itemPath, index);
  });
}

function assertRecord(value: unknown, path: string): asserts value is JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} 必须是对象。`);
  }
}

function assertArray(value: unknown, path: string): asserts value is unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path} 必须是数组。`);
}
