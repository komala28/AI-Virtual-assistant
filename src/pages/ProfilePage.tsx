import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Mail, User as UserIcon, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export function ProfilePage() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ conversations: 0, messages: 0 });

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      const [c, m] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      ]);
      setStats({ conversations: c.count || 0, messages: m.count || 0 });
    };
    loadStats();
  }, [user]);

  const save = async () => {
    setSaving(true);
    await updateProfile({ full_name: fullName, bio, avatar_url: avatarUrl });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const initial = (fullName || profile?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0b]">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link to="/chat" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft size={16} /> Back to chat
        </Link>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Profile</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your personal information.</p>
        </motion.div>

        {/* Avatar card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-8 flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-semibold text-white shadow-sm">
              {initial}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{fullName || 'Your name'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
            <div className="mt-3 flex gap-6">
              <Stat icon={MessageSquare} label="Conversations" value={stats.conversations} />
              <Stat icon={UserIcon} label="Messages sent" value={stats.messages} />
            </div>
          </div>
        </motion.div>

        {/* Edit form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]"
        >
          <div className="space-y-5">
            <Field label="Full name" icon={UserIcon}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-blue-500/20"
              />
            </Field>

            <Field label="Avatar URL" icon={UserIcon}>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-blue-500/20"
              />
            </Field>

            <Field label="Email" icon={Mail}>
              <input
                value={profile?.email || ''}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400 outline-none dark:border-white/10 dark:bg-white/5 dark:text-gray-500"
              />
            </Field>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell us a bit about yourself…"
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save changes
              </button>
              {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved!</span>}
            </div>
          </div>
        </motion.div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Calendar size={13} /> Member since {profile ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '—'}
        </p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-gray-400" />
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</span>
      <span className="text-sm text-gray-400">{label}</span>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof UserIcon; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Icon size={14} className="text-gray-400" /> {label}
      </label>
      {children}
    </div>
  );
}
