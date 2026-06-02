// server.js
import { serve } from "https://deno.land/std@0.200.0/http/server.ts";

// Открываем встроенную KV-базу данных (постоянное облачное хранилище Deno)
const kv = await Deno.openKv();

async function handleRequest(req) {
  const url = new URL(req.url);
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  // Обработка CORS (если нужно)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // GET /notes — получить все заметки
  if (req.method === "GET" && url.pathname === "/notes") {
    const notes = [];
    for await (const entry of kv.list({ prefix: ["notes"] })) {
      notes.push({ id: entry.key[1], text: entry.value });
    }
    return new Response(JSON.stringify(notes), { headers });
  }

  // POST /notes — добавить заметку (ожидает { text: "..." })
  if (req.method === "POST" && url.pathname === "/notes") {
    const { text } = await req.json();
    if (!text) return new Response('{"error":"text required"}', { status: 400, headers });
    const id = crypto.randomUUID();
    await kv.set(["notes", id], text);
    return new Response(JSON.stringify({ id, text }), { status: 201, headers });
  }

  // DELETE /notes?id=... — удалить заметку
  if (req.method === "DELETE" && url.pathname === "/notes") {
    const id = url.searchParams.get("id");
    if (!id) return new Response('{"error":"id required"}', { status: 400, headers });
    await kv.delete(["notes", id]);
    return new Response(JSON.stringify({ success: true }), { headers });
  }

  return new Response("Not found", { status: 404 });
}

serve(handleRequest);
