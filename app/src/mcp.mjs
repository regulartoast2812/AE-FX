// AE FX's tools for an agent (Edie in Creative Assist, or any MCP client):
// a stdio MCP server, newline-delimited JSON-RPC, no dependencies.
//
// It runs commands exactly as the palette or the Functions list would, through
// the AE FX panel's bridge, on the layers and keyframes selected in After
// Effects. After Effects' own undo takes each run back.
import readline from 'node:readline';
import { ask, Closed, statusLine, findCommands } from './core.mjs';

const VERSION = '0.1.0';

const TOOLS = [
  {
    name: 'ae_status',
    description: 'Whether AE FX can run commands in After Effects right now: whether the AE FX panel is open, the active composition, and how many layers are selected. Call this first if a run fails.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'ae_find_commands',
    description: 'Search the AE FX command list (easing, overshoot/wiggle expressions, animate position/scale/opacity in and out, anchor points, layer/keyframe/marker labels, trims, snap/pull/stagger, adding layers, duplicate/split, every installed AE effect, and the user\'s saved scripts). Every word of the query must appear. Returns exact names to pass to ae_run; a command inside a menu is named "Menu / Item".',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words from the command name, e.g. "overshoot", "ease", "anchor center", "gaussian blur".' },
        kind: { type: 'string', description: 'Optional: only this kind — Panel, Custom, AE effect, Saved script.' },
        limit: { type: 'number', description: 'At most this many (default 15, max 50).' },
      },
      required: ['query'], additionalProperties: false,
    },
  },
  {
    name: 'ae_run',
    description: 'Run one AE FX command on what is selected in After Effects (layers, or keyframes for keyframe commands) and wait for its result. Use the exact name from ae_find_commands. It edits the user\'s project: run only what the user asked for, one command at a time, and report the result message.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'The command\'s exact name.' } },
      required: ['name'], additionalProperties: false,
    },
  },
  {
    name: 'ae_recent',
    description: 'The latest AE FX runs made through Edie or its page since the panel opened: what ran, whether it worked, and its message.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number', description: 'Default 10, max 20.' } }, additionalProperties: false },
  },
];

const text = (t, isError = false) => ({ content: [{ type: 'text', text: t }], ...(isError ? { isError: true } : {}) });
const notOpen = e => text((e instanceof Closed ? e.message + ' Ask the editor to open it (Window ▸ Extensions ▸ AE FX) and keep it open.' : 'AE FX did not answer: ' + e.message), true);

let cache = null, cachedAt = 0;
async function commands() {
  if (cache && Date.now() - cachedAt < 60_000) return cache;
  const r = await ask('commands', {}, 15_000);
  cache = Array.isArray(r.commands) ? r.commands : [];
  cachedAt = Date.now();
  return cache;
}

async function call(name, args) {
  if (name === 'ae_status') {
    let s = null, err = null;
    try { s = await ask('status'); } catch (e) { err = e; }
    if (!s) return notOpen(err);
    const line = statusLine(s);
    return text([
      `Status: ${line.label}`,
      `Composition: ${s.comp || 'none open'}`,
      `Layers selected: ${s.selected} of ${s.layers}`,
      `Commands available: ${s.commands}${s.effectsLoaded ? '' : ' (AE effects load on the first search)'}`,
      s.busy ? 'A command is running right now.' : '',
    ].filter(Boolean).join('\n'));
  }
  if (name === 'ae_find_commands') {
    let list;
    try { list = await commands(); } catch (e) { return notOpen(e); }
    const limit = Math.max(1, Math.min(50, Number(args.limit) || 15));
    const found = findCommands(list, String(args.query || ''), { kind: String(args.kind || ''), limit });
    if (!found.length) return text(`No command matches "${args.query}". Try fewer or different words.`);
    return text(found.map(c => `- ${c.name}  [${c.kind}${c.category ? ' · ' + c.category : ''}${c.needs ? ' · needs ' + c.needs : ''}]`).join('\n'));
  }
  if (name === 'ae_run') {
    try {
      const r = await ask('run', { name: String(args.name || '') }, 30_000);
      if (!r.ok && /No AE FX command is called/.test(r.error || '')) {
        let near = [];
        try {
          const all = await commands(), asked = String(args.name || '');
          near = findCommands(all, asked, { limit: 5 });
          // A typo ("Overshot") matches nothing whole: try each word's first four letters.
          if (!near.length) near = findCommands(all, asked.split(/\s+/).map(w => w.slice(0, 4)).join(' '), { limit: 5 });
        } catch (_) {}
        return text(r.error + (near.length ? ' Did you mean:\n' + near.map(x => '- ' + x.name).join('\n') : ''), true);
      }
      if (r.error) return text(r.error, true);
      return text(`${r.ok ? 'Done' : 'Failed'}: ${r.name}${r.ms != null ? ` (${r.ms} ms)` : ''}\n${r.message || ''}`.trim(), !r.ok);
    } catch (e) { return notOpen(e); }
  }
  if (name === 'ae_recent') {
    let s;
    try { s = await ask('status'); } catch (e) { return notOpen(e); }
    const limit = Math.max(1, Math.min(20, Number(args.limit) || 10));
    const runs = (s.runs || []).slice(-limit).reverse();
    if (!runs.length) return text('Nothing has run through Edie since the panel opened.');
    return text(runs.map(r => `${r.time}  ${r.outcome.toUpperCase()}  ${r.command} — ${r.detail || ''}`).join('\n'));
  }
  return text('Unknown tool: ' + name, true);
}

function reply(id, result) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n'); }
function fail(id, code, message) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n'); }

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', async line => {
  let msg;
  try { msg = JSON.parse(line); } catch (_) { return; }
  const { id, method, params } = msg || {};
  if (id === undefined) return;
  try {
    if (method === 'initialize') {
      return reply(id, {
        protocolVersion: (params && params.protocolVersion) || '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'aefx', version: VERSION },
        instructions: 'AE FX runs commands in Adobe After Effects on the selected layers or keyframes, through the AE FX panel. Find the exact name with ae_find_commands, then ae_run it. Check ae_status if something fails.',
      });
    }
    if (method === 'ping') return reply(id, {});
    if (method === 'tools/list') return reply(id, { tools: TOOLS });
    if (method === 'tools/call') return reply(id, await call(params && params.name, (params && params.arguments) || {}));
    if (method === 'resources/list') return reply(id, { resources: [] });
    if (method === 'prompts/list') return reply(id, { prompts: [] });
    fail(id, -32601, 'Method not found: ' + method);
  } catch (error) {
    fail(id, -32603, error.message);
  }
});
