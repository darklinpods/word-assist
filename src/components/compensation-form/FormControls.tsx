import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function Label({ children }: { children: ReactNode }) {
  return <span className="text-[11px] text-gray-500 font-medium block mb-0.5">{children}</span>;
}

export function NumberInput({
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

export function RadioGroup<T extends string>({
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

export function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
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
