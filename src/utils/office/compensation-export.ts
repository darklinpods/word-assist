import { assertWordLoaded } from './environment';

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
      `适用标准：${meta.province} ${meta.year} 年居民标准 | 案件类型：${caseLabel}`,
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
