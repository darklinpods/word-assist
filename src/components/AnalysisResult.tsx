import { Wand2, ArrowDownToLine, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  result: string;
  onInsert: () => void;
  onRerun: () => void;
  rerunDisabled?: boolean;
  insertDisabled?: boolean;
}

export default function AnalysisResult({
  result,
  onInsert,
  onRerun,
  rerunDisabled = false,
  insertDisabled = false,
}: Props) {
  if (!result) {
    return (
      <div className="mt-5 border-t border-gray-100 pt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[15px] font-bold text-gray-800 flex items-center">
            <Wand2 className="w-4 h-4 mr-1.5 text-indigo-500" />
            AI 审查建议
          </h3>
          <div className="flex gap-2">
            <button
              onClick={onRerun}
              disabled={rerunDisabled}
              className="px-3 py-1.5 flex items-center text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />重新分析
            </button>
            <button
              onClick={onInsert}
              disabled={insertDisabled}
              className="px-3 py-1.5 flex items-center text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="将以下建议插入到 Word 当前光标后"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />插入批注
            </button>
          </div>
        </div>

        <div className="text-[13px] text-gray-500 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          暂无审查结果。点击“重新分析”开始。
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[15px] font-bold text-gray-800 flex items-center">
          <Wand2 className="w-4 h-4 mr-1.5 text-indigo-500" />
          AI 审查建议
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onRerun}
            disabled={rerunDisabled}
            className="px-3 py-1.5 flex items-center text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />重新分析
          </button>
          <button
            onClick={onInsert}
            disabled={insertDisabled}
            className="px-3 py-1.5 flex items-center text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="将以下建议插入到 Word 当前光标后">
            <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />插入批注
          </button>
        </div>
      </div>

      <div className="text-[13px] text-gray-800 bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-h-[400px] overflow-y-auto w-full selection:bg-indigo-100">
        <ReactMarkdown
          components={{
            h3: ({ node, ...props }) => (
              <h3
                className="text-sm font-bold text-indigo-800 mt-4 mb-2 pb-1 border-b border-indigo-100 break-words"
                {...props}
              />
            ),
            h4: ({ node, ...props }) => (
              <h4 className="text-[13px] font-bold text-gray-900 mt-3 mb-1 break-words" {...props} />
            ),
            strong: ({ node, ...props }) => <strong className="font-bold text-indigo-700" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1.5" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5" {...props} />,
            li: ({ node, ...props }) => <li className="break-words leading-relaxed" {...props} />,
            p: ({ node, ...props }) => <p className="mb-2.5 leading-relaxed break-words" {...props} />,
          }}
        >
          {result}
        </ReactMarkdown>
      </div>
    </div>
  );
}
