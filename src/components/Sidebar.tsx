import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Pencil,
  X,
  Check,
  Sparkles,
  Settings as SettingsIcon,
  User as UserIcon,
  LogOut,
  PanelLeftClose,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Conversation } from '@/lib/types';
import { useAuth } from '@/lib/auth';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onTogglePin,
  open,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const pinned = conversations.filter((c) => c.pinned);
  const filtered = conversations
    .filter((c) => !c.pinned)
    .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));

  const startEdit = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
  };
  const commitEdit = () => {
    if (editingId && editTitle.trim()) onRename(editingId, editTitle.trim());
    setEditingId(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const Row = ({ c }: { c: Conversation }) => (
    <div
      className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition cursor-pointer ${
        activeId === c.id
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
      }`}
      onClick={() => onSelect(c.id)}
    >
      <MessageSquare size={15} className="flex-none opacity-60" />
      {editingId === c.id ? (
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      ) : (
        <span className="flex-1 truncate">{c.title}</span>
      )}
      <div className="flex flex-none items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        {editingId === c.id ? (
          <button onClick={(e) => { e.stopPropagation(); commitEdit(); }} className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10">
            <Check size={13} />
          </button>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin(c.id); }}
              className={`rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 ${c.pinned ? 'text-blue-500' : ''}`}
              title={c.pinned ? 'Unpin' : 'Pin'}
            >
              <Pin size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); startEdit(c); }}
              className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white dark:border-white/10 dark:bg-[#0d0d0f] md:relative md:translate-x-0 md:z-auto"
        style={{ transform: open ? undefined : undefined }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/chat" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <Sparkles size={17} />
            </div>
            <span className="font-semibold tracking-tight text-gray-800 dark:text-white">Aria</span>
          </Link>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 md:hidden dark:hover:bg-white/10">
            <PanelLeftClose size={18} />
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            onClick={onNew}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} /> New chat
          </button>
        </div>

        <div className="px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
            <Search size={14} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {pinned.length > 0 && (
            <div className="mb-3">
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pinned</p>
              {pinned.map((c) => <Row key={c.id} c={c} />)}
            </div>
          )}
          {filtered.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Recent</p>
              )}
              {filtered.map((c) => <Row key={c.id} c={c} />)}
            </div>
          )}
          {conversations.length === 0 && (
            <div className="px-3 py-8 text-center">
              <MessageSquare size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a new chat to begin</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-3 dark:border-white/10">
          <div className="mb-2 flex items-center gap-2">
            <Link
              to="/settings"
              className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <SettingsIcon size={16} /> Settings
            </Link>
            <Link
              to="/profile"
              className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <UserIcon size={16} /> Profile
            </Link>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-rose-50 hover:text-rose-600 dark:text-gray-300 dark:hover:bg-rose-500/10"
          >
            <LogOut size={16} /> Sign out
          </button>
          <div className="mt-2 flex items-center gap-2 rounded-lg px-1 py-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
              {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="truncate text-xs text-gray-500">{profile?.full_name || profile?.email}</span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
