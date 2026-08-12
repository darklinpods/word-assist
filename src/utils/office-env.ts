import { useEffect, useState } from 'react'

export const OFFICE_BOOTSTRAP_EVENT = 'office-bootstrap-change'

type OfficeEnvironmentStatus =
  | 'ready'
  | 'loading-script'
  | 'host-not-ready'
  | 'script-load-failed'
  | 'sdk-missing'

interface OfficeBootstrapState {
  scriptRequestedAt: number | null
  scriptLoaded: boolean
  scriptLoadFailed: boolean
  onReadyResolved: boolean
}

export interface OfficeEnvironmentInfo {
  status: OfficeEnvironmentStatus
  isOfficeReady: boolean
  isWordReady: boolean
  title: string
  message: string
  debugMessage: string
}

declare global {
  interface Window {
    __officeBootstrap?: Partial<OfficeBootstrapState>
  }
}

function getBootstrapState(): OfficeBootstrapState {
  if (typeof window === 'undefined') {
    return {
      scriptRequestedAt: null,
      scriptLoaded: false,
      scriptLoadFailed: false,
      onReadyResolved: false,
    }
  }

  return {
    scriptRequestedAt: window.__officeBootstrap?.scriptRequestedAt ?? null,
    scriptLoaded: window.__officeBootstrap?.scriptLoaded ?? false,
    scriptLoadFailed: window.__officeBootstrap?.scriptLoadFailed ?? false,
    onReadyResolved: window.__officeBootstrap?.onReadyResolved ?? false,
  }
}

export function notifyOfficeBootstrapChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(OFFICE_BOOTSTRAP_EVENT))
}

export function getOfficeEnvironmentInfo(): OfficeEnvironmentInfo {
  const bootstrap = getBootstrapState()
  const hasOffice = typeof Office !== 'undefined'
  const hasWord = typeof Word !== 'undefined'

  if (hasOffice && (hasWord || bootstrap.onReadyResolved)) {
    return {
      status: 'ready',
      isOfficeReady: true,
      isWordReady: hasWord,
      title: 'Office 已就绪',
      message: '已检测到 Office 宿主环境。',
      debugMessage: hasWord ? 'Office 与 Word API 已可用。' : 'Office 已就绪，但 Word API 仍在加载。',
    }
  }

  if (bootstrap.scriptLoadFailed) {
    return {
      status: 'script-load-failed',
      isOfficeReady: false,
      isWordReady: false,
      title: 'Office 脚本加载失败',
      message: '当前页面没能成功加载 office.js，通常是网络、代理、证书或防火墙导致 Word 侧边栏无法连接到 Office SDK。',
      debugMessage: '检查是否能访问 appsforoffice.microsoft.com，以及任务窗格开发者工具的 Network/Console。',
    }
  }

  if (hasOffice) {
    return {
      status: 'host-not-ready',
      isOfficeReady: false,
      isWordReady: false,
      title: '正在等待 Word 宿主就绪',
      message: 'Office SDK 已加载，但 Word 宿主还没有完成初始化。若长时间停留在此状态，通常是插件不是从 Word 任务窗格打开，或宿主连接异常。',
      debugMessage: '这时页面里通常已经有 Office 全局对象，但 Word API 还不可用。',
    }
  }

  if (bootstrap.scriptLoaded) {
    return {
      status: 'sdk-missing',
      isOfficeReady: false,
      isWordReady: false,
      title: 'Office SDK 未挂载到页面',
      message: 'office.js 已返回，但页面里没有检测到 Office 全局对象。这通常表示脚本执行被拦截，或当前页面并非由 Word 宿主正常加载。',
      debugMessage: '如果你确实是在 Word 里看到这个页面，优先检查任务窗格控制台是否有脚本加载或 CSP 错误。',
    }
  }

  return {
    status: 'loading-script',
    isOfficeReady: false,
    isWordReady: false,
    title: '未检测到 Office 环境',
    message: '当前页面还没有检测到 Office 运行环境。若你已在 Word 侧边栏中打开插件，多半是 office.js 还没加载成功。',
    debugMessage: '这在直接用浏览器访问页面时也会出现。',
  }
}

export function getOfficeActionError(): string {
  const env = getOfficeEnvironmentInfo()
  const actionLabel = 'Word 文档操作失败'

  switch (env.status) {
    case 'script-load-failed':
      return `${actionLabel}: Office 脚本加载失败。请检查网络、代理、证书或防火墙，并确认 Word 能访问 Office SDK。`
    case 'sdk-missing':
      return `${actionLabel}: office.js 已返回，但 Office SDK 没有挂载到当前页面。请确认这是从 Microsoft Word 任务窗格打开的插件页面。`
    case 'host-not-ready':
      return `${actionLabel}: Office SDK 已加载，但 Word 宿主尚未完成初始化。请稍等几秒后重试。`
    case 'loading-script':
      return `${actionLabel}: 未检测到 Office 环境。请从 Microsoft Word 任务窗格打开此插件；若已在 Word 中打开，请检查 office.js 是否加载成功。`
    case 'ready':
      return `${actionLabel}: Office 环境已就绪，但调用 Word API 仍然失败。请查看任务窗格控制台的详细错误。`
  }
}

export function useOfficeEnvironment() {
  const [info, setInfo] = useState<OfficeEnvironmentInfo>(() => getOfficeEnvironmentInfo())

  useEffect(() => {
    if (typeof window === 'undefined') return

    const refresh = () => {
      const nextInfo = getOfficeEnvironmentInfo()
      setInfo(nextInfo)
      if (nextInfo.isWordReady) {
        window.clearInterval(intervalId)
        window.clearTimeout(timeoutId)
      }
    }

    const intervalId = window.setInterval(refresh, 500)
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId)
    }, 8000)

    refresh()
    window.addEventListener(OFFICE_BOOTSTRAP_EVENT, refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
      window.removeEventListener(OFFICE_BOOTSTRAP_EVENT, refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  return info
}
