import { useState, type ReactNode } from 'react';
import { ChevronDown, FileText, ListChecks, Users } from 'lucide-react';

import type { ElementalComplaintDraft } from './types';
import { LegalPartyPreview, NaturalPartyPreview } from './PartyPreview';

export default function ComplaintPreview({ draft }: { draft: ElementalComplaintDraft }) {
  return (
    <div className="space-y-3">
      <PreviewGroup title="当事人信息" icon={<Users className="h-4 w-4" />} defaultOpen>
        <NaturalPartyPreview title="原告" items={draft.plaintiffsNatural} />
        <NaturalPartyPreview title="自然人被告" items={draft.defendantsNatural} />
        <LegalPartyPreview title="法人被告" items={draft.defendantsLegal} />
        <LegalPartyPreview title="保险公司" items={draft.defendantsInsurance} />
        <LegalPartyPreview title="第三人" items={draft.thirdPartyLegal} />
      </PreviewGroup>

      <PreviewGroup title="诉讼请求与索赔清单" icon={<ListChecks className="h-4 w-4" />} defaultOpen>
        <TextPreview label="诉讼请求" value={draft.claimsText} />
        <TextPreview label="索赔清单" value={draft.claimsList} />
      </PreviewGroup>

      <PreviewGroup title="事实与理由" icon={<FileText className="h-4 w-4" />} defaultOpen>
        <TextPreview label="交通事故发生情况" value={draft.accidentFacts} />
        <TextPreview label="交通事故责任认定" value={draft.liabilityDetermination} />
        <TextPreview label="机动车投保情况" value={draft.insuranceInfo} />
        <TextPreview label="其他情况及法律依据" value={draft.otherFacts.join('\n\n')} />
      </PreviewGroup>
    </div>
  );
}

function PreviewGroup({
  title,
  icon,
  defaultOpen,
  children,
}: {
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="group rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-bold text-text-primary">{icon}{title}</span>
        <ChevronDown className="h-4 w-4 text-text-muted transition group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-gray-100 px-4 py-4">{children}</div>
    </details>
  );
}

function TextPreview({ label, value }: { label: string; value: string }) {
  return (
    <section>
      <h4 className="mb-1.5 text-xs font-semibold text-text-secondary">{label}</h4>
      <div className={`whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2.5 text-xs leading-5 ${value ? 'text-text-primary' : 'text-gray-400'}`}>
        {value || '未提取到'}
      </div>
    </section>
  );
}
