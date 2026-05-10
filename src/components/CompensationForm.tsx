import type { CaseParams, Dependent } from '../utils/compensation-calculator';
import BasicInfoSection from './compensation-form/BasicInfoSection';
import DependentsSection from './compensation-form/DependentsSection';
import LossSection from './compensation-form/LossSection';
import VictimSection from './compensation-form/VictimSection';

interface Props {
  params: CaseParams;
  availableProvinces: string[];
  availableYears: string[];
  autoCompensationYears: number;
  onUpdate: <K extends keyof CaseParams>(key: K, value: CaseParams[K]) => void;
  onUpdateProvince: (province: string) => void;
  onAddDependent: () => void;
  onRemoveDependent: (id: string) => void;
  onUpdateDependent: <K extends keyof Dependent>(id: string, key: K, value: Dependent[K]) => void;
  onCalculate: () => void;
  error: string;
}

export default function CompensationForm({
  params,
  availableProvinces,
  availableYears,
  autoCompensationYears,
  onUpdate,
  onUpdateProvince,
  onAddDependent,
  onRemoveDependent,
  onUpdateDependent,
  onCalculate,
  error,
}: Props) {
  return (
    <div className="space-y-3">
      <BasicInfoSection
        params={params}
        availableProvinces={availableProvinces}
        availableYears={availableYears}
        onUpdate={onUpdate}
        onUpdateProvince={onUpdateProvince}
      />
      <VictimSection
        params={params}
        autoCompensationYears={autoCompensationYears}
        onUpdate={onUpdate}
      />
      <LossSection params={params} onUpdate={onUpdate} />
      <DependentsSection
        dependents={params.dependents}
        onAddDependent={onAddDependent}
        onRemoveDependent={onRemoveDependent}
        onUpdateDependent={onUpdateDependent}
      />

      {error && (
        <div className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-md border border-red-100">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onCalculate}
        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center"
      >
        立即计算
      </button>
    </div>
  );
}
