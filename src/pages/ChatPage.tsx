import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { generateResponse, suggestTitle, streamResponse } from '@/lib/assistant';
import { useSpeechSynthesis } from '@/lib/voice';
import type { Conversation, Message, Attachment } from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { Composer } from '@/components/Composer';
import { MessageBubble } from '@/components/MessageBubble';
import { EmptyState } from '@/components/EmptyState';

export function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, settings, loading } = useAuth();
  const { speak, stop: stopSpeak, speaking, supported: ttsSupported } = useSpeechSynthesis();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const streamCancel = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    supabase
      .from('conversations')
      .select('*')
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setConversations(data as Conversation[]);
      });
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (!id || !user) {
      setMessages([]);
      setActive(null);
      return;
    }
    supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setActive((data as Conversation) || null));
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) || []));
  }, [id, user]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const newConversation = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title: 'New conversation' })
      .select()
      .single();
    if (error || !data) throw error;
    const conv = data as Conversation;
    setConversations((prev) => [conv, ...prev]);
    return conv.id;
  }, []);

  const handleNew = useCallback(async () => {
    try {
      const newId = await newConversation();
      setSidebarOpen(false);
      navigate(`/chat/${newId}`);
    } catch {
      // ignore
    }
  }, [newConversation, navigate]);

  const handleSelect = useCallback((convId: string) => {
    setSidebarOpen(false);
    navigate(`/chat/${convId}`);
  }, [navigate]);

  const persistMessage = useCallback(async (convId: string, role: 'user' | 'assistant', content: string, attachments: Attachment[] = []) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, role, content, attachments })
      .select()
      .single();
    if (error || !data) return null;
    return data as Message;
  }, []);

  const touchConversation = useCallback(async (convId: string, title?: string) => {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title) patch.title = title;
    await supabase.from('conversations').update(patch).eq('id', convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, ...patch } as Conversation : c))
    );
  }, []);

  const runAssistant = useCallback(
    async (convId: string, history: { role: 'user' | 'assistant'; content: string }[], attachments: Attachment[]) => {
      const lastUser = history[history.length - 1];
      const fullResponse = generateResponse(lastUser.content, { settings, history, attachments });
      const streamEnabled = settings?.streaming_enabled ?? true;

      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        conversation_id: convId,
        role: 'assistant',
        content: '',
        attachments: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMessage]);
      setStreaming(true);
      streamCancel.current = false;

      let accumulated = '';
      for await (const chunk of streamResponse(fullResponse, streamEnabled)) {
        if (streamCancel.current) break;
        accumulated += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, content: accumulated } : m))
        );
      }

      setStreaming(false);
      const saved = await persistMessage(convId, 'assistant', accumulated || fullResponse);
      if (saved) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
        if (settings?.voice_output_enabled && ttsSupported && !streamCancel.current) {
          speak(accumulated || fullResponse, parseFloat(settings.voice_rate) || 1);
        }
      }
    },
    [settings, persistMessage, speak, ttsSupported]
  );

  const handleSend = useCallback(
    async (text: string, attachments: Attachment[]) => {
      let convId = id;
      if (!convId) {
        try {
          convId = await newConversation();
          navigate(`/chat/${convId}`, { replace: true });
        } catch {
          return;
        }
      }

      const userMsg = await persistMessage(convId, 'user', text, attachments);
      if (!userMsg) return;
      setMessages((prev) => [...prev, userMsg]);

      const history = [...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })), { role: 'user' as const, content: text }];

      if (messages.length === 0 && text) {
        const title = suggestTitle(text);
        await touchConversation(convId, title);
        setActive((prev) => (prev ? { ...prev, title } : prev));
      } else {
        await touchConversation(convId);
      }

      await runAssistant(convId, history, attachments);
    },
    [id, messages, newConversation, navigate, persistMessage, runAssistant, touchConversation]
  );

  const handleRegenerate = useCallback(async () => {
    if (!id || messages.length < 2) return;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    const lastAssistantIdx = messages.map((m) => m.role).lastIndexOf('assistant');
    if (lastAssistantIdx >= 0) {
      setMessages((prev) => prev.slice(0, lastAssistantIdx));
    }
    const history = messages
      .filter((m, i) => i < lastAssistantIdx)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    await runAssistant(id, [...history, { role: 'user', content: lastUser.content }], lastUser.attachments || []);
  }, [id, messages, runAssistant]);

  const handleStop = useCallback(() => {
    streamCancel.current = true;
    setStreaming(false);
  }, []);

  const handleRename = useCallback(async (convId: string, title: string) => {
    await supabase.from('conversations').update({ title }).eq('id', convId);
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title } : c)));
    if (active?.id === convId) setActive({ ...active, title });
  }, [active]);

  const handleDelete = useCallback(async (convId: string) => {
    await supabase.from('conversations').delete().eq('id', convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (active?.id === convId) {
      setActive(null);
      setMessages([]);
      navigate('/chat');
    }
  }, [active, navigate]);

  const handleTogglePin = useCallback(async (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;
    const pinned = !conv.pinned;
    await supabase.from('conversations').update({ pinned }).eq('id', convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, pinned } : c)).sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
    );
  }, [conversations]);

  const handleExport = useCallback(() => {
    if (!active) return;
    const lines = messages.map((m) => {
      const who = m.role === 'user' ? 'You' : 'Aria';
      return `## ${who}\n\n${m.content}\n`;
    });
    const blob = new Blob([`# ${active.title}\n\n${lines.join('\n')}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [active, messages]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0a0a0b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0a0a0b]">
      <Sidebar
        conversations={conversations}
        activeId={id || null}
        onSelect={handleSelect}
        onNew={handleNew}
        onRename={handleRename}
        onDelete={handleDelete}
        onTogglePin={handleTogglePin}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          conversation={active}
          onExport={handleExport}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onPick={(p) => handleSend(p, [])} />
          ) : (
            <div className="mx-auto max-w-3xl py-2">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isLast={i === messages.length - 1}
                    streaming={streaming && i === messages.length - 1 && m.role === 'assistant'}
                    onSpeak={(t) => speak(t, parseFloat(settings?.voice_rate || '1'))}
                    speaking={speaking}
                    onStopSpeak={stopSpeak}
                    onRegenerate={handleRegenerate}
                  />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        <Composer
          onSend={handleSend}
          disabled={streaming}
          streaming={streaming}
          onStop={handleStop}
        />
      </div>
    </div>
  );
}
