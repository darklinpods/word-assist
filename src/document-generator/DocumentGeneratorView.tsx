import {
  CheckCircle2,
  FileOutput,
  FileSearch,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import OfficeWarning from '../components/OfficeWarning';
import EvidenceResult from '../components/EvidenceResult';
import { useEvidenceCheck } from '../hooks/useEvidenceCheck';
import { useOfficeEnvironment } from '../utils/office-env';
import ComplaintPreview from './complaint/ComplaintPreview';
import GenerationSteps from './components/GenerationSteps';
import ValidationSummary from './components/ValidationSummary';
import { useDocumentGeneration } from './core/useDocumentGeneration';
import { getDocumentDefinition } from './registry';

const primaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-cta px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cta-hover disabled:cursor-not-allowed disabled:bg-gray-300 cursor-pointer';

const complaintDefinition = getDocumentDefinition('traffic-accident-elemental-complaint');

export default function DocumentGeneratorView() {
  const officeEnv = useOfficeEnvironment();
  const generation = useDocumentGeneration(complaintDefinition);
  const evidence = useEvidenceCheck();
  const isExtracting = generation.step === 'reading' || generation.step === 'extracting';
  const isGenerating = generation.step === 'generating';

  const handleGenerate = async () => {
    const errorCount = generation.issues.filter((item) => item.severity === 'error').length;
    if (errorCount > 0) {
      const shouldContinue = window.confirm(
        `当前还有 ${errorCount} 项必填信息缺失或格式错误。仍要继续生成吗？`,
      );
      if (!shouldContinue) return;
    }

    await generation.generate((target) => window.confirm(target.message));
  };

  const handleEvidenceCheck = () => {
    void evidence.check(generation.sourceText);
  };

  const handleExtract = () => {
    evidence.reset();
    void generation.extract();
  };

  const handleReset = () => {
    evidence.reset();
    generation.reset();
  };

  return (
    <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-3xl space-y-4 px-3 py-4 sm:px-5">
        <OfficeWarning officeEnv={officeEnv} />

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              {complaintDefinition.title}
            </div>
            <p className="text-xs leading-5 text-text-secondary">
              {complaintDefinition.description}
            </p>
          </div>
          <GenerationSteps step={generation.step} />
        </section>

        {generation.error ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-error">
            <span className="font-semibold">操作失败：</span>{generation.error}
          </div>
        ) : null}

        {!generation.draft ? (
          <section className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSearch className="h-6 w-6" />
            </div>
            <h2 className="mt-3 text-lg font-bold text-text-primary">读取当前传统式起诉状</h2>
            <p className="mx-auto mt-1.5 max-w-lg text-xs leading-5 text-text-secondary">
              无需选择文字。插件将读取当前 Word 文档全文，提取当事人、诉讼请求、事实理由和索赔清单。
            </p>
            <button
              type="button"
              onClick={handleExtract}
              disabled={!officeEnv.isWordReady || isExtracting}
              className={`${primaryButtonClassName} mt-5 w-full sm:w-auto`}
            >
              {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              {generation.step === 'reading'
                ? '正在读取 Word 文档…'
                : generation.step === 'extracting'
                  ? '正在提取诉状要素…'
                  : '读取当前诉状并提取'}
            </button>
          </section>
        ) : (
          <>
            <section className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-text-primary">查看提取结果</h2>
                  <p className="mt-0.5 text-xs text-text-muted">已读取 {generation.sourceText.length.toLocaleString('zh-CN')} 个字符；以下内容将直接写入要素式起诉状。</p>
                </div>
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={isExtracting || isGenerating}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isExtracting ? 'animate-spin' : ''}`} />重新提取
                </button>
              </div>
            </section>

            <ValidationSummary issues={generation.issues} />

            <ComplaintPreview draft={generation.draft} />

            <details className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-text-primary">
                辅助检查：证据清单
                <span className="ml-2 text-[10px] font-normal text-text-muted">不影响文书生成</span>
              </summary>
              <div className="border-t border-gray-100 p-4">
                {evidence.error ? (
                  <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-error">
                    {evidence.error}
                  </div>
                ) : null}
                {evidence.evidenceResults ? (
                  <EvidenceResult
                    results={evidence.evidenceResults}
                    onRerun={handleEvidenceCheck}
                    rerunDisabled={evidence.isChecking || isGenerating}
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-xs leading-5 text-text-secondary">根据读取到的原诉状检查证据提及情况，并提供缺失证据取得建议。</p>
                    <button
                      type="button"
                      onClick={handleEvidenceCheck}
                      disabled={evidence.isChecking || isGenerating}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 cursor-pointer"
                    >
                      {evidence.isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSearch className="h-3.5 w-3.5" />}
                      {evidence.isChecking ? '正在核查证据…' : '开始证据核查'}
                    </button>
                  </div>
                )}
              </div>
            </details>

            {generation.result ? (
              <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <h2 className="text-sm font-bold text-emerald-900">要素式起诉状已生成</h2>
                    <p className="mt-1 text-xs leading-5 text-emerald-800">
                      已插入一份新模板并写入展示的全部内容，原有文档内容未被覆盖。
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="sticky bottom-0 z-10 -mx-3 border-t border-gray-200 bg-white/95 px-3 py-3 shadow-[0_-6px_18px_rgba(15,23,42,0.06)] backdrop-blur sm:-mx-5 sm:px-5">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />重新开始
                </button>
                <button type="button" onClick={handleGenerate} disabled={isGenerating} className={primaryButtonClassName}>
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileOutput className="h-4 w-4" />}
                  {isGenerating ? '正在生成…' : generation.result ? '重新生成' : '生成要素式起诉状'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
