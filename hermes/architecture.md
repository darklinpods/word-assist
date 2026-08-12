# 架构说明

## 技术基线

- React 19 + TypeScript 5.9
- Vite 8 + Tailwind CSS 4
- Office.js / Word JavaScript API
- 火山引擎 Ark API
- Vitest
- 静态 Word 模板：`public/templates/complaint-template.docx`

## 架构原则

系统采用“公共生成流水线 + 文书定义 + 领域预览 + Word 生成适配器”。公共层负责状态和生命周期，文书模块负责自己的数据、提取、校验和写入。

```text
Word 原始文档
  -> Office 全文读取
  -> DocumentDefinition.extract
  -> AI JSON 严格解析
  -> 领域归类与校验
  -> 只读预览
  -> DocumentDefinition.generate
  -> 干净模板插入
  -> Word 模板回填
```

## 代码分层

### 应用外壳

- `src/App.tsx`：AI 配置页和文书生成页之间的最小路由。
- `src/components/Header.tsx`：产品标题与 AI 配置入口。
- `src/services/ai-config.ts`：运行时凭证、验证和本地存储。

### 文书生成公共层

- `src/document-generator/core/types.ts`：生成步骤、校验问题、生成结果和 `DocumentDefinition<TDraft>`。
- `src/document-generator/core/useDocumentGeneration.ts`：读取、提取、预览、生成和错误状态。
- `src/document-generator/registry.ts`：类型安全的文书注册表。
- `src/document-generator/components/`：流程步骤和通用校验展示。

公共层不得依赖某个案由的字段，也不得直接操作特定模板。

### 交通事故要素式起诉状模块

- `complaint/types.ts`：自然人、法人和诉状结构化数据。
- `complaint/definition.ts`：提取、校验、目标检查和生成能力的组合入口。
- `complaint/ComplaintPreview.tsx`、`PartyPreview.tsx`：只读结果展示。
- `complaint/validation.ts`：完整度和身份证校验。
- `complaint/party-role-normalization.ts`：法人车主与保险公司的互斥归类及去重。
- `complaint/legacy-adapter.ts`：结构化数据到现有模板字符串格式的隔离层。
- `complaint/word-generator.ts`：模板检测、插入和完整回填编排。

### AI 边界

- `src/services/ai.ts`：方舟请求和文书专用提示词。
- `src/services/ai-validators.ts`：将不可信模型文本解析为严格领域对象。

模型输出永远视为不可信输入。字段缺失、类型错误或非法状态必须在边界处失败，不得让松散对象进入 UI 或 Word 写入层。

### Office 边界

- `src/utils/office/environment.ts`：Word 宿主检查和全文读取。
- `src/utils/office/template.ts`：DOCX 模板加载、插入和已有模板检测。
- `src/utils/office/parties-template.ts`：表格定位、动态行和格式写入。

React 组件不得直接调用 Word API。所有 Office 代理对象必须遵循 `load -> context.sync -> 读取`，结构变化后重新加载代理集合。

## 状态模型

```text
idle
  -> reading
  -> extracting
  -> previewing
  -> generating
  -> completed

任一步骤失败 -> error
重新提取或重新开始 -> 对应安全初始状态
```

提取结果是一次生成会话的只读数据。界面不暴露 `setDraft`；避免展示内容与写入内容产生不可追踪的差异。

## 生成策略

- 每次生成都插入一份干净模板。
- 检测到已有模板时先明确提示用户。
- 不覆盖已有文书，避免动态行残留、重复和用户内容丢失。
- 模板写入仍通过适配器复用经过验证的旧写入器，减少 Word API 重写风险。

## 扩展新文书

新增文书类型时：

1. 定义结构化草稿类型。
2. 实现提取与严格解析。
3. 实现领域校验和必要的归一化。
4. 实现只读预览。
5. 实现 Word 模板适配器和生成器。
6. 注册到 `registry.ts`。
7. 增加解析、校验和生成映射测试。

只有当多个文书确实共享数据时才抽取公共领域模型；不要通过条件分支把多个案由塞进同一个巨型组件或提示词。

## 关键风险

- 不同 Word 宿主支持的 requirement set 不一致。
- 模板标签或表格结构被修改后，定位可能失败。
- 模型可能错误分类、重复当事人或输出非 JSON。
- 运行时 API Key 存放于本地存储，不适合团队级密钥管理。
- 浏览器模式只能验证界面和纯逻辑，不能替代真实 Word 端到端验证。
