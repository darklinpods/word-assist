import { ArrowLeft, Calculator, Loader2, Wand2 } from 'lucide-react';

import type { useCompensationCalculator } from '../hooks/useCompensationCalculator';
import CompensationForm from '../components/CompensationForm';
import CompensationResult from '../components/CompensationResult';

interface Props {
  calculator: ReturnType<typeof useCompensationCalculator>;
  onBack: () => void;
}

export default function CalculatorView({ calculator, onBack }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <button
        onClick={onBack}
        className="flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />返回主界面
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-text-primary font-heading flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-primary" />赔偿金额计算器
          </h2>
          <button
            type="button"
            onClick={calculator.prefillFromComplaint}
            disabled={calculator.isPrefilling}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
          >
            {calculator.isPrefilling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            {calculator.isPrefilling ? '识别中' : '从诉状填入并计算'}
          </button>
        </div>

        {(calculator.prefilledFields.length > 0 || calculator.prefillWarnings.length > 0) && (
          <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
            {calculator.prefilledFields.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold">已填入：</span>
                {calculator.prefilledFields.map(field => (
                  <span key={field} className="rounded-full bg-white/70 px-2 py-0.5 text-amber-700 border border-amber-100">
                    {field}
                  </span>
                ))}
              </div>
            )}
            {calculator.prefillWarnings.length > 0 && (
              <ul className="mt-2 space-y-1">
                {calculator.prefillWarnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>• {warning}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <CompensationForm
          params={calculator.params}
          availableProvinces={calculator.availableProvinces}
          availableYears={calculator.availableYears}
          autoCompensationYears={calculator.autoCompensationYears}
          onUpdate={calculator.updateParam}
          onUpdateProvince={calculator.updateProvince}
          onAddDependent={calculator.addDependent}
          onRemoveDependent={calculator.removeDependent}
          onUpdateDependent={calculator.updateDependent}
          onCalculate={calculator.calculate}
          error={calculator.result ? '' : calculator.error}
        />
        {calculator.result && (
          <CompensationResult
            result={calculator.result}
            params={calculator.params}
            isExporting={calculator.isExporting}
            onExport={calculator.exportToWord}
          />
        )}
        {calculator.error && calculator.result && (
          <div className="mt-3 text-error text-sm bg-red-50 p-2.5 rounded-md border border-red-100">
            {calculator.error}
          </div>
        )}
      </div>
    </div>
  );
}
