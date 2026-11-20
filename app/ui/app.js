// AE FX's page inside Creative Assist (Edie's desk), served at /tools/aefx/…
//   calls  POST /api/tools/aefx/call/<route>   (status, commands, run)
//   events GET  /api/tools/aefx/events         (status)
'use strict';
(function () {
  var match = /^\/tools\/([a-z0-9-]+)\//.exec(location.pathname);
  var base = '/api/tools/' + (match ? match[1] : 'aefx') + '/';
  var root = document.documentElement;

  // The host's look (Dark / Light / System) wins over the computer's.
  function followTheme() {
    try {
      var host = window.parent && window.parent !== window ? window.parent.document.documentElement : null;
      var theme = host && host.dataset.theme;
      if (theme) root.dataset.theme = theme;
      if (host && !followTheme.watching) {
        followTheme.watching = true;
        new MutationObserver(followTheme).observe(host, { attributes: true, attributeFilter: ['data-theme'] });
      }
    } catch (_) { /* not same-origin: the computer's look */ }
  }
  var asked = /[?&]theme=(light|dark)/.exec(location.search);
  if (asked) root.dataset.theme = asked[1]; else followTheme();

  function call(route, body) {
    return fetch(base + 'call/' + route, {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (json) {
        if (!res.ok) throw new Error((json && json.error) || 'Creative Assist answered ' + res.status);
        return json;
      });
    });
  }
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var KINDS = [['', 'All'], ['Custom', 'Custom'], ['Panel', 'Panel'], ['AE effect', 'AE effects'], ['Saved script', 'Saved scripts']];
  var PAGE = 150;
  var all = [], status = null, kind = '', sel = 0, shown = PAGE, results = {}, loading = false, loadedOnce = false;

  function drawStatus(s) {
    status = s;
    var dot = $('dot');
    dot.className = 'dot ' + (s.kind === 'ok' ? 'is-good' : s.kind === 'ready' ? 'is-wait' : 'is-bad');
    $('statusLine').textContent = s.open ? s.label : (s.error ? 'Not answering: ' + s.error : 'The AE FX panel is not open in After Effects');
    $('closed').hidden = !!s.open;
    $('closedDetail').textContent = s.error ? 'After Effects said: ' + s.error : '';
    $('closedDetail').hidden = !s.error;
    $('tools').hidden = !s.open;
    $('reload').hidden = !s.open;
    if (s.open && !loadedOnce && !loading) load();
  }

  function load() {
    loading = true;
    return call('commands').then(function (r) {
      all = (r && r.commands) || [];
      loadedOnce = true;
      draw();
    }).catch(function (e) {
      $('list').innerHTML = '<div class="empty">Couldn’t read the command list: ' + esc(e.message) + '</div>';
    }).finally(function () { loading = false; });
  }

  function filtered() {
    var terms = $('query').value.toLowerCase().split(/\s+/).filter(Boolean);
    var out = all.filter(function (c) {
      if (kind && c.kind !== kind) return false;
      var hay = (c.name + ' ' + c.category + ' ' + c.kind).toLowerCase();
      return terms.every(function (t) { return hay.indexOf(t) >= 0; });
    });
    if (terms.length) {
      var q = terms.join(' ');
      var rank = function (c) { var n = c.name.toLowerCase(); return n === q ? 0 : n.indexOf(q) === 0 ? 1 : terms.every(function (t) { return n.indexOf(t) >= 0; }) ? 2 : 3; };
      out.sort(function (a, b) { return rank(a) - rank(b) || (a.kind === 'AE effect') - (b.kind === 'AE effect'); });
    }
    return out;
  }

  function drawKinds() {
    var terms = $('query').value;
    var html = KINDS.map(function (k) {
      var n = k[0] ? all.filter(function (c) { return c.kind === k[0]; }).length : all.length;
      if (k[0] && !n) return '';
      return '<button type="button" class="kind' + (kind === k[0] ? ' on' : '') + '" role="tab" aria-selected="' + (kind === k[0]) + '" data-kind="' + esc(k[0]) + '">' + esc(k[1]) + '<span>' + n + '</span></button>';
    }).join('');
    if ($('kinds').dataset.html !== html) { $('kinds').dataset.html = html; $('kinds').innerHTML = html; }
    return terms;
  }

  function draw() {
    drawKinds();
    var list = filtered();
    sel = Math.max(0, Math.min(sel, list.length - 1));
    if (!list.length) {
      $('list').innerHTML = '<div class="empty">' + (all.length ? 'Nothing matches. Try fewer words.' : 'No commands yet.') + '</div>';
      return;
    }
    var rows = list.slice(0, shown).map(function (c, i) {
      var r = results[c.name];
      // "Animate · Custom", but "Panel" not "Panel · Panel" and "Saved script" not "Saved · Saved script".
      var cat = String(c.category || ''), kd = c.kind === 'AE effect' ? '' : String(c.kind || '');
      var same = cat && kd && (kd.toLowerCase().indexOf(cat.toLowerCase()) === 0 || cat.toLowerCase().indexOf(kd.toLowerCase()) === 0);
      var meta = same ? kd : [cat, kd].filter(Boolean).join(' · ');
      return '<button type="button" class="row' + (i === sel ? ' sel' : '') + '" role="option" aria-selected="' + (i === sel) + '" data-i="' + i + '" data-kind="' + esc(c.kind) + '">' +
        '<span class="ic"></span><span class="nm"><strong>' + esc(c.name) + '</strong>' + (meta ? '<em>' + esc(meta) + '</em>' : '') + '</span>' +
        '<span class="needs">' + esc(c.needs ? 'Needs ' + c.needs.toLowerCase() : '') + '</span>' +
        (c.shortcut ? '<kbd>' + esc(c.shortcut) + '</kbd>' : '<span></span>') +
        (r ? '<span class="res ' + r.state + '">' + esc(r.text) + '</span>' : '') + '</button>';
    }).join('');
    if (list.length > shown) rows += '<button type="button" class="ghost more" data-more>Show ' + Math.min(PAGE, list.length - shown) + ' more of ' + (list.length - shown) + '</button>';
    $('list').innerHTML = rows;
  }

  function run(i) {
    var c = filtered()[i];
    if (!c) return;
    if (results[c.name] && results[c.name].state === 'running') return;
    results[c.name] = { state: 'running', text: 'Running in After Effects…' };
    draw();
    call('run', { name: c.name }).then(function (r) {
      results[c.name] = r.ok ? { state: 'ok', text: (r.message || 'Done') + (r.ms != null ? ' · ' + (r.ms / 1000).toFixed(1) + ' s' : '') }
        : { state: 'failed', text: r.message || r.error || 'It didn’t run.' };
    }).catch(function (e) {
      results[c.name] = { state: 'failed', text: e.message };
    }).finally(draw);
  }

  function scrollToSel() {
    var el = $('list').querySelector('.row.sel');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  $('query').addEventListener('input', function () { sel = 0; shown = PAGE; draw(); $('list').scrollTop = 0; });
  $('query').addEventListener('keydown', function (e) {
    var n = filtered().length;
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(n - 1, sel + 1); if (sel >= shown) shown += PAGE; draw(); scrollToSel(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); scrollToSel(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    else if (e.key === 'Escape' && $('query').value) { e.preventDefault(); $('query').value = ''; sel = 0; draw(); }
  });
  $('kinds').addEventListener('click', function (e) {
    var b = e.target.closest('.kind');
    if (!b) return;
    kind = b.dataset.kind || ''; sel = 0; shown = PAGE; draw(); $('list').scrollTop = 0;
    $('query').focus();
  });
  $('list').addEventListener('click', function (e) {
    if (e.target.closest('[data-more]')) { shown += PAGE; draw(); return; }
    var row = e.target.closest('.row');
    if (!row) return;
    sel = Number(row.dataset.i);
    run(sel);
    $('query').focus();
  });
  $('reload').addEventListener('click', function () { load(); });

  var events = new EventSource(base + 'events');
  events.addEventListener('status', function (e) { try { drawStatus(JSON.parse(e.data)); } catch (_) {} });
  call('status').then(drawStatus).catch(function (e) { drawStatus({ open: false, kind: 'offline', label: '', error: e.message }); });
  $('query').focus();
})();
