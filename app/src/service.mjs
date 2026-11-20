// AE FX as a Creative Assist tool: the backend its page (app/ui) talks to
// through the host. Contract (tool.json): createService(ctx) → { handle, summary, stop }.
import { ask, statusLine, Closed } from './core.mjs';

export function createService(ctx) {
  let status = null, error = null, timer = null, stopped = false;

  async function poll() {
    if (stopped) return;
    try { status = await ask('status', {}, 2500); error = null; }
    catch (e) { status = null; error = e; }
    ctx.emit('status', view());
    clearTimeout(timer);
    timer = setTimeout(poll, ctx.watching() > 0 ? 1500 : 4000);
  }
  function view() {
    const line = statusLine(status, error);
    return { ...line, open: !!status, comp: status?.comp || '', selected: status?.selected ?? 0, layers: status?.layers ?? 0,
      commands: status?.commands ?? 0, runs: status?.runs || [], error: error && !(error instanceof Closed) ? error.message : '' };
  }
  poll();

  return {
    async handle(route, body) {
      if (route === 'status') { try { status = await ask('status', {}, 2500); error = null; } catch (e) { status = null; error = e; } return view(); }
      if (route === 'commands') return ask('commands', {}, 15_000);
      if (route === 'run') {
        const r = await ask('run', { name: String(body?.name || '') }, 30_000);
        clearTimeout(timer); timer = setTimeout(poll, 50);
        return r;
      }
      throw new Error('Unknown route: ' + route);
    },
    summary() {
      const v = view();
      const today = new Date().toISOString().slice(0, 10);
      const runs = v.runs.filter(r => String(r.time).startsWith(today));
      return {
        ok: v.open, kind: v.kind, label: v.label, error: v.error || null, commands: v.commands,
        today: { ok: runs.filter(r => r.outcome === 'ok').length, failed: runs.filter(r => r.outcome !== 'ok').length, fired: runs.length },
        recent: v.runs.slice(-5).reverse().map(r => ({ time: r.time, outcome: r.outcome, command: r.command, detail: r.detail || '' })),
      };
    },
    stop() { stopped = true; clearTimeout(timer); },
  };
}
