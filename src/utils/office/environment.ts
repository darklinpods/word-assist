import { getOfficeActionError } from '../office-env';

function assertWordLoaded(): void {
  if (typeof Word === 'undefined') {
    throw new Error(getOfficeActionError());
  }
}

/**
 * 读取 Word 文档正文文本。
 *
 * 仅读取 body.text，不枚举书签：Mac 版 Word 16.112 通过 Office.js 枚举书签
 * （bookmarks.items）时存在原生崩溃 bug，会连带整个 Word 闪退。书签原本只用于
 * “重新提取时排除已生成文书”这一可选场景，对核心提取功能非必需，故移除。
 */
export async function getDocumentText(): Promise<string> {
  assertWordLoaded();
  return Word.run(async (context) => {
    const body = context.document.body;
    body.load('text');
    await context.sync();
    return body.text || '';
  });
}

export { assertWordLoaded };
