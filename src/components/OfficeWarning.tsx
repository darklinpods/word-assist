import { AlertTriangle, LoaderCircle } from 'lucide-react'

import type { OfficeEnvironmentInfo } from '../utils/office-env'

interface OfficeWarningProps {
  officeEnv: OfficeEnvironmentInfo
}

export default function OfficeWarning({ officeEnv }: OfficeWarningProps) {
  if (officeEnv.isOfficeReady) return null

  const isLoadingState = officeEnv.status === 'loading-script' || officeEnv.status === 'host-not-ready'
  const containerClassName = isLoadingState
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-red-50 border-red-200 text-red-800'
  const Icon = isLoadingState ? LoaderCircle : AlertTriangle
  const iconClassName = isLoadingState
    ? 'w-4 h-4 mr-2 flex-shrink-0 mt-0.5 animate-spin'
    : 'w-4 h-4 mr-2 flex-shrink-0 mt-0.5'

  return (
    <div className={`border text-xs p-3 rounded flex items-start ${containerClassName}`}>
      <Icon className={iconClassName} />
      <div className="space-y-1">
        <div className="font-medium">{officeEnv.title}</div>
        <div>{officeEnv.message}</div>
        <div className="opacity-80">诊断提示：{officeEnv.debugMessage}</div>
      </div>
    </div>
  )
}
