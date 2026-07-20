#!/usr/bin/env node
/**
 * Local NeuralBridge-shaped intent WebSocket server for NeuraBinder demos.
 *
 *   pnpm intent:ws
 *   → ws://127.0.0.1:7843
 *
 * Protocol:
 *   Client → server: { "type":"neurabinder.intent", "event": { "kind":"class_label", "label":"select", ... } }
 *   Server broadcasts to all other clients.
 *
 * Also accepts lines: select | confirm | next | prev | cancel | search
 *
 * Computer-side simulation only. Not implant software.
 */

import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.INTENT_WS_PORT || 7843);
const HOST = process.env.INTENT_WS_HOST || "127.0.0.1";

const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(
    "NeuraBinder intent WebSocket — connect clients to this port. Computer-side simulation only.\n"
  );
});

const wss = new WebSocketServer({ server });

function broadcast(from, data) {
  const raw = typeof data === "string" ? data : JSON.stringify(data);
  for (const client of wss.clients) {
    if (client !== from && client.readyState === 1) {
      client.send(raw);
    }
  }
}

wss.on("connection", (ws) => {
  ws.send(
    JSON.stringify({
      type: "neurabinder.hello",
      role: "server",
      message: "intent-ws ready",
      v: 1,
    })
  );

  ws.on("message", (buf) => {
    const text = buf.toString();
    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      // plain label
      msg = {
        type: "neurabinder.intent",
        event: {
          kind: "class_label",
          label: text.trim(),
          source: "websocket_intent",
          ts: Date.now(),
        },
      };
    }

    // Echo envelope normalize
    if (msg.label && !msg.event && !msg.kind) {
      msg = {
        type: "neurabinder.intent",
        event: {
          kind: "class_label",
          label: msg.label,
          source: "websocket_intent",
          ts: Date.now(),
        },
      };
    }

    broadcast(ws, msg);
    // Also echo back so single-client demos can log
    if (ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "neurabinder.ack",
          ok: true,
          at: Date.now(),
        })
      );
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[intent-ws] NeuraBinder intent socket on ws://${HOST}:${PORT}`);
  console.log(`[intent-ws] Computer-side simulation only — not implant I/O`);
  console.log(`[intent-ws] Try: node -e "const WebSocket=require('ws');const w=new WebSocket('ws://${HOST}:${PORT}');w.on('open',()=>w.send(JSON.stringify({type:'neurabinder.intent',event:{kind:'class_label',label:'select',source:'websocket_intent',ts:Date.now()}})))"`);
});
