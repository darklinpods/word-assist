/**
 * Real AI service connecting to Volcengine Ark API.
 */

// 使用你的火山引擎 API Key
const API_KEY = '557f4ffb-d5e3-4a2c-a213-eea305641f33';

// ⚠️ 注意：火山引擎的大模型强制要求必须使用你自己创建的“推理接入点(Endpoint ID)”，类似于 ep-2024...
// 这里为你预留了位置。请登录火山方舟控制台，选择【豆包·Pro·32k】或【DeepSeek-V3】后创建一个接入点。
const MODEL_EP_ID = 'ep-m-20260319002513-6dws2';

export async function analyzeLegalText(text: string): Promise<string> {
  if (!text || text.trim() === '') {
    return '请先选中诉状中的部分文字，然后再点击分析。';
  }

  // 拦截未配置 Endpoint ID 的情况并在界面抛出提示
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
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_EP_ID,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请帮我深入审查并提出修改这段诉状建议：\n\n${text}` }
        ],
        temperature: 0.2, // 诉状类严谨的文本，将温度设置在较低水平，防止模型过于奔放
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API 请求出错: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error: any) {
    throw new Error(`请求火山引擎大模型时发生异常: ${error.message}`);
  }
}

import type { ClaimItemExtracted } from '../utils/compensation-rules';
import { EVIDENCE_CHECKLIST } from '../utils/evidence-rules';
import type { EvidenceRawResult } from '../utils/evidence-rules';

/**
 * 结构化抽取交通事故索赔事实要素
 * 屏蔽主观推理，只管客观读数
 */
export async function extractClaimElementsAsJSON(text: string): Promise<ClaimItemExtracted[]> {
  if (!text || text.trim() === '') {
    throw new Error('未选中任何文字。');
  }

  if (MODEL_EP_ID.includes('请在此处填入')) {
    throw new Error('请先在 src/services/ai.ts 文件填入模型接入点 ID');
  }

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
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_EP_ID,
        // 这里强制要求 JSON 输出（由于部分模型可能不支持 response_format: { type: "json_object" }，用严厉的 Prompt 辅以解析即可）
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.0, // 事实提取温度降到完全冷酷
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // 粗暴剔除可能被大模型多嘴加上的 ```json 块
    if (content.startsWith('\`\`\`json')) {
      content = content.replace(/^\\\`\\\`\\\`json/i, '').replace(/\\\`\\\`\\\`$/, '').trim();
    } else if (content.startsWith('\`\`\`')) {
      content = content.replace(/^\\\`\\\`\\\`/i, '').replace(/\\\`\\\`\\\`$/, '').trim();
    }

    return JSON.parse(content) as ClaimItemExtracted[];

  } catch (error: any) {
    throw new Error(`解析索赔失败: ${error.message}`);
  }
}

/**
 * 证据清单核查：让 AI 逐一判断诉状中每项标准证据的出具状态
 */
export async function extractEvidenceFromText(text: string): Promise<EvidenceRawResult[]> {
  if (!text || text.trim() === '') {
    throw new Error('未选中任何文字。');
  }
  if (MODEL_EP_ID.includes('请在此处填入')) {
    throw new Error('请先填入模型接入点 ID');
  }

  // 把证据清单序列化给模型，确保 id 完全一致
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
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_EP_ID,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请核查以下诉状材料中的证据出具情况：\n\n${text}` },
        ],
        temperature: 0.0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    // 剥离可能的 markdown 代码块
    content = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    return JSON.parse(content) as EvidenceRawResult[];
  } catch (error: any) {
    throw new Error(`证据核查失败: ${error.message}`);
  }
}
