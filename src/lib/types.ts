export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  accent_color: 'blue' | 'emerald' | 'amber' | 'rose';
  voice_output_enabled: boolean;
  voice_rate: string;
  assistant_tone: 'helpful' | 'concise' | 'creative' | 'formal';
  streaming_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Attachment {
  name: string;
  type: string;
  size: number;
  text?: string;
  preview?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  attachments: Attachment[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'> = {
  theme: 'system',
  accent_color: 'blue',
  voice_output_enabled: true,
  voice_rate: '1',
  assistant_tone: 'helpful',
  streaming_enabled: true,
};
