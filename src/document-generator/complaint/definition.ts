import { extractElementalComplaintFromText } from '../../services/ai';
import type { DocumentDefinition } from '../core/types';
import type { ElementalComplaintDraft } from './types';
import { validateElementalComplaint } from './validation';
import { generateElementalComplaint } from './word-generator';
import { hasElementalComplaintTemplate } from './word-generator';

export const trafficAccidentComplaintDefinition: DocumentDefinition<ElementalComplaintDraft> = {
  id: 'traffic-accident-elemental-complaint',
  title: '交通事故要素式起诉状',
  description: '读取当前传统式起诉状，展示提取结果后生成要素式起诉状。',
  extract: extractElementalComplaintFromText,
  validate: validateElementalComplaint,
  inspectTarget: async () => ({
    exists: await hasElementalComplaintTemplate(),
    message: '当前文档中已经存在要素式起诉状。为保护已有内容，继续后将插入一份新的生成版本，不会覆盖旧版本。',
  }),
  generate: generateElementalComplaint,
};
