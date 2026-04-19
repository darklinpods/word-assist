import { getOfficeActionError } from '../office-env';

function assertWordLoaded(): void {
  if (typeof Word === 'undefined') {
    throw new Error(getOfficeActionError('word-document'));
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

/**
 * 在文档中定位并选中指定文本（首次匹配）
 */
export async function locateTextInDocument(text: string): Promise<boolean> {
  assertWordLoaded();
  return Word.run(async (context) => {
    const body = context.document.body;
    const results = body.search(text, { matchCase: false, matchWholeWord: false });
    results.load('items');
    await context.sync();
    if (results.items.length === 0) return false;
    const range = results.items[0];
    range.select();
    await context.sync();
    return true;
  });
}

/**
 * Reads the currently selected text in the Word document.
 */
export async function getSelectedText(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof Office === 'undefined') {
      return reject(new Error(getOfficeActionError('read-selection')));
    }
    Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        reject(new Error(result.error.message));
      } else {
        resolve(result.value as string);
      }
    });
  });
}

export { assertWordLoaded };
