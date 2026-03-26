import { useDocumentReader } from './hooks/useDocumentReader';
import { useAnalysis } from './hooks/useAnalysis';
import { useClaimsVerification } from './hooks/useClaimsVerification';
import { useEvidenceCheck } from './hooks/useEvidenceCheck';

import Header from './components/Header';
import OfficeWarning from './components/OfficeWarning';
import StepReadDocument from './components/StepReadDocument';
import ActionPanel from './components/ActionPanel';
import AnalysisResult from './components/AnalysisResult';
import ClaimsResult from './components/ClaimsResult';
import EvidenceResult from './components/EvidenceResult';

export default function App() {
  const reader = useDocumentReader();
  const analysis = useAnalysis();
  const claims = useClaimsVerification();
  const evidence = useEvidenceCheck();

  // 合并各 hook 的错误信息，展示在 ActionPanel 中
  const combinedError =
    reader.error || analysis.error || claims.error || evidence.error;

  // 任意功能正在加载时禁用所有按钮
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-8 font-sans">
      <Header />

      <main className="w-full max-w-md p-4 flex flex-col space-y-5 mt-2">
        <OfficeWarning />

        {/* 步骤一：读取文档 */}
        <StepReadDocument
          selectedText={reader.selectedText}
          onRead={reader.readSelection}
        />

        {/* 步骤二：功能选择 + 错误提示 */}
        <ActionPanel
          hasText={!!reader.selectedText}
          isBusy={isBusy}
          isAnalyzing={analysis.isLoading}
          isVerifying={claims.isVerifying}
          isCheckingEvidence={evidence.isChecking}
          onAnalyze={handleAnalyze}
          onVerifyClaims={handleVerifyClaims}
          onCheckEvidence={handleCheckEvidence}
          error={combinedError}
        >
          {/* 功能结果区：同一时间只展示一个 */}
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

        {/* 证据核查结果渲染在 ActionPanel 外（独立卡片） */}
        {evidence.evidenceResults && (
          <EvidenceResult results={evidence.evidenceResults} />
        )}
      </main>
    </div>
  );
}
