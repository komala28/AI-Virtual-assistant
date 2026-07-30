import { motion } from 'framer-motion';
import { Code2, FileText, PenLine, Calculator, Mic, ListChecks, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  { icon: Code2, title: 'Debug my code', prompt: 'Help me debug a function that throws a null reference error' },
  { icon: PenLine, title: 'Write an email', prompt: 'Write a professional follow-up email after a job interview' },
  { icon: FileText, title: 'Summarize a document', prompt: 'Summarize the document I uploaded' },
  { icon: Calculator, title: 'Do some math', prompt: 'What is 15% of 240?' },
  { icon: ListChecks, title: 'Plan my day', prompt: 'Help me create a to-do list for a productive workday' },
  { icon: Mic, title: 'Try voice mode', prompt: 'What can you do?' },
];

export function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
      >
        <Sparkles size={30} />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-white sm:text-3xl"
      >
        How can I help you today?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-2 text-center text-gray-500 dark:text-gray-400"
      >
        Ask anything, upload documents, or pick a starting point below.
      </motion.p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.04 }}
            onClick={() => onPick(s.prompt)}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left transition hover:border-blue-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-500/40"
          >
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300">
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{s.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{s.prompt}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
