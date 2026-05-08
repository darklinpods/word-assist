import { useState } from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

import { insertFullExtractionIntoTemplate, insertTemplate, formatTraditionalComplaint } from './utils/office-utils';
import { useDocumentReader } from './hooks/useDocumentReader';
import { useAnalysis } from './hooks/useAnalysis';
import { useClaimsVerification } from './hooks/useClaimsVerification';
import { useEvidenceCheck } from './hooks/useEvidenceCheck';
import { useCompensationCalculator } from './hooks/useCompensationCalculator';
import { usePartyExtraction } from './hooks/usePartyExtraction';

import Header from './components/Header';
import OfficeWarning from './components/OfficeWarning';
import ActionPanel from './components/ActionPanel';
import AnalysisResult from './components/AnalysisResult';
import ClaimsResult from './components/ClaimsResult';
import EvidenceResult from './components/EvidenceResult';
import PartiesResult from './components/PartiesResult';
import CompensationForm from './components/CompensationForm';
import CompensationResult from './components/CompensationResult';
import { buildPanels, type PanelId } from './panels/panels';
import { getErrorMessage } from './utils/error';
import { useOfficeEnvironment } from './utils/office-env';

type View = 'main' | 'calculator';

export default function App() {
  const [view, setView] = useState<View>('main');
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [partyInsertError, setPartyInsertError] = useState('');
  const [templateInsertError, setTemplateInsertError] = useState('');
  const [isInsertingParties, setIsInsertingParties] = useState(false);

  const reader = useDocumentReader();
  const analysis = useAnalysis();
  const claims = useClaimsVerification();
  const evidence = useEvidenceCheck();
  const parties = usePartyExtraction();
  const calc = useCompensationCalculator();
  const officeEnv = useOfficeEnvironment();

  const isBusy =
    analysis.isLoading ||
    claims.isVerifying ||
    evidence.isChecking ||
    parties.isExtracting;

  // 结果区内"重新执行"按钮
  const handleRerunAnalyze = () => { analysis.analyze(reader.selectedText); };
  const handleRerunClaims = () => { claims.verify(reader.selectedText); };
  const handleRerunEvidence = () => { evidence.check(reader.selectedText); };
  const handleRerunParties = () => {
    setPartyInsertError('');
    parties.extract();
  };
  const handleInsertParties = async () => {
    if (!parties.result || isInsertingParties) return;
    try {
      setIsInsertingParties(true);
      setPartyInsertError('');
      await insertFullExtractionIntoTemplate(parties.result);
    } catch (err: unknown) {
      setPartyInsertError('写入要素式诉状失败: ' + getErrorMessage(err));
    } finally {
      setIsInsertingParties(false);
    }
  };

  const handleInsertTemplate = async () => {
    try {
      setTemplateInsertError('');
      await insertTemplate();
    } catch (err: unknown) {
      setTemplateInsertError('插入模板失败: ' + getErrorMessage(err));
    }
  };

  const panels = buildPanels([
    {
      id: 'analysis',
      isLoading: analysis.isLoading,
      error: analysis.error,
      render: () => (
        <AnalysisResult
          result={analysis.analysisResult}
          onInsert={analysis.insertToDocument}
          onRerun={handleRerunAnalyze}
          rerunDisabled={isBusy || !reader.selectedText}
          insertDisabled={!analysis.analysisResult}
        />
      ),
    },
    {
      id: 'claims',
      isLoading: claims.isVerifying,
      error: claims.error,
      render: () => (
        <ClaimsResult
          results={claims.verificationResults}
          totalSummary={claims.totalSummary}
          fixingIndexes={claims.fixingIndexes}
          fixedIndexes={claims.fixedIndexes}
          fixAllStatus={claims.fixAllStatus}
          fixAllMessage={claims.fixAllMessage}
          onFixOne={claims.fixOne}
          onFixAll={claims.fixAll}
          onRerun={handleRerunClaims}
          rerunDisabled={isBusy || !reader.selectedText}
        />
      ),
    },
    {
      id: 'evidence',
      isLoading: evidence.isChecking,
      error: evidence.error,
      render: () => (
        <EvidenceResult
          results={evidence.evidenceResults}
          onRerun={handleRerunEvidence}
          rerunDisabled={isBusy || !reader.selectedText}
        />
      ),
    },
    {
      id: 'parties',
      isLoading: parties.isExtracting,
      error: partyInsertError || parties.error,
      render: () => (
        <PartiesResult
          result={parties.result}
          onInsert={handleInsertParties}
          onRerun={handleRerunParties}
          rerunDisabled={isBusy}
          insertDisabled={isInsertingParties || !parties.result}
        />
      ),
    },
  ]);

  const activeError = activePanel
    ? panels.find(panel => panel.id === activePanel)?.error ?? ''
    : '';

  const topError = templateInsertError || reader.error || activeError;

  const activePanelRender = activePanel
    ? panels.find(panel => panel.id === activePanel)?.render()
    : null;

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
          <OfficeWarning officeEnv={officeEnv} />

          <div className="px-3 pt-3">
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
              流程：1 提取文本 → 2 选择功能 → 3 查看结果/写回
            </div>
          </div>

          {/* 读取文档工具栏 */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200">
            <button onClick={reader.readSelection}
              disabled={!officeEnv.isOfficeReady}
              title={officeEnv.isOfficeReady ? '从当前 Word 选区读取文本' : officeEnv.message}
              className="relative group flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-gray-100 disabled:border-gray-200 disabled:hover:bg-gray-100">
              <FileText className="w-4 h-4" />
              提取选中段落
            </button>
            {reader.selectedText && (
              <span className="text-xs text-gray-400 truncate max-w-[200px]">{reader.selectedText.slice(0, 40)}…</span>
            )}
          </div>

          <ActionPanel
            hasText={!!reader.selectedText}
            isBusy={isBusy}
            panels={panels}
            activePanel={activePanel}
            onSelectPanel={setActivePanel}
            onOpenCalculator={() => setView('calculator')}
            onInsertTemplate={handleInsertTemplate}
            onFormatDocument={formatTraditionalComplaint}
            error={topError}
          >
            {activePanelRender}
          </ActionPanel>
        </div>
      )}
    </div>
  );
}
