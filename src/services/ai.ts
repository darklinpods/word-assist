import type { ElementalComplaintDraft } from '../document-generator/complaint/types';
import { EVIDENCE_CHECKLIST } from '../utils/evidence-rules';
import type { EvidenceRawResult } from '../utils/evidence-rules';
import { getErrorMessage } from '../utils/error';
import { ARK_API_URL, requireAiConfig } from './ai-config';
import { parseElementalComplaintDraft, parseEvidenceResults } from './ai-validators';

interface ArkMessage {
  role: 'system' | 'user';
  content: string;
}

interface ArkResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

async function callArkAPI(messages: ArkMessage[], temperature: number): Promise<string> {
  const { apiKey, endpointId } = requireAiConfig();
  const response = await fetch(ARK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: endpointId, messages, temperature }),
  });

  const data = await response.json() as ArkResponse;
  if (!response.ok) {
    throw new Error(`API: ${data.error?.message || response.statusText}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('模型未返回有效内容。');
  return content;
}

function assertSourceText(text: string): void {
  if (!text.trim()) throw new Error('当前文档没有可提取的正文内容。');
  requireAiConfig();
}

function stripMarkdownFence(content: string): string {
  return content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

/**
 * 从传统交通事故起诉状全文中提取可编辑的结构化要素。
 */
export async function extractElementalComplaintFromText(text: string): Promise<ElementalComplaintDraft> {
  assertSourceText(text);

  const systemPrompt = `你是中国交通事故民事起诉状的信息提取器。
只从用户提供的传统式起诉状中提取信息，不得改写原意，不得推断原文没有的事实。

当字段未出现时输出空字符串；角色不存在时输出空数组。多个当事人必须分别输出。
诉讼请求、事故事实、责任认定、投保情况、其他事实和索赔清单应尽量保持原文措辞。

【被告角色分类规则（必须严格遵守）】
1. defendantsLegal 只放非保险类法人被告，例如车辆所有人为公司、车辆管理人为公司或用人单位为公司。
2. defendantsInsurance 只放承保事故车辆、因保险合同承担交强险或商业险责任的保险公司、分公司或支公司。
3. 保险公司虽然也是法人，但属于本任务的特定被告类型，禁止同时放入 defendantsLegal。
4. 同一当事人只能出现一次；如果原文同时说明“法人车主”和“承保保险公司”，应分别提取到 defendantsLegal 与 defendantsInsurance，不得互相替代或合并。
5. 不得仅因某法人名下车辆已投保，就把该法人车主归类成保险公司。

自然人字段：name（姓名）、gender（性别）、nationality（民族）、birthDate（出生日期）、address（户籍地或住址）、idNumber（公民身份号码）、phone（联系电话）。
法人、保险公司及法人第三人字段：name（名称）、address（住所地）、creditCode（统一社会信用代码）、entityType（法人类型）、contact（联系人）、legalRepresentative（法定代表人）。

严格输出以下 JSON 对象，不要输出 Markdown 或解释：
{
  "plaintiffsNatural": [{"name":"","gender":"","nationality":"","birthDate":"","address":"","idNumber":"","phone":""}],
  "defendantsNatural": [],
  "defendantsLegal": [{"name":"","address":"","creditCode":"","entityType":"","contact":"","legalRepresentative":""}],
  "defendantsInsurance": [],
  "thirdPartyLegal": [],
  "claimsText": "",
  "accidentFacts": "",
  "liabilityDetermination": "",
  "insuranceInfo": "",
  "otherFacts": [],
  "claimsList": ""
}`;

  try {
    const content = stripMarkdownFence(
      await callArkAPI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请提取以下传统式起诉状：\n\n${text}` },
        ],
        0,
      ),
    );
    return parseElementalComplaintDraft(content);
  } catch (error: unknown) {
    throw new Error(`要素式起诉状信息提取失败: ${getErrorMessage(error)}`);
  }
}

/**
 * 保留为文书生成流程的辅助核查能力，不再作为一级功能入口。
 */
export async function extractEvidenceFromText(text: string): Promise<EvidenceRawResult[]> {
  assertSourceText(text);
  const checklistSummary = EVIDENCE_CHECKLIST.map(
    (item, index) => `${index + 1}. id="${item.id}" 名称="${item.name}" 用途="${item.purpose}"`,
  ).join('\n');

  const systemPrompt = `你是中国交通事故人身损害案件的证据核查助手。
请逐一检查以下 ${EVIDENCE_CHECKLIST.length} 项证据在文本中的状态。

${checklistSummary}

状态只能是 present（明确提到）、weak（提及但不完整）或 missing（未发现）。
严格输出全部项目组成的 JSON 数组，每项包含 id、status、note，不要输出 Markdown 或解释。`;

  try {
    const content = stripMarkdownFence(
      await callArkAPI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请核查以下诉状材料：\n\n${text}` },
        ],
        0,
      ),
    );
    return parseEvidenceResults(content);
  } catch (error: unknown) {
    throw new Error(`证据核查失败: ${getErrorMessage(error)}`);
  }
}
