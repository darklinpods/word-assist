import { insertTemplateAndFill } from '../../utils/office/parties-template';
import { hasElementalComplaintTemplate } from '../../utils/office/template';
import type { GenerationResult } from '../core/types';
import { toLegacyPartyExtraction } from './legacy-adapter';
import type { ElementalComplaintDraft } from './types';

export { hasElementalComplaintTemplate };

export async function generateElementalComplaint(
  draft: ElementalComplaintDraft,
): Promise<GenerationResult> {
  const existingTemplateDetected = await hasElementalComplaintTemplate();
  // 每次生成都使用一份干净模板，避免覆盖用户已有文书，也避免动态当事人行重复累积。
  await insertTemplateAndFill(toLegacyPartyExtraction(draft));

  return {
    generatedAt: new Date().toISOString(),
    insertedNewTemplate: true,
    existingTemplateDetected,
  };
}
