import { useState } from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

import { insertFullExtractionIntoTemplate, insertTemplate, formatTraditionalComplaint } from './utils/office-utils';
import { useDocumentReader } from './hooks/useDocumentReader';
import { useAnalysis } from './hooks/useAnalysis';
import { useClaimsVerification } from './hooks/useClaimsVerification';
import { useEvidenceCheck } from './hooks/useEvidenceCheck';
import { useCompensationCalculator } from './hooks/useCompensationCalculator';
import { useIdCardVerification } from './hooks/useIdCardVerification';
import { usePartyExtraction } from './hooks/usePartyExtraction';

import Header from './components/Header';
import OfficeWarning from './components/OfficeWarning';
import ActionPanel from './components/ActionPanel';
import AnalysisResult from './components/AnalysisResult';
import ClaimsResult from './components/ClaimsResult';
import EvidenceResult from './components/EvidenceResult';
import IdCardResult from './components/IdCardResult';
import PartiesResult from './components/PartiesResult';
import CompensationForm from './components/CompensationForm';
import CompensationResult from './components/CompensationResult';

type View = 'main' | 'calculator';

export default function App() {
  const [view, setView] = useState<View>('main');
  const [partyInsertError, setPartyInsertError] = useState('');

  const reader = useDocumentReader();
  const analysis = useAnalysis();
  const claims = useClaimsVerification();
  const evidence = useEvidenceCheck();
  const idCard = useIdCardVerification();
  const parties = usePartyExtraction();
  const calc = useCompensationCalculator();

  const resetAll = () => {
    analysis.reset(); claims.reset(); evidence.reset(); idCard.reset(); parties.reset(); setPartyInsertError('');
  };

  const combinedError =
    reader.error ||
    analysis.error ||
    claims.error ||
    evidence.error ||
    idCard.error ||
    parties.error ||
    partyInsertError;
  const isBusy =
    analysis.isLoading ||
    claims.isVerifying ||
    evidence.isChecking ||
    idCard.isChecking ||
    parties.isExtracting;
  const hasAnyResult = Boolean(
    analysis.analysisResult ||
    (claims.verificationResults && claims.totalSummary) ||
    evidence.evidenceResults ||
    idCard.results ||
    parties.result
  );

  // 顶部按钮：只切换面板，首次切入且无结果时自动触发
  const handleAnalyze = () => {
    if (!analysis.analysisResult && !analysis.isLoading) {
      resetAll(); analysis.analyze(reader.selectedText);
    }
  };
  const handleVerifyClaims = () => {
    if (!claims.verificationResults && !claims.isVerifying) {
      resetAll(); claims.verify(reader.selectedText);
    }
  };
  const handleCheckEvidence = () => {
    if (!evidence.evidenceResults && !evidence.isChecking) {
      resetAll(); evidence.check(reader.selectedText);
    }
  };
  const handleCheckIdCard = () => {
    if (!idCard.isChecking) {
      resetAll(); idCard.checkDocument();
    }
  };
  const handleExtractParties = () => {
    if (!parties.isExtracting) {
      resetAll(); parties.extract();
    }
  };

  // 结果区内"重新执行"按钮
  const handleRerunAnalyze = () => { analysis.analyze(reader.selectedText); };
  const handleRerunClaims = () => { claims.verify(reader.selectedText); };
  const handleRerunEvidence = () => { evidence.check(reader.selectedText); };
  const handleRerunIdCard = () => { idCard.checkDocument(); };
  const handleRerunParties = () => { parties.extract(); };
  const handleInsertParties = async () => {
    if (!parties.result) return;
    try {
      setPartyInsertError('');
      await insertFullExtractionIntoTemplate(parties.result);
    } catch (err: any) {
      setPartyInsertError('写入要素式诉状失败: ' + err.message);
    }
  };

  return (
    <div className="h-screen flex flex-col font-sans bg-gray-50">
      <Header />

      {view === 'calculator' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <button onClick={() => setView('main')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />返回主界面
          </button>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">🧮 赔偿金额计算器</h2>
            <CompensationForm
              params={calc.params} availableProvinces={calc.availableProvinces}
              availableYears={calc.availableYears} autoCompensationYears={calc.autoCompensationYears}
              onUpdate={calc.updateParam} onUpdateProvince={calc.updateProvince}
              onAddDependent={calc.addDependent} onRemoveDependent={calc.removeDependent}
              onUpdateDependent={calc.updateDependent} onCalculate={calc.calculate}
              error={calc.result ? '' : calc.error}
            />
            {calc.result && (
              <CompensationResult result={calc.result} params={calc.params}
                isExporting={calc.isExporting} onExport={calc.exportToWord} />
            )}
            {calc.error && calc.result && (
              <div className="mt-3 text-red-500 text-sm bg-red-50 p-2.5 rounded-md border border-red-100">{calc.error}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <OfficeWarning />

          <div className="px-3 pt-3">
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
              流程：1 提取文本 → 2 选择功能 → 3 查看结果/写回
            </div>
          </div>

          {/* 读取文档工具栏 */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200">
            <button onClick={reader.readSelection}
              className="relative group flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer">
              <FileText className="w-4 h-4" />
              提取选中段落
            </button>
            {reader.selectedText && (
              <span className="text-xs text-gray-400 truncate max-w-[200px]">{reader.selectedText.slice(0, 40)}…</span>
            )}
          </div>

          <ActionPanel
            hasText={!!reader.selectedText} isBusy={isBusy}
            isAnalyzing={analysis.isLoading} isVerifying={claims.isVerifying}
            isCheckingEvidence={evidence.isChecking} isCheckingIdCard={idCard.isChecking}
            isExtractingParties={parties.isExtracting}
            hasResults={hasAnyResult}
            onAnalyze={handleAnalyze} onVerifyClaims={handleVerifyClaims}
            onCheckEvidence={handleCheckEvidence} onCheckIdCard={handleCheckIdCard}
            onExtractParties={handleExtractParties}
            onOpenCalculator={() => setView('calculator')}
            onInsertTemplate={insertTemplate}
            onFormatDocument={formatTraditionalComplaint}
            error={combinedError}
          >
            <AnalysisResult result={analysis.analysisResult} onInsert={analysis.insertToDocument} onRerun={handleRerunAnalyze} />
            {claims.verificationResults && claims.totalSummary && (
              <ClaimsResult
                results={claims.verificationResults} totalSummary={claims.totalSummary}
                fixingIndexes={claims.fixingIndexes} fixedIndexes={claims.fixedIndexes}
                fixAllStatus={claims.fixAllStatus} fixAllMessage={claims.fixAllMessage}
                onFixOne={claims.fixOne} onFixAll={claims.fixAll} onRerun={handleRerunClaims}
              />
            )}
            {evidence.evidenceResults && <EvidenceResult results={evidence.evidenceResults} onRerun={handleRerunEvidence} />}
            {idCard.results && (
              <IdCardResult
                results={idCard.results}
                onRerun={handleRerunIdCard}
                onLocate={idCard.locateInDocument}
              />
            )}
            {parties.result && (
              <PartiesResult
                result={parties.result}
                onInsert={handleInsertParties}
                onRerun={handleRerunParties}
              />
            )}
          </ActionPanel>
        </div>
      )}
    </div>
  );
}
