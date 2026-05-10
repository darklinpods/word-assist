import type { CaseParams } from '../../utils/compensation-calculator';
import type { UpdateCaseParam } from './types';
import { Label, NumberInput, Section } from './FormControls';

const DISABILITY_LEVELS = [
  { value: null, label: '无伤残' },
  { value: 1, label: '一级（100%）' },
  { value: 2, label: '二级（90%）' },
  { value: 3, label: '三级（80%）' },
  { value: 4, label: '四级（70%）' },
  { value: 5, label: '五级（60%）' },
  { value: 6, label: '六级（50%）' },
  { value: 7, label: '七级（40%）' },
  { value: 8, label: '八级（30%）' },
  { value: 9, label: '九级（20%）' },
  { value: 10, label: '十级（10%）' },
];

interface Props {
  params: CaseParams;
  autoCompensationYears: number;
  onUpdate: UpdateCaseParam;
}

export default function VictimSection({ params, autoCompensationYears, onUpdate }: Props) {
  const isInjury = params.caseType === 'injury';

  return (
    <Section title="伤者信息">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>年龄（岁）</Label>
          <NumberInput value={params.victimAge} onChange={v => onUpdate('victimAge', v)} min={1} />
        </div>

        {isInjury && (
          <div>
            <Label>伤残等级</Label>
            <select
              value={params.disabilityLevel ?? 'null'}
              onChange={e => {
                const val = e.target.value;
                onUpdate('disabilityLevel', val === 'null' ? null : Number(val));
              }}
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-text-primary bg-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            >
              {DISABILITY_LEVELS.map(opt => (
                <option key={String(opt.value)} value={opt.value === null ? 'null' : opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <Label>
          赔偿年限（自动推算：{autoCompensationYears} 年，可手动覆盖）
        </Label>
        <NumberInput
          value={params.compensationYearsOverride ?? 0}
          onChange={v => onUpdate('compensationYearsOverride', v > 0 ? v : null)}
          placeholder={String(autoCompensationYears)}
          suffix="年"
          min={1}
        />
      </div>
    </Section>
  );
}
