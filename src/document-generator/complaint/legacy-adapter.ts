import type { PartyExtraction } from '../../types/parties';
import type { ElementalComplaintDraft, LegalEntity, NaturalPerson } from './types';

function formatNaturalPerson(person: NaturalPerson): string {
  return [
    `姓名：${person.name}`,
    `性别：${person.gender}；民族：${person.nationality}`,
    `出生日期：${person.birthDate}`,
    `户籍/住址：${person.address}`,
    `公民身份号码：${person.idNumber}`,
    `联系电话：${person.phone}`,
  ].join('\n');
}

function formatLegalEntity(entity: LegalEntity): string {
  const entityType = entity.entityType || (entity.name.includes('股份') ? '股份有限公司' : '有限责任公司');
  return [
    `名称：${entity.name}`,
    `住所地：${entity.address}`,
    `统一社会信用代码：${entity.creditCode}`,
    `法人类型：${entityType}`,
    `联系人：${entity.contact}`,
    `法定代表人：${entity.legalRepresentative}`,
  ].join('\n');
}

export function toLegacyPartyExtraction(draft: ElementalComplaintDraft): PartyExtraction {
  return {
    plaintiffsNatural: draft.plaintiffsNatural.map(formatNaturalPerson),
    defendantsNatural: draft.defendantsNatural.map(formatNaturalPerson),
    defendantsLegal: draft.defendantsLegal.map(formatLegalEntity),
    defendantsInsurance: draft.defendantsInsurance.map(formatLegalEntity),
    thirdPartyLegal: draft.thirdPartyLegal.map(formatLegalEntity),
    claimsText: draft.claimsText,
    accidentFacts: draft.accidentFacts,
    liabilityDetermination: draft.liabilityDetermination,
    insuranceInfo: draft.insuranceInfo,
    otherFacts: draft.otherFacts,
    claimsList: draft.claimsList,
  };
}
