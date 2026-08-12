import { FilePenLine, Settings } from 'lucide-react';

interface Props {
  onOpenAiSetup: () => void;
  showSettings: boolean;
}

export default function Header({ onOpenAiSetup, showSettings }: Props) {
  return (
    <header className="w-full bg-primary text-white px-4 py-3 shadow-md flex items-center justify-between border-b-2 border-cta/30">
      <div className="flex min-w-0 items-center space-x-2.5">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-white/15 flex items-center justify-center">
          <FilePenLine className="w-4.5 h-4.5 text-amber-300" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-wide font-heading">要素式起诉状生成助手</h1>
          <p className="text-[10px] text-blue-100">交通事故案件</p>
        </div>
      </div>
      {showSettings ? (
        <button
          type="button"
          onClick={onOpenAiSetup}
          title="查看或修改 AI 配置"
          className="ml-2 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5" />
          AI 配置
        </button>
      ) : null}
    </header>
  );
}
