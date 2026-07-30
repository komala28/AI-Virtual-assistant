import type { Attachment } from './types';
import type { UserSettings } from './types';

interface AssistantContext {
  settings: UserSettings | null;
  history: { role: 'user' | 'assistant'; content: string }[];
  attachments: Attachment[];
}

const GREETING_RE = /^(hi|hello|hey|greetings|howdy|yo|sup|good (morning|afternoon|evening))\b/i;
const CAPABILITY_RE = /(what can you do|your features|help me with|capabilities|what are you)/i;
const IDENTITY_RE = /(who are you|what are you|your name)/i;
const CODE_RE = /(code|function|bug|debug|error|program|script|compile|syntax|algorithm|refactor)/i;
const WRITING_RE = /(write|email|resume|cv|cover letter|blog|article|essay|script|story|grammar|proofread|paraphrase)/i;
const MATH_RE = /(\d+\s*[+\-*/x]\s*\d+|calculate|solve|equation|sum of|product of|percentage of)/i;
const SUMMARIZE_RE = /(summar|tl;dr|key points|main points|gist of)/i;
const TODO_RE = /(todo|to-do|task list|remind me|reminder)/i;
const WEATHER_RE = /(weather|temperature|forecast|rain|sunny)/i;
const TIME_RE = /(time|date|today|day is it)/i;

function tonePrefix(tone: UserSettings['assistant_tone']): string {
  switch (tone) {
    case 'concise':
      return 'Here is a concise answer:';
    case 'creative':
      return 'Let me approach this creatively.';
    case 'formal':
      return 'Certainly. Here is a considered response:';
    default:
      return '';
  }
}

function evaluateMath(expr: string): string | null {
  const cleaned = expr.replace(/[^0-9+\-*/().\sx]/gi, ' ').trim();
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*([+\-*/x])\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const a = parseFloat(match[1]);
  const op = match[2].replace('x', '*');
  const b = parseFloat(match[3]);
  let result: number;
  switch (op) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/': result = b === 0 ? NaN : a / b; break;
    default: return null;
  }
  if (Number.isNaN(result)) return null;
  const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op;
  return `**${a} ${opSymbol} ${b} = ${Number.isInteger(result) ? result : result.toFixed(4)}**\n\nThat's the arithmetic result. Want me to break down the steps or try another calculation?`;
}

function codeResponse(prompt: string): string {
  const wantsGenerate = /(generate|create|write|make|build).*(function|code|component|script|program)/i.test(prompt);
  const wantsDebug = /(debug|fix|error|not working|broken|why doesn't)/i.test(prompt);
  const wantsExplain = /(explain|what does|how does|understand)/i.test(prompt);
  const wantsConvert = /(convert|translate|to (python|javascript|typescript|java|rust|go|c\+\+))/i.test(prompt);

  if (wantsDebug) {
    return `Let's debug this together. Here's a systematic approach:\n\n1. **Reproduce the error** — run the exact scenario that triggers it and capture the full error message.\n2. **Isolate the cause** — comment out sections until the error disappears, then re-enable piece by piece.\n3. **Check common culprits**:\n   - Off-by-one errors in loops\n   - Null/undefined access without guards\n   - Async code not awaited\n   - Type mismatches\n\nPaste the error message and the relevant code block, and I'll pinpoint the fix.\n\n\`\`\`\n// Example defensive pattern\nfunction safeGet(obj, path) {\n  return path.split('.').reduce((acc, key) => acc?.[key], obj);\n}\n\`\`\``;
  }
  if (wantsConvert) {
    return `I can translate code between languages while preserving logic. For an accurate conversion:\n\n- I keep the **algorithm identical**.\n- I adapt to the target language's **idioms and standard library**.\n- I note where direct equivalents don't exist.\n\nPaste the code you want converted and name the target language.\n\n\`\`\`python\n# Python -> JavaScript equivalent example\n# Python: squares = [x**2 for x in range(10)]\nconst squares = Array.from({ length: 10 }, (_, x) => x * x);\n\`\`\``;
  }
  if (wantsExplain) {
    return `Sure — paste the code snippet and I'll walk through it line by line, explaining:\n\n- **What each part does**\n- **Why it's written that way**\n- **Any gotchas or improvements**\n\nGo ahead and share the code.`;
  }
  if (wantsGenerate) {
    return `Here's a clean, well-structured starting point. Tell me the exact requirements and language and I'll tailor it precisely.\n\n\`\`\`javascript\n// Example: a debounce utility\nfunction debounce(fn, delay = 300) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}\n\`\`\`\n\nWhat should I generate for you specifically?`;
  }
  return `I'm your coding assistant. I can:\n\n- **Generate code** in most languages\n- **Debug** errors and explain fixes\n- **Explain** how code works line by line\n- **Convert** code between languages\n- **Review** for best practices\n\nWhat are you working on? Share the code or describe what you need.`;
}

function writingResponse(prompt: string): string {
  if (/email/i.test(prompt)) {
    return `Here's a professional email draft. Tell me the recipient, purpose, and tone and I'll refine it.\n\n---\n\n**Subject:** Follow-up on our discussion\n\nHi [Name],\n\nI hope this message finds you well. I'm writing to follow up on our recent conversation regarding [topic].\n\n[Body — what you need, by when, and why it matters.]\n\nPlease let me know if you have any questions. I'm happy to provide more detail.\n\nBest regards,\n[Your name]\n\n---\n\nWant it more formal, shorter, or warmer?`;
  }
  if (/resume|cv/i.test(prompt)) {
    return `I'll help strengthen your resume. For the best result, share:\n\n1. The **job title** you're targeting\n2. Your **current resume text** (or bullet points)\n3. The **job description** if you have one\n\nI'll then:\n- Rewrite weak bullets into **impact-driven achievements**\n- Add quantified results where possible\n- Align keywords with the role\n\nPaste what you have and I'll get to work.`;
  }
  if (/blog|article/i.test(prompt)) {
    return `Let's craft a compelling post. Share your **topic**, **target audience**, and **desired length**, and I'll produce:\n\n- An engaging hook\n- A clear structure with headings\n- SEO-friendly subheadings\n- A strong call to action\n\nWhat's the topic?`;
  }
  if (/script/i.test(prompt) && !/code|function/i.test(prompt)) {
    return `I can write YouTube/video scripts. Tell me:\n\n- **Topic & hook**\n- **Length** (short-form / long-form)\n- **Tone** (energetic, educational, casual)\n\nI'll structure it with intro, main beats, and outro with a CTA.`;
  }
  if (/grammar|proofread|correct/i.test(prompt)) {
    return `Paste the text and I'll correct grammar, spelling, and clarity while keeping your voice intact. I'll show the corrected version and flag what changed.`;
  }
  return `I'm your writing assistant. I can help with:\n\n- **Emails** — professional or casual\n- **Resumes & cover letters** — impact-driven rewrites\n- **Blog posts & articles** — structured and SEO-aware\n- **YouTube scripts** — with hooks and CTAs\n- **Grammar & proofreading** — polished corrections\n\nWhat would you like to write?`;
}

function summarizeResponse(attachments: Attachment[]): string {
  const file = attachments.find((a) => a.text);
  if (!file) {
    return `Upload a document (PDF, DOCX, or TXT) and I'll extract the key points into a concise summary. You can also paste the text directly.`;
  }
  const text = file.text || '';
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 30);
  const wordCounts = sentences.map((s) => s.split(/\s+/).length);
  const totalWords = wordCounts.reduce((a, b) => a + b, 0);
  const topSentences = sentences
    .map((s, i) => ({ s, i, score: s.split(/\s+/).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s.trim());

  return `## Summary of *${file.name}*\n\n**Document stats:** ~${totalWords} words across ${sentences.length} sentences.\n\n### Key Points\n${topSentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n---\n\nWant me to extract specific details, answer questions about this document, or produce a one-paragraph TL;DR? Just ask.`;
}

function fileAwareResponse(prompt: string, attachments: Attachment[]): string {
  const file = attachments.find((a) => a.text);
  if (!file) return '';
  const text = (file.text || '').slice(0, 8000);
  const lower = prompt.toLowerCase();
  const keywords = lower
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['what', 'when', 'where', 'which', 'about', 'with', 'that', 'this', 'from', 'have', 'does', 'tell', 'me', 'please', 'could', 'would', 'should'].includes(w));

  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  const scored = paragraphs
    .map((p) => {
      const pl = p.toLowerCase();
      const score = keywords.reduce((acc, kw) => acc + (pl.includes(kw) ? 1 : 0), 0);
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.p.trim());

  if (scored.length === 0) {
    const snippet = text.slice(0, 600).trim();
    return `Based on *${file.name}*, here's what I found relevant:\n\n> ${snippet}${text.length > 600 ? '…' : ''}\n\nI couldn't find a passage that directly matches your question. Could you rephrase, or ask about a specific section?`;
  }

  return `Based on *${file.name}*, here's the most relevant content:\n\n${scored.map((s) => `> ${s}`).join('\n\n')}\n\nWant me to summarize this further or dig into another part of the document?`;
}

function genericResponse(prompt: string, history: { role: string; content: string }[]): string {
  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
  const isFollowUp = lastAssistant && /you|this|that|it|more|continue|example/i.test(prompt) && prompt.length < 60;

  if (isFollowUp && lastAssistant) {
    return `Building on that — here's more detail. ${prompt.trim().replace(/\?$/, '')} depends on your specific context, but a good next step is to apply it concretely and observe the result. Share the specifics (your data, your code, or your scenario) and I'll give you a precise, actionable answer rather than general guidance.`;
  }

  const topic = prompt.replace(/[?.!]+$/, '').trim();
  return `Here's my take on **"${topic}"**:\n\nThis is a thoughtful question. The most useful answer depends on a few specifics — your goal, constraints, and context. Here's a structured starting point:\n\n1. **Clarify the goal** — what outcome would make this successful for you?\n2. **Identify constraints** — time, budget, tools, or prior knowledge.\n3. **Start small** — pick the simplest version that works, then iterate.\n\nIf you share more detail (what you're trying to achieve, what you've tried, or the exact problem), I'll give you a precise, tailored answer with concrete steps.`;
}

export function generateResponse(prompt: string, ctx: AssistantContext): string {
  const { settings, attachments } = ctx;
  const p = prompt.trim();
  if (!p) return "I didn't catch that. Could you say it again?";

  const prefix = settings ? tonePrefix(settings.assistant_tone) : '';
  const join = prefix ? `${prefix}\n\n` : '';

  if (attachments.some((a) => a.text)) {
    if (SUMMARIZE_RE.test(p)) return join + summarizeResponse(attachments);
    const fa = fileAwareResponse(p, attachments);
    if (fa) return join + fa;
  }

  if (GREETING_RE.test(p)) return `${prefix ? prefix + ' ' : ''}Hello! I'm your AI assistant. I can help with writing, coding, math, document analysis, planning, and general questions. What would you like to work on?`;
  if (IDENTITY_RE.test(p)) return "I'm your **AI Virtual Assistant** — a built-in assistant that works right here in your browser. I can chat, write, code, summarize documents, do math, and more. No external setup required.";
  if (CAPABILITY_RE.test(p)) return `I can help you with:\n\n- **Chat & Q&A** — general questions, brainstorming, explanations\n- **Writing** — emails, resumes, blogs, scripts, grammar fixes\n- **Coding** — generate, debug, explain, and convert code\n- **Math** — calculations and arithmetic\n- **Documents** — summarize and answer questions about PDFs, DOCX, and TXT files\n- **Productivity** — to-do lists, reminders, planning\n- **Voice** — speak your input and hear responses read aloud\n\nWhat would you like to do?`;
  if (TIME_RE.test(p)) {
    const now = new Date();
    return `It's currently **${now.toLocaleTimeString()}** on **${now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}** (your local time).`;
  }
  if (WEATHER_RE.test(p)) return `I can't fetch live weather data in this offline build, but I can help you plan around weather. Tell me your location and what you need (an outfit suggestion, a travel plan, an event backup), and I'll reason through it.`;

  const math = evaluateMath(p);
  if (math) return join + math;

  if (CODE_RE.test(p)) return join + codeResponse(p);
  if (WRITING_RE.test(p)) return join + writingResponse(p);
  if (SUMMARIZE_RE.test(p)) return join + summarizeResponse(attachments);
  if (TODO_RE.test(p)) {
    return `Let's set up your task list. Tell me what you need to do and I'll help you organize it:\n\n- [ ] Add your first task\n- [ ] Add another\n\nYou can also describe a project and I'll break it into actionable steps with priorities.`;
  }

  return join + genericResponse(p, ctx.history);
}

export function suggestTitle(firstMessage: string): string {
  const cleaned = firstMessage.replace(/[#*`>_~]/g, '').trim();
  const words = cleaned.split(/\s+/).slice(0, 6).join(' ');
  return words.length > 0 ? words.charAt(0).toUpperCase() + words.slice(1) : 'New conversation';
}

export async function* streamResponse(text: string, enabled: boolean): AsyncGenerator<string> {
  if (!enabled) {
    yield text;
    return;
  }
  const tokens = text.split(/(\s+)/);
  for (const token of tokens) {
    yield token;
    await new Promise((r) => setTimeout(r, 12));
  }
}
