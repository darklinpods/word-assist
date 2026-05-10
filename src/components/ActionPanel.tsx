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
  `relative group px-2.5 py-1.5 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5 text-[11px] leading-tight ${
    active
      ? 'bg-primary/10 text-primary font-semibold'
      : 'text-text-secondary hover:text-primary hover:bg-primary/5'
  } disabled:opacity-40 disabled:cursor-not-allowed`;

const RibbonGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex items-center gap-1.5 pr-2 mr-2 border-r border-gray-200 last:border-r-0 last:mr-0 last:pr-0">
    <span className="text-[10px] text-text-muted bg-gray-100 px-2 py-1 rounded-full shrink-0 font-medium">{title}</span>
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
    `relative px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer ${
      activeTab === tab
        ? 'text-primary'
        : 'text-text-muted hover:text-text-secondary'
    }`;

  const reviewPanels = panels.filter(panel => panel.group === 'review');
  const checkPanels = panels.filter(panel => panel.group === 'check');

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tab bar */}
      <div className="px-3 pt-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-end gap-0">
          {(['ai', 'calculator', 'docs'] as RibbonTab[]).map(tab => (
            <button
              key={tab}
              className={tabBtn(tab)}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'ai' ? '智能能力' : tab === 'calculator' ? '计算器' : '文书工具'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-b-md rounded-tr-md px-2 py-2 -ml-[1px]">
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
                      {panel.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
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
                      {panel.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
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
                <button
                  onClick={onOpenCalculator}
                  className={ribbonBtn(false, '') + ' hover:text-cta hover:bg-amber-50'}
                >
                  <ReceiptText className="w-4 h-4" />
                  <span>赔偿计算</span>
                </button>
              </RibbonGroup>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="flex items-center gap-2">
              <RibbonGroup title="文书">
                <button
                  onClick={onInsertTemplate}
                  className={ribbonBtn(false, '') + ' hover:text-primary hover:bg-primary/5'}
                >
                  <FileText className="w-4 h-4" />
                  <span>插入模板</span>
                </button>

                <button
                  onClick={onFormatDocument}
                  className={ribbonBtn(false, '') + ' hover:text-emerald-600 hover:bg-emerald-50'}
                >
                  <PaintbrushVertical className="w-4 h-4" />
                  <span>格式整理</span>
                </button>
              </RibbonGroup>
            </div>
          )}
        </div>
      </div>

      {/* Output area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="text-error text-sm bg-red-50 p-2.5 rounded-md border border-red-100">{error}</div>
        )}
        {!error && !hasChildren && !isBusy && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-text-secondary shadow-sm">
            <div className="font-semibold text-text-primary mb-1.5 font-heading text-base">开始处理</div>
            {!hasText ? (
              <div>请先在 Word 中选中诉状段落，然后点击上方"提取选中段落"。</div>
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
