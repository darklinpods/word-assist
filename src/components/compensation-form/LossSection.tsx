import type { CaseParams } from '../../utils/compensation-calculator';
import type { UpdateCaseParam } from './types';
import { Label, NumberInput, RadioGroup, Section } from './FormControls';

interface Props {
  params: CaseParams;
  onUpdate: UpdateCaseParam;
}

export default function LossSection({ params, onUpdate }: Props) {
  const isInjury = params.caseType === 'injury';

  return (
    <Section title="损失明细">
      <div>
        <Label>医疗费（发票总额）</Label>
        <NumberInput
          value={params.medicalExpense}
          onChange={v => onUpdate('medicalExpense', v)}
          suffix="元"
          step={0.01}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>住院天数</Label>
          <NumberInput
            value={params.hospitalizationDays}
            onChange={v => onUpdate('hospitalizationDays', v)}
            suffix="天"
          />
        </div>
        <div>
          <Label>营养期天数</Label>
          <NumberInput
            value={params.nutritionDays}
            onChange={v => onUpdate('nutritionDays', v)}
            suffix="天"
          />
        </div>
      </div>

      <div>
        <Label>误工费计算方式</Label>
        <RadioGroup
          value={params.lostWageMode}
          options={[
            { value: 'actual', label: '实际收入' },
            { value: 'standard', label: '省服务业标准' },
            { value: 'none', label: '不主张' },
          ]}
          onChange={v => onUpdate('lostWageMode', v)}
        />
      </div>

      {params.lostWageMode !== 'none' && (
        <div className="grid grid-cols-2 gap-2">
          {params.lostWageMode === 'actual' && (
            <div>
              <Label>月收入</Label>
              <NumberInput
                value={params.monthlyIncome}
                onChange={v => onUpdate('monthlyIncome', v)}
                suffix="元"
                step={0.01}
              />
            </div>
          )}
          <div>
            <Label>误工天数</Label>
            <NumberInput
              value={params.lostWageDays}
              onChange={v => onUpdate('lostWageDays', v)}
              suffix="天"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>护理天数</Label>
          <NumberInput
            value={params.nursingDays}
            onChange={v => onUpdate('nursingDays', v)}
            suffix="天"
          />
        </div>
        <div>
          <Label>护理人数</Label>
          <NumberInput
            value={params.nursingPersons}
            onChange={v => onUpdate('nursingPersons', Math.max(1, v))}
            suffix="人"
            min={1}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>交通费</Label>
          <NumberInput
            value={params.transportFee}
            onChange={v => onUpdate('transportFee', v)}
            suffix="元"
            step={0.01}
          />
        </div>
        <div>
          <Label>鉴定费</Label>
          <NumberInput
            value={params.assessmentFee}
            onChange={v => onUpdate('assessmentFee', v)}
            suffix="元"
            step={0.01}
          />
        </div>
      </div>

      {(params.caseType === 'death' || params.disabilityLevel !== null) && (
        <div>
          <Label>精神损害抚慰金（酌情）</Label>
          <NumberInput
            value={params.mentalDistressFee}
            onChange={v => onUpdate('mentalDistressFee', v)}
            suffix="元"
            step={100}
          />
        </div>
      )}

      {isInjury && (
        <div>
          <Label>残疾辅助器具费</Label>
          <NumberInput
            value={params.assistiveDeviceFee}
            onChange={v => onUpdate('assistiveDeviceFee', v)}
            suffix="元"
            step={0.01}
          />
        </div>
      )}
    </Section>
  );
}
