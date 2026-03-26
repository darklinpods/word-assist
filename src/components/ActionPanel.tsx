import { type ReactNode } from 'react';
import { Wand2, Calculator, ClipboardList, Loader2, ReceiptText } from 'lucide-react';

interface Props {
  hasText: boolean;
  isBusy: boolean;
  isAnalyzing: boolean;
  isVerifying: boolean;
  isCheckingEvidence: boolean;
  onAnalyze: () => void;
  onVerifyClaims: () => void;
  onCheckEvidence: () => void;
  onOpenCalculator: () => void;
  error: string;
  children?: ReactNode;
}

export default function ActionPanel({
  hasText,
  isBusy,
  isAnalyzing,
  isVerifying,
  isCheckingEvidence,
  onAnalyze,
  onVerifyClaims,
  onCheckEvidence,
  onOpenCalculator,
  error,
  children,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal">
      <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
        <span className="bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold mr-2">
          2
        </span>
        AI 智能法务分析
      </h2>

      <div className="flex flex-col space-y-3">
        {/* 文本审查 */}
        <button
          onClick={onAnalyze}
          disabled={!hasText || isBusy}
          className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-transparent rounded-lg transition-colors font-medium text-sm flex justify-center items-center shadow-sm cursor-pointer"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
          {isAnalyzing ? '大模型正在分析...' : '一键文本智能审查'}
        </button>

        {/* 金额核算 */}
        <button
          onClick={onVerifyClaims}
          disabled={!hasText || isBusy}
          className="w-full py-2.5 bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-transparent rounded-lg transition-colors font-medium text-sm flex justify-center items-center shadow-sm cursor-pointer"
        >
          {isVerifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
          {isVerifying ? '正在加载核算引擎...' : '🧮 智能核定索赔金额'}
        </button>

        {/* 证据核查 */}
        <button
          onClick={onCheckEvidence}
          disabled={!hasText || isBusy}
          className="w-full py-2.5 bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-transparent rounded-lg transition-colors font-medium text-sm flex justify-center items-center shadow-sm cursor-pointer"
        >
          {isCheckingEvidence ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ClipboardList className="w-4 h-4 mr-2" />
          )}
          {isCheckingEvidence ? 'AI 核查证据中...' : '📋 证据清单核查'}
        </button>

        {/* 赔偿计算器 — 始终可点击，不依赖选中文字 */}
        <button
          onClick={onOpenCalculator}
          className="w-full py-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-colors font-medium text-sm flex justify-center items-center shadow-sm cursor-pointer"
        >
          <ReceiptText className="w-4 h-4 mr-2" />
          🧮 赔偿金额计算器
        </button>
      </div>

      {error && (
        <div className="mt-3 text-red-500 text-sm bg-red-50 p-2.5 rounded-md border border-red-100">{error}</div>
      )}

      {children}
    </div>
  );
}
