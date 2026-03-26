import { FileText } from 'lucide-react';

interface Props {
  selectedText: string;
  onRead: () => void;
}

export default function StepReadDocument({ selectedText, onRead }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal">
      <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
        <span className="bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold mr-2">
          1
        </span>
        获取所选文档
      </h2>

      <button
        onClick={onRead}
        className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm border border-blue-200 shadow-sm flex items-center justify-center cursor-pointer"
      >
        <FileText className="w-4 h-4 mr-2" />
        提取Word选中段落
      </button>

      {selectedText && (
        <div className="mt-4">
          <span className="text-xs text-gray-400 mb-1 block">已提取内容预览：</span>
          <div className="p-3 bg-gray-50 text-xs text-gray-500 rounded-lg border border-gray-100 max-h-24 overflow-y-auto leading-relaxed shadow-inner">
            {selectedText}
          </div>
        </div>
      )}
    </div>
  );
}
