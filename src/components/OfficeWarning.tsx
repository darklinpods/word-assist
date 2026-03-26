import { FileWarning } from 'lucide-react';

export default function OfficeWarning() {
  const isOfficeLoaded = typeof Office !== 'undefined';
  if (isOfficeLoaded) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded flex items-start">
      <FileWarning className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
      <span>
        当前在浏览器中运行，未检测到 Office 环境。请在 Microsoft Word 侧边栏中加载此插件以获得完整功能体验。
      </span>
    </div>
  );
}
