import type { PartyCheckItem, PartyExtraction, PartyRole } from '../types/parties';
import { extractIdCardsFromText, validateIdCard } from './id-card';

const LINE_SPLIT = /\r?\n+/;
const PHONE_REGEX = /(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})/;
const CREDIT_CODE_REGEX = /[0-9A-Z]{18}/;
const DATE_REGEX = /(\d{4})[年\-/.](\d{1,2})[月\-/.](\d{1,2})/;

const getLineValue = (raw: string, label: string): string => {
  const lines = raw.split(LINE_SPLIT);
  const regex = new RegExp(`${label}\\s*[:：]\\s*(.*)`);
  for (const line of lines) {
    const match = line.match(regex);
    if (match && match[1]) return match[1].trim();
  }
  return '';
};

const normalizeDate = (input: string): string => {
  const match = input.match(DATE_REGEX);
  if (!match) return '';
  const year = match[1];
  const month = String(Number(match[2])).padStart(2, '0');
  const day = String(Number(match[3])).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const extractDateFromText = (raw: string): string => {
  const match = raw.match(DATE_REGEX);
  return match ? normalizeDate(match[0]) : '';
};

const extractPhone = (raw: string): string => {
  const line = getLineValue(raw, '联系电话') || getLineValue(raw, '联系方式');
  const match = (line || raw).match(PHONE_REGEX);
  return match ? match[0] : '';
};

const extractAddress = (raw: string): string => {
  return (
    getLineValue(raw, '户籍/住址') ||
    getLineValue(raw, '户籍') ||
    getLineValue(raw, '住址') ||
    getLineValue(raw, '住所') ||
    getLineValue(raw, '住所地')
  );
};

const extractName = (raw: string): string => getLineValue(raw, '姓名') || getLineValue(raw, '名称');

const extractCreditCode = (raw: string): string => {
  const line = getLineValue(raw, '统一社会信用代码');
  const match = (line || raw).toUpperCase().match(CREDIT_CODE_REGEX);
  return match ? match[0] : '';
};

const extractLegalRep = (raw: string): string => getLineValue(raw, '法定代表人');
const extractContact = (raw: string): string => getLineValue(raw, '联系人');

const buildNaturalCheck = (role: PartyRole, raw: string, index: number): PartyCheckItem => {
  const idNumber = extractIdCardsFromText(raw)[0] || '';
  const birthDateRaw = getLineValue(raw, '出生日期');
  const birthDate = normalizeDate(birthDateRaw) || extractDateFromText(raw);
  const phone = extractPhone(raw);
  const address = extractAddress(raw);
  const name = extractName(raw);

  const missing: string[] = [];
  const recommendedMissing: string[] = [];
  const issues: string[] = [];

  if (!idNumber) missing.push('身份证号码');
  if (!birthDate) missing.push('出生日期');
  if (!phone) missing.push('联系方式');
  if (!address) missing.push('住址');

  let idCheck: PartyCheckItem['idCheck'] | undefined;
  if (idNumber) {
    const checked = validateIdCard(idNumber);
    const birthDateMatches = birthDate ? checked.birthDate === birthDate : null;
    idCheck = {
      present: true,
      isValid: checked.isValid,
      reason: checked.reason,
      birthDateFromId: checked.birthDate,
      birthDateMatches,
    };
    if (!checked.isValid) issues.push(`身份证号码无效（${checked.reason}）`);
    if (checked.isValid && birthDate && birthDateMatches === false) {
      issues.push('身份证与出生日期不匹配');
    }
  } else {
    idCheck = {
      present: false,
      isValid: false,
      reason: '未提供身份证号码',
      birthDateFromId: '',
      birthDateMatches: null,
    };
  }

  const ok = missing.length === 0 && issues.length === 0;
  return {
    role,
    kind: 'natural',
    index,
    raw,
    fields: {
      name,
      idNumber,
      birthDate,
      phone,
      address,
      creditCode: '',
      legalRep: '',
      contact: '',
    },
    idCheck,
    completeness: { missing, recommendedMissing, issues, ok },
  };
};

const buildLegalCheck = (role: PartyRole, raw: string, index: number): PartyCheckItem => {
  const name = extractName(raw);
  const address = extractAddress(raw);
  const creditCode = extractCreditCode(raw);
  const legalRep = extractLegalRep(raw);
  const contact = extractContact(raw);

  const missing: string[] = [];
  const recommendedMissing: string[] = [];
  const issues: string[] = [];

  if (!name) missing.push('名称');
  if (!address) missing.push('住所地');
  if (!creditCode) missing.push('统一社会信用代码');

  if (!legalRep) recommendedMissing.push('法定代表人');
  if (!contact) recommendedMissing.push('联系人');

  const ok = missing.length === 0 && issues.length === 0;
  return {
    role,
    kind: 'legal',
    index,
    raw,
    fields: {
      name,
      idNumber: '',
      birthDate: '',
      phone: '',
      address,
      creditCode,
      legalRep,
      contact,
    },
    completeness: { missing, recommendedMissing, issues, ok },
  };
};

export const buildPartyChecks = (parties: PartyExtraction): PartyCheckItem[] => {
  const checks: PartyCheckItem[] = [];

  parties.plaintiffsNatural.forEach((raw, index) => {
    checks.push(buildNaturalCheck('原告（自然人）', raw, index));
  });
  parties.defendantsNatural.forEach((raw, index) => {
    checks.push(buildNaturalCheck('被告（自然人）', raw, index));
  });
  parties.defendantsLegal.forEach((raw, index) => {
    checks.push(buildLegalCheck('被告（法人）', raw, index));
  });
  parties.defendantsInsurance.forEach((raw, index) => {
    checks.push(buildLegalCheck('被告（保险公司）', raw, index));
  });
  parties.thirdPartyLegal.forEach((raw, index) => {
    checks.push(buildLegalCheck('第三人（法人）', raw, index));
  });

  return checks;
};
