// AE FX's bridge, from outside After Effects (Edie's service and MCP server).
//
// The AE FX panel (src/js/25-native-bridge-server.js) listens on 127.0.0.1 and
// publishes its port and a token in ~/.ae-fx-quick-controls/bridge.json (0600).
// One request per connection: newline-delimited JSON, the token on every line.
//   {"id","token","op":"status"|"commands"|"run", "name"?}  ->  {"id","result":"<json>"}
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// AEFX_BRIDGE_FILE points at another discovery file (tests use a stand-in panel).
export const discoveryFile = process.env.AEFX_BRIDGE_FILE || path.join(os.homedir(), '.ae-fx-quick-controls', 'bridge.json');

export function discovery() {
  try {
    const d = JSON.parse(fs.readFileSync(discoveryFile, 'utf8'));
    return d && Number(d.port) > 0 && typeof d.token === 'string' && d.token ? d : null;
  } catch (_) { return null; }
}

export class Closed extends Error {}

/** One request to the panel. Throws Closed when the panel isn't open (no discovery file, or nothing listening). */
export function ask(op, extra = {}, timeoutMs = 4000) {
  const d = discovery();
  if (!d) return Promise.reject(new Closed('The AE FX panel is not open in After Effects.'));
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const socket = net.createConnection({ host: '127.0.0.1', port: Number(d.port) });
    let buffer = '', done = false;
    const finish = (fn, v) => { if (done) return; done = true; clearTimeout(timer); socket.destroy(); fn(v); };
    const timer = setTimeout(() => finish(reject, new Error(op === 'run'
      ? 'After Effects is still busy with it (no answer in ' + Math.round(timeoutMs / 1000) + ' s). Check the panel.'
      : 'After Effects did not answer. It may be busy, or a dialog is open.')), timeoutMs);
    socket.setEncoding('utf8');
    socket.on('connect', () => socket.write(JSON.stringify({ id, token: d.token, op, ...extra }) + '\n'));
    socket.on('data', chunk => {
      buffer += chunk;
      let i;
      while ((i = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, i).trim();
        buffer = buffer.slice(i + 1);
        let msg; try { msg = JSON.parse(line); } catch (_) { continue; }
        if (msg.id !== id) continue;
        if (msg.error) return finish(reject, new Error(msg.error));
        try { return finish(resolve, JSON.parse(msg.result)); }
        catch (_) { return finish(reject, new Error('The AE FX panel gave an answer this version cannot read. Update AE FX.')); }
      }
    });
    socket.on('error', e => finish(reject, e && (e.code === 'ECONNREFUSED' || e.code === 'ECONNRESET')
      ? new Closed('The AE FX panel is not open in After Effects.') : e));
    socket.on('close', () => finish(reject, new Closed('The AE FX panel closed the connection. Reopen it in After Effects.')));
  });
}

/** Status in the words Edie's switcher shows. */
export function statusLine(s, error) {
  if (!s) return { kind: 'offline', label: error instanceof Closed || !error ? 'Open AE FX in After Effects' : 'Not answering' };
  if (s.ok && typeof s.commands !== 'number') return { kind: 'error', label: 'Update AE FX' };
  if (!s.comp) return { kind: 'ready', label: 'No composition open' };
  return { kind: 'ok', label: s.selected ? `${s.comp} · ${s.selected} selected` : `${s.comp} · nothing selected` };
}

/** Commands whose name (and kind, category) hold every word of the query, best first. */
export function findCommands(list, query, { kind = '', limit = 20 } = {}) {
  const terms = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  const k = String(kind || '').toLowerCase();
  const scored = [];
  for (const c of list) {
    if (k && !c.kind.toLowerCase().includes(k)) continue;
    const name = c.name.toLowerCase();
    const hay = `${name} ${c.kind} ${c.category}`.toLowerCase();
    if (!terms.every(t => hay.includes(t))) continue;
    const q = terms.join(' ');
    const score = name === q ? 0 : name.startsWith(q) ? 1 : terms.every(t => name.includes(t)) ? 2 : 3;
    scored.push([score, c.kind === 'AE effect' ? 1 : 0, c]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2].name.localeCompare(b[2].name));
  return scored.slice(0, limit).map(x => x[2]);
}
