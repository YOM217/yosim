import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const FILE = 'openers-feed.json';
const key = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
const now = new Date().toISOString();

const normalize = s => String(s || '').normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
const idFor = s => 'ai-' + crypto.createHash('sha256').update(normalize(s)).digest('hex').slice(0,16);

const feed = JSON.parse(await fs.readFile(FILE,'utf8'));
feed.items = Array.isArray(feed.items) ? feed.items : [];

if (!key) {
  console.log('OPENAI_API_KEY is not configured; keeping the existing feed unchanged.');
  process.exit(0);
}

const existing = feed.items.slice(0,400).map(x=>x.text).filter(Boolean);
const prompt = `Create 36 ORIGINAL Hebrew conversation openers for a respectful social conversation app.
Audience is general. Keep them natural, interesting, short, non-manipulative and usable as first messages or conversation starters.
Categories allowed: קליל, מסקרן, עמוק, מצחיק, רגעי.
Prefer fresh ideas connected to the current season, everyday culture, hobbies, food, music, technology, travel, creativity and harmless current trends when useful.
Avoid politics, tragedies, sexual content, insults, pressure, pickup manipulation, medical advice and copyrighted quotations.
Do not copy or closely paraphrase the existing openers below.
Return ONLY a valid JSON array. Every item must be exactly: {"category":"...","text":"..."}.
Existing openers to avoid:\n${existing.join('\n')}`;

const response = await fetch('https://api.openai.com/v1/responses', {
  method:'POST',
  headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
  body:JSON.stringify({
    model,
    input:prompt,
    tools:[{type:'web_search'}]
  })
});

if (!response.ok) throw new Error(`OpenAI API ${response.status}: ${await response.text()}`);
const data = await response.json();
const text = (data.output || []).flatMap(o=>o.content || []).filter(c=>c.type==='output_text').map(c=>c.text).join('\n').trim();
if (!text) throw new Error('No text output returned');

let parsed;
try { parsed = JSON.parse(text); }
catch {
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('Could not parse model JSON output');
  parsed = JSON.parse(m[0]);
}
if (!Array.isArray(parsed)) throw new Error('Model output is not an array');

const allowed = new Set(['קליל','מסקרן','עמוק','מצחיק','רגעי']);
const known = new Set(feed.items.map(x=>normalize(x.text)));
const additions = [];
for (const row of parsed) {
  const text = String(row?.text || '').replace(/\s+/g,' ').trim();
  const category = allowed.has(row?.category) ? row.category : 'מסקרן';
  if (text.length < 12 || text.length > 180) continue;
  const n = normalize(text);
  if (!n || known.has(n)) continue;
  known.add(n);
  additions.push({id:idFor(text),category,text,createdAt:now,source:'ai'});
}

if (!additions.length) {
  console.log('No unique additions produced.');
  process.exit(0);
}

feed.version = Number(feed.version || 0) + 1;
feed.generatedAt = now;
feed.source = 'openai-responses-web-search';
feed.items = [...additions, ...feed.items].slice(0,3000);
await fs.writeFile(FILE, JSON.stringify(feed,null,2) + '\n');
console.log(`Added ${additions.length} unique openers; feed now has ${feed.items.length}.`);
