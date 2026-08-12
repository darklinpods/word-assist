import { describe, expect, it } from 'vitest';

import type { ElementalComplaintDraft } from './types';
import { validateElementalComplaint } from './validation';

function buildDraft(): ElementalComplaintDraft {
  return {
    plaintiffsNatural: [
      {
        id: 'plaintiff-1',
        name: '张三',
        gender: '男',
        nationality: '汉族',
        birthDate: '1949年12月31日',
        address: '北京市朝阳区',
        idNumber: '11010519491231002X',
        phone: '13800000000',
      },
    ],
    defendantsNatural: [],
    defendantsLegal: [
      {
        id: 'defendant-1',
        name: '示例公司',
        address: '北京市海淀区',
        creditCode: '91110000123456789A',
        entityType: '有限责任公司',
        contact: '',
        legalRepresentative: '',
      },
    ],
    defendantsInsurance: [],
    thirdPartyLegal: [],
    claimsText: '请求依法判决。',
    accidentFacts: '发生交通事故。',
    liabilityDetermination: '',
    insuranceInfo: '',
    otherFacts: [],
    claimsList: '',
  };
}

describe('validateElementalComplaint', () => {
  it('separates blocking data problems from recommended additions', () => {
    const issues = validateElementalComplaint(buildDraft());

    expect(issues.filter((item) => item.severity === 'error')).toHaveLength(0);
    expect(issues.map((item) => item.message)).toContain('法人被告1建议补充法定代表人');
    expect(issues.map((item) => item.message)).toContain('建议补充交通事故责任认定');
  });

  it('detects invalid identity numbers and missing defendants', () => {
    const draft = buildDraft();
    draft.plaintiffsNatural[0] = { ...draft.plaintiffsNatural[0]!, idNumber: '123' };
    draft.defendantsLegal = [];

    const errors = validateElementalComplaint(draft).filter((item) => item.severity === 'error');
    expect(errors.map((item) => item.message)).toContain('至少需要一名被告');
    expect(errors.some((item) => item.message.includes('身份证号码无效'))).toBe(true);
  });
});
