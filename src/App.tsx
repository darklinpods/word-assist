import React, { useState } from 'react';
import { FileText, Wand2, ArrowDownToLine, Loader2, FileWarning } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getSelectedText, insertSuggestion } from './utils/office-utils';
import { analyzeLegalText } from './services/ai';

export default function App() {
  const [selectedText, setSelectedText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReadSelection = async () => {
    try {
      setError('');
      const text = await getSelectedText();
      setSelectedText(text);
      if (!text) {
        setError('未选中任何文字。在 Word 文档中选中需要分析的段落再试。');
      }
    } catch (err: any) {
      setError('读取文档失败: ' + err.message);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedText) {
      setError('请先获取文档内容。');
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      const result = await analyzeLegalText(selectedText);
      setAnalysisResult(result);
    } catch (err: any) {
      setError('分析出错: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = async () => {
    if (!analysisResult) return;
    try {
      await insertSuggestion(analysisResult);
    } catch (err: any) {
      setError('插入建议失败: ' + err.message);
    }
  };

  const isOfficeLoaded = typeof Office !== 'undefined';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-8 font-sans">
      {/* Header */}
      <header className="w-full bg-slate-800 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-bold tracking-wide">诉状智能助手</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md p-4 flex flex-col space-y-5 mt-2">
        
        {!isOfficeLoaded && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded flex items-start">
            <FileWarning className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>当前在浏览器中运行，未检测到 Office 环境。请在 Microsoft Word 侧边栏中加载此插件以获得完整功能体验。</span>
          </div>
        )}

        {/* Step 1: Read */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <span className="bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold mr-2">1</span>
            获取所选文档
          </h2>
          <button 
            onClick={handleReadSelection}
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

        {/* Step 2: Analyze */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <span className="bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold mr-2">2</span>
            AI 智能法务分析
          </h2>
          <button 
            onClick={handleAnalyze}
            disabled={!selectedText || isLoading}
            className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-transparent rounded-lg transition-colors font-medium text-sm flex justify-center items-center shadow-sm cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
            {isLoading ? '大模型正在分析...' : '开始一键审查'}
          </button>

          {error && <div className="mt-3 text-red-500 text-xs bg-red-50 p-2 rounded border border-red-100">{error}</div>}

          {analysisResult && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[15px] font-bold text-gray-800 flex items-center">
                  <Wand2 className="w-4 h-4 mr-1.5 text-indigo-500" />
                  AI 审查建议
                </h3>
                <button 
                  onClick={handleInsert}
                  className="px-3 py-1.5 flex justify-center items-center text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors font-medium shadow-sm cursor-pointer"
                  title="将以下建议插入到 Word 当前光标后"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />
                  插入批注
                </button>
              </div>

              {/* 使用 React Markdown 渲染 */}
              <div className="text-[13px] text-gray-800 bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-h-[400px] overflow-y-auto w-full selection:bg-indigo-100">
                <ReactMarkdown
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-sm font-bold text-indigo-800 mt-4 mb-2 pb-1 border-b border-indigo-100 break-words" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-[13px] font-bold text-gray-900 mt-3 mb-1 break-words" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-indigo-700" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1.5" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1.5" {...props} />,
                    li: ({node, ...props}) => <li className="break-words leading-relaxed" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2.5 leading-relaxed break-words" {...props} />
                  }}
                >
                  {analysisResult}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
