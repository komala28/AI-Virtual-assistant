import { Menu, Sun, Moon, Monitor, Download } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import type { Conversation } from '@/lib/types';

interface Props {
  onToggleSidebar: () => void;
  conversation: Conversation | null;
  onExport: () => void;
}

export function TopBar({ onToggleSidebar, conversation, onExport }: Props) {
  const { resolved, mode, setMode } = useTheme();
  const { settings } = useAuth();

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system'] as const;
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setMode(next);
  };

  const ThemeIcon = resolved === 'dark' ? Moon : Sun;

  return (
    <header className="flex h-14 flex-none items-center justify-between border-b border-gray-200 bg-white/80 px-3 backdrop-blur dark:border-white/10 dark:bg-[#0a0a0b]/80">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 md:hidden dark:hover:bg-white/10"
        >
          <Menu size={19} />
        </button>
        <h2 className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
          {conversation?.title || 'New conversation'}
        </h2>
      </div>

      <div className="flex items-center gap-1">
        {conversation && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
            title="Export conversation"
          >
            <Download size={15} /> Export
          </button>
        )}
        <button
          onClick={cycleTheme}
          className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
          title={`Theme: ${mode}`}
        >
          {mode === 'system' ? <Monitor size={18} /> : <ThemeIcon size={18} />}
        </button>
      </div>
    </header>
  );
}
