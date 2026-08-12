import { describe, expect, it } from 'vitest';

import { createLegalEntity, type ElementalComplaintDraft, type LegalEntity } from './types';
import { normalizeComplaintPartyRoles } from './party-role-normalization';

function entity(id: string, name: string, creditCode = ''): LegalEntity {
  return {
    ...createLegalEntity(id),
    name,
    creditCode,
  };
}

function draftWith(
  defendantsLegal: LegalEntity[],
  defendantsInsurance: LegalEntity[],
): ElementalComplaintDraft {
  return {
    plaintiffsNatural: [],
    defendantsNatural: [],
    defendantsLegal,
    defendantsInsurance,
    thirdPartyLegal: [],
    claimsText: '',
    accidentFacts: '',
    liabilityDetermination: '',
    insuranceInfo: '',
    otherFacts: [],
    claimsList: '',
  };
}

describe('normalizeComplaintPartyRoles', () => {
  it('keeps a corporate vehicle owner as a legal defendant and the insurer separately', () => {
    const owner = entity('owner', '武汉市某物流有限公司', '91420100123456789A');
    const insurer = entity('insurer', '中国人民财产保险股份有限公司武汉市分公司', '91420100987654321B');

    const result = normalizeComplaintPartyRoles(draftWith([owner], [insurer]));

    expect(result.defendantsLegal.map((item) => item.name)).toEqual([owner.name]);
    expect(result.defendantsInsurance.map((item) => item.name)).toEqual([insurer.name]);
  });

  it('removes an insurer duplicated in both defendant collections', () => {
    const insurerAsLegal = entity('legal-copy', '中国平安财产保险股份有限公司湖北分公司');
    const insurerAsInsurance = entity('insurance-copy', ' 中国平安财产保险股份有限公司湖北分公司 ');

    const result = normalizeComplaintPartyRoles(
      draftWith([insurerAsLegal], [insurerAsInsurance]),
    );

    expect(result.defendantsLegal).toHaveLength(0);
    expect(result.defendantsInsurance).toHaveLength(1);
    expect(result.defendantsInsurance[0]?.id).toBe('insurance-copy');
  });

  it('moves an insurance company out of legal defendants when the model misclassifies it', () => {
    const insurer = entity('misclassified', '中华联合财产保险股份有限公司某支公司');

    const result = normalizeComplaintPartyRoles(draftWith([insurer], []));

    expect(result.defendantsLegal).toHaveLength(0);
    expect(result.defendantsInsurance.map((item) => item.name)).toEqual([insurer.name]);
  });
});
