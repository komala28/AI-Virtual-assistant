import type { Attachment } from './types';

const MAX_TEXT = 200_000;

async function readTextFile(file: File): Promise<string> {
  return file.text();
}

async function readPdf(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text = '';

    const full = new TextDecoder('utf-8').decode(bytes);
    const streamRe = /stream\r?\n([\s\S]*?)endstream/g;
    let streamMatch: RegExpExecArray | null;
    while ((streamMatch = streamRe.exec(full)) !== null) {
      let raw = streamMatch[1];
      if (/\/FlateDecode/.test(full.slice(Math.max(0, streamMatch.index - 300), streamMatch.index))) {
        try {
          const trimmed = raw.replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, '');
          const compressed = new Uint8Array(
            trimmed.split('').map((c) => c.charCodeAt(0))
          );
          const ds = new DecompressionStream('deflate');
          const decompressed = await new Response(
            new Blob([compressed]).stream().pipeThrough(ds)
          ).text();
          raw = decompressed;
        } catch {
          // not deflate or malformed — keep raw
        }
      }
      const extracted = raw
        .replace(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g, (_, g1) => ' ' + g1 + ' ')
        .replace(/\\([nrt()\\])/g, ' ')
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ')
        .replace(/[^\x20-\x7E\r\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (extracted.length > 5) text += extracted + '\n';
    }

    text = text.replace(/\s+/g, ' ').trim();
    if (text.length < 20) {
      return 'This PDF appears to be scanned or image-based, so text extraction yielded little content. Text-based PDFs work best.';
    }
    return text.slice(0, MAX_TEXT);
  } catch (err) {
    return `[Could not read PDF: ${(err as Error).message}]`;
  }
}

async function readDocx(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const full = new TextDecoder('utf-8').decode(bytes);
    const matches = full.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    const text = matches
      .map((m) => m.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, '$1'))
      .join(' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return 'No readable text found in this DOCX file.';
    return text.slice(0, MAX_TEXT);
  } catch (err) {
    return `[Could not read DOCX: ${(err as Error).message}]`;
  }
}

export async function processFile(file: File): Promise<Attachment> {
  const base: Attachment = {
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
  };

  if (file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    return { ...base, preview: url };
  }

  let text = '';
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt') || file.type === 'text/plain') {
    text = await readTextFile(file);
  } else if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    text = await readPdf(file);
  } else if (name.endsWith('.docx') || file.type.includes('word')) {
    text = await readDocx(file);
  } else if (name.endsWith('.md') || name.endsWith('.csv') || name.endsWith('.json')) {
    text = await readTextFile(file);
  } else {
    text = `[Unsupported file type: ${file.name}. Supported: PDF, DOCX, TXT, MD, CSV, JSON, and images.]`;
  }

  return { ...base, text: text.slice(0, MAX_TEXT) };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
