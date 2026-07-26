import { assertWordLoaded } from './environment';

const TEMPLATE_PATH = `${import.meta.env.BASE_URL}templates/complaint-template.docx`;

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

function getTemplateUrl(): string {
  return new URL(TEMPLATE_PATH, window.location.origin).href;
}

function isZipBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4) return false;

  return (
    (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) ||
    (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x05 && bytes[3] === 0x06) ||
    (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x07 && bytes[3] === 0x08)
  );
}

function getTextPreview(buffer: ArrayBuffer): string {
  try {
    const preview = new TextDecoder('utf-8').decode(buffer.slice(0, 200)).replace(/\s+/g, ' ').trim();
    return preview;
  } catch {
    return '';
  }
}

async function getTemplateBase64(): Promise<string> {
  if (templateBase64Cache) return templateBase64Cache;
  if (templateBase64Promise) return templateBase64Promise;

  templateBase64Promise = (async () => {
    try {
      const response = await fetch(getTemplateUrl());
      if (!response.ok) {
        throw new Error(`无法加载模板文件: ${response.status} ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      if (!isZipBuffer(buffer)) {
        const preview = getTextPreview(buffer);
        const detail = preview ? `，返回内容预览: ${preview}` : '';
        throw new Error(`模板文件不是有效的 Word 文档，请检查静态资源路径是否正确: ${getTemplateUrl()}${detail}`);
      }
      const base64 = arrayBufferToBase64(buffer);
      templateBase64Cache = base64;
      return base64;
    } finally {
      templateBase64Promise = null;
    }
  })();

  return templateBase64Promise;
}

/**
 * 将打包的起诉状模板插入当前 Word 文档开头
 */
export async function insertTemplate(): Promise<void> {
  assertWordLoaded();
  const templateBase64 = await getTemplateBase64();
  return Word.run(async (context) => {
    const insertedRange = context.document.body.insertFileFromBase64(templateBase64, Word.InsertLocation.start);
    // 在插入的模板末尾追加分页符，使模板与原有文档内容分页
    insertedRange.insertBreak(Word.BreakType.page, Word.InsertLocation.after);
    await context.sync();
  });
}
