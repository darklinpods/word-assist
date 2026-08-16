import { getOfficeActionError } from '../office-env';
import { GENERATED_TEMPLATE_BOOKMARK_PREFIX, excludeGeneratedRegions } from './generated-region';

function assertWordLoaded(): void {
  if (typeof Word === 'undefined') {
    throw new Error(getOfficeActionError());
  }
}

/**
 * 读取 Word 文档正文文本。
 *
 * 如果文档中存在插件生成的要素式起诉状（以 GENERATED_TEMPLATE_BOOKMARK_PREFIX 命名的书签），
 * 会从返回文本中剔除这些已生成区域，保证提取始终基于原始（传统式）起诉状。
 * 旧版 Word 不支持书签时自动回退为读取全文。
 */
export async function getDocumentText(): Promise<string> {
  assertWordLoaded();
  return Word.run(async (context) => {
    const body = context.document.body;
    body.load('text');
    await context.sync();
    const fullText = body.text || '';

    try {
      const bookmarks = context.document.bookmarks;
      bookmarks.load('items');
      await context.sync();
      for (const bookmark of bookmarks.items) bookmark.load('name');
      await context.sync();

      const generated = bookmarks.items.filter((bookmark) =>
        bookmark.name.startsWith(GENERATED_TEMPLATE_BOOKMARK_PREFIX),
      );
      if (generated.length === 0) return fullText;

      for (const bookmark of generated) bookmark.range.load('text');
      await context.sync();

      const generatedTexts = generated.map((bookmark) => bookmark.range.text || '');
      return excludeGeneratedRegions(fullText, generatedTexts);
    } catch {
      // 书签不可用（旧版 Word 等）时回退为全文，保持原有读取行为。
      return fullText;
    }
  });
}

export { assertWordLoaded };
