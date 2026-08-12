import type { ReactNode } from 'react';

import type { LegalEntity, NaturalPerson } from './types';

function DisplayField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold text-text-muted">{label}</div>
      <div className={`mt-0.5 break-words text-xs leading-5 ${value ? 'text-text-primary' : 'text-gray-400'}`}>
        {value || '未提取到'}
      </div>
    </div>
  );
}

export function NaturalPartyPreview({ title, items }: { title: string; items: NaturalPerson[] }) {
  return (
    <PartySection title={title} count={items.length}>
      {items.length === 0 ? <EmptyParty /> : items.map((person, index) => (
        <article key={person.id} className="rounded-lg border border-gray-200 bg-gray-50/70 p-3">
          <div className="text-xs font-semibold text-text-primary">{title}{index + 1}</div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
            <DisplayField label="姓名" value={person.name} />
            <DisplayField label="性别" value={person.gender} />
            <DisplayField label="民族" value={person.nationality} />
            <DisplayField label="出生日期" value={person.birthDate} />
            <div className="col-span-2"><DisplayField label="户籍/住址" value={person.address} /></div>
            <div className="col-span-2"><DisplayField label="公民身份号码" value={person.idNumber} /></div>
            <div className="col-span-2"><DisplayField label="联系电话" value={person.phone} /></div>
          </div>
        </article>
      ))}
    </PartySection>
  );
}

export function LegalPartyPreview({ title, items }: { title: string; items: LegalEntity[] }) {
  return (
    <PartySection title={title} count={items.length}>
      {items.length === 0 ? <EmptyParty /> : items.map((entity, index) => (
        <article key={entity.id} className="rounded-lg border border-gray-200 bg-gray-50/70 p-3">
          <div className="text-xs font-semibold text-text-primary">{title}{index + 1}</div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
            <div className="col-span-2"><DisplayField label="名称" value={entity.name} /></div>
            <div className="col-span-2"><DisplayField label="住所地" value={entity.address} /></div>
            <div className="col-span-2"><DisplayField label="统一社会信用代码" value={entity.creditCode} /></div>
            <DisplayField label="法人类型" value={entity.entityType} />
            <DisplayField label="法定代表人" value={entity.legalRepresentative} />
            <div className="col-span-2"><DisplayField label="联系人" value={entity.contact} /></div>
          </div>
        </article>
      ))}
    </PartySection>
  );
}

function PartySection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h4 className="text-xs font-bold text-text-primary">
        {title} <span className="font-normal text-text-muted">({count})</span>
      </h4>
      {children}
    </section>
  );
}

function EmptyParty() {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 px-3 py-3 text-center text-xs text-text-muted">
      未提取到
    </div>
  );
}
