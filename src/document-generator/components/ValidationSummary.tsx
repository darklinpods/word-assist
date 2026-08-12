import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

import type { ValidationIssue } from '../core/types';

export default function ValidationSummary({ issues }: { issues: ValidationIssue[] }) {
  const errors = issues.filter((item) => item.severity === 'error');
  const warnings = issues.filter((item) => item.severity === 'warning');

  if (issues.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>当前提取内容完整，可以生成要素式起诉状。</span>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50/70 p-3" aria-labelledby="validation-title">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-900" id="validation-title">
        <AlertTriangle className="h-4 w-4" />
        发现 {errors.length} 项缺失或错误、{warnings.length} 项建议补充
      </div>
      <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs text-amber-900">
        {issues.map((item) => (
          <li key={item.id} className="flex items-start gap-1.5">
            <AlertCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${item.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
            <span>{item.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
