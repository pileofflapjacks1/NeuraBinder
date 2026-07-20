# Intent socket protocol (NeuraBinder)

Computer-side / simulation only. Compatible with **NeuralBridge**-shaped generic intents. Not implant I/O.

## Transports

| Transport | How |
|-----------|-----|
| `window.postMessage` | Parent iframe / Neurabeach embed |
| `BroadcastChannel("neurabinder-intent")` | Multi-tab loopback |
| WebSocket | `pnpm intent:ws` → `ws://127.0.0.1:7843` or `NEXT_PUBLIC_INTENT_WS_URL` |

## Envelope

```json
{
  "type": "neurabinder.intent",
  "event": {
    "kind": "class_label",
    "label": "select",
    "confidence": 0.98,
    "source": "websocket_intent",
    "ts": 1710000000000
  },
  "v": 1
}
```

`type` may also be `neuralbridge.intent`.

## Event kinds (`inputs` in manifest)

### `class_label`
```json
{ "kind": "class_label", "label": "select", "confidence": 1, "source": "synthetic", "ts": 0 }
```
Labels: `select` | `confirm` | `cancel` | `back` | `search` | `next` | `prev` | `add` | `remove`

### `switch_binary`
```json
{ "kind": "switch_binary", "pressed": true, "source": "synthetic", "ts": 0 }
```
Rising edge → `select`.

### `velocity_2d`
```json
{ "kind": "velocity_2d", "dx": 0.1, "dy": -0.2, "source": "generic_intent", "ts": 0 }
```
Reserved for continuous cursor (middleware-owned).

### `synthetic`
```json
{ "kind": "synthetic", "payload": { "label": "search" }, "source": "synthetic", "ts": 0 }
```

## Local server

```bash
pnpm intent:ws
# Clients: Connect WS on /demo or Settings → Intent socket
```

## postMessage (embed)

```js
iframe.contentWindow.postMessage({
  type: "neurabinder.intent",
  event: { kind: "class_label", label: "search", source: "generic_intent", ts: Date.now() }
}, "*");
```

## Showcase mode

- URL: `/?showcase=1` or visit `/demo`
- Header **Showcase** · Settings toggle
- Locks destructive resets; forces BCI-friendly profile; starts intent listeners
