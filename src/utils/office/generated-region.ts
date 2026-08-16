/**
 * 插件生成的要素式起诉状会被插入到文档开头，并以该前缀命名书签。
 * 读取全文时按书签排除已生成的文书，避免“重新提取”把生成结果当成原始诉状再次交给模型。
 */
export const GENERATED_TEMPLATE_BOOKMARK_PREFIX = 'WA_Gen_';

/**
 * 从全文里按顺序剔除各已生成文书区域的文本。
 * 每份生成文书的文本都是全文的连续子串，replace 首个匹配即可精确移除；
 * 多份文书内容相同时，逐次移除各自的首个匹配。
 */
export function excludeGeneratedRegions(fullText: string, generatedTexts: string[]): string {
  let text = fullText;
  for (const generatedText of generatedTexts) {
    if (generatedText) text = text.replace(generatedText, '');
  }
  return text;
}

/**
 * 计算下一个可用的生成文书书签名，避免覆盖文档中已有的同名书签。
 */
export function nextGeneratedBookmarkName(existingNames: readonly string[]): string {
  const names = new Set(existingNames);
  let index = 1;
  while (names.has(`${GENERATED_TEMPLATE_BOOKMARK_PREFIX}${index}`)) index += 1;
  return `${GENERATED_TEMPLATE_BOOKMARK_PREFIX}${index}`;
}
