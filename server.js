// server.js
import { serve } from "https://deno.land/std@0.200.0/http/server.ts";

// Простая база данных в памяти (Map)
const notes = new Map(); // ключ: id, значение: текст заметки

async function handleRequest(req) {
  const url = new URL(req.url);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  try {
    // GET /notes — список всех заметок
    if (req.method === "GET" && url.pathname === "/notes") {
      const result = [];
      for (const [id, text] of notes) {
        result.push({ id, text });
      }
      return new Response(JSON.stringify(result), { headers });
    }

    // POST /notes — добавить заметку (ожидает { text: "..." })
    if (req.method === "POST" && url.pathname === "/notes") {
      const { text } = await req.json();
      if (!text) {
        return new Response('{"error":"text required"}', { status: 400, headers });
      }
      const id = crypto.randomUUID();
      notes.set(id, text);
      return new Response(JSON.stringify({ id, text }), { status: 201, headers });
    }

    // DELETE /notes?id=... — удалить заметку по id
    if (req.method === "DELETE" && url.pathname === "/notes") {
      const id = url.searchParams.get("id");
      if (!id || !notes.has(id)) {
        return new Response('{"error":"not found"}', { status: 404, headers });
      }
      notes.delete(id);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response("Not found", { status: 404 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

serve(handleRequest);
