import { type ReactNode } from 'react';
import { Wand2, Calculator, ClipboardList, Loader2, ReceiptText, FileText } from 'lucide-react';

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
  onInsertTemplate: () => void;
  error: string;
  children?: ReactNode;
}

const btn = (active: boolean, color: string) =>
  `relative group p-2.5 rounded-lg transition-colors cursor-pointer ${active ? color : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} disabled:opacity-40 disabled:cursor-not-allowed`;

const Tip = ({ label }: { label: string }) => (
  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
    {label}
  </span>
);

export default function ActionPanel({
  hasText, isBusy, isAnalyzing, isVerifying, isCheckingEvidence,
  onAnalyze, onVerifyClaims, onCheckEvidence, onOpenCalculator, onInsertTemplate,
  error, children,
}: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 图标工具栏 */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-white border-b border-gray-200">
        <button onClick={onAnalyze} disabled={!hasText || isBusy}
          className={btn(isAnalyzing, 'text-indigo-600 bg-indigo-50')}>
          <Tip label="文本智能审查" />
          {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
        </button>

        <button onClick={onVerifyClaims} disabled={!hasText || isBusy}
          className={btn(isVerifying, 'text-teal-600 bg-teal-50')}>
          <Tip label="智能核定索赔金额" />
          {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
        </button>

        <button onClick={onCheckEvidence} disabled={!hasText || isBusy}
          className={btn(isCheckingEvidence, 'text-violet-600 bg-violet-50')}>
          <Tip label="证据清单核查" />
          {isCheckingEvidence ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardList className="w-5 h-5" />}
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button onClick={onOpenCalculator}
          className={btn(false, '') + ' hover:text-amber-600 hover:bg-amber-50'}>
          <Tip label="赔偿金额计算器" />
          <ReceiptText className="w-5 h-5" />
        </button>

        <button onClick={onInsertTemplate}
          className={btn(false, '') + ' hover:text-gray-700 hover:bg-gray-100'}>
          <Tip label="插入起诉状模板" />
          <FileText className="w-5 h-5" />
        </button>
      </div>

      {/* 输出区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-2.5 rounded-md border border-red-100">{error}</div>
        )}
        {children}
      </div>
    </div>
  );
}
