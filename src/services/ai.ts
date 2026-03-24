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
