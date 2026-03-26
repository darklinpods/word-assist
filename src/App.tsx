import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { useDocumentReader } from './hooks/useDocumentReader';
import { useAnalysis } from './hooks/useAnalysis';
import { useClaimsVerification } from './hooks/useClaimsVerification';
import { useEvidenceCheck } from './hooks/useEvidenceCheck';
import { useCompensationCalculator } from './hooks/useCompensationCalculator';

import Header from './components/Header';
import OfficeWarning from './components/OfficeWarning';
import StepReadDocument from './components/StepReadDocument';
import ActionPanel from './components/ActionPanel';
import AnalysisResult from './components/AnalysisResult';
import ClaimsResult from './components/ClaimsResult';
import EvidenceResult from './components/EvidenceResult';
import CompensationForm from './components/CompensationForm';
import CompensationResult from './components/CompensationResult';

type View = 'main' | 'calculator';

export default function App() {
  const [view, setView] = useState<View>('main');

  // ── 主界面 hooks ──────────────────────────────────────────────
  const reader = useDocumentReader();
  const analysis = useAnalysis();
  const claims = useClaimsVerification();
  const evidence = useEvidenceCheck();

  // ── 赔偿计算器 hook ───────────────────────────────────────────
  const calc = useCompensationCalculator();

  // 合并各 hook 的错误信息，展示在 ActionPanel 中
  const combinedError = reader.error || analysis.error || claims.error || evidence.error;

  // 任意 AI 功能正在加载时禁用按钮
  const isBusy = analysis.isLoading || claims.isVerifying || evidence.isChecking;

  const handleAnalyze = () => {
    claims.reset();
    evidence.reset();
    analysis.analyze(reader.selectedText);
  };

  const handleVerifyClaims = () => {
    analysis.reset();
    evidence.reset();
    claims.verify(reader.selectedText);
  };

  const handleCheckEvidence = () => {
    analysis.reset();
    claims.reset();
    evidence.check(reader.selectedText);
  };

  // ── 渲染 ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-8 font-sans">
      <Header />

      <main className="w-full max-w-md p-4 flex flex-col space-y-5 mt-2">

        {/* ── 计算器视图 ── */}
        {view === 'calculator' && (
          <>
            {/* 返回按钮 */}
            <button
              onClick={() => setView('main')}
              className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors -mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回主界面
            </button>

            {/* 计算器卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal">
              <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                <span className="bg-amber-100 text-amber-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold mr-2">
                  🧮
                </span>
                赔偿金额计算器
              </h2>

              <CompensationForm
                params={calc.params}
                availableProvinces={calc.availableProvinces}
                availableYears={calc.availableYears}
                autoCompensationYears={calc.autoCompensationYears}
                onUpdate={calc.updateParam}
                onUpdateProvince={calc.updateProvince}
                onAddDependent={calc.addDependent}
                onRemoveDependent={calc.removeDependent}
                onUpdateDependent={calc.updateDependent}
                onCalculate={calc.calculate}
                error={calc.result ? '' : calc.error}
              />

              {calc.result && (
                <CompensationResult
                  result={calc.result}
                  params={calc.params}
                  isExporting={calc.isExporting}
                  onExport={calc.exportToWord}
                />
              )}

              {calc.error && calc.result && (
                <div className="mt-3 text-red-500 text-sm bg-red-50 p-2.5 rounded-md border border-red-100">
                  {calc.error}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── 主界面视图 ── */}
        {view === 'main' && (
          <>
            <OfficeWarning />

            {/* 步骤一：读取文档 */}
            <StepReadDocument
              selectedText={reader.selectedText}
              onRead={reader.readSelection}
            />

            {/* 步骤二：功能选择 */}
            <ActionPanel
              hasText={!!reader.selectedText}
              isBusy={isBusy}
              isAnalyzing={analysis.isLoading}
              isVerifying={claims.isVerifying}
              isCheckingEvidence={evidence.isChecking}
              onAnalyze={handleAnalyze}
              onVerifyClaims={handleVerifyClaims}
              onCheckEvidence={handleCheckEvidence}
              onOpenCalculator={() => setView('calculator')}
              error={combinedError}
            >
              <AnalysisResult
                result={analysis.analysisResult}
                onInsert={analysis.insertToDocument}
              />

              {claims.verificationResults && claims.totalSummary && (
                <ClaimsResult
                  results={claims.verificationResults}
                  totalSummary={claims.totalSummary}
                  fixingIndexes={claims.fixingIndexes}
                  fixedIndexes={claims.fixedIndexes}
                  fixAllStatus={claims.fixAllStatus}
                  fixAllMessage={claims.fixAllMessage}
                  onFixOne={claims.fixOne}
                  onFixAll={claims.fixAll}
                />
              )}
            </ActionPanel>

            {/* 证据核查结果（独立卡片） */}
            {evidence.evidenceResults && (
              <EvidenceResult results={evidence.evidenceResults} />
            )}
          </>
        )}

      </main>
    </div>
  );
}
