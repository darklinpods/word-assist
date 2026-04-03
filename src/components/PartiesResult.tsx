import { Users, RefreshCw, FileDown } from 'lucide-react';
import type { PartyCheckItem, PartyExtraction, PartyRole } from '../types/parties';
import ResultActionButton from './common/ResultActionButton';
import ResultCard from './common/ResultCard';
import ResultEmpty from './common/ResultEmpty';

interface Props {
  result: PartyExtraction | null;
  onInsert: () => void;
  onRerun: () => void;
  rerunDisabled?: boolean;
  insertDisabled?: boolean;
}

const renderCheck = (check?: PartyCheckItem) => {
  if (!check) return null;
  const { missing, recommendedMissing, issues, ok } = check.completeness;
  const missingText = missing.length > 0 ? `缺少：${missing.join('、')}` : '';
  const recommendText = recommendedMissing.length > 0 ? `建议补充：${recommendedMissing.join('、')}` : '';
  const issueText = issues.length > 0 ? `问题：${issues.join('、')}` : '';

  const idStatus =
    check.kind === 'natural'
      ? check.idCheck?.present
        ? check.idCheck.isValid ? '✅ 有效' : '❌ 无效'
        : '— 未提供'
      : '';
  const birthMatch =
    check.kind === 'natural'
      ? check.idCheck?.birthDateMatches === null
        ? '— 未提供出生日期'
        : check.idCheck?.birthDateMatches
          ? '✅ 一致'
          : '❌ 不一致'
      : '';

  return (
    <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-[11px] text-gray-600 space-y-1">
      <div>完整度：{ok ? '✅ 完整' : `⚠️ ${[missingText, issueText].filter(Boolean).join('；')}`}</div>
      {recommendText && <div>{recommendText}</div>}
      {check.kind === 'natural' && (
        <>
          <div>身份证：{idStatus}</div>
          <div>出生日期匹配：{birthMatch}</div>
        </>
      )}
    </div>
  );
};

const renderSection = (
  title: PartyRole | string,
  items: string[],
  checks: PartyCheckItem[],
) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
    <div className="text-xs font-semibold text-gray-700 mb-2">{title}</div>
    {items.length === 0 ? (
      <div className="text-xs text-gray-400">无</div>
    ) : (
      <div className="space-y-2">
        {items.map((item, idx) => {
          const check = checks.find(c => c.role === title && c.index === idx);
          return (
            <div
              key={`${title}-${idx}`}
              className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed bg-white border border-gray-200 rounded-md p-2"
            >
              {item}
              {renderCheck(check)}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const renderText = (title: string, text: string) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
    <div className="text-xs font-semibold text-gray-700 mb-2">{title}</div>
    {text ? (
      <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed bg-white border border-gray-200 rounded-md p-2">{text}</div>
    ) : (
      <div className="text-xs text-gray-400">无</div>
    )}
  </div>
);

export default function PartiesResult({
  result,
  onInsert,
  onRerun,
  rerunDisabled = false,
  insertDisabled = false,
}: Props) {
  const insertButtonDisabled = !result || insertDisabled;
  const actions = (
    <div className="flex items-center gap-2">
      <ResultActionButton onClick={onInsert} disabled={insertButtonDisabled} variant="blue">
        <FileDown className="w-3.5 h-3.5 mr-1" />写入要素式诉状
      </ResultActionButton>
      <ResultActionButton onClick={onRerun} disabled={rerunDisabled} variant="gray">
        <RefreshCw className="w-3.5 h-3.5 mr-1" />重新提取
      </ResultActionButton>
    </div>
  );

  if (!result) {
    return (
      <ResultCard
        variant="card"
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
        title={
          <>
            诉状信息提取
            <span className="ml-2 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              含完整度核查
            </span>
          </>
        }
        icon={<Users className="w-4 h-4 mr-2 text-blue-600" />}
        actions={actions}
        titleTag="h2"
        titleClassName="text-sm font-semibold text-gray-800"
        headerClassName="mb-4"
      >
        <ResultEmpty>暂无提取结果。点击“重新提取”开始。</ResultEmpty>
      </ResultCard>
    );
  }
  const total =
    result.plaintiffsNatural.length +
    result.defendantsNatural.length +
    result.defendantsLegal.length +
    result.defendantsInsurance.length +
    result.thirdPartyLegal.length;
  const checks = result.partyChecks || [];
  const okCount = checks.filter(c => c.completeness.ok).length;
  const issueCount = checks.length - okCount;

  return (
    <ResultCard
      variant="card"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      title={
        <>
          诉状信息提取
          <span className="ml-2 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            含完整度核查
          </span>
        </>
      }
      icon={<Users className="w-4 h-4 mr-2 text-blue-600" />}
      actions={actions}
      titleTag="h2"
      titleClassName="text-sm font-semibold text-gray-800"
      headerClassName="mb-4"
    >
      <div className="text-xs text-gray-500 mb-4">
        共识别当事人 {total} 名
        {checks.length > 0 && (
          <span className="ml-2">
            · 完整 {okCount} · 需补充 {issueCount}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {renderSection('原告（自然人）', result.plaintiffsNatural, checks)}
        {renderSection('被告（自然人）', result.defendantsNatural, checks)}
        {renderSection('被告（法人）', result.defendantsLegal, checks)}
        {renderSection('被告（保险公司）', result.defendantsInsurance, checks)}
        {renderSection('第三人（法人）', result.thirdPartyLegal, checks)}
        {renderText('诉讼请求', result.claimsText)}
        {renderText('交通事故发生情况', result.accidentFacts)}
        {renderText('交通事故责任认定', result.liabilityDetermination)}
        {renderText('机动车投保情况', result.insuranceInfo)}
        {renderSection('其他情况及法律依据', result.otherFacts, checks)}
        {renderText('索赔清单', result.claimsList)}
      </div>
    </ResultCard>
  );
}
