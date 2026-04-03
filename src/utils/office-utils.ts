import type { PartyExtraction } from '../types/parties';

const HIGHLIGHT_COLOR = '#c0392b';
const TEMPLATE_PATH = '/templates/complaint-template.docx';

let templateBase64Cache: string | null = null;
let templateBase64Promise: Promise<string> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function getTemplateBase64(): Promise<string> {
  if (templateBase64Cache) return templateBase64Cache;
  if (templateBase64Promise) return templateBase64Promise;

  templateBase64Promise = (async () => {
    try {
      const response = await fetch(TEMPLATE_PATH);
      if (!response.ok) {
        throw new Error(`无法加载模板文件: ${response.status} ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      templateBase64Cache = base64;
      return base64;
    } finally {
      templateBase64Promise = null;
    }
  })();

  return templateBase64Promise;
}

function assertWordLoaded(): void {
  if (typeof Word === 'undefined') {
    throw new Error('Word.js API 未加载，请在 Microsoft Word 侧边栏中运行此插件。');
  }
}

/**
 * 将打包的起诉状模板插入当前 Word 文档开头
 */
export async function insertTemplate(): Promise<void> {
  assertWordLoaded();
  const templateBase64 = await getTemplateBase64();
  return Word.run(async (context) => {
    context.document.body.insertFileFromBase64(templateBase64, Word.InsertLocation.start);
    await context.sync();
  });
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
  assertWordLoaded();
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
  newAmount: number
): Promise<number> {
  assertWordLoaded();

  return Word.run(async (context) => {
    const body = context.document.body;

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
          range.font.color = HIGHLIGHT_COLOR;
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
  assertWordLoaded();

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
            range.font.color = HIGHLIGHT_COLOR;
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
  assertWordLoaded();

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
    const reloadRows = async () => {
      rows.load('items');
      await context.sync();
      for (const row of rows.items) {
        row.load('values');
        row.cells.load('items');
      }
      await context.sync();
    };

    await reloadRows();

    const findRowByLabel = (label: string) =>
      rows.items.find((row) => row.values.some((r) => r.some((cell) => typeof cell === 'string' && cell.includes(label))));

    const plaintiffRow = findRowByLabel('原告（自然人）');
    let defendantNaturalRow = findRowByLabel('被告（自然人）');
    let insuranceRow = findRowByLabel('被告（保险公司）');

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
      for (let i = 1; i < contents.length; i++) {
        const newRows = lastRow.insertRows(Word.InsertLocation.after, 1);
        newRows.load('items');
        await context.sync();
        const newRow = newRows.items[0];
        newRow.cells.load('items');
        await context.sync();
        writeRow(newRow, label, contents[i]);
        lastRow = newRow;
      }
      return lastRow;
    };

    const insertRowsAfter = async (
      anchorRow: Word.TableRow,
      label: string,
      contents: string[]
    ): Promise<Word.TableRow> => {
      if (contents.length === 0) return anchorRow;
      let lastRow = anchorRow;
      for (let i = 0; i < contents.length; i++) {
        const newRows = lastRow.insertRows(Word.InsertLocation.after, 1);
        newRows.load('items');
        await context.sync();
        const newRow = newRows.items[0];
        newRow.cells.load('items');
        await context.sync();
        writeRow(newRow, label, contents[i]);
        lastRow = newRow;
      }
      return lastRow;
    };

    await applyRowsFromBase(plaintiffRow, '原告（自然人）', parties.plaintiffsNatural);
    // 插入多原告可能导致后续行引用偏移，刷新行引用
    await reloadRows();
    defendantNaturalRow = findRowByLabel('被告（自然人）');
    insuranceRow = findRowByLabel('被告（保险公司）');
    if (!defendantNaturalRow || !insuranceRow) {
      throw new Error('模板中的当事人信息行不完整，请确认模板未被修改。');
    }

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
      await insertRowsAfter(lastDefendantRow, '被告（法人）', parties.defendantsLegal);
    }

    // 插入多被告可能导致保险公司行引用偏移，刷新行引用
    await reloadRows();
    insuranceRow = findRowByLabel('被告（保险公司）');
    if (!insuranceRow) {
      throw new Error('模板中的当事人信息行不完整，请确认模板未被修改。');
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
      await insertRowsAfter(lastInsuranceRow, '第三人（法人）', parties.thirdPartyLegal);
    }

    await context.sync();
  });
}

/**
 * 将完整提取结果（当事人 + 诉讼请求 + 事实与理由 + 索赔清单）写入要素式诉状模板
 * 所有内容均写入对应标签行的右侧单元格（与当事人信息表格结构一致）
 */
function applyElementalFont(body: Word.Body) {
  body.font.name = '微软雅黑';
  body.font.size = 11;
  body.font.scaling = 80;
  body.font.spacing = 0.25;
}

export async function insertFullExtractionIntoTemplate(parties: PartyExtraction): Promise<void> {
  assertWordLoaded();

  await insertPartiesIntoTemplate(parties);

  return Word.run(async (context) => {
    const body = context.document.body;

    // 搜索标签所在行，写入该行最后一个单元格（适用于2列行）
    const writeToRightCell = async (label: string, content: string) => {
      if (!content) return;
      const results = body.search(label, { matchCase: false, matchWholeWord: false });
      results.load('items');
      await context.sync();
      if (results.items.length === 0) return;
      const cellOrNull = results.items[0].parentTableCellOrNullObject;
      cellOrNull.load('isNullObject');
      await context.sync();
      if (cellOrNull.isNullObject) return;
      const row = cellOrNull.parentRow;
      row.cells.load('items');
      await context.sync();
      const cells = row.cells.items;
      const target = cells[cells.length - 1];
      target.body.clear();
      target.body.insertText(content, Word.InsertLocation.start);
      applyElementalFont(target.body);
      await context.sync();
    };

    // 搜索标签所在行，写入下一行的独立单元格（适用于标题独占一行 + 下一行单元格的情况）
    const writeToNextRowCell = async (label: string, content: string) => {
      if (!content) return;
      const results = body.search(label, { matchCase: false, matchWholeWord: false });
      results.load('items');
      await context.sync();
      if (results.items.length === 0) return;
      const candidateCells: Word.TableCell[] = [];
      for (const item of results.items) {
        const cellOrNull = item.parentTableCellOrNullObject;
        cellOrNull.load('isNullObject');
        candidateCells.push(cellOrNull as Word.TableCell);
      }
      await context.sync();

      const candidateRows: { row: Word.TableRow; nextRow: Word.TableRow }[] = [];
      for (const cell of candidateCells) {
        if (cell.isNullObject) continue;
        const row = cell.parentRow;
        const nextRow = row.getNextOrNullObject();
        nextRow.load('isNullObject');
        candidateRows.push({ row, nextRow });
      }
      await context.sync();

      for (const entry of candidateRows) {
        if (entry.nextRow.isNullObject) continue;
        entry.nextRow.cells.load('items');
      }
      await context.sync();

      const emptyNextRow = async (): Promise<Word.TableRow | null> => {
        for (const entry of candidateRows) {
          if (entry.nextRow.isNullObject) continue;
          const cells = entry.nextRow.cells.items;
          if (cells.length === 0) continue;
          cells[0].body.load('text');
        }
        await context.sync();
        for (const entry of candidateRows) {
          if (entry.nextRow.isNullObject) continue;
          const cells = entry.nextRow.cells.items;
          if (cells.length === 0) continue;
          const text = (cells[0].body.text || '').trim();
          if (text.length === 0) return entry.nextRow;
        }
        return null;
      };

      let nextRow = await emptyNextRow();
      if (!nextRow) {
        const fallback = candidateRows[0];
        if (!fallback) return;
        const candidateNext = fallback.row.getNextOrNullObject();
        candidateNext.load('isNullObject');
        await context.sync();
        if (candidateNext.isNullObject) {
          const inserted = fallback.row.insertRows(Word.InsertLocation.after, 1);
          inserted.load('items');
          await context.sync();
          nextRow = inserted.items[0];
        } else {
          nextRow = candidateNext;
        }
      }

      nextRow.cells.load('items');
      await context.sync();
      let cells = nextRow.cells.items;
      if (cells.length === 0) return;

      if (cells.length > 1) {
        try {
          // 合并为单一单元格，保证“独立单元格”结构
          for (let i = cells.length - 1; i >= 1; i--) {
            cells[0].merge(cells[i]);
          }
          await context.sync();
          nextRow.cells.load('items');
          await context.sync();
          cells = nextRow.cells.items;
        } catch {
          // 若宿主不支持 merge，回退为清空其他单元格，仅填充第一个
          for (let i = 1; i < cells.length; i++) {
            cells[i].body.clear();
          }
          await context.sync();
        }
      }

      const target = cells[0];
      target.body.clear();
      target.body.insertText(content, Word.InsertLocation.start);
      applyElementalFont(target.body);
      await context.sync();
    };

    // 诉讼请求、索赔清单：标题独占一行，内容在下一行
    await writeToNextRowCell('诉讼请求', parties.claimsText);
    await writeToNextRowCell('索赔清单', parties.claimsList);
    // 事实与理由各子项：左标签右内容（2列行）
    await writeToRightCell('交通事故发生情况', parties.accidentFacts);
    await writeToRightCell('交通事故责任认定', parties.liabilityDetermination);
    await writeToRightCell('机动车投保情况', parties.insuranceInfo);
    await writeToRightCell('其他情况', parties.otherFacts.join('\n\n'));
  });
}

// ─── 传统诉状格式整理 ─────────────────────────────────────────

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
      para.font.size = 15;           // 小三号
      para.font.bold = false;
      para.alignment = Word.Alignment.justified;
      para.firstLineIndent = 30;     // 约2字符（15pt×2）
      para.lineSpacing = 25;         // 行高25磅

      const text = para.text.trim();
      if (!text) continue;

      // 步骤2：主标题（含"诉状"且字数<20）
      if (text.length < 20 && (text.includes('诉状') || text.includes('起诉状'))) {
        para.alignment = Word.Alignment.centered;
        para.font.size = 24;         // 小一号
        para.font.bold = true;
        para.firstLineIndent = 0;
        continue;
      }

      // 步骤3：副标题
      if (SUBTITLE_KEYWORDS.some(kw => text.includes(kw))) {
        para.font.size = 18;         // 小二号
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
  assertWordLoaded();

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
