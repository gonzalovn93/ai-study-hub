import Anthropic from '@anthropic-ai/sdk';

// Tutor system prompt — kept server-side so the endpoint can only ever
// behave as Gonzalo's AI study tutor, never as a general-purpose LLM.
const SYSTEM = `You are Gonzalo's personal AI tutor for his Berkeley Haas AI curriculum.

Context about Gonzalo and the curriculum:
- Berkeley Haas MBA (Class of 2026), AI-native PM, ex-Intuit (QuickBooks onboarding) and Rappi (built RappiAds 0->1, ~$1M/month LatAm).
- Completed coursework: Business AI Foundations (17 classes), Pepe's 4-class series (Software -> ML -> LLMs in Production -> Multi-Agent Systems), and an AI/DS/ML Strategy series.
- His projects: ai-operating-system (Claude Code workflows + Notion/Calendar MCP), WhatIfStudios (AI video pipeline), Kairos (AI OKR system), content-marketing-agent (TypeScript multi-agent), berkeley-optometry-voice (voice scheduling agent), GoPlai (CV + LLMs for amateur basketball highlights).
- 2026 landscape he should know: GPT-5.5, Claude Opus 4.x, Gemini 3.1 (1M ctx), LLaMA 4 (10M ctx), the DeepSeek moment, agents mainstream, evals as a required PM skill, MCP as "USB for AI".

The study hub covers 9 modules: Foundations, Machine Learning, Deep Learning, Transformers, LLMs, Evals, Agents, Multi-Agent Systems, and AI Strategy.

Teaching style — structure answers as:
1. Core insight in one bold sentence.
2. A short, concrete explanation (use a small example, analogy, or code snippet when it helps).
3. A tie-back to his projects or the real industry when relevant.
4. A PM/builder "so what" — the practical implication.
Be technically precise, direct, and concise. Correct misconceptions immediately. Stay on AI / the curriculum; if asked something far outside it, gently redirect.`;

const MODEL = 'claude-opus-4-8';
const MAX_TOKENS = 1024;

// Origin allowlist (browsers enforce CORS; this also gates non-browser callers
// that honor Origin). Not a hard security boundary on its own — the real
// backstop is a spend limit on the API key.
const ALLOWED_ORIGINS = ['https://gonzalovn93.github.io'];
function originAllowed(o) {
  if (!o) return false;
  if (ALLOWED_ORIGINS.includes(o)) return true;
  try { return new URL(o).hostname.endsWith('.vercel.app'); } catch { return false; }
}

// Best-effort in-memory rate limit (per warm instance; resets on cold start and
// is not shared across instances — good enough to blunt casual abuse).
const HITS = new Map();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_PER_WINDOW = 25;
function rateLimited(ip) {
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) return true;
  arr.push(now);
  HITS.set(ip, arr);
  return false;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = originAllowed(origin);

  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!allowed) return res.status(403).json({ error: 'Origin not allowed.' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'Rate limit reached — give it a minute.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const raw = Array.isArray(body && body.messages) ? body.messages : null;
  if (!raw || raw.length === 0) return res.status(400).json({ error: 'messages required' });

  // Trim history + clamp each message size to control cost.
  const messages = raw.slice(-12).map((m) => ({
    role: m && m.role === 'assistant' ? 'assistant' : 'user',
    content: String((m && m.content) || '').slice(0, 4000),
  }));

  try {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      messages,
    });
    const text = (r.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return res.status(200).json({ text: text || '(no response)' });
  } catch (e) {
    const status = (e && e.status) || 500;
    return res.status(status >= 400 && status < 600 ? status : 500)
      .json({ error: 'Tutor request failed.', detail: String((e && e.message) || e) });
  }
}
