import React, { useState } from 'react';
import { FileText, Wand2, ArrowDownToLine, Loader2, FileWarning, Calculator, CheckCircle2, XCircle, PenLine, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getSelectedText, insertSuggestion, replaceAmountInDocument, replaceAllAmounts } from './utils/office-utils';
import { analyzeLegalText, extractClaimElementsAsJSON } from './services/ai';
import { verifyCompensationItem, calculateTotalSummary } from './utils/compensation-rules';
import type { ClaimVerificationResult } from './utils/compensation-rules';

export default function App() {
  const [selectedText, setSelectedText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  
  const [verificationResults, setVerificationResults] = useState<ClaimVerificationResult[] | null>(null);
  const [totalSummary, setTotalSummary] = useState<{ userTotal: number; correctTotal: number; hasMismatch: boolean } | null>(null);

  // 修正状态：每项的 index
  const [fixingIndexes, setFixingIndexes] = useState<Set<number>>(new Set());
  const [fixedIndexes, setFixedIndexes] = useState<Set<number>>(new Set());
  const [fixAllStatus, setFixAllStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [fixAllMessage, setFixAllMessage] = useState('');

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
      setAnalysisResult('');
      const result = await analyzeLegalText(selectedText);
      setAnalysisResult(result);
    } catch (err: any) {
      setError('分析出错: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyClaims = async () => {
    if (!selectedText) {
      setError('请先获取文档内容。');
      return;
    }
    try {
      setIsVerifying(true);
      setError('');
      setVerificationResults(null);
      setTotalSummary(null);
      
      const elements = await extractClaimElementsAsJSON(selectedText);
      const results = elements.map(verifyCompensationItem);
      const summary = calculateTotalSummary(results);
      
      setVerificationResults(results);
      setTotalSummary(summary);
    } catch (err: any) {
      setError('金额核对出错: ' + err.message);
    } finally {
      setIsVerifying(false);
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

  // 修正单条错误金额
  const handleFixOne = async (res: ClaimVerificationResult, idx: number) => {
    setFixingIndexes(prev => new Set(prev).add(idx));
    try {
      const count = await replaceAmountInDocument(res.user_amount, res.theoretical_amount, res.type);
      if (count === 0) {
        setError(`未在文档中找到「${res.type}」的金额 ${res.user_amount}，请确认原文格式或手动修正。`);
      } else {
        setFixedIndexes(prev => new Set(prev).add(idx));
        setError('');
      }
    } catch (err: any) {
      setError('写回失败: ' + err.message);
    } finally {
      setFixingIndexes(prev => { const s = new Set(prev); s.delete(idx); return s; });
    }
  };

  // 批量修正所有错误金额
  const handleFixAll = async () => {
    if (!verificationResults) return;
    const wrongItems = verificationResults
      .map((r, i) => ({ r, i }))
      .filter(({ r, i }) => !r.is_correct && !fixedIndexes.has(i));
    if (wrongItems.length === 0) return;

    setFixAllStatus('loading');
    setFixAllMessage('');
    try {
      const corrections = wrongItems.map(({ r }) => ({
        oldAmount: r.user_amount,
        newAmount: r.theoretical_amount,
        itemType: r.type,
      }));
      const count = await replaceAllAmounts(corrections);
      const newFixed = new Set(fixedIndexes);
      wrongItems.forEach(({ i }) => newFixed.add(i));
      setFixedIndexes(newFixed);
      setFixAllStatus('done');
      setFixAllMessage(count > 0
        ? `已修正 ${count} 处金额，新数值已在 Word 文档中标红加粗，请复核。`
        : '未在文档中找到对应金额，请确认原文选中范围是否包含索赔列表。'
      );
    } catch (err: any) {
      setFixAllStatus('error');
      setFixAllMessage('批量修正失败: ' + err.message);
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
          <div className="flex flex-col space-y-3">
            <button 
              onClick={handleAnalyze}
              disabled={!selectedText || isLoading || isVerifying}
              className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-transparent rounded-lg transition-colors font-medium text-sm flex justify-center items-center shadow-sm cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              {isLoading ? '大模型正在分析...' : '一键文本智能审查'}
            </button>

            <button 
              onClick={handleVerifyClaims}
              disabled={!selectedText || isLoading || isVerifying}
              className="w-full py-2.5 bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-transparent rounded-lg transition-colors font-medium text-sm flex justify-center items-center shadow-sm cursor-pointer"
            >
              {isVerifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
              {isVerifying ? '正在加载核算引擎...' : '🧮 智能核定索赔金额'}
            </button>
          </div>

          {error && <div className="mt-3 text-red-500 text-sm bg-red-50 p-2.5 rounded-md border border-red-100">{error}</div>}

          {/* 选项一：法务审查结果 */}
          {analysisResult && !verificationResults && (
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

          {/* 选项二：财务金额核对单 */}
          {verificationResults && totalSummary && (
            <div className="mt-5 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[15px] font-bold text-gray-800 flex items-center">
                  <Calculator className="w-4 h-4 mr-1.5 text-teal-600" />
                  索赔金额核算对账单
                </h3>
              </div>
              
              <div className="space-y-3">
                {verificationResults.map((res, idx) => {
                  const isFixed = fixedIndexes.has(idx);
                  const isFixing = fixingIndexes.has(idx);
                  return (
                    <div key={idx} className={`p-3.5 rounded-lg border text-sm transition-all ${
                      isFixed ? 'bg-gray-50 border-gray-200 opacity-60'
                        : res.is_correct ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200 shadow-sm'
                    }`}>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-gray-800">{res.type}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold font-mono tracking-wide ${
                            !res.is_correct && !isFixed ? 'line-through text-red-400' : 'text-gray-700'
                          }`}>{res.user_amount} 元</span>
                          {/* 只对错误且未修正的项显示修正按钮 */}
                          {!res.is_correct && !isFixed && (
                            <button
                              onClick={() => handleFixOne(res, idx)}
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
                          <CheckCircle2 className={`w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5 ${isFixed ? 'text-gray-400' : 'text-green-600'}`} />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 mr-1.5 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`leading-snug ${
                          isFixed ? 'text-gray-400' : res.is_correct ? 'text-green-700' : 'text-red-700 font-medium'
                        }`}>
                          {isFixed ? `已修正 → ${res.theoretical_amount} 元（已在 Word 中标红加粗）` : res.message}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 汇总统计框 */}
              <div className={`mt-5 p-4 rounded-xl border-2 ${totalSummary.hasMismatch ? 'bg-orange-50/50 border-orange-200' : 'bg-emerald-50/50 border-emerald-200'}`}>
                <div className="text-sm font-bold mb-2 flex items-center justify-between">
                  <span>{totalSummary.hasMismatch ? '⚠️' : '✅'} 合计审查结论</span>
                  {/* 全部修正按钮：只在有错误&&有待修正项时显示 */}
                  {totalSummary.hasMismatch && verificationResults.some((r, i) => !r.is_correct && !fixedIndexes.has(i)) && (
                    <button
                      onClick={handleFixAll}
                      disabled={fixAllStatus === 'loading'}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg shadow transition-colors cursor-pointer"
                    >
                      {fixAllStatus === 'loading'
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Zap className="w-3.5 h-3.5" />}
                      {fixAllStatus === 'loading' ? '修正中...' : '⚡ 全部修正'}
                    </button>
                  )}
                </div>

                {/* 修正结果提示 */}
                {fixAllMessage && (
                  <div className={`text-xs p-2 rounded-md mb-2 ${
                    fixAllStatus === 'done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
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
                  <span className={totalSummary.hasMismatch ? 'text-orange-700' : 'text-emerald-700'}>
                    法定适用应得：
                  </span>
                  <span className={`font-mono ${totalSummary.hasMismatch ? 'text-orange-700' : 'text-emerald-700'}`}>
                    {totalSummary.correctTotal} 元
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
