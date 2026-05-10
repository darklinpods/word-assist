import { IdCard, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import type { IdCardCheckResult } from '../utils/id-card';
import ResultActionButton from './common/ResultActionButton';
import ResultCard from './common/ResultCard';
import ResultEmpty from './common/ResultEmpty';

interface Props {
  results: IdCardCheckResult[];
  onRerun: () => void;
  onLocate: (id: string) => void;
}

export default function IdCardResult({ results, onRerun, onLocate }: Props) {
  const total = results.length;
  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = total - validCount;

  const actions = (
    <ResultActionButton onClick={onRerun} variant="gray">
      <RefreshCw className="w-3.5 h-3.5" />重新核查
    </ResultActionButton>
  );

  return (
    <ResultCard
      variant="card"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      title="身份证号核查"
      icon={<IdCard className="w-4 h-4 text-primary" />}
      actions={actions}
      titleTag="h2"
      titleClassName="text-sm font-semibold text-text-primary"
      headerClassName="mb-4"
    >
      {total === 0 ? (
        <ResultEmpty>未在文档中识别到身份证号（仅支持中国大陆 18 位身份证）。</ResultEmpty>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-center">
              <div className="text-xs text-emerald-700">合法</div>
              <div className="text-lg font-bold text-emerald-700">{validCount}</div>
            </div>
            <div className="flex-1 rounded-lg border border-red-200 bg-red-50 p-2.5 text-center">
              <div className="text-xs text-red-700">异常</div>
              <div className="text-lg font-bold text-red-700">{invalidCount}</div>
            </div>
            <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-center">
              <div className="text-xs text-text-secondary">合计</div>
              <div className="text-lg font-bold text-text-primary">{total}</div>
            </div>
          </div>

          <div className="space-y-3">
            {results.map((res) => (
              <div
                key={res.id}
                className={`p-3.5 rounded-lg border text-sm transition-all ${
                  res.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="font-mono font-bold text-text-primary">{res.masked}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      {res.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={res.isValid ? 'text-emerald-700' : 'text-red-700'}>
                        {res.isValid ? '合法' : '异常'}
                      </span>
                    </div>
                    {!res.isValid && (
                      <button
                        onClick={() => onLocate(res.id)}
                        className="px-2 py-0.5 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        定位
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-text-secondary space-x-2">
                  {res.province && <span>地区：{res.province}</span>}
                  {res.birthDate && <span>出生：{res.birthDate}</span>}
                  {res.gender && <span>性别：{res.gender}</span>}
                  {res.age !== null && <span>年龄：{res.age}</span>}
                </div>
                <div className={`mt-1 text-xs ${res.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                  {res.reason}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </ResultCard>
  );
}
