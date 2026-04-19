import type { PartyExtraction } from '../../types/parties';
import { assertWordLoaded } from './environment';

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

function applyElementalFont(body: Word.Body) {
  body.font.name = '微软雅黑';
  body.font.size = 11;
  body.font.scaling = 80;
  body.font.spacing = 0.25;
}

/**
 * 将完整提取结果（当事人 + 诉讼请求 + 事实与理由 + 索赔清单）写入要素式诉状模板
 * 所有内容均写入对应标签行的右侧单元格（与当事人信息表格结构一致）
 */
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
