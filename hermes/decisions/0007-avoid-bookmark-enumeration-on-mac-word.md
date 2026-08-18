# ADR 0007：提取与生成均不枚举书签，规避 Mac 版 Word 16.112 原生崩溃

- 状态：已接受
- 日期：2026-08-18

## 背景

Mac 版 Word 16.112（macOS 26.5）在通过 Office.js 枚举 `document.bookmarks`（`bookmarks.load('items')` 后 `context.sync()`）时存在原生崩溃 bug，会连带整个 Word 进程闪退。

Word 崩溃日志给出了确定证据：提取路径中 `Body.text` 已成功取回正文（返回 2721 字节），随后在书签枚举处日志戛然而止，`Document.bookmarks` 调用尚未完成进程即终止。崩溃无法被 JS 的 `try/catch` 捕获——那是原生进程崩溃，不是 JS 异常。

书签在此前的用途只有一个：为已生成的要素式起诉状打 `WA_Gen_N` 书签，提取时按书签剔除已生成区域，避免“重新提取”把生成结果当原始诉状再次交给模型。生成路径（`parties-template.ts`）在写入书签前同样会先枚举全部书签以计算下一个可用序号，因此也带有相同的崩溃风险。

## 决策

- 提取路径（`src/utils/office/environment.ts` 的 `getDocumentText`）只读取 `body.text`，不再枚举书签。
- 生成路径（`src/utils/office/parties-template.ts` 的 `insertTemplateAndFill`）删除 `bookmarkGeneratedTemplate`，不再写入书签。
- 删除因此完全失效的 `src/utils/office/generated-region.ts` 及其单元测试。

## 影响

- 优点：消除提取与生成两处由书签枚举引发的原生崩溃，恢复正常使用。
- 代价：失去“重新提取时自动排除已生成文书”的能力。已生成的起诉状仍保留在文档中，重新提取时可能被当成输入的一部分；用户应在干净文档上提取，或生成前复制原始诉状。
- 约束：未来若要恢复该能力，必须先确认目标 Word 版本不再存在书签枚举崩溃；并优先采用非书签方案（如文本标记）而非重新引入 `bookmarks.items` 枚举。
