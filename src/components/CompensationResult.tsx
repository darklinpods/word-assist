import { FileDown, Loader2, CheckCircle2 } from 'lucide-react';
import type { CalcResult } from '../utils/compensation-calculator';
import type { CaseParams } from '../utils/compensation-calculator';

interface Props {
  result: CalcResult;
  params: Pick<CaseParams, 'province' | 'year' | 'residentType' | 'caseType'>;
  isExporting: boolean;
  onExport: () => void;
}

export default function CompensationResult({ result, params, isExporting, onExport }: Props) {
  const { items, total } = result;
  const enabledItems = items.filter(i => i.enabled);
  const residentLabel = params.residentType === 'urban' ? '城镇居民' : '农村居民';

  return (
    <div className="mt-4 border-t border-gray-100 pt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 元数据标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-gray-800">📊 计算结果</h3>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {params.province} · {params.year} · {residentLabel}
        </span>
      </div>

      {/* 各项明细 */}
      <div className="space-y-0 border border-gray-100 rounded-lg overflow-hidden text-[12px]">
        {/* 启用项 */}
        {enabledItems.map(item => (
          <div
            key={item.key}
            className="flex items-start px-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
          >
            <CheckCircle2 className="w-3 h-3 text-teal-500 flex-shrink-0 mt-0.5 mr-2" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800">{item.type}</div>
              {item.formula !== '—' && (
                <div className="text-[10px] text-gray-400 mt-0.5 break-words leading-tight">
                  {item.formula}
                </div>
              )}
            </div>
            <span className="font-mono font-bold text-gray-800 ml-2 whitespace-nowrap">
              {item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元
            </span>
          </div>
        ))}

        {/* 不适用项（折叠展示） */}
        {items.filter(i => !i.enabled).length > 0 && (
          <details className="group">
            <summary className="px-3 py-1.5 text-[10px] text-gray-400 cursor-pointer hover:bg-gray-50 list-none flex items-center">
              <span className="mr-1">▸</span>
              未主张项目（{items.filter(i => !i.enabled).length} 项）
            </summary>
            {items
              .filter(i => !i.enabled)
              .map(item => (
                <div
                  key={item.key}
                  className="flex items-center px-3 py-1.5 text-gray-300 border-t border-gray-50"
                >
                  <span className="flex-1 line-through">{item.type}</span>
                  <span className="text-[10px]">{item.note}</span>
                </div>
              ))}
          </details>
        )}
      </div>

      {/* 合计 */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-amber-700 font-medium">合计主张金额</div>
          <div className="text-[10px] text-amber-500 mt-0.5">共 {enabledItems.length} 项</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-mono text-amber-700">
            {total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-amber-500">元</div>
        </div>
      </div>

      {/* 导出按钮 */}
      <button
        type="button"
        onClick={onExport}
        disabled={isExporting}
        className="w-full py-2.5 bg-slate-700 hover:bg-slate-800 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4 mr-2" />
        )}
        {isExporting ? '导出中...' : '📄 导出计算明细到 Word'}
      </button>
    </div>
  );
}
