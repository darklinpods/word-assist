# 架构说明

## 技术基线

- React 19 + TypeScript 5.9
- Vite 8 + Tailwind CSS 4
- Office.js / Word JavaScript API
- 火山引擎 Ark API
- 静态 Word 模板：`public/templates/complaint-template.docx`

## 代码分层

- `src/views/`：页面级流程编排。
- `src/components/`：可复用界面组件。
- `src/hooks/`：功能状态与业务流程。
- `src/services/`：外部服务调用，目前主要是 AI 接入。
- `src/utils/office/`：Word 文档读取、写入、格式化和模板操作。
- `src/utils/`：赔偿、证据、身份证等纯业务规则。
- `src/types/`：跨模块共享的数据结构。
- `src/data/`：赔偿标准等静态业务数据。

## 主数据流

```text
Word 文档内容
  -> Office 读取封装
  -> Hook 组织请求
  -> AI 提取 / 本地规则计算
  -> 结构化结果与用户复核
  -> Office 写入封装
  -> 当前 Word 文档或要素式诉状模板
```

## Office 集成边界

- 所有 Word API 入口先调用 `assertWordLoaded()`。
- Office 对象是代理对象；读取属性前必须 `load()`，写入后在合理边界调用 `context.sync()`。
- 模板定位优先使用稳定标签文本，并对未找到表格、行或单元格提供明确错误。
- `src/utils/office-utils.ts` 是外部模块使用 Office 工具的统一导出面。

## 模板写入路径

- `src/utils/office/template.ts`：加载、校验并插入 DOCX 模板。
- `src/utils/office/parties-template.ts`：定位模板表格，写入当事人、诉讼请求、事实理由与索赔清单。
- `src/views/MainWorkflow.tsx`：触发模板插入和完整提取结果回填。

## 关键风险

- Word 桌面版、网页版和不同 requirement set 对 API 的支持并不一致。
- 标签文本或表格结构被用户修改后，基于模板结构的定位可能失败。
- 多当事人会动态插入表格行，旧的 Office 代理引用可能失效，因此结构变化后需要重新加载。
- AI 输出和赔偿标准数据都需要业务人员复核。
