import { TEMPLATE_BASE64 } from '../assets/template';
import type { PartyExtraction } from '../types/parties';

/**
 * 将打包的起诉状模板插入当前 Word 文档开头
 */
export async function insertTemplate(): Promise<void> {
  if (typeof Word === 'undefined') {
    throw new Error('Word.js API 未加载，请在 Microsoft Word 侧边栏中运行此插件。');
  }
  return Word.run(async (context) => {
    context.document.body.insertFileFromBase64(TEMPLATE_BASE64, Word.InsertLocation.start);
    await context.sync();
  });
}

/**
 * 读取 Word 文档正文文本
 */
export async function getDocumentText(): Promise<string> {
  if (typeof Word === 'undefined') {
    throw new Error('Word.js API 未加载，请在 Microsoft Word 侧边栏中运行此插件。');
  }
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
  if (typeof Word === 'undefined') {
    throw new Error('Word.js API 未加载，请在 Microsoft Word 侧边栏中运行此插件。');
  }
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

/**
 * 将当事人信息写入要素式诉状模板中的“当事人信息”表格（按原文，不改写）
 */
export async function insertPartiesIntoTemplate(parties: PartyExtraction): Promise<void> {
  if (typeof Word === 'undefined') {
    throw new Error('Word.js API 未加载，请在 Microsoft Word 侧边栏中运行此插件。');
  }

  return Word.run(async (context) => {
    const body = context.document.body;
    let targetTable: Word.Table | null = null;

    // 优先：通过“当事人信息”标题定位其所在表格
    const ranges = body.search('当事人信息', { matchCase: false, matchWholeWord: false });
    ranges.load('items');
    await context.sync();
    if (ranges.items.length > 0) {
      const tableOrNull = ranges.items[0].parentTableOrNullObject;
      tableOrNull.load('isNullObject');
      await context.sync();
      if (!tableOrNull.isNullObject) {
        targetTable = tableOrNull;
      }
    }

    // 兜底：遍历表格值查找
    if (!targetTable) {
      const tables = body.tables;
      tables.load('items');
      await context.sync();

      if (tables.items.length === 0) {
        throw new Error('未找到任何表格，请先插入要素式起诉状模板。');
      }

      for (const table of tables.items) {
        table.load('values');
      }
      await context.sync();

      targetTable = tables.items.find((table) =>
        table.values.some((row) => row.some((cell) => typeof cell === 'string' && cell.includes('当事人信息')))
      ) || null;
    }

    if (!targetTable) {
      throw new Error('未找到“当事人信息”表格，请确认已插入要素式起诉状模板。');
    }

    const rows = targetTable.rows;
    rows.load('items');
    await context.sync();

    for (const row of rows.items) {
      row.load('values');
      row.cells.load('items');
    }
    await context.sync();

    const findRowByLabel = (label: string) =>
      rows.items.find((row) => row.values.some((r) => r.some((cell) => typeof cell === 'string' && cell.includes(label))));

    const plaintiffRow = findRowByLabel('原告（自然人）');
    const defendantNaturalRow = findRowByLabel('被告（自然人）');
    const insuranceRow = findRowByLabel('被告（保险公司）');

    if (!plaintiffRow || !defendantNaturalRow || !insuranceRow) {
      throw new Error('模板中的当事人信息行不完整，请确认模板未被修改。');
    }

    const writeRow = (row: Word.TableRow, label: string, content: string) => {
      const cells = row.cells.items;
      if (!cells || cells.length < 2) {
        throw new Error('当事人信息行结构异常，无法写入内容。');
      }
      const leftCell = cells[0];
      const rightCell = cells[1];
      leftCell.body.clear();
      leftCell.body.insertText(label, Word.InsertLocation.start);
      rightCell.body.clear();
      rightCell.body.insertText(content || '', Word.InsertLocation.start);
    };

    const applyRowsFromBase = async (
      baseRow: Word.TableRow,
      label: string,
      contents: string[]
    ): Promise<Word.TableRow> => {
      baseRow.cells.load('items');
      await context.sync();
      if (contents.length === 0) {
        writeRow(baseRow, label, '');
        return baseRow;
      }
      writeRow(baseRow, label, contents[0]);
      let lastRow = baseRow;
      if (contents.length > 1) {
        const inserted = baseRow.insertRows(Word.InsertLocation.after, contents.length - 1);
        inserted.load('items');
        await context.sync();
        for (const row of inserted.items) {
          row.cells.load('items');
        }
        await context.sync();
        inserted.items.forEach((row, idx) => writeRow(row, label, contents[idx + 1]));
        lastRow = inserted.items[inserted.items.length - 1];
      }
      return lastRow;
    };

    const insertRowsAfter = async (
      anchorRow: Word.TableRow,
      label: string,
      contents: string[]
    ): Promise<Word.TableRow> => {
      if (contents.length === 0) return anchorRow;
      const inserted = anchorRow.insertRows(Word.InsertLocation.after, contents.length);
      inserted.load('items');
      await context.sync();
      for (const row of inserted.items) {
        row.cells.load('items');
      }
      await context.sync();
      inserted.items.forEach((row, idx) => writeRow(row, label, contents[idx]));
      return inserted.items[inserted.items.length - 1];
    };

    await applyRowsFromBase(plaintiffRow, '原告（自然人）', parties.plaintiffsNatural);

    const hasDefNatural = parties.defendantsNatural.length > 0;
    const hasDefLegal = parties.defendantsLegal.length > 0;
    let lastDefendantRow: Word.TableRow;

    if (hasDefNatural) {
      lastDefendantRow = await applyRowsFromBase(defendantNaturalRow, '被告（自然人）', parties.defendantsNatural);
    } else if (hasDefLegal) {
      lastDefendantRow = await applyRowsFromBase(defendantNaturalRow, '被告（法人）', parties.defendantsLegal);
    } else {
      lastDefendantRow = await applyRowsFromBase(defendantNaturalRow, '被告（自然人）', []);
    }

    if (hasDefNatural && hasDefLegal) {
      lastDefendantRow = await insertRowsAfter(lastDefendantRow, '被告（法人）', parties.defendantsLegal);
    }

    const hasInsurance = parties.defendantsInsurance.length > 0;
    const hasThird = parties.thirdPartyLegal.length > 0;
    let lastInsuranceRow: Word.TableRow;

    if (hasInsurance) {
      lastInsuranceRow = await applyRowsFromBase(insuranceRow, '被告（保险公司）', parties.defendantsInsurance);
    } else if (hasThird) {
      lastInsuranceRow = await applyRowsFromBase(insuranceRow, '第三人（法人）', parties.thirdPartyLegal);
    } else {
      lastInsuranceRow = await applyRowsFromBase(insuranceRow, '被告（保险公司）', []);
    }

    if (hasInsurance && hasThird) {
      lastInsuranceRow = await insertRowsAfter(lastInsuranceRow, '第三人（法人）', parties.thirdPartyLegal);
    }

    await context.sync();
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

// ─── 赔偿计算表导出 ───────────────────────────────────────────

export interface CompensationExportItem {
  type: string;
  amount: number;
  formula: string;
  note: string;
  enabled: boolean;
}

export interface CompensationExportMeta {
  province: string;
  year: string;
  residentType: 'urban' | 'rural';
  caseType: 'injury' | 'death';
  total: number;
}

/**
 * 将赔偿计算明细以表格形式插入 Word 文档末尾。
 * 格式：标题 + 元数据说明 + 4列表格（索赔项目 / 计算公式 / 金额 / 适用依据）
 */
export async function exportCompensationTable(
  items: CompensationExportItem[],
  meta: CompensationExportMeta
): Promise<void> {
  if (typeof Word === 'undefined') {
    throw new Error('Word.js API 未加载，请在 Microsoft Word 侧边栏中运行此插件。');
  }

  const enabledItems = items.filter(i => i.enabled);
  const residentLabel = meta.residentType === 'urban' ? '城镇居民' : '农村居民';
  const caseLabel = meta.caseType === 'death' ? '死亡' : '伤残';

  return Word.run(async (context) => {
    const body = context.document.body;

    // ── 分页符 ──
    body.insertBreak(Word.BreakType.page, Word.InsertLocation.end);

    // ── 标题 ──
    const title = body.insertParagraph('交通事故损害赔偿计算明细表', Word.InsertLocation.end);
    title.style = 'Heading 2';

    // ── 适用标准说明 ──
    const meta1 = body.insertParagraph(
      `适用标准：${meta.province} ${meta.year} 年 ${residentLabel} | 案件类型：${caseLabel}`,
      Word.InsertLocation.end
    );
    meta1.font.color = '#555555';
    meta1.font.size = 10;

    // ── 表格：header + 数据行 + 合计行 ──
    const ROW_COUNT = enabledItems.length + 2; // header + data + total
    const table = body.insertTable(ROW_COUNT, 4, Word.InsertLocation.end, []);
    table.style = 'Table Grid';

    // 表头
    const HEADERS = ['索赔项目', '计算公式', '金额（元）', '适用依据'];
    HEADERS.forEach((h, col) => {
      const cell = table.getCell(0, col);
      cell.value = h;
      cell.body.paragraphs.getFirst().font.bold = true;
    });

    // 数据行
    enabledItems.forEach((item, rowIdx) => {
      table.getCell(rowIdx + 1, 0).value = item.type;
      table.getCell(rowIdx + 1, 1).value = item.formula;
      const amtCell = table.getCell(rowIdx + 1, 2);
      amtCell.value = item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 });
      amtCell.body.paragraphs.getFirst().alignment = Word.Alignment.right;
      table.getCell(rowIdx + 1, 3).value = item.note;
    });

    // 合计行
    const lastRow = enabledItems.length + 1;
    const totalLabel = table.getCell(lastRow, 0);
    totalLabel.value = '合计主张金额';
    totalLabel.body.paragraphs.getFirst().font.bold = true;

    table.getCell(lastRow, 1).value = '';
    table.getCell(lastRow, 3).value = '';

    const totalCell = table.getCell(lastRow, 2);
    totalCell.value = meta.total.toLocaleString('zh-CN', { minimumFractionDigits: 2 });
    totalCell.body.paragraphs.getFirst().font.bold = true;
    totalCell.body.paragraphs.getFirst().font.color = '#c0392b';
    totalCell.body.paragraphs.getFirst().alignment = Word.Alignment.right;

    await context.sync();
  });
}
