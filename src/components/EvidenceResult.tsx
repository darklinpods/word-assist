import { ClipboardList, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import type { EvidenceCheckResult } from '../utils/evidence-rules';
import ResultActionButton from './common/ResultActionButton';
import ResultCard from './common/ResultCard';
import ResultEmpty from './common/ResultEmpty';

interface Props {
  results: EvidenceCheckResult[] | null;
  onRerun: () => void;
  rerunDisabled?: boolean;
}

export default function EvidenceResult({ results, onRerun, rerunDisabled = false }: Props) {
  const actions = (
    <ResultActionButton onClick={onRerun} disabled={rerunDisabled} variant="gray">
      <RefreshCw className="w-3.5 h-3.5" />重新核查
    </ResultActionButton>
  );

  if (!results) {
    return (
      <ResultCard
        variant="card"
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
        title="证据清单核查报告"
        icon={<ClipboardList className="w-4 h-4 text-primary" />}
        actions={actions}
        titleTag="h2"
        titleClassName="text-sm font-semibold text-text-primary"
        headerClassName="mb-4"
      >
        <ResultEmpty>暂无核查结果。点击"重新核查"开始。</ResultEmpty>
      </ResultCard>
    );
  }
  const presentCount = results.filter(r => r.status === 'present').length;
  const weakCount = results.filter(r => r.status === 'weak').length;
  const missingCount = results.filter(r => r.status === 'missing').length;
  const total = results.length;

  return (
    <ResultCard
      variant="card"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      title="证据清单核查报告"
      icon={<ClipboardList className="w-4 h-4 text-primary" />}
      actions={actions}
      titleTag="h2"
      titleClassName="text-sm font-semibold text-text-primary"
      headerClassName="mb-4"
    >

      {/* 统计卡片 */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-emerald-700">{presentCount}</div>
          <div className="text-[11px] text-emerald-600 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" />已具备
          </div>
        </div>
        <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-amber-600">{weakCount}</div>
          <div className="text-[11px] text-amber-500 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />偏弱
          </div>
        </div>
        <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-red-600">{missingCount}</div>
          <div className="text-[11px] text-red-500 flex items-center justify-center gap-1">
            <XCircle className="w-3 h-3" />缺失
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden mb-5 flex">
        <div className="bg-emerald-400 h-full transition-all" style={{ width: `${(presentCount / total) * 100}%` }} />
        <div className="bg-amber-400 h-full transition-all" style={{ width: `${(weakCount / total) * 100}%` }} />
        <div className="bg-red-400 h-full transition-all" style={{ width: `${(missingCount / total) * 100}%` }} />
      </div>

      {/* 证据列表 */}
      <div className="space-y-2.5">
        {results.map(r => {
          const statusConfig = {
            present: {
              bg: 'bg-emerald-50',
              border: 'border-emerald-200',
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
              noteColor: 'text-emerald-700',
            },
            weak: {
              bg: 'bg-amber-50',
              border: 'border-amber-200',
              icon: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
              noteColor: 'text-amber-700',
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
                <span className="font-semibold text-text-primary flex-1">{r.item.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${requiredBadge.style}`}>
                  {requiredBadge.label}
                </span>
              </div>

              <div className="text-[11px] text-text-muted mb-1.5 ml-6">用于：{r.item.purpose}</div>

              <div className={`text-[12px] ml-6 leading-snug ${statusConfig.noteColor}`}>
                {r.status === 'missing' ? (
                  <details>
                    <summary className="cursor-pointer font-medium flex items-center gap-1">
                      <XCircle className="w-3 h-3" />未发现 — 点击查看取得建议
                    </summary>
                    <p className="mt-1.5 p-2 bg-white/70 rounded text-text-secondary leading-relaxed">{r.item.obtainTip}</p>
                  </details>
                ) : (
                  r.note
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ResultCard>
  );
}
