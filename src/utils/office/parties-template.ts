import type { PartyExtraction } from '../../types/parties';
import { assertWordLoaded } from './environment';
import { nextGeneratedBookmarkName } from './generated-region';
import { getTemplateBase64 } from './template';

/**
 * 要素式诉状填入内容的统一字体格式
 * 对应 Word「字体 → 高级」：字符宽度（缩放）85%、字符间距 0.25 磅
 */
const ELEMENTAL_FONT_NAME = '微软雅黑';
const ELEMENTAL_FONT_SIZE_POINTS = 11;
const ELEMENTAL_FONT_SCALING_PERCENT = 85; // 字符宽度 85%
const ELEMENTAL_CHAR_SPACING_POINTS = 0.25; // 字符间距 0.25 磅

/**
 * 以统一字体格式覆写单元格全部内容。
 * 注意：font.scaling / font.spacing 属于 WordApiDesktop 1.3，旧版 Word 不支持；
 * 因此分两次同步——先提交文本与基础字体保证写入一定成功，
 * 再单独尝试宽度/间距，失败（宿主不支持）时静默忽略。
 */
async function writeCellBody(cell: Word.TableCell, content: string): Promise<void> {
  const body = cell.body;
  body.clear();
  const range = body.insertText(content, Word.InsertLocation.start);
  range.font.name = ELEMENTAL_FONT_NAME;
  range.font.size = ELEMENTAL_FONT_SIZE_POINTS;
  await cell.context.sync();
  try {
    range.font.scaling = ELEMENTAL_FONT_SCALING_PERCENT;
    range.font.spacing = ELEMENTAL_CHAR_SPACING_POINTS;
    await cell.context.sync();
  } catch {
    // 宿主不支持 scaling/spacing，忽略
  }
}

/**
 * 插入一份干净模板并回填全部内容（单次 Word.run）。
 *
 * 插入模板后，所有标签查找都限定在刚插入的模板范围（insertedRange）内，
 * 避免误匹配原文或文档中已有的其他要素式起诉状。
 * 回填完成后，为整份已生成文书打上书签，供“重新提取”时排除已生成区域。
 */
export async function insertTemplateAndFill(parties: PartyExtraction): Promise<void> {
  assertWordLoaded();
  const templateBase64 = await getTemplateBase64();
  return Word.run(async (context) => {
    const body = context.document.body;
    const insertedRange = body.insertFileFromBase64(templateBase64, Word.InsertLocation.start);
    // 在插入的模板末尾追加分页符，使模板与原有文档内容分页
    insertedRange.insertBreak(Word.BreakType.page, Word.InsertLocation.after);
    await context.sync();

    await insertPartiesIntoRange(context, insertedRange, parties);
    await insertContentIntoRange(context, insertedRange, parties);

    try {
      await bookmarkGeneratedTemplate(context, insertedRange);
    } catch {
      // 书签仅用于“重新提取”时排除已生成文书，失败不应阻断文书生成。
    }
  });
}

/**
 * 将当事人信息写入要素式起诉状模板中的“当事人信息”表格（按原文，不改写）。
 * 仅在 templateRange（刚插入的模板）内查找标签，避免误匹配其他内容。
 */
async function insertPartiesIntoRange(
  context: Word.RequestContext,
  templateRange: Word.Range,
  parties: PartyExtraction,
): Promise<void> {
  let targetTable: Word.Table | null = null;

  // 优先：通过“当事人信息”标题定位其所在表格
  const ranges = templateRange.search('当事人信息', { matchCase: false, matchWholeWord: false });
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

  // 兜底：遍历模板范围内的表格查找
  if (!targetTable) {
    const tables = templateRange.tables;
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

  const writeRow = async (row: Word.TableRow, label: string, content: string) => {
    const cells = row.cells.items;
    if (!cells || cells.length < 2) {
      throw new Error('当事人信息行结构异常，无法写入内容。');
    }
    await writeCellBody(cells[0], label);
    await writeCellBody(cells[1], content || '');
  };

  const applyRowsFromBase = async (
    baseRow: Word.TableRow,
    label: string,
    contents: string[]
  ): Promise<Word.TableRow> => {
    baseRow.cells.load('items');
    await context.sync();
    if (contents.length === 0) {
      await writeRow(baseRow, label, '');
      return baseRow;
    }
    await writeRow(baseRow, label, contents[0]);
    let lastRow = baseRow;
    for (let i = 1; i < contents.length; i++) {
      const newRows = lastRow.insertRows(Word.InsertLocation.after, 1);
      newRows.load('items');
      await context.sync();
      const newRow = newRows.items[0];
      newRow.cells.load('items');
      await context.sync();
      await writeRow(newRow, label, contents[i]);
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
      await writeRow(newRow, label, contents[i]);
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
}

/**
 * 将诉讼请求、事实与理由、索赔清单等写入模板对应位置。
 * 仅在 templateRange（刚插入的模板）内查找标签，避免误匹配其他内容。
 */
async function insertContentIntoRange(
  context: Word.RequestContext,
  templateRange: Word.Range,
  parties: PartyExtraction,
): Promise<void> {
  // 搜索标签所在行，写入该行最后一个单元格（适用于2列行）
  const writeToRightCell = async (label: string, content: string) => {
    if (!content) return;
    const results = templateRange.search(label, { matchCase: false, matchWholeWord: false });
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
    await writeCellBody(target, content);
  };

  // 搜索标签所在行，写入下一行的独立单元格（适用于标题独占一行 + 下一行单元格的情况）
  const writeToNextRowCell = async (label: string, content: string) => {
    if (!content) return;
    const results = templateRange.search(label, { matchCase: false, matchWholeWord: false });
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
    await writeCellBody(target, content);
  };

  // 诉讼请求、索赔清单：标题独占一行，内容在下一行
  await writeToNextRowCell('诉讼请求', parties.claimsText);
  await writeToNextRowCell('索赔清单', parties.claimsList);
  // 事实与理由各子项：左标签右内容（2列行）
  await writeToRightCell('交通事故发生情况', parties.accidentFacts);
  await writeToRightCell('交通事故责任认定', parties.liabilityDetermination);
  await writeToRightCell('机动车投保情况', parties.insuranceInfo);
  await writeToRightCell('其他情况', parties.otherFacts.join('\n\n'));
}

/**
 * 为刚生成的要素式起诉状打上书签，供“重新提取”时排除已生成区域。
 * 书签名带自增序号，多次生成时每份文书都有独立书签，全部会被排除。
 */
async function bookmarkGeneratedTemplate(
  context: Word.RequestContext,
  range: Word.Range,
): Promise<void> {
  const bookmarks = context.document.bookmarks;
  bookmarks.load('items');
  await context.sync();
  for (const bookmark of bookmarks.items) bookmark.load('name');
  await context.sync();

  const names = bookmarks.items.map((bookmark) => bookmark.name);
  const bookmarkName = nextGeneratedBookmarkName(names);

  range.insertBookmark(bookmarkName);
  await context.sync();
}
