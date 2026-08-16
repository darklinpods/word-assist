import { describe, expect, it } from 'vitest';

import {
  GENERATED_TEMPLATE_BOOKMARK_PREFIX,
  excludeGeneratedRegions,
  nextGeneratedBookmarkName,
} from './generated-region';

describe('excludeGeneratedRegions', () => {
  it('在全文开头剔除单份已生成文书', () => {
    const fullText = '要素式起诉状（生成内容）\r传统式起诉状正文';
    const result = excludeGeneratedRegions(fullText, ['要素式起诉状（生成内容）']);
    expect(result).toBe('\r传统式起诉状正文');
  });

  it('剔除多份已生成文书，保留原文', () => {
    const fullText = '生成一\r生成二\r原始诉状';
    const result = excludeGeneratedRegions(fullText, ['生成一', '生成二']);
    expect(result).toBe('\r\r原始诉状');
  });

  it('多份内容相同的已生成文书被逐次移除', () => {
    const fullText = '相同内容\r相同内容\r原始诉状';
    const result = excludeGeneratedRegions(fullText, ['相同内容', '相同内容']);
    expect(result).toBe('\r\r原始诉状');
  });

  it('空文本或未命中时保持原文不变', () => {
    expect(excludeGeneratedRegions('原文', [])).toBe('原文');
    expect(excludeGeneratedRegions('原文', [''])).toBe('原文');
    expect(excludeGeneratedRegions('原文', ['不存在的内容'])).toBe('原文');
  });
});

describe('nextGeneratedBookmarkName', () => {
  it('无同名书签时从 1 开始', () => {
    expect(nextGeneratedBookmarkName([])).toBe(`${GENERATED_TEMPLATE_BOOKMARK_PREFIX}1`);
    expect(nextGeneratedBookmarkName(['其他书签'])).toBe(`${GENERATED_TEMPLATE_BOOKMARK_PREFIX}1`);
  });

  it('跳过已占用的序号', () => {
    expect(nextGeneratedBookmarkName([`${GENERATED_TEMPLATE_BOOKMARK_PREFIX}1`])).toBe(
      `${GENERATED_TEMPLATE_BOOKMARK_PREFIX}2`,
    );
    expect(
      nextGeneratedBookmarkName([
        `${GENERATED_TEMPLATE_BOOKMARK_PREFIX}1`,
        `${GENERATED_TEMPLATE_BOOKMARK_PREFIX}2`,
        `${GENERATED_TEMPLATE_BOOKMARK_PREFIX}3`,
      ]),
    ).toBe(`${GENERATED_TEMPLATE_BOOKMARK_PREFIX}4`);
  });

  it('允许跳过中间的序号后复用最小空闲序号', () => {
    expect(
      nextGeneratedBookmarkName([
        `${GENERATED_TEMPLATE_BOOKMARK_PREFIX}2`,
        `${GENERATED_TEMPLATE_BOOKMARK_PREFIX}3`,
      ]),
    ).toBe(`${GENERATED_TEMPLATE_BOOKMARK_PREFIX}1`);
  });
});
