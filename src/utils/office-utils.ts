/**
 * Reads the currently selected text in the Word document.
 */
export async function getSelectedText(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof Office === 'undefined') {
      return reject(new Error('Office SDK is not loaded. Please run inside Microsoft Word.'));
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

/**
 * Inserts suggestion text after the current selection
 */
export async function insertSuggestion(text: string): Promise<void> {
  if (typeof Word === 'undefined') {
    throw new Error('Word.js API is not loaded.');
  }
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    // Insert text at the end of the selection
    const insertedRange = selection.insertText(`\n[AI审查建议: ${text}]\n`, Word.InsertLocation.after);
    insertedRange.font.color = "red";
    insertedRange.font.bold = true;
    await context.sync();
  });
}

/**
 * 在 Word 文档正文中搜索旧金额，并将其替换为新的正确金额。
 * 替换后的新金额会以红色加粗显示，便于律师复核。
 * @returns 实际替换的次数（0 表示文档中未找到该金额）
 */
export async function replaceAmountInDocument(
  oldAmount: number,
  newAmount: number,
  _itemType: string
): Promise<number> {
  if (typeof Word === 'undefined') {
    throw new Error('Word.js API 未加载，请在 Microsoft Word 侧边栏中运行此插件。');
  }

  return Word.run(async (context) => {
    const body = context.document.body;

    // 构建多种金额格式的候选搜索词（整数/两位小数/带千分位）
    const formatVariants = buildAmountVariants(oldAmount);
    const newAmountStr = formatFinalAmount(newAmount);

    let totalReplaced = 0;

    for (const searchStr of formatVariants) {
      const results = body.search(searchStr, { matchCase: false, matchWholeWord: false });
      results.load('items');
      await context.sync();

      if (results.items.length > 0) {
        for (const range of results.items) {
          range.insertText(newAmountStr, Word.InsertLocation.replace);
          range.font.color = '#c0392b';   // 红色
          range.font.bold = true;
          totalReplaced++;
        }
        await context.sync();
        // 找到并替换之后不再尝试其他格式，避免重复替换
        break;
      }
    }

    return totalReplaced;
  });
}

/**
 * 批量修正文档中的所有错误金额，一次性完成所有替换。
 * @returns 总替换次数
 */
export async function replaceAllAmounts(
  corrections: Array<{ oldAmount: number; newAmount: number; itemType: string }>
): Promise<number> {
  if (typeof Word === 'undefined') {
    throw new Error('Word.js API 未加载，请在 Microsoft Word 侧边栏中运行此插件。');
  }

  return Word.run(async (context) => {
    const body = context.document.body;
    let totalReplaced = 0;

    for (const { oldAmount, newAmount } of corrections) {
      const formatVariants = buildAmountVariants(oldAmount);
      const newAmountStr = formatFinalAmount(newAmount);

      for (const searchStr of formatVariants) {
        const results = body.search(searchStr, { matchCase: false, matchWholeWord: false });
        results.load('items');
        await context.sync();

        if (results.items.length > 0) {
          for (const range of results.items) {
            range.insertText(newAmountStr, Word.InsertLocation.replace);
            range.font.color = '#c0392b';
            range.font.bold = true;
            totalReplaced++;
          }
          await context.sync();
          break;
        }
      }
    }

    return totalReplaced;
  });
}

// ─── 内部辅助函数 ────────────────────────────────────────────

/**
 * 将金额格式化为最终写入文档的字符串（保留两位小数当非整数，否则输出整数）
 */
function formatFinalAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

/**
 * 生成一个金额可能在文档中出现的多种格式变体，用于搜索匹配
 * 优先精确两位小数，其次整数，最后带千分位
 */
function buildAmountVariants(amount: number): string[] {
  const variants: string[] = [];
  // 精确两位小数（如 98328.00）
  variants.push(amount.toFixed(2));
  // 整数（如 98328）
  if (Number.isInteger(amount) || amount === Math.floor(amount)) {
    variants.push(String(Math.floor(amount)));
  }
  // 去除多余零的自然数（如 1234.50 -> "1234.5"）
  const natural = String(parseFloat(amount.toFixed(2)));
  if (!variants.includes(natural)) variants.push(natural);
  // 带千分位（如 98,328 或 98,328.00）
  const withCommas = amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  if (!variants.includes(withCommas)) variants.push(withCommas);

  return variants;
}

