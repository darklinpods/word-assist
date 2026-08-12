import { describe, expect, it } from 'vitest';

import { parseElementalComplaintDraft } from './ai-validators';

const validPayload = JSON.stringify({
  plaintiffsNatural: [
    {
      name: '张三',
      gender: '男',
      nationality: '汉族',
      birthDate: '1990年1月2日',
      address: '湖北省武汉市',
      idNumber: '11010519491231002X',
      phone: '13800000000',
    },
  ],
  defendantsNatural: [],
  defendantsLegal: [],
  defendantsInsurance: [],
  thirdPartyLegal: [],
  claimsText: '请求判令被告赔偿损失。',
  accidentFacts: '2026年发生交通事故。',
  liabilityDetermination: '被告承担全部责任。',
  insuranceInfo: '',
  otherFacts: ['原告经治疗后出院。'],
  claimsList: '医疗费1000元。',
});

describe('parseElementalComplaintDraft', () => {
  it('parses a strict structured complaint and assigns UI ids', () => {
    const result = parseElementalComplaintDraft(validPayload);

    expect(result.plaintiffsNatural).toHaveLength(1);
    expect(result.plaintiffsNatural[0]).toMatchObject({ name: '张三', phone: '13800000000' });
    expect(result.plaintiffsNatural[0]?.id).toMatch(/^natural-0-/);
    expect(result.otherFacts).toEqual(['原告经治疗后出院。']);
  });

  it('rejects missing fixed fields instead of silently accepting malformed AI output', () => {
    const malformed = JSON.stringify({ ...JSON.parse(validPayload), claimsText: undefined });
    expect(() => parseElementalComplaintDraft(malformed)).toThrow('claimsText 必须是字符串');
  });
});
