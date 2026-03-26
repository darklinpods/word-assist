import { ClipboardList, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { EvidenceCheckResult } from '../utils/evidence-rules';

interface Props {
  results: EvidenceCheckResult[];
}

export default function EvidenceResult({ results }: Props) {
  const presentCount = results.filter(r => r.status === 'present').length;
  const weakCount = results.filter(r => r.status === 'weak').length;
  const missingCount = results.filter(r => r.status === 'missing').length;
  const total = results.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
        <ClipboardList className="w-4 h-4 mr-2 text-violet-600" />
        证据清单核查报告
      </h2>

      {/* 统计卡片 */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-green-700">{presentCount}</div>
          <div className="text-[11px] text-green-600">✅ 已具备</div>
        </div>
        <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-orange-600">{weakCount}</div>
          <div className="text-[11px] text-orange-500">⚠️ 偏弱</div>
        </div>
        <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-red-600">{missingCount}</div>
          <div className="text-[11px] text-red-500">❌ 缺失</div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden mb-5 flex">
        <div className="bg-green-400 h-full transition-all" style={{ width: `${(presentCount / total) * 100}%` }} />
        <div className="bg-orange-400 h-full transition-all" style={{ width: `${(weakCount / total) * 100}%` }} />
        <div className="bg-red-400 h-full transition-all" style={{ width: `${(missingCount / total) * 100}%` }} />
      </div>

      {/* 证据列表 */}
      <div className="space-y-2.5">
        {results.map(r => {
          const statusConfig = {
            present: {
              bg: 'bg-green-50',
              border: 'border-green-200',
              icon: <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />,
              noteColor: 'text-green-700',
            },
            weak: {
              bg: 'bg-orange-50',
              border: 'border-orange-200',
              icon: <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />,
              noteColor: 'text-orange-700',
            },
            missing: {
              bg: 'bg-red-50',
              border: 'border-red-200',
              icon: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
              noteColor: 'text-red-700',
            },
          }[r.status];

          const requiredBadge = {
            must: { label: '必须', style: 'bg-red-100 text-red-700' },
            conditional: { label: '条件性', style: 'bg-amber-100 text-amber-700' },
            recommended: { label: '建议', style: 'bg-blue-100 text-blue-700' },
          }[r.item.required];

          return (
            <div
              key={r.item.id}
              className={`rounded-lg border p-3 text-sm ${statusConfig.bg} ${statusConfig.border}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {statusConfig.icon}
                <span className="font-semibold text-gray-800 flex-1">{r.item.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${requiredBadge.style}`}>
                  {requiredBadge.label}
                </span>
              </div>

              <div className="text-[11px] text-gray-400 mb-1.5 ml-6">用于：{r.item.purpose}</div>

              <div className={`text-[12px] ml-6 leading-snug ${statusConfig.noteColor}`}>
                {r.status === 'missing' ? (
                  <details>
                    <summary className="cursor-pointer font-medium">❌ 未发现 — 点击查看取得建议</summary>
                    <p className="mt-1.5 p-2 bg-white/70 rounded text-gray-600 leading-relaxed">{r.item.obtainTip}</p>
                  </details>
                ) : (
                  r.note
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
