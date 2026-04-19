import { assertWordLoaded } from './environment';

const SUBTITLE_KEYWORDS = ['诉讼请求', '事实与理由', '索赔清单', '证据目录'];

/**
 * 对当前文档执行传统诉状格式整理（四步）
 */
export async function formatTraditionalComplaint(): Promise<void> {
  assertWordLoaded();
  return Word.run(async (context) => {
    const body = context.document.body;
    const paras = body.paragraphs;
    paras.load('items');
    await context.sync();

    for (const para of paras.items) {
      para.load('text');
    }
    await context.sync();

    const nonEmpty = paras.items.filter(p => p.text.trim().length > 0);

    for (const para of paras.items) {
      // 步骤1：全文基础格式
      para.font.name = '仿宋';
      para.font.size = 15; // 小三号
      para.font.bold = false;
      para.alignment = Word.Alignment.justified;
      para.firstLineIndent = 30; // 约2字符（15pt×2）
      para.lineSpacing = 25; // 行高25磅

      const text = para.text.trim();
      if (!text) continue;

      // 步骤2：主标题（含"诉状"且字数<20）
      if (text.length < 20 && (text.includes('诉状') || text.includes('起诉状'))) {
        para.alignment = Word.Alignment.centered;
        para.font.size = 24; // 小一号
        para.font.bold = true;
        para.firstLineIndent = 0;
        continue;
      }

      // 步骤3：副标题
      if (SUBTITLE_KEYWORDS.some(kw => text.includes(kw))) {
        para.font.size = 18; // 小二号
        para.font.bold = true;
        para.alignment = Word.Alignment.centered;
        para.firstLineIndent = 0;
        continue;
      }
    }

    // 步骤4：最后一个非空段落（法院名称）顶格左对齐
    if (nonEmpty.length > 0) {
      const last = nonEmpty[nonEmpty.length - 1];
      last.alignment = Word.Alignment.left;
      last.firstLineIndent = 0;
    }

    await context.sync();
  });
}
