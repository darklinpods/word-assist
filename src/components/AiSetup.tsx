import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Rocket,
  Server,
  ShieldCheck,
} from 'lucide-react';

import {
  ARK_CONSOLE_URL,
  ARK_ENDPOINT_DOC_URL,
  getAiConfigStatus,
  saveAiConfig,
  verifyAiConfig,
} from '../services/ai-config';
import { getErrorMessage } from '../utils/error';

interface Props {
  canCancel: boolean;
  onCancel: () => void;
  onConfigured: () => void;
}

const inputClassName = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-gray-400';

export default function AiSetup({ canCancel, onCancel, onConfigured }: Props) {
  const initialConfig = getAiConfigStatus().config;
  const [apiKey, setApiKey] = useState(initialConfig.apiKey);
  const [endpointId, setEndpointId] = useState(initialConfig.endpointId);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isTesting) return;

    try {
      setIsTesting(true);
      setError('');
      const config = { apiKey, endpointId };
      await verifyAiConfig(config);
      saveAiConfig(config);
      onConfigured();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
        {canCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            返回助手
          </button>
        ) : null}

        <section className="mb-4 rounded-2xl bg-primary px-5 py-5 text-white shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Rocket className="h-5 w-5 text-amber-300" />
          </div>
          <h2 className="text-xl font-bold">只需几分钟，启用 AI 能力</h2>
          <p className="mt-1.5 text-sm leading-6 text-blue-100">
            插件需要连接火山方舟的大模型。跟着下面三步操作，不需要编程知识。
          </p>
        </section>

        <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-bold text-text-primary">先在火山方舟获取两项信息</h3>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
              <div>
                <div className="text-sm font-semibold text-text-primary">注册并进入控制台</div>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  登录火山引擎，按页面提示完成实名认证并开通火山方舟。调用模型可能产生少量费用，请留意余额和计费提示。
                </p>
                <a
                  href={ARK_CONSOLE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark"
                >
                  打开火山方舟控制台 <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</span>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                  <KeyRound className="h-4 w-4 text-cta" /> 获取 API Key
                </div>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  在控制台左侧进入“API Key 管理”，创建并复制一条 API Key。它相当于密码，请勿发给他人。
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">3</span>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                  <Server className="h-4 w-4 text-cta" /> 创建推理接入点
                </div>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  进入“在线推理”，选择一个支持文本对话的模型并创建接入点。启动成功后复制以 <code className="rounded bg-gray-100 px-1 py-0.5">ep-</code> 开头的接入点 ID。
                </p>
                <a
                  href={ARK_ENDPOINT_DOC_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark"
                >
                  查看官方接入点说明 <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </li>
          </ol>
        </section>

        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-bold text-text-primary">填入并验证</h3>
          <p className="mt-1 text-xs text-text-muted">验证会发送一句极短的测试消息，可能产生极少量 Token 费用。</p>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-text-primary">API Key</span>
              <span className="relative block">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="粘贴从 API Key 管理页面复制的密钥"
                  autoComplete="off"
                  spellCheck={false}
                  className={`${inputClassName} pr-11 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((value) => !value)}
                  aria-label={showApiKey ? '隐藏 API Key' : '显示 API Key'}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-text-secondary cursor-pointer"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-text-primary">推理接入点 ID</span>
              <input
                type="text"
                value={endpointId}
                onChange={(event) => setEndpointId(event.target.value)}
                placeholder="例如：ep-20260729-abc12"
                autoComplete="off"
                spellCheck={false}
                className={`${inputClassName} font-mono`}
              />
              <span className="mt-1.5 block text-xs text-text-muted">不要填写模型名称；这里应当是以 ep- 开头的完整 ID。</span>
            </label>
          </div>

          {error ? (
            <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-error">
              <span className="font-semibold">未能连接：</span>{error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isTesting || !apiKey.trim() || !endpointId.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-cta px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cta-hover disabled:cursor-not-allowed disabled:bg-gray-300 cursor-pointer"
          >
            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isTesting ? '正在验证连接…' : '验证并保存配置'}
          </button>

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>配置只保存在这台电脑的插件本地存储中，不会写入 Word 文档或提交到项目代码。请仅在自己的电脑上保存个人密钥。</span>
          </div>
        </form>
      </div>
    </main>
  );
}
