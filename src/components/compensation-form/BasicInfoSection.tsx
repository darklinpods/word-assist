import type { CaseParams } from '../../utils/compensation-calculator';
import type { UpdateCaseParam } from './types';
import { Label, RadioGroup, Section } from './FormControls';

interface Props {
  params: CaseParams;
  availableProvinces: string[];
  availableYears: string[];
  onUpdate: UpdateCaseParam;
  onUpdateProvince: (province: string) => void;
}

export default function BasicInfoSection({
  params,
  availableProvinces,
  availableYears,
  onUpdate,
  onUpdateProvince,
}: Props) {
  return (
    <Section title="📋 基本信息">
      <div>
        <Label>省份</Label>
        <select
          value={params.province}
          onChange={e => onUpdateProvince(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:border-indigo-400"
        >
          {availableProvinces.map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <Label>适用年份</Label>
        <select
          value={params.year}
          onChange={e => onUpdate('year', e.target.value)}
          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:border-indigo-400"
        >
          {availableYears.map(y => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      <div>
        <Label>案件类型</Label>
        <RadioGroup
          value={params.caseType}
          options={[
            { value: 'injury', label: '伤残' },
            { value: 'death', label: '死亡' },
          ]}
          onChange={v => onUpdate('caseType', v)}
        />
      </div>
    </Section>
  );
}
