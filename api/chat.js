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

// Sonnet 5 rather than Opus: this is a study tutor on a public URL, and Opus
// pricing ($5/$25 per MTok) is hard to justify for anything a stranger can
// trigger. Override with STUDY_MODEL if a specific answer needs more.
const MODEL = process.env.STUDY_MODEL || 'claude-sonnet-5';
const MAX_TOKENS = 1024;

// Optional shared passphrase. Set ACCESS_CODE in Vercel to require it; leave
// it unset and the endpoint behaves exactly as before. This is the only
// control here that actually stops a non-browser caller — Origin is a request
// header and anyone can forge it, so the allowlist below only shapes browser
// behaviour. It is not cryptographic: the frontend is a public static page,
// so treat it as a lock on the door, not a vault.
const ACCESS_CODE = process.env.ACCESS_CODE || '';

// Origin allowlist. The previous version accepted ANY *.vercel.app host, which
// let every Vercel deployment on the internet through; now only this project's
// own preview domains are allowed.
const ALLOWED_ORIGINS = ['https://gonzalovn93.github.io'];
function originAllowed(o) {
  if (!o) return false;
  if (ALLOWED_ORIGINS.includes(o)) return true;
  try {
    const h = new URL(o).hostname;
    return /^ai-study-hub[a-z0-9-]*\.vercel\.app$/.test(h);
  } catch { return false; }
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Access-Code');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!allowed) return res.status(403).json({ error: 'Origin not allowed.' });

  if (ACCESS_CODE && req.headers['x-access-code'] !== ACCESS_CODE) {
    return res.status(401).json({ error: 'Access code required.' });
  }

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
    // Log the real error server-side; don't hand internals (billing state,
    // request ids, key hints) to an anonymous caller.
    console.error('[api/chat]', (e && e.status) || '', (e && e.message) || e);
    const status = (e && e.status) || 500;
    return res.status(status >= 400 && status < 600 ? status : 500)
      .json({ error: 'Tutor request failed.' });
  }
}
