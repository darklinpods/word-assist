import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Wand2, Calculator, ClipboardList, Users } from 'lucide-react';

export type PanelId = 'analysis' | 'claims' | 'evidence' | 'parties';
export type PanelGroup = 'review' | 'check';

interface PanelMeta {
  label: string;
  group: PanelGroup;
  icon: LucideIcon;
  activeClassName: string;
}

const PANEL_META: Record<PanelId, PanelMeta> = {
  analysis: {
    label: '文本审查',
    group: 'review',
    icon: Wand2,
    activeClassName: 'text-indigo-600 bg-indigo-50',
  },
  claims: {
    label: '索赔核定',
    group: 'review',
    icon: Calculator,
    activeClassName: 'text-teal-600 bg-teal-50',
  },
  evidence: {
    label: '证据核查',
    group: 'check',
    icon: ClipboardList,
    activeClassName: 'text-violet-600 bg-violet-50',
  },
  parties: {
    label: '具体信息提取',
    group: 'check',
    icon: Users,
    activeClassName: 'text-sky-600 bg-sky-50',
  },
};

export interface PanelDefinition extends PanelMeta {
  id: PanelId;
  isLoading: boolean;
  error: string;
  render: () => ReactNode;
}

interface PanelRuntime {
  id: PanelId;
  isLoading: boolean;
  error: string;
  render: () => ReactNode;
}

export function buildPanels(runtimePanels: PanelRuntime[]): PanelDefinition[] {
  return runtimePanels.map(panel => ({
    ...PANEL_META[panel.id],
    ...panel,
  }));
}
