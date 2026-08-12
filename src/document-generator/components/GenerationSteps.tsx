import { Check } from 'lucide-react';

import type { GenerationStep } from '../core/types';

const steps = [
  { number: 1, label: '读取诉状' },
  { number: 2, label: '查看要素' },
  { number: 3, label: '生成文书' },
];

function getActiveIndex(step: GenerationStep): number {
  if (step === 'idle' || step === 'reading' || step === 'extracting') return 0;
  if (step === 'previewing' || step === 'error') return 1;
  return 2;
}

export default function GenerationSteps({ step }: { step: GenerationStep }) {
  const activeIndex = getActiveIndex(step);

  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="生成进度">
      {steps.map((item, index) => {
        const completed = index < activeIndex || step === 'completed';
        const active = index === activeIndex && step !== 'completed';
        return (
          <li key={item.number} className="flex min-w-0 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                completed
                  ? 'bg-emerald-600 text-white'
                  : active
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {completed ? <Check className="h-3.5 w-3.5" /> : item.number}
            </span>
            <span className={`truncate text-xs font-semibold ${active ? 'text-primary' : 'text-text-secondary'}`}>
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
