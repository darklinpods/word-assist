import { Wand2, ArrowDownToLine, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ResultActionButton from './common/ResultActionButton';
import ResultCard from './common/ResultCard';
import ResultEmpty from './common/ResultEmpty';

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
  const actions = (
    <div className="flex gap-2">
      <ResultActionButton onClick={onRerun} disabled={rerunDisabled} variant="gray">
        <RefreshCw className="w-3.5 h-3.5" />重新分析
      </ResultActionButton>
      <ResultActionButton
        onClick={onInsert}
        disabled={insertDisabled}
        variant="emerald"
        title="将以下建议插入到 Word 当前光标后"
      >
        <ArrowDownToLine className="w-3.5 h-3.5" />插入批注
      </ResultActionButton>
    </div>
  );

  const content = !result ? (
    <ResultEmpty>暂无审查结果。点击"重新分析"开始。</ResultEmpty>
  ) : (
    <div className="text-[13px] text-text-primary bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-h-[400px] overflow-y-auto w-full">
      <ReactMarkdown
        components={{
          h3: ({ ...props }) => (
            <h3
              className="text-sm font-bold text-primary mt-4 mb-2 pb-1 border-b border-primary/20 break-words font-heading"
              {...props}
            />
          ),
          h4: ({ ...props }) => (
            <h4 className="text-[13px] font-bold text-text-primary mt-3 mb-1 break-words" {...props} />
          ),
          strong: ({ ...props }) => <strong className="font-bold text-primary" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1.5" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5" {...props} />,
          li: ({ ...props }) => <li className="break-words leading-relaxed" {...props} />,
          p: ({ ...props }) => <p className="mb-2.5 leading-relaxed break-words" {...props} />,
        }}
      >
        {result}
      </ReactMarkdown>
    </div>
  );

  return (
    <ResultCard
      variant="section"
      title="AI 审查建议"
      icon={<Wand2 className="w-4 h-4 text-primary" />}
      actions={actions}
      titleTag="h3"
      titleClassName="text-[15px] font-bold text-text-primary"
      headerClassName="mb-3"
    >
      {content}
    </ResultCard>
  );
}
