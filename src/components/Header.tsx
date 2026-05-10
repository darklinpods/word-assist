import { Wand2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full bg-primary text-white px-4 py-3 shadow-md flex items-center justify-between border-b-2 border-cta/30">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
          <Wand2 className="w-4.5 h-4.5 text-amber-300" />
        </div>
        <h1 className="text-lg font-bold tracking-wide font-heading">诉状智能助手</h1>
      </div>
    </header>
  );
}
