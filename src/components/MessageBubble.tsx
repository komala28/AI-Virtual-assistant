import { AnimatePresence, motion } from 'framer-motion';
import { Copy, RefreshCw, Square, Volume2, Check, User as UserIcon, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Markdown } from './Markdown';
import type { Message } from '@/lib/types';
import { formatFileSize } from '@/lib/files';
import { useAuth } from '@/lib/auth';

interface Props {
  message: Message;
  isLast: boolean;
  streaming?: boolean;
  onSpeak: (text: string) => void;
  speaking: boolean;
  onStopSpeak: () => void;
  onRegenerate: () => void;
}

export function MessageBubble({ message, isLast, streaming, onSpeak, speaking, onStopSpeak, onRegenerate }: Props) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`group flex gap-3 px-4 py-5 sm:px-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
            : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
        }`}
      >
        {isUser ? (
          profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <UserIcon size={17} />
          )
        ) : (
          <Sparkles size={17} />
        )}
      </div>

      <div className={`flex max-w-[min(680px,85%)] flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
            isUser
              ? 'rounded-tr-md bg-blue-600 text-white'
              : 'rounded-tl-md border border-gray-200 bg-white text-gray-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-100'
          }`}
        >
          {message.attachments.length > 0 && (
            <div className={`mb-2 flex flex-wrap gap-1.5 ${isUser ? 'justify-end' : ''}`}>
              {message.attachments.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                    isUser ? 'bg-blue-500/30 text-blue-50' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                  }`}
                >
                  {a.preview && (
                    <img src={a.preview} alt={a.name} className="h-8 w-8 rounded object-cover" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{a.name}</span>
                    <span className="opacity-70">{formatFileSize(a.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <>
              <Markdown content={message.content} />
              {streaming && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-full bg-emerald-500 align-middle" />
              )}
            </>
          )}
        </div>

        {!isUser && !streaming && (
          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={copy}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {speaking ? (
              <button
                onClick={onStopSpeak}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <Square size={13} /> Stop
              </button>
            ) : (
              <button
                onClick={() => onSpeak(message.content)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              >
                <Volume2 size={13} /> Listen
              </button>
            )}
            {isLast && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              >
                <RefreshCw size={13} /> Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
