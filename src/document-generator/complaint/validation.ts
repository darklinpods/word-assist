import type { ValidationIssue } from '../core/types';
import { validateIdCard } from '../../utils/id-card';
import type { ElementalComplaintDraft, LegalEntity, NaturalPerson } from './types';

function issue(
  id: string,
  path: string,
  severity: ValidationIssue['severity'],
  message: string,
): ValidationIssue {
  return { id, path, severity, message };
}

function validateNaturalPerson(
  person: NaturalPerson,
  path: string,
  label: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!person.name.trim()) issues.push(issue(`${person.id}-name`, `${path}.name`, 'error', `${label}缺少姓名`));
  if (!person.idNumber.trim()) {
    issues.push(issue(`${person.id}-id`, `${path}.idNumber`, 'error', `${label}缺少公民身份号码`));
  } else {
    const checked = validateIdCard(person.idNumber.trim());
    if (!checked.isValid) {
      issues.push(issue(`${person.id}-id-invalid`, `${path}.idNumber`, 'error', `${label}身份证号码无效：${checked.reason}`));
    } else if (person.birthDate.trim()) {
      const normalizedBirthDate = person.birthDate.trim().replace(/[年/.]/g, '-').replace('月', '-').replace('日', '');
      const parts = normalizedBirthDate.split('-').filter(Boolean);
      const comparableBirthDate = parts.length === 3
        ? `${parts[0]}-${String(Number(parts[1])).padStart(2, '0')}-${String(Number(parts[2])).padStart(2, '0')}`
        : normalizedBirthDate;
      if (comparableBirthDate !== checked.birthDate) {
        issues.push(issue(`${person.id}-birth-mismatch`, `${path}.birthDate`, 'error', `${label}出生日期与身份证不一致`));
      }
    }
  }
  if (!person.birthDate.trim()) issues.push(issue(`${person.id}-birth`, `${path}.birthDate`, 'error', `${label}缺少出生日期`));
  if (!person.address.trim()) issues.push(issue(`${person.id}-address`, `${path}.address`, 'error', `${label}缺少户籍或住址`));
  if (!person.phone.trim()) issues.push(issue(`${person.id}-phone`, `${path}.phone`, 'warning', `${label}建议补充联系电话`));
  return issues;
}

function validateLegalEntity(entity: LegalEntity, path: string, label: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!entity.name.trim()) issues.push(issue(`${entity.id}-name`, `${path}.name`, 'error', `${label}缺少名称`));
  if (!entity.address.trim()) issues.push(issue(`${entity.id}-address`, `${path}.address`, 'error', `${label}缺少住所地`));
  if (!entity.creditCode.trim()) issues.push(issue(`${entity.id}-credit`, `${path}.creditCode`, 'error', `${label}缺少统一社会信用代码`));
  if (!entity.legalRepresentative.trim()) {
    issues.push(issue(`${entity.id}-representative`, `${path}.legalRepresentative`, 'warning', `${label}建议补充法定代表人`));
  }
  if (!entity.contact.trim()) issues.push(issue(`${entity.id}-contact`, `${path}.contact`, 'warning', `${label}建议补充联系人`));
  return issues;
}

export function validateElementalComplaint(draft: ElementalComplaintDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (draft.plaintiffsNatural.length === 0) {
    issues.push(issue('plaintiff-missing', 'plaintiffsNatural', 'error', '至少需要一名原告'));
  }
  if (
    draft.defendantsNatural.length +
      draft.defendantsLegal.length +
      draft.defendantsInsurance.length ===
    0
  ) {
    issues.push(issue('defendant-missing', 'defendants', 'error', '至少需要一名被告'));
  }

  draft.plaintiffsNatural.forEach((person, index) => {
    issues.push(...validateNaturalPerson(person, `plaintiffsNatural.${index}`, `原告${index + 1}`));
  });
  draft.defendantsNatural.forEach((person, index) => {
    issues.push(...validateNaturalPerson(person, `defendantsNatural.${index}`, `自然人被告${index + 1}`));
  });
  draft.defendantsLegal.forEach((entity, index) => {
    issues.push(...validateLegalEntity(entity, `defendantsLegal.${index}`, `法人被告${index + 1}`));
  });
  draft.defendantsInsurance.forEach((entity, index) => {
    issues.push(...validateLegalEntity(entity, `defendantsInsurance.${index}`, `保险公司${index + 1}`));
  });
  draft.thirdPartyLegal.forEach((entity, index) => {
    issues.push(...validateLegalEntity(entity, `thirdPartyLegal.${index}`, `第三人${index + 1}`));
  });

  if (!draft.claimsText.trim()) issues.push(issue('claims-missing', 'claimsText', 'error', '缺少诉讼请求'));
  if (!draft.accidentFacts.trim()) issues.push(issue('accident-missing', 'accidentFacts', 'error', '缺少交通事故发生情况'));
  if (!draft.liabilityDetermination.trim()) {
    issues.push(issue('liability-missing', 'liabilityDetermination', 'warning', '建议补充交通事故责任认定'));
  }
  if (!draft.insuranceInfo.trim()) issues.push(issue('insurance-missing', 'insuranceInfo', 'warning', '建议补充机动车投保情况'));
  if (!draft.claimsList.trim()) issues.push(issue('claims-list-missing', 'claimsList', 'warning', '建议补充索赔清单'));

  return issues;
}
