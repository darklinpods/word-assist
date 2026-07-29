export interface AiConfig {
  apiKey: string;
  endpointId: string;
}

export interface AiConfigStatus {
  configured: boolean;
  source: 'local' | 'environment' | 'none';
  config: AiConfig;
}

const STORAGE_KEY = 'word-assist.ai-config.v1';
export const ARK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
export const ARK_CONSOLE_URL = 'https://console.volcengine.com/ark/region%3Acn-beijing';
export const ARK_ENDPOINT_DOC_URL = 'https://docs.volcengine.com/docs/82379/1182403?lang=zh';

const environmentConfig: AiConfig = import.meta.env.DEV
  ? {
      apiKey: String(import.meta.env.VITE_ARK_API_KEY ?? '').trim(),
      endpointId: String(import.meta.env.VITE_ARK_MODEL_EP_ID ?? '').trim(),
    }
  : { apiKey: '', endpointId: '' };

function normalizeConfig(config: Partial<AiConfig>): AiConfig {
  return {
    apiKey: String(config.apiKey ?? '').trim(),
    endpointId: String(config.endpointId ?? '').trim(),
  };
}

function isComplete(config: AiConfig): boolean {
  return Boolean(
    config.apiKey &&
    config.endpointId &&
    !config.endpointId.includes('请在此处填入')
  );
}

function readLocalConfig(): AiConfig | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeConfig(JSON.parse(raw) as Partial<AiConfig>);
  } catch {
    return null;
  }
}

export function getAiConfigStatus(): AiConfigStatus {
  const localConfig = readLocalConfig();
  if (localConfig && isComplete(localConfig)) {
    return { configured: true, source: 'local', config: localConfig };
  }
  if (isComplete(environmentConfig)) {
    return { configured: true, source: 'environment', config: environmentConfig };
  }
  return {
    configured: false,
    source: 'none',
    config: localConfig ?? environmentConfig,
  };
}

export function requireAiConfig(): AiConfig {
  const status = getAiConfigStatus();
  if (!status.configured) {
    throw new Error('尚未配置 AI 服务，请点击右上角“AI 配置”完成设置。');
  }
  return status.config;
}

export function saveAiConfig(config: AiConfig): void {
  const normalized = normalizeConfig(config);
  if (!normalized.apiKey) throw new Error('请填写 API Key。');
  if (!normalized.endpointId) throw new Error('请填写推理接入点 ID。');
  if (!normalized.endpointId.startsWith('ep-')) {
    throw new Error('推理接入点 ID 通常以 ep- 开头，请从方舟“在线推理”页面复制完整 ID。');
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    throw new Error('浏览器阻止了本地存储，无法保存配置。请允许此插件使用网站数据后重试。');
  }
}

function getApiErrorMessage(status: number, detail: string): string {
  if (status === 401) return 'API Key 无效或已失效，请重新从“API Key 管理”复制。';
  if (status === 403) return '当前账号或 API Key 没有调用权限，请确认已开通方舟服务并完成实名认证。';
  if (status === 404) return '未找到这个推理接入点，请检查 ID 是否完整、接入点是否已启动。';
  if (status === 429) return '请求过于频繁或账户额度不足，请到方舟控制台检查余额和限流。';
  if (status >= 500) return '火山方舟服务暂时不可用，请稍后再试。';
  return detail ? `连接失败：${detail}` : `连接失败（HTTP ${status}）。`;
}

export async function verifyAiConfig(config: AiConfig): Promise<void> {
  const normalized = normalizeConfig(config);
  if (!normalized.apiKey) throw new Error('请先填写 API Key。');
  if (!normalized.endpointId) throw new Error('请先填写推理接入点 ID。');
  if (!normalized.endpointId.startsWith('ep-')) {
    throw new Error('推理接入点 ID 应以 ep- 开头，请不要填写模型名称或 API Key。');
  }

  let response: Response;
  try {
    response = await fetch(ARK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalized.apiKey}`,
      },
      body: JSON.stringify({
        model: normalized.endpointId,
        messages: [{ role: 'user', content: '请只回复：连接成功' }],
        temperature: 0,
        max_tokens: 8,
      }),
    });
  } catch {
    throw new Error('无法连接火山方舟。请检查网络、代理或防火墙是否允许访问 ark.cn-beijing.volces.com。');
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json() as { error?: { message?: string } };
      detail = body.error?.message ?? '';
    } catch {
      // The status-specific message below is enough when the response is not JSON.
    }
    throw new Error(getApiErrorMessage(response.status, detail));
  }
}
