import { assertWordLoaded } from './environment';

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

function getTemplateUrl(): string {
  return new URL(TEMPLATE_PATH, window.location.href).href;
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
    context.document.body.insertFileFromBase64(templateBase64, Word.InsertLocation.start);
    await context.sync();
  });
}
