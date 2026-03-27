import { Users, RefreshCw, FileDown } from 'lucide-react';
import type { PartyExtraction } from '../types/parties';

interface Props {
  result: PartyExtraction;
  onInsert: () => void;
  onRerun: () => void;
}

const renderSection = (title: string, items: string[]) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
    <div className="text-xs font-semibold text-gray-700 mb-2">{title}</div>
    {items.length === 0 ? (
      <div className="text-xs text-gray-400">无</div>
    ) : (
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={`${title}-${idx}`} className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed bg-white border border-gray-200 rounded-md p-2">
            {item}
          </div>
        ))}
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

export default function PartiesResult({ result, onInsert, onRerun }: Props) {
  const total =
    result.plaintiffsNatural.length +
    result.defendantsNatural.length +
    result.defendantsLegal.length +
    result.defendantsInsurance.length +
    result.thirdPartyLegal.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center">
          <Users className="w-4 h-4 mr-2 text-blue-600" />
          诉状信息提取
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onInsert}
            className="px-3 py-1.5 flex items-center text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors font-medium cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 mr-1" />写入要素式诉状
          </button>
          <button
            onClick={onRerun}
            className="px-3 py-1.5 flex items-center text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors font-medium cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />重新提取
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4">共识别当事人 {total} 名</div>

      <div className="space-y-3">
        {renderSection('原告（自然人）', result.plaintiffsNatural)}
        {renderSection('被告（自然人）', result.defendantsNatural)}
        {renderSection('被告（法人）', result.defendantsLegal)}
        {renderSection('被告（保险公司）', result.defendantsInsurance)}
        {renderSection('第三人（法人）', result.thirdPartyLegal)}
        {renderText('诉讼请求', result.claimsText)}
        {renderText('交通事故发生情况', result.accidentFacts)}
        {renderText('交通事故责任认定', result.liabilityDetermination)}
        {renderText('机动车投保情况', result.insuranceInfo)}
        {renderSection('其他情况及法律依据', result.otherFacts)}
        {renderText('索赔清单', result.claimsList)}
      </div>
    </div>
  );
}
