# 诉状智能助手 — Word 插件

> 一款面向中国民事诉讼场景的 Microsoft Word 侧边栏 AI 插件，专为交通事故人身损害赔偿案件设计。

---

## 功能概览

### 1. 🧠 AI 文本智能审查
- 将 Word 文档中选中的诉状片段发送至大模型（火山引擎 Ark API）进行深度法律分析。
- 重点审查：诉讼请求完整性、事实逻辑、时间线合理性、法律条款引用。
- 结果以结构化 Markdown 形式展示，支持一键将建议批注插入 Word 文档（以红色加粗显示）。

### 2. 🧮 智能核定索赔金额
- AI 自动从诉状文本中结构化提取各赔偿科目（残疾赔偿金、医疗费、护理费、误工费等）及关键参数。
- 内置多省份多年度法定赔偿标准，对每项金额进行规则引擎校验。
- 生成逐项对账单，标注正确/错误，并展示理论应赔金额与原告主张金额的差额。
- 支持**单条修正**或**一键批量修正**：自动在 Word 文档中搜索并替换错误金额，以红色加粗标记，便于律师复核。

### 3. 📋 证据清单核查
- 内置交通事故人身损害标准证据清单（共 14 项），含必须、条件性、建议三级优先级分类。
- AI 逐项判断诉状中各证据的出具状态：✅ 已具备 / ⚠️ 偏弱 / ❌ 缺失。
- 对缺失证据提供详细的取得建议与操作指引。
- 结果以彩色卡片列表展示，并附统计进度条。

### 4. 👥 当事人信息提取
- 一键读取全文，AI 结构化抽取原告、被告（自然人/法人/保险公司）、第三人等各方信息。
- 同步提取诉讼请求、事实与理由各子项、索赔清单，支持一键写入要素式诉状模板。

### 5. 🪪 身份证号码核查
- 自动扫描全文，提取所有 18 位身份证号码并逐一校验（格式、校验位、出生日期合法性）。
- 支持一键在 Word 文档中定位高亮显示问题号码。

### 6. 🧮 赔偿金额计算器
- 独立计算器界面，支持伤残/死亡两类案件，覆盖医疗费、误工费、护理费、残疾赔偿金、被扶养人生活费等全科目。
- 支持多省份、多年度标准切换，被扶养人可动态增减。
- 计算结果可一键导出为 Word 表格（含公式、金额、适用依据）。

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS v4 |
| 图标 | Lucide React |
| Markdown 渲染 | react-markdown |
| AI 接入 | 火山引擎 Ark API（豆包 Pro / DeepSeek 等推理接入点） |
| Office 集成 | Office.js + Word.js API（`@types/office-js`） |
| 本地 HTTPS | `vite-plugin-mkcert` |

---

## 项目结构

```
word-assist/
├── manifest.xml              # Office 插件清单
├── index.html                # 插件入口页
├── src/
│   ├── App.tsx               # 主界面路由与各功能模块编排
│   ├── main.tsx              # 应用挂载入口
│   ├── services/
│   │   └── ai.ts             # 火山引擎 Ark API 调用（callArkAPI 统一封装）
│   ├── hooks/                # 各功能模块的状态与业务逻辑
│   │   ├── useAnalysis.ts
│   │   ├── useClaimsVerification.ts
│   │   ├── useEvidenceCheck.ts
│   │   ├── useIdCardVerification.ts
│   │   ├── usePartyExtraction.ts
│   │   ├── useCompensationCalculator.ts
│   │   └── useDocumentReader.ts
│   ├── components/           # UI 组件
│   ├── utils/
│   │   ├── office-utils.ts   # Office/Word.js 封装（assertWordLoaded 统一守卫）
│   │   ├── compensation-calculator.ts  # 赔偿金额计算引擎
│   │   ├── compensation-rules.ts       # 索赔核验规则
│   │   ├── evidence-rules.ts           # 证据清单定义与核查逻辑
│   │   └── id-card.ts                  # 身份证提取与校验
│   ├── types/
│   │   └── parties.ts        # 当事人信息类型定义
│   └── data/
│       └── compensation-standards.json # 多省份多年度赔偿标准数据
├── package.json
├── vite.config.ts
└── tsconfig.app.json
```

---

## 快速开始

### 前置要求

- **Node.js** ≥ 18
- **Microsoft Word** 桌面版（Windows 或 macOS）
- **火山引擎** Ark API Key 及推理接入点 ID

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 AI 接入点

在项目根目录创建 `.env.local` 文件，填入你的火山引擎凭证：

```env
VITE_ARK_API_KEY=你的火山引擎 API Key
VITE_ARK_MODEL_EP_ID=ep-xxxxxxxx
```

> **提示**：登录 [火山方舟控制台](https://ark.cn-beijing.volces.com) → 选择模型（如豆包·Pro·32k 或 DeepSeek-V3）→ 创建推理接入点，复制接入点 ID 填入上方。

### 3. 启动本地开发服务器

```bash
npm run dev
```

服务将在 `https://localhost:3100` 启动。开发环境使用 `vite-plugin-mkcert` 生成并信任本地证书，更适合 Word 本地加载项调试。

如果你第一次在这台 Mac 上运行，系统可能会弹出钥匙串或管理员授权提示，用于把本地开发证书加入信任链；允许后再重新打开 Word。

### 4. 在 Word 中加载插件

1. 打开 Microsoft Word。
2. 确认 `https://localhost:3100/index.html` 可以在浏览器中正常打开，且浏览器没有证书告警。
3. 在 macOS 上进行本地开发时，优先将本项目根目录下的 `manifest.xml` 复制到 `~/Library/Containers/com.microsoft.Word/Data/Documents/wef/`。
4. 完全退出并重新打开 Word。
5. 在 **开始 / Home → 加载项 / Add-ins** 中打开插件；加载完成后，在 **开始** 选项卡的 **AI 工具** 组中点击 **启动法律助手** 即可打开侧边栏。

---

## 使用流程

```
在 Word 中选中需要分析的诉状段落
        ↓
点击「提取选中段落」
        ↓
选择以下功能之一：

  [一键文本智能审查]      → AI 法务建议，可插入批注
  [智能核定索赔金额]      → 逐项对账 + 一键修正错误金额
  [证据清单核查]         → 14项证据状态报告 + 取证建议
  [当事人信息提取]        → 结构化抽取各方信息，写入要素式模板
  [身份证号码核查]        → 全文扫描校验，一键定位问题号码
  [赔偿金额计算器]        → 独立计算器，支持导出 Word 表格
```

---

## 赔偿计算规则说明

赔偿标准数据存储于 `src/data/compensation-standards.json`，支持多省份多年度，可自行扩充。

**残疾赔偿金计算公式**：`年收入 × (11 - 伤残等级) × 10% × 年限`

---

## 证据清单说明

内置 14 项标准证据，分三级优先级：

| 级别 | 标识 | 包含项目（示例） |
|------|------|----------------|
| **必须** | 红色徽章 | 事故认定书、医疗发票、诊断证明、误工证明、被告资质证明、原告身份证明 |
| **条件性** | 橙色徽章 | 伤残鉴定意见书、被扶养人证明、车辆损失评估 |
| **建议** | 蓝色徽章 | 营养费医嘱、住院伙食补助说明、交通费票据、精神损害依据 |

---

## 构建与部署

```bash
# 生产构建
npm run build

# 预览构建产物
npm run preview
```

生产部署时，将 `manifest.xml` 中所有 `https://localhost:3100` 替换为实际的生产域名（需要 HTTPS）。

---

## 注意事项

- **API Key 安全**：API Key 通过 `.env.local` 注入，请勿将该文件提交至版本控制。生产环境建议通过后端代理转发请求，避免密钥泄露。
- **法定标准时效**：内置赔偿标准为假定的 2026 年湖北省数据，实际使用时请根据最新发布标准及目标省份进行更新。
- **AI 输出免责**：AI 生成的审查建议仅供参考，不构成正式法律意见，最终诉状修改应由执业律师复核确认。
- **浏览器模式**：在非 Word 环境中直接打开链接时，插件会显示提示警告，Office API 功能不可用，但 AI 文本分析功能仍可测试。

---

## 开发者信息

- **开发者**：Guangge Developer
- **插件默认语言**：简体中文（zh-CN）
- **Office 权限级别**：ReadWriteDocument

---


*本项目为 Microsoft Word 任务栏插件（Task Pane Add-in），基于 Office.js API 与 React 技术栈构建。*
