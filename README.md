# 要素式起诉状生成助手

面向中国交通事故民事诉讼场景的 Microsoft Word 任务窗格插件。它读取当前传统式起诉状，提取并核对案件要素，然后在 Word 中生成一份新的要素式起诉状。

## 当前功能

- 自动读取当前 Word 文档全文，无需选择段落。
- AI 结构化提取原告、自然人被告、法人被告、保险公司及第三人。
- 提取诉讼请求、交通事故事实、责任认定、投保情况、其他事实和索赔清单。
- 在生成前按类别展示提取结果，不提供文本修改入口。
- 检查必填信息、身份证有效性及出生日期一致性。
- 可选执行交通事故证据清单核查。
- 自动插入内置要素式起诉状模板并回填全部内容。
- 多原告、多被告自动增加表格行。
- 自动应用微软雅黑 11 磅、85% 字符宽度及 0.25 磅字符间距；旧版 Word 不支持高级字体属性时自动降级。
- 检测到已有要素式起诉状时生成新版本，不覆盖已有文书。

已移除文本智能审查、索赔金额核定与修正、赔偿金额计算器。

## 使用流程

```text
打开传统式起诉状
        ↓
点击“读取当前诉状并提取”
        ↓
查看结构化提取结果
        ↓
可选执行证据清单核查
        ↓
点击“生成要素式起诉状”
        ↓
Word 中插入并填写一份新的要素式起诉状
```

## 架构

文书生成采用“公共流水线 + 文书定义 + 专用预览”的结构：

```text
src/document-generator/
├── core/
│   ├── types.ts                     # 公共文书定义、状态和校验类型
│   └── useDocumentGeneration.ts     # 读取、提取、只读预览和生成状态机
├── components/                      # 通用流程界面
├── registry.ts                      # 类型安全的文书类型注册表
├── complaint/
│   ├── definition.ts                # 交通事故要素式起诉状注册定义
│   ├── types.ts                     # 结构化起诉状和当事人类型
│   ├── validation.ts                # 业务校验
│   ├── ComplaintPreview.tsx         # 提取结果预览
│   ├── word-generator.ts            # Word 生成编排
│   └── legacy-adapter.ts            # 结构化数据到现有模板写入器的适配
└── DocumentGeneratorView.tsx        # 当前单页生成入口
```

新增其他文书时，应实现一个 `DocumentDefinition<TDraft>`，提供提取、校验、目标检查和生成能力；共享的当事人及案件数据可以逐步上移到公共领域层。

## 技术栈

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Office.js / Word.js
- 火山引擎 Ark API
- Vitest

## 本地开发

前置要求：Node.js 18 以上、Microsoft Word 桌面版。

```bash
npm install
npm run dev
```

开发服务器默认运行于 `https://localhost:3100`。首次运行可能请求信任本地开发证书。

在 macOS Word 中进行本地加载时，可将 `manifest.xml` 复制到：

```text
~/Library/Containers/com.microsoft.Word/Data/Documents/wef/
```

然后完全退出并重新打开 Word，在“开始 → 加载项”中打开插件。

## AI 配置

普通用户首次打开插件时会进入配置引导：

1. 在火山方舟开通服务。
2. 创建 API Key。
3. 创建并启动文本模型推理接入点，复制以 `ep-` 开头的 ID。
4. 在插件中验证并保存。

运行时配置保存在当前电脑的插件 `localStorage` 中。它适合个人受控设备，不等同于服务端密钥保险库；团队部署应使用后端代理和用户鉴权。

本地开发也可以创建 `.env.local`：

```env
VITE_ARK_API_KEY=你的火山方舟APIKey
VITE_ARK_MODEL_EP_ID=ep-xxxxxxxx
```

环境变量只在 Vite 开发模式中作为回退配置，生产构建不会携带开发者密钥。

## 质量检查

```bash
npm run test
npm run build
npm run lint
```

自动化测试覆盖结构化 AI 返回校验、诉状完整度检查、当事人角色归类，以及提取数据到 Word 模板文本的适配。Word 表格结构、多当事人动态行和字体兼容仍需在真实 Word 宿主中进行端到端回归。

## 注意事项

- AI 只用于辅助提取，生成前必须由法律专业人员复核。
- 模型没有识别到的字段会保留为空，不应据此推断原材料不存在相关事实。
- 内置模板位于 `public/templates/complaint-template.docx`。
- 插件需要 Word 文档读写权限。
