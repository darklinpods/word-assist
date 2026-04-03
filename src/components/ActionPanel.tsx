import { type ReactNode, useState } from 'react';
import { Loader2, ReceiptText, FileText, PaintbrushVertical } from 'lucide-react';
import type { PanelDefinition, PanelId } from '../panels/panels';

interface Props {
  hasText: boolean;
  isBusy: boolean;
  panels: PanelDefinition[];
  activePanel: PanelId | null;
  onSelectPanel: (panel: PanelId) => void;
  onOpenCalculator: () => void;
  onInsertTemplate: () => void;
  onFormatDocument: () => void;
  error: string;
  children?: ReactNode;
}

const ribbonBtn = (active: boolean, color: string) =>
  `relative group px-2.5 py-1.5 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5 text-[11px] leading-tight ${active ? color : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} disabled:opacity-40 disabled:cursor-not-allowed`;

const RibbonGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex items-center gap-1.5 pr-2 mr-2 border-r border-gray-200 last:border-r-0 last:mr-0 last:pr-0">
    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-full shrink-0">{title}</span>
    {children}
  </div>
);

type RibbonTab = 'ai' | 'calculator' | 'docs';

export default function ActionPanel({
  hasText, isBusy, panels, activePanel,
  onSelectPanel, onOpenCalculator, onInsertTemplate, onFormatDocument,
  error, children,
}: Props) {
  const [activeTab, setActiveTab] = useState<RibbonTab>('ai');
  const hasChildren = Array.isArray(children)
    ? children.some(child => child !== null && child !== false)
    : children !== null && children !== undefined && children !== false;
  const tabBtn = (tab: RibbonTab) =>
    `px-3 py-1.5 text-[11px] font-semibold rounded-t-md border border-b-0 transition-colors ${
      activeTab === tab
        ? 'bg-white text-gray-900 border-gray-200'
        : 'bg-gray-100 text-gray-500 border-transparent hover:text-gray-700'
    }`;
  const reviewPanels = panels.filter(panel => panel.group === 'review');
  const checkPanels = panels.filter(panel => panel.group === 'check');

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 功能分组：先宏观、再微观 */}
      <div className="px-3 pt-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-end gap-1">
          <button className={tabBtn('ai')} onClick={() => setActiveTab('ai')}>智能能力</button>
          <button className={tabBtn('calculator')} onClick={() => setActiveTab('calculator')}>计算器</button>
          <button className={tabBtn('docs')} onClick={() => setActiveTab('docs')}>文书工具</button>
        </div>
        <div className="bg-white border border-gray-200 rounded-b-md rounded-tr-md px-2 py-2">
          {activeTab === 'ai' && (
            <div className="flex items-center gap-2 flex-wrap">
              <RibbonGroup title="审查/核定">
                {reviewPanels.map(panel => {
                  const isActive = activePanel === panel.id || panel.isLoading;
                  const Icon = panel.icon;
                  return (
                    <button
                      key={panel.id}
                      onClick={() => onSelectPanel(panel.id)}
                      className={ribbonBtn(isActive, panel.activeClassName)}
                    >
                      {panel.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                      <span>{panel.label}</span>
                    </button>
                  );
                })}
              </RibbonGroup>

              <RibbonGroup title="核查/提取">
                {checkPanels.map(panel => {
                  const isActive = activePanel === panel.id || panel.isLoading;
                  const Icon = panel.icon;
                  return (
                    <button
                      key={panel.id}
                      onClick={() => onSelectPanel(panel.id)}
                      className={ribbonBtn(isActive, panel.activeClassName)}
                    >
                      {panel.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                      <span>{panel.label}</span>
                    </button>
                  );
                })}
              </RibbonGroup>
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="flex items-center gap-2">
              <RibbonGroup title="计算入口">
                <button onClick={onOpenCalculator}
                  className={ribbonBtn(false, '') + ' hover:text-amber-600 hover:bg-amber-50'}>
                  <ReceiptText className="w-4 h-4" />
                  <span>赔偿计算</span>
                </button>
              </RibbonGroup>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="flex items-center gap-2">
              <RibbonGroup title="文书">
                <button onClick={onInsertTemplate}
                  className={ribbonBtn(false, '') + ' hover:text-gray-700 hover:bg-gray-100'}>
                  <FileText className="w-4 h-4" />
                  <span>插入模板</span>
                </button>

                <button onClick={onFormatDocument}
                  className={ribbonBtn(false, '') + ' hover:text-emerald-600 hover:bg-emerald-50'}>
                  <PaintbrushVertical className="w-4 h-4" />
                  <span>格式整理</span>
                </button>
              </RibbonGroup>
            </div>
          )}
        </div>
      </div>

      {/* 输出区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-2.5 rounded-md border border-red-100">{error}</div>
        )}
        {!error && !hasChildren && !isBusy && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
            <div className="font-semibold text-gray-800 mb-1.5">开始处理</div>
            {!hasText ? (
              <div>请先在 Word 中选中诉状段落，然后点击上方“提取选中段落”。</div>
            ) : (
              <div>已获取文本，选择上方功能开始分析与写回。</div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
