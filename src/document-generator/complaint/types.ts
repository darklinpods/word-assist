export interface NaturalPerson {
  id: string;
  name: string;
  gender: string;
  nationality: string;
  birthDate: string;
  address: string;
  idNumber: string;
  phone: string;
}

export interface LegalEntity {
  id: string;
  name: string;
  address: string;
  creditCode: string;
  entityType: string;
  contact: string;
  legalRepresentative: string;
}

export interface ElementalComplaintDraft {
  plaintiffsNatural: NaturalPerson[];
  defendantsNatural: NaturalPerson[];
  defendantsLegal: LegalEntity[];
  defendantsInsurance: LegalEntity[];
  thirdPartyLegal: LegalEntity[];
  claimsText: string;
  accidentFacts: string;
  liabilityDetermination: string;
  insuranceInfo: string;
  otherFacts: string[];
  claimsList: string;
}

export type NaturalPartyCollection = 'plaintiffsNatural' | 'defendantsNatural';
export type LegalPartyCollection =
  | 'defendantsLegal'
  | 'defendantsInsurance'
  | 'thirdPartyLegal';

let idSequence = 0;

export function createDocumentItemId(prefix: string): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return `${prefix}-${randomUuid}`;
  idSequence += 1;
  return `${prefix}-${Date.now()}-${idSequence}`;
}

export function createNaturalPerson(id: string): NaturalPerson {
  return {
    id,
    name: '',
    gender: '',
    nationality: '',
    birthDate: '',
    address: '',
    idNumber: '',
    phone: '',
  };
}

export function createLegalEntity(id: string): LegalEntity {
  return {
    id,
    name: '',
    address: '',
    creditCode: '',
    entityType: '',
    contact: '',
    legalRepresentative: '',
  };
}
