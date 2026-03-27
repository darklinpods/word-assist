import { Calculator, CheckCircle2, XCircle, PenLine, Loader2, Zap, RefreshCw } from 'lucide-react';
import type { ClaimVerificationResult } from '../utils/compensation-rules';
import type { FixAllStatus } from '../hooks/useClaimsVerification';

interface Props {
  results: ClaimVerificationResult[];
  totalSummary: { userTotal: number; correctTotal: number; hasMismatch: boolean };
  fixingIndexes: Set<number>;
  fixedIndexes: Set<number>;
  fixAllStatus: FixAllStatus;
  fixAllMessage: string;
  onFixOne: (res: ClaimVerificationResult, idx: number) => void;
  onFixAll: () => void;
  onRerun: () => void;
}

export default function ClaimsResult({
  results, totalSummary, fixingIndexes, fixedIndexes,
  fixAllStatus, fixAllMessage, onFixOne, onFixAll, onRerun,
}: Props) {
  return (
    <div className="mt-5 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[15px] font-bold text-gray-800 flex items-center">
          <Calculator className="w-4 h-4 mr-1.5 text-teal-600" />
          索赔金额核算对账单
        </h3>
        <button onClick={onRerun} className="px-3 py-1.5 flex items-center text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors font-medium cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5 mr-1" />重新核算
        </button>
      </div>

      <div className="space-y-3">
        {results.map((res, idx) => {
          const isFixed = fixedIndexes.has(idx);
          const isFixing = fixingIndexes.has(idx);
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border text-sm transition-all ${isFixed
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : res.is_correct
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200 shadow-sm'
                }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-bold text-gray-800">{res.type}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold font-mono tracking-wide ${!res.is_correct && !isFixed ? 'line-through text-red-400' : 'text-gray-700'
                      }`}
                  >
                    {res.user_amount} 元
                  </span>

                  {!res.is_correct && !isFixed && (
                    <button
                      onClick={() => onFixOne(res, idx)}
                      disabled={isFixing}
                      title={`将文档中的 ${res.user_amount} 元修正为 ${res.theoretical_amount} 元`}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded transition-colors shadow-sm cursor-pointer"
                    >
                      {isFixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenLine className="w-3 h-3" />}
                      {isFixing ? '修正中' : '✏️ 修正'}
                    </button>
                  )}

                  {isFixed && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> 已修正
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start text-[13px] mt-1.5">
                {res.is_correct || isFixed ? (
                  <CheckCircle2
                    className={`w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5 ${isFixed ? 'text-gray-400' : 'text-green-600'}`}
                  />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 mr-1.5 flex-shrink-0 mt-0.5" />
                )}
                <span
                  className={`leading-snug ${isFixed ? 'text-gray-400' : res.is_correct ? 'text-green-700' : 'text-red-700 font-medium'
                    }`}
                >
                  {isFixed ? `已修正 → ${res.theoretical_amount} 元（已在 Word 中标红加粗）` : res.message}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 汇总框 */}
      <div
        className={`mt-5 p-4 rounded-xl border-2 ${totalSummary.hasMismatch ? 'bg-orange-50/50 border-orange-200' : 'bg-emerald-50/50 border-emerald-200'
          }`}
      >
        <div className="text-sm font-bold mb-2 flex items-center justify-between">
          <span>{totalSummary.hasMismatch ? '⚠️' : '✅'} 合计审查结论</span>

          {totalSummary.hasMismatch && results.some((r, i) => !r.is_correct && !fixedIndexes.has(i)) && (
            <button
              onClick={onFixAll}
              disabled={fixAllStatus === 'loading'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg shadow transition-colors cursor-pointer"
            >
              {fixAllStatus === 'loading' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              {fixAllStatus === 'loading' ? '修正中...' : '⚡ 全部修正'}
            </button>
          )}
        </div>

        {fixAllMessage && (
          <div
            className={`text-xs p-2 rounded-md mb-2 ${fixAllStatus === 'done'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-600 border border-red-200'
              }`}
          >
            {fixAllMessage}
          </div>
        )}

        <div className="flex justify-between text-[13px] mt-3 pb-2 border-b border-gray-200/60">
          <span className="text-gray-600">原文主张总额：</span>
          <span className={`font-mono text-gray-500 ${totalSummary.hasMismatch ? 'line-through' : ''}`}>
            {totalSummary.userTotal} 元
          </span>
        </div>
        <div className="flex justify-between text-[15px] font-bold mt-2 pt-1">
          <span className={totalSummary.hasMismatch ? 'text-orange-700' : 'text-emerald-700'}>法定适用应得：</span>
          <span className={`font-mono ${totalSummary.hasMismatch ? 'text-orange-700' : 'text-emerald-700'}`}>
            {totalSummary.correctTotal} 元
          </span>
        </div>
      </div>
    </div>
  );
}
