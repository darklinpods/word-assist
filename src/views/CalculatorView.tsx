import { ArrowLeft } from 'lucide-react';

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
        className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />返回主界面
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">🧮 赔偿金额计算器</h2>
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
          <div className="mt-3 text-red-500 text-sm bg-red-50 p-2.5 rounded-md border border-red-100">
            {calculator.error}
          </div>
        )}
      </div>
    </div>
  );
}
