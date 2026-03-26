import { Wand2, ArrowDownToLine } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  result: string;
  onInsert: () => void;
}

export default function AnalysisResult({ result, onInsert }: Props) {
  if (!result) return null;

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[15px] font-bold text-gray-800 flex items-center">
          <Wand2 className="w-4 h-4 mr-1.5 text-indigo-500" />
          AI 审查建议
        </h3>
        <button
          onClick={onInsert}
          className="px-3 py-1.5 flex justify-center items-center text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors font-medium shadow-sm cursor-pointer"
          title="将以下建议插入到 Word 当前光标后"
        >
          <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />
          插入批注
        </button>
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
