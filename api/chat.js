js
// -----------------------------------------------------
// api/chat.js  (Vercel Serverless Function)
// -----------------------------------------------------
import fetch from 'node-fetch';

// Vercel sẽ tự inject biến môi trường này
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

// -----------------------------------------------------
// Helper: trả về JSON + status code
// -----------------------------------------------------
function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// -----------------------------------------------------
// POST handler (được Vercel gọi khi client thực hiện fetch)
// -----------------------------------------------------
export async function POST(req) {
  // ---- 1️⃣ Kiểm tra key đã được cấu hình chưa
  if (!CEREBRAS_API_KEY) {
    return jsonResponse(500, { error: "Cerebras API key not set" });
  }

  // ---- 2️⃣ Đọc body JSON { message: "..." }
  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const userMessage = payload?.message?.trim();
  if (!userMessage) {
    return jsonResponse(400, { error: "Missing message" });
  }

  // ---- 3️⃣ Gọi Cerebras
  try {
    const resp = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CEREBRAS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.1-8b",          // hoặc model phù hợp với gói của bạn
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return jsonResponse(resp.status, {
        error: `Cerebras error: ${errText}`,
      });
    }

    const data = await resp.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";
    return jsonResponse(200, { reply: answer });
  } catch (e) {
    console.error("Cerebras request failed:", e);
    return jsonResponse(500, { error: e.message });
  }
}
