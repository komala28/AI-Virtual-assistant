import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Monitor, Volume2, Zap, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import type { UserSettings } from '@/lib/types';

const TONES: { value: UserSettings['assistant_tone']; label: string; desc: string }[] = [
  { value: 'helpful', label: 'Helpful', desc: 'Balanced and friendly' },
  { value: 'concise', label: 'Concise', desc: 'Short and to the point' },
  { value: 'creative', label: 'Creative', desc: 'Imaginative and exploratory' },
  { value: 'formal', label: 'Formal', desc: 'Professional and measured' },
];

const THEMES: { value: 'light' | 'dark' | 'system'; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export function SettingsPage() {
  const { settings, updateSettings } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!settings) return null;

  const apply = async (patch: Partial<UserSettings>) => {
    setSaving(true);
    if (patch.theme) setMode(patch.theme);
    await updateSettings(patch);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0b]">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link to="/chat" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft size={16} /> Back to chat
        </Link>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Customize your assistant experience.</p>
        </motion.div>

        <div className="mt-8 space-y-6">
          {/* Appearance */}
          <Section title="Appearance" desc="Choose how Aria looks to you.">
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => apply({ theme: t.value })}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                    mode === t.value
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/5'
                  }`}
                >
                  <t.icon size={20} className={mode === t.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'} />
                  <span className={`text-sm font-medium ${mode === t.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{t.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Assistant tone */}
          <Section title="Assistant tone" desc="Set the default personality of your assistant.">
            <div className="grid grid-cols-2 gap-3">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => apply({ assistant_tone: t.value })}
                  className={`flex flex-col items-start gap-0.5 rounded-xl border p-3.5 text-left transition ${
                    settings.assistant_tone === t.value
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/5'
                  }`}
                >
                  <span className={`text-sm font-medium ${settings.assistant_tone === t.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{t.label}</span>
                  <span className="text-xs text-gray-400">{t.desc}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Voice */}
          <Section title="Voice" desc="Control speech output and reading speed.">
            <Toggle
              icon={Volume2}
              label="Read responses aloud"
              desc="Automatically speak assistant replies"
              checked={settings.voice_output_enabled}
              onChange={(v) => apply({ voice_output_enabled: v })}
            />
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reading speed: {parseFloat(settings.voice_rate).toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.voice_rate}
                onChange={(e) => apply({ voice_rate: e.target.value })}
                className="w-full accent-blue-600"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>0.5x</span><span>1x</span><span>2x</span>
              </div>
            </div>
          </Section>

          {/* Streaming */}
          <Section title="Responses" desc="Control how responses appear.">
            <Toggle
              icon={Zap}
              label="Stream responses"
              desc="Show text as it's generated, word by word"
              checked={settings.streaming_enabled}
              onChange={(v) => apply({ streaming_enabled: v })}
            />
          </Section>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
          >
            Done
          </button>
          {saving && <span className="flex items-center gap-1.5 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Saving…</span>}
          {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"><Check size={14} /> Saved</span>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{desc}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Toggle({ icon: Icon, label, desc, checked, onChange }: { icon: typeof Sun; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
          <Icon size={17} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 flex-none rounded-full transition ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-white/15'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
