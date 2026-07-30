import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Paperclip, Send, Square, X, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useSpeechRecognition } from '@/lib/voice';
import { processFile, formatFileSize } from '@/lib/files';
import type { Attachment } from '@/lib/types';

interface Props {
  onSend: (text: string, attachments: Attachment[]) => void;
  disabled?: boolean;
  streaming?: boolean;
  onStop?: () => void;
}

export function Composer({ onSend, disabled, streaming, onStop }: Props) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleTranscript = (t: string) => setText((prev) => (prev ? prev + ' ' : '') + t);
  const { listening, supported: micSupported, start, stop } = useSpeechRecognition(handleTranscript);

  const autoResize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setProcessing(true);
    const processed = await Promise.all(Array.from(files).slice(0, 4).map(processFile));
    setAttachments((prev) => [...prev, ...processed].slice(0, 6));
    setProcessing(false);
  };

  const removeAttachment = (i: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  };

  const submit = () => {
    if ((!text.trim() && attachments.length === 0) || disabled) return;
    onSend(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#0a0a0b]/80">
      <div className="mx-auto max-w-3xl">
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex flex-wrap gap-2"
            >
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-1.5 pr-2 dark:border-white/10 dark:bg-white/5"
                >
                  {a.preview ? (
                    <img src={a.preview} alt={a.name} className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-[10px] font-bold uppercase text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                      {a.name.split('.').pop()?.slice(0, 3)}
                    </div>
                  )}
                  <div className="flex flex-col text-xs">
                    <span className="max-w-[120px] truncate font-medium text-gray-700 dark:text-gray-200">{a.name}</span>
                    <span className="text-gray-400">{formatFileSize(a.size)}</span>
                  </div>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="rounded p-0.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-white/10"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-white/10 dark:bg-white/[0.03] dark:focus-within:ring-blue-500/20">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.csv,.json,image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
            title="Attach files"
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>

          {micSupported && (
            <button
              onClick={() => (listening ? stop() : start())}
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl transition ${
                listening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10'
              }`}
              title="Voice input"
            >
              <Mic size={18} />
            </button>
          )}

          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => { setText(e.target.value); autoResize(); }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={listening ? 'Listening…' : 'Message your assistant…'}
            className="flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100"
          />

          {streaming ? (
            <button
              onClick={onStop}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gray-200 text-gray-700 transition hover:bg-gray-300 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20"
              title="Stop"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={disabled || (!text.trim() && attachments.length === 0)}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-center text-[11px] text-gray-400">
          AI assistant can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
