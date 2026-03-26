import { useState } from 'react';
import { ChevronDown, ChevronRight, PlusCircle, Trash2 } from 'lucide-react';
import type { CaseParams, Dependent } from '../utils/compensation-calculator';

// ─── 共用子组件 ──────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] text-gray-500 font-medium block mb-0.5">{children}</span>;
}

function NumberInput({
  value,
  onChange,
  placeholder = '0',
  suffix,
  min = 0,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  suffix?: string;
  min?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center">
      <input
        type="number"
        min={min}
        step={step}
        value={value === 0 ? '' : value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 bg-white"
      />
      {suffix && <span className="ml-1 text-[11px] text-gray-400 whitespace-nowrap">{suffix}</span>}
    </div>
  );
}

function RadioGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            value === opt.value
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-gray-700">{title}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

// ─── 主组件 Props ────────────────────────────────────────────

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

// ─── 伤残等级选项 ────────────────────────────────────────────

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

// ─── 主表单组件 ───────────────────────────────────────────────

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
  const isInjury = params.caseType === 'injury';

  return (
    <div className="space-y-3">
      {/* ── 基本信息 ── */}
      <Section title="📋 基本信息">
        {/* 省份 */}
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

        {/* 年份 + 居民类型 */}
        <div className="grid grid-cols-2 gap-2">
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
            <Label>居民类型</Label>
            <RadioGroup
              value={params.residentType}
              options={[
                { value: 'urban', label: '城镇' },
                { value: 'rural', label: '农村' },
              ]}
              onChange={v => onUpdate('residentType', v)}
            />
          </div>
        </div>

        {/* 案件类型 */}
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

      {/* ── 伤者信息 ── */}
      <Section title="👤 伤者信息">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>年龄（岁）</Label>
            <NumberInput value={params.victimAge} onChange={v => onUpdate('victimAge', v)} min={1} />
          </div>

          {/* 伤残等级（仅伤残案件） */}
          {isInjury && (
            <div>
              <Label>伤残等级</Label>
              <select
                value={params.disabilityLevel ?? 'null'}
                onChange={e => {
                  const val = e.target.value;
                  onUpdate('disabilityLevel', val === 'null' ? null : Number(val));
                }}
                className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:border-indigo-400"
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

        {/* 赔偿年限 */}
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

      {/* ── 损失明细 ── */}
      <Section title="💰 损失明细">
        {/* 医疗费 */}
        <div>
          <Label>医疗费（发票总额）</Label>
          <NumberInput
            value={params.medicalExpense}
            onChange={v => onUpdate('medicalExpense', v)}
            suffix="元"
            step={0.01}
          />
        </div>

        {/* 住院 + 营养 */}
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

        {/* 误工费 */}
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

        {/* 护理 */}
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

        {/* 交通 + 鉴定 */}
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

        {/* 精神抚慰金 */}
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

        {/* 辅具费（仅伤残）*/}
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

      {/* ── 被扶养人 ── */}
      <Section title="👨‍👩‍👧 被扶养人（选填）" defaultOpen={false}>
        <div className="space-y-2">
          {params.dependents.map(dep => (
            <div
              key={dep.id}
              className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 space-y-2"
            >
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="称谓（如：子女、父亲）"
                  value={dep.name}
                  onChange={e => onUpdateDependent(dep.id, 'name', e.target.value)}
                  className="text-sm border border-gray-200 rounded-md px-2 py-1 flex-1 mr-2 focus:outline-none focus:border-indigo-400 bg-white"
                />
                <button
                  type="button"
                  onClick={() => onRemoveDependent(dep.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>年龄（岁）</Label>
                  <NumberInput
                    value={dep.age}
                    onChange={v => onUpdateDependent(dep.id, 'age', v)}
                    min={0}
                  />
                </div>
                <div>
                  <Label>其他供养人数</Label>
                  <NumberInput
                    value={dep.otherSupporters}
                    onChange={v => onUpdateDependent(dep.id, 'otherSupporters', v)}
                    suffix="人"
                    min={0}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={onAddDependent}
            className="w-full py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-indigo-300 hover:text-indigo-600 flex items-center justify-center transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            添加被扶养人
          </button>
        </div>
      </Section>

      {/* ── 错误提示 ── */}
      {error && (
        <div className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-md border border-red-100">
          {error}
        </div>
      )}

      {/* ── 计算按钮 ── */}
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
