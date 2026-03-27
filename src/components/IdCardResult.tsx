import { IdCard, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import type { IdCardCheckResult } from '../utils/id-card';

interface Props {
  results: IdCardCheckResult[];
  onRerun: () => void;
  onLocate: (id: string) => void;
}

export default function IdCardResult({ results, onRerun, onLocate }: Props) {
  const total = results.length;
  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = total - validCount;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 leading-normal animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center">
          <IdCard className="w-4 h-4 mr-2 text-blue-600" />
          身份证号核查
        </h2>
        <button onClick={onRerun}
          className="px-3 py-1.5 flex items-center text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors font-medium cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5 mr-1" />重新核查
        </button>
      </div>

      {total === 0 ? (
        <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
          未在文档中识别到身份证号（仅支持中国大陆 18 位身份证）。
        </div>
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
              <div className="text-xs text-gray-600">合计</div>
              <div className="text-lg font-bold text-gray-700">{total}</div>
            </div>
          </div>

          <div className="space-y-3">
            {results.map((res) => (
              <div
                key={res.id}
                className={`p-3.5 rounded-lg border text-sm transition-all ${
                  res.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="font-mono font-bold text-gray-800">{res.masked}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      {res.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={res.isValid ? 'text-green-700' : 'text-red-700'}>
                        {res.isValid ? '合法' : '异常'}
                      </span>
                    </div>
                    {!res.isValid && (
                      <button
                        onClick={() => onLocate(res.id)}
                        className="px-2 py-0.5 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        定位
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-700 space-x-2">
                  {res.province && <span>地区：{res.province}</span>}
                  {res.birthDate && <span>出生：{res.birthDate}</span>}
                  {res.gender && <span>性别：{res.gender}</span>}
                  {res.age !== null && <span>年龄：{res.age}</span>}
                </div>
                <div className={`mt-1 text-xs ${res.isValid ? 'text-green-700' : 'text-red-700'}`}>
                  {res.reason}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
