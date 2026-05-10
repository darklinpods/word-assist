import { PlusCircle, Trash2 } from 'lucide-react';

import type { Dependent } from '../../utils/compensation-calculator';
import type { UpdateDependent } from './types';
import { Label, NumberInput, Section } from './FormControls';

interface Props {
  dependents: Dependent[];
  onAddDependent: () => void;
  onRemoveDependent: (id: string) => void;
  onUpdateDependent: UpdateDependent;
}

export default function DependentsSection({
  dependents,
  onAddDependent,
  onRemoveDependent,
  onUpdateDependent,
}: Props) {
  return (
    <Section title="被扶养人（选填）" defaultOpen={false}>
      <div className="space-y-2">
        {dependents.map(dep => (
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
                className="text-sm border border-gray-200 rounded-md px-2 py-1 flex-1 mr-2 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-white"
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
          className="w-full py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-text-muted hover:border-primary/30 hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 mr-1" />
          添加被扶养人
        </button>
      </div>
    </Section>
  );
}
