// api/chat.js — Vercel Function (web standard)
// Đặt CEREBRAS_API_KEY trong Vercel → Settings → Environment Variables

const UPSTREAM = 'https://api.cerebras.ai/v1/chat/completions';
const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status, data) {
  return new Response(JSON.stringify(data), { status, headers: { ...H, 'Content-Type': 'application/json' } });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: H });
}

export async function POST(req) {
  const envKey = process.env.CEREBRAS_API_KEY;
  let body;
  try { body = await req.json(); }
  catch { return json(400, { error: 'JSON body không hợp lệ' }); }

  const { model = 'llama3.1-8b', messages, max_tokens = 2048, stream = false, key } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return json(400, { error: 'Thiếu mảng messages' });
  }
  const apiKey = key || envKey;
  if (!apiKey) return json(500, { error: 'Chưa cấu hình CEREBRAS_API_KEY trên Vercel' });

  try {
    const r = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, max_tokens, stream }),
    });
    if (!r.ok) {
      const t = await r.text();
      return json(r.status, { error: t });
    }
    if (stream && r.body) {
      return new Response(r.body, {
        status: 200,
        headers: { ...H, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      });
    }
    const d = await r.json();
    return new Response(JSON.stringify(d), { status: 200, headers: { ...H, 'Content-Type': 'application/json' } });
  } catch (e) {
    return json(500, { error: String((e && e.message) || e) });
  }
}
