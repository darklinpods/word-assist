import { describe, expect, it } from 'vitest';

import { toLegacyPartyExtraction } from './legacy-adapter';
import type { ElementalComplaintDraft } from './types';

describe('toLegacyPartyExtraction', () => {
  it('uses the extracted structured values when formatting Word template content', () => {
    const draft: ElementalComplaintDraft = {
      plaintiffsNatural: [
        {
          id: 'p1',
          name: '修改后的姓名',
          gender: '女',
          nationality: '汉族',
          birthDate: '1991年2月3日',
          address: '修改后的地址',
          idNumber: '11010519491231002X',
          phone: '13900000000',
        },
      ],
      defendantsNatural: [],
      defendantsLegal: [],
      defendantsInsurance: [],
      thirdPartyLegal: [],
      claimsText: '修改后的诉讼请求',
      accidentFacts: '',
      liabilityDetermination: '',
      insuranceInfo: '',
      otherFacts: [],
      claimsList: '',
    };

    const result = toLegacyPartyExtraction(draft);
    expect(result.plaintiffsNatural[0]).toContain('姓名：修改后的姓名');
    expect(result.plaintiffsNatural[0]).toContain('户籍/住址：修改后的地址');
    expect(result.claimsText).toBe('修改后的诉讼请求');
  });
});
