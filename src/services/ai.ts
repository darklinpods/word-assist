/**
 * Real AI service connecting to Volcengine Ark API.
 */

import type { ClaimItemExtracted } from '../utils/compensation-rules';
import { EVIDENCE_CHECKLIST } from '../utils/evidence-rules';
import type { EvidenceRawResult } from '../utils/evidence-rules';
import type { PartyExtraction } from '../types/parties';
import { getErrorMessage } from '../utils/error';

const API_KEY = import.meta.env.VITE_ARK_API_KEY;
const MODEL_EP_ID = import.meta.env.VITE_ARK_MODEL_EP_ID;
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

function assertConfigured(text: string): void {
  if (!text || text.trim() === '') throw new Error('未选中任何文字。');
  if (MODEL_EP_ID.includes('请在此处填入')) {
    throw new Error('请先在 src/services/ai.ts 填入模型接入点 ID');
  }
}

async function callArkAPI(
  messages: { role: string; content: string }[],
  temperature: number
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL_EP_ID, messages, temperature }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(`API: ${err.error?.message || response.statusText}`);
  }
  const data = await response.json();
  return data.choices[0].message.content as string;
}

function stripMarkdownFence(content: string): string {
  return content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

/**
 * 分析法律文本
 * @param text 要分析的文本
 * @returns 分析结果
 */
export async function analyzeLegalText(text: string): Promise<string> {
  if (!text || text.trim() === '') {
    return '请先选中诉状中的部分文字，然后再点击分析。';
  }
  if (MODEL_EP_ID.includes('请在此处填入')) {
    throw new Error('请先在 src/services/ai.ts 文件的第 9 行填入你的火山引擎模型接入点 ID (格式类似于 ep-xxxxxx)');
  }

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  const systemPrompt = `你是一名资深的中国执业律师，精通民商事诉讼业务。
【注意！当前系统真实时间】：今天是 ${today}（请务必以此时间作为判断过去与未来的唯一基准，切记现在不是2024年，切勿受你的模型默认年份影响！）

请审查以下当事人起草的民事起诉状片段，重点检查：
1. 诉讼请求是否明确、具体、完整；
2. 事实和理由是否有逻辑漏洞或前后矛盾（特别是时间线的合理性，必须完全基于我告知你的系统真实时间！）；
3. 法律适用（是否引用了确切的现行法律条款，如有缺失请补充）。
请结构化地列出审查意见及具体的修改建议。保持语气的专业、客观。`;

  try {
    return await callArkAPI(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: `请帮我深入审查并提出修改这段诉状建议：\n\n${text}` }],
      0.2
    );
  } catch (error: unknown) {
    throw new Error(`请求火山引擎大模型时发生异常: ${getErrorMessage(error)}`);
  }
}

/**
 * 结构化抽取交通事故索赔事实要素
 */
export async function extractClaimElementsAsJSON(text: string): Promise<ClaimItemExtracted[]> {
  assertConfigured(text);

  const systemPrompt = `你是一个无情的法律事实提取机器。
请从给定的交通事故起诉状文本中，抽取所有主张的索赔科目明细，严禁进行任何你自己的计算！你只负责把文书中写上的数字原样抄录并格式化。

提取要求：
1. 提取每一项费用名目（如 "医疗费"、"残疾赔偿金"、"护理费"、"误工费"、"休学损失" 等）。
2. "user_amount": 提取当事人起诉状上明确写出的主张金额，必须为 Number。
3. "disability_level": 若有伤残等级，提取为1-10的数字（如十级为10，如果没有就不输出）。
4. "years_claimed": 若有赔偿年限提取为数字（如20）。
5. "days_claimed": 若写明了天数，如 90 天，提取为 90。
6. "daily_rate": 类似 50 元/天 的日标准。
7. "yearly_rate": 类似 52532 元/年 的年标准，不带单位。
8. "components": 如果某项是由一系列发票算式组成的（如 21895.30+329.06+83.88），请提成一个 Number 数组 [21895.3, 329.06, 83.88]。

输出格式必须是严格的纯 JSON 数组，不要包裹在 Markdown 代码块（如 \`\`\`json）内，不要有任何前言后语。
示例：
[
  { "type": "残疾赔偿金", "user_amount": 98328, "disability_level": 10, "years_claimed": 20 },
  { "type": "医疗费", "user_amount": 22308.24, "components": [21895.30, 329.06, 83.88] },
  { "type": "护理费", "user_amount": 12953, "yearly_rate": 52532, "days_claimed": 90 }
]
`;

  try {
    const content = stripMarkdownFence(
      await callArkAPI(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }],
        0.0
      )
    );
    return JSON.parse(content) as ClaimItemExtracted[];
  } catch (error: unknown) {
    throw new Error(`解析索赔失败: ${getErrorMessage(error)}`);
  }
}

/**
 * 证据清单核查
 */
export async function extractEvidenceFromText(text: string): Promise<EvidenceRawResult[]> {
  assertConfigured(text);

  const checklistSummary = EVIDENCE_CHECKLIST.map(
    (e, i) => `${i + 1}. id="${e.id}" 名称="${e.name}" 用途="${e.purpose}"`
  ).join('\n');

  const systemPrompt = `你是一个中国民事诉讼证据核查助手，精通交通事故人身损害案件的举证规范。

你将收到一份起诉状或诉讼材料文本。请逐一检查以下 ${EVIDENCE_CHECKLIST.length} 项标准证据在文本中的出具状态，并严格按照 JSON 格式输出结果。

【标准证据清单】
${checklistSummary}

【状态定义】
- "present"：文本中明确提到或引用了该证据（如"附事故认定书"、"凭医疗发票"等）
- "weak"：隐约提及但内容不完整或仅泛泛说"见附件"，无具体说明
- "missing"：未找到任何与该证据相关的表述

【输出格式】
严格输出纯 JSON 数组，不加 Markdown 代码块，不加任何前言后语：
[
  { "id": "accident_report", "status": "present", "note": "原文：见交警部门出具的道路交通事故认定书" },
  { "id": "medical_invoice", "status": "weak", "note": "原文仅写'见发票'，未说明金额或张数" },
  { "id": "disability_assessment", "status": "missing", "note": "文本中未提及伤残鉴定" }
]
必须输出全部 ${EVIDENCE_CHECKLIST.length} 项，每项都要有 id、status、note 三个字段。`;

  try {
    const content = stripMarkdownFence(
      await callArkAPI(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: `请核查以下诉状材料中的证据出具情况：\n\n${text}` }],
        0.0
      )
    );
    return JSON.parse(content) as EvidenceRawResult[];
  } catch (error: unknown) {
    throw new Error(`证据核查失败: ${getErrorMessage(error)}`);
  }
}

/**
 * 抽取当事人信息（严格按原文，不改写）
 */
export async function extractPartiesFromText(text: string): Promise<PartyExtraction> {
  assertConfigured(text);

  const systemPrompt = `你是一个诉状信息格式化抽取器。
只从传统式起诉状中抽取信息，禁止改写任何内容，任何未出现的信息不得推断或补充。

【一、当事人】
角色范围固定为以下五类（没有就留空数组）：
1. 原告（自然人）
2. 被告（自然人）
3. 被告（法人）
4. 被告（保险公司）
5. 第三人（法人）

规则：
- 原告/被告数量不固定，必须逐个输出为数组项。
- 每个数组项输出为多行格式字符串，只做格式化，不得改写原意。
- 若某字段在原文中找不到，保留字段名，冒号后留空。

【自然人格式】
姓名：xxx
性别：xxx；民族：xxx
出生日期：xxxx年xx月xx日
户籍/住址：xxx
公民身份号码：xxxxxxxx
联系电话：xxxxxxx

【法人/保险公司/第三人法人格式】
名称：xxx
住所地：xxx
统一社会信用代码：xxxxxxxx
法人类型：xxx
联系人：xxx
法定代表人：xxx

【二、诉讼请求】
完整复制原文"诉讼请求"部分的所有内容，一字不动照抄，输出到 claimsText 字段。

【三、事实与理由】
从"事实与理由"部分提取以下四个子项：
- accidentFacts：交通事故发生情况（通常第一段），原文照抄。
- liabilityDetermination：交通事故责任认定（通常第二段），原文照抄。
- insuranceInfo：机动车投保情况（单独的一段），原文照抄。
- otherFacts：除上述三段之外，事实与理由中其余所有独立段落，每段作为数组中的一个元素，原文照抄，不合并。

【四、索赔清单】
找到"索赔清单"节（单独的一节），全文照抄，一字不改，输出到 claimsList 字段。

输出格式必须是严格 JSON（不要 Markdown），字段固定为：
{
  "plaintiffsNatural": ["..."],
  "defendantsNatural": ["..."],
  "defendantsLegal": ["..."],
  "defendantsInsurance": ["..."],
  "thirdPartyLegal": ["..."],
  "claimsText": "...",
  "accidentFacts": "...",
  "liabilityDetermination": "...",
  "insuranceInfo": "...",
  "otherFacts": ["...", "..."],
  "claimsList": "..."
}
`;

  try {
    const content = stripMarkdownFence(
      await callArkAPI(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }],
        0.0
      )
    );
    const parsed = JSON.parse(content) as PartyExtraction;
    return {
      plaintiffsNatural: parsed.plaintiffsNatural || [],
      defendantsNatural: parsed.defendantsNatural || [],
      defendantsLegal: parsed.defendantsLegal || [],
      defendantsInsurance: parsed.defendantsInsurance || [],
      thirdPartyLegal: parsed.thirdPartyLegal || [],
      claimsText: parsed.claimsText || '',
      accidentFacts: parsed.accidentFacts || '',
      liabilityDetermination: parsed.liabilityDetermination || '',
      insuranceInfo: parsed.insuranceInfo || '',
      otherFacts: parsed.otherFacts || [],
      claimsList: parsed.claimsList || '',
    };
  } catch (error: unknown) {
    throw new Error(`当事人信息抽取失败: ${getErrorMessage(error)}`);
  }
}
