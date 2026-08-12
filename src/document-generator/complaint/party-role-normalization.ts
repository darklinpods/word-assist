import type { ElementalComplaintDraft, LegalEntity } from './types';

const INSURANCE_ENTITY_PATTERN =
  /(?:财产保险|人寿保险|保险股份有限公司|保险有限责任公司|保险有限公司|保险分公司|保险支公司)/;

function normalizeIdentityValue(value: string): string {
  return value.normalize('NFKC').replace(/[\s·•,，。.;；:：()（）【】[\]]/g, '').toUpperCase();
}

function getEntityIdentityKeys(entity: LegalEntity): string[] {
  const keys: string[] = [];
  const creditCode = normalizeIdentityValue(entity.creditCode);
  const name = normalizeIdentityValue(entity.name);
  if (creditCode) keys.push(`credit:${creditCode}`);
  if (name) keys.push(`name:${name}`);
  return keys;
}

function hasKnownIdentity(entity: LegalEntity, identities: Set<string>): boolean {
  return getEntityIdentityKeys(entity).some((key) => identities.has(key));
}

function addIdentity(entity: LegalEntity, identities: Set<string>): void {
  getEntityIdentityKeys(entity).forEach((key) => identities.add(key));
}

export function isInsuranceEntity(entity: LegalEntity): boolean {
  return INSURANCE_ENTITY_PATTERN.test(entity.name.normalize('NFKC'));
}

function deduplicateEntities(entities: LegalEntity[]): LegalEntity[] {
  const identities = new Set<string>();
  const result: LegalEntity[] = [];

  for (const entity of entities) {
    const keys = getEntityIdentityKeys(entity);
    if (keys.length > 0 && hasKnownIdentity(entity, identities)) continue;
    result.push(entity);
    addIdentity(entity, identities);
  }

  return result;
}

/**
 * 交通事故案件中的“法人被告”和“保险公司被告”是互斥角色：
 * - 法人车主、管理人或用人单位保留在 defendantsLegal；
 * - 承保并承担保险责任的保险机构只保留在 defendantsInsurance。
 */
export function normalizeComplaintPartyRoles(
  draft: ElementalComplaintDraft,
): ElementalComplaintDraft {
  const insuranceEntities = deduplicateEntities([
    ...draft.defendantsInsurance,
    ...draft.defendantsLegal.filter(isInsuranceEntity),
  ]);
  const insuranceIdentities = new Set<string>();
  insuranceEntities.forEach((entity) => addIdentity(entity, insuranceIdentities));

  const legalEntities = deduplicateEntities(
    draft.defendantsLegal.filter(
      (entity) => !isInsuranceEntity(entity) && !hasKnownIdentity(entity, insuranceIdentities),
    ),
  );

  return {
    ...draft,
    defendantsLegal: legalEntities,
    defendantsInsurance: insuranceEntities,
  };
}
