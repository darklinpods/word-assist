import { getOfficeActionError } from '../office-env';

function assertWordLoaded(): void {
  if (typeof Word === 'undefined') {
    throw new Error(getOfficeActionError());
  }
}

/**
 * 读取 Word 文档正文文本
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
