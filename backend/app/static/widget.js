/*
 * Agent3 chat widget.
 *   <script src="https://YOUR-API/widget.js" data-agent-key="pk_..." async></script>
 * Optional: data-position="left", data-open="true".
 * Renders in a shadow root so the host page's CSS can't affect it.
 */
(function () {
  var script = document.currentScript || document.querySelector('script[data-agent-key]');
  if (!script || window.__agent3Widget) return;
  window.__agent3Widget = true;

  var KEY = script.getAttribute('data-agent-key');
  var API = new URL(script.src).origin;
  var LEFT = script.getAttribute('data-position') === 'left';
  var STORE = 'agent3:' + KEY;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }
  var state = load();
  if (!state.visitorId) {
    state.visitorId = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    save(state);
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // small, safe markdown: escape first, then bold, inline code, links, lists, tables and line breaks.
  // Citation markers like [1] are dropped, visitors don't see the source documents.
  function markdown(text) {
    var lines = escapeHtml(text.replace(/\s*\[\d{1,2}\](?!\()/g, '')).split('\n');
    var html = '', inList = false, table = [];
    function inline(s) {
      return s
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }
    function flushTable() {
      if (!table.length) return;
      var rows = table.filter(function (r) { return !/^\|\s*-{2,}/.test(r); });
      html += '<div class="tbl"><table>' + rows.map(function (r, i) {
        var cells = r.replace(/^\||\|$/g, '').split('|');
        var tag = i === 0 ? 'th' : 'td';
        return '<tr>' + cells.map(function (c) { return '<' + tag + '>' + inline(c.trim()) + '</' + tag + '>'; }).join('') + '</tr>';
      }).join('') + '</table></div>';
      table = [];
    }
    lines.forEach(function (line) {
      if (/^\s*\|.*\|\s*$/.test(line)) { table.push(line.trim()); return; }
      flushTable();
      var item = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
      if (item) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += '<li>' + inline(item[1]) + '</li>';
        return;
      }
      if (inList) { html += '</ul>'; inList = false; }
      html += line.trim() ? '<p>' + inline(line) + '</p>' : '';
    });
    flushTable();
    if (inList) html += '</ul>';
    return html;
  }

  var host = document.createElement('div');
  host.id = 'agent3-widget';
  // lets a page remove the widget again (used by the dashboard preview)
  window.Agent3Widget = {
    destroy: function () { host.remove(); window.__agent3Widget = false; delete window.Agent3Widget; }
  };
  host.style.cssText = 'position:fixed;z-index:2147483000;bottom:20px;' + (LEFT ? 'left' : 'right') + ':20px;';
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: 'open' });

  function render(config) {
    var accent = config.accent_color || '#8083ff';
    root.innerHTML =
      '<style>' +
      ':host{all:initial}*{box-sizing:border-box;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}' +
      '.bubble{width:56px;height:56px;border-radius:50%;border:none;background:' + accent + ';color:#fff;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;transition:transform .15s}' +
      '.bubble:hover{transform:scale(1.06)}.bubble svg{width:26px;height:26px}' +
      '.panel{position:absolute;bottom:72px;' + (LEFT ? 'left' : 'right') + ':0;width:380px;max-width:calc(100vw - 40px);height:560px;max-height:calc(100vh - 110px);background:#fff;color:#1f2937;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden}' +
      '.panel.open{display:flex}' +
      '.head{background:' + accent + ';color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}' +
      '.head b{flex:1;font-size:15px;font-weight:600}.head button{background:rgba(255,255,255,.18);border:none;color:#fff;border-radius:8px;padding:5px 8px;cursor:pointer;font-size:12px}' +
      '.msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f8fafc}' +
      '.msg{max-width:85%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.5;word-wrap:break-word}' +
      '.msg p{margin:0 0 6px}.msg p:last-child{margin:0}.msg ul{margin:4px 0;padding-left:18px}.msg code{background:#eef2ff;padding:1px 4px;border-radius:4px;font-size:12px}' +
      '.msg a{color:' + accent + '}' +
      '.tbl{overflow-x:auto;margin:6px 0}.tbl table{border-collapse:collapse;font-size:12.5px}.tbl th,.tbl td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left}.tbl th{background:#f1f5f9}' +
      '.user{align-self:flex-end;background:' + accent + ';color:#fff;border-bottom-right-radius:4px}' +
      '.bot{align-self:flex-start;background:#fff;border:1px solid #e2e8f0;border-bottom-left-radius:4px}' +
      '.err{color:#b91c1c}' +
      '.dots span{display:inline-block;width:6px;height:6px;margin-right:3px;border-radius:50%;background:#94a3b8;animation:b 1s infinite}.dots span:nth-child(2){animation-delay:.15s}.dots span:nth-child(3){animation-delay:.3s}' +
      '@keyframes b{0%,80%,100%{opacity:.3}40%{opacity:1}}' +
      'form{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e8f0;background:#fff}' +
      'textarea{flex:1;resize:none;border:1px solid #cbd5e1;border-radius:10px;padding:9px 10px;font-size:14px;max-height:120px;outline:none;color:#1f2937;background:#fff}' +
      'textarea:focus{border-color:' + accent + '}' +
      'form button{border:none;background:' + accent + ';color:#fff;border-radius:10px;padding:0 14px;cursor:pointer;font-weight:600}form button:disabled{opacity:.5;cursor:default}' +
      '.foot{text-align:center;font-size:10.5px;color:#94a3b8;padding:0 0 8px;background:#fff}' +
      '@media (max-width:480px){.panel{position:fixed;inset:0;width:100vw;height:100%;max-width:none;max-height:none;border-radius:0;bottom:0}}' +
      '</style>' +
      '<div class="panel" role="dialog" aria-label="' + escapeHtml(config.title || 'Chat') + '">' +
      '  <div class="head"><b></b><button type="button" class="new" title="Start a new conversation">New chat</button><button type="button" class="close" aria-label="Close chat">✕</button></div>' +
      '  <div class="msgs" aria-live="polite"></div>' +
      '  <form><textarea rows="1" placeholder="Type your question..." aria-label="Message"></textarea><button type="submit">Send</button></form>' +
      '  <div class="foot">AI answers from ' + escapeHtml(config.agent_name || 'our documents') + ' • may be inaccurate</div>' +
      '</div>' +
      '<button class="bubble" type="button" aria-label="Open chat"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/></svg></button>';

    root.querySelector('.head b').textContent = config.title || 'Chat';
    var panel = root.querySelector('.panel');
    var msgs = root.querySelector('.msgs');
    var form = root.querySelector('form');
    var input = root.querySelector('textarea');
    var sendBtn = root.querySelector('form button');
    var busy = false;

    function add(role, html) {
      var el = document.createElement('div');
      el.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
      el.innerHTML = html;
      msgs.appendChild(el);
      msgs.scrollTop = msgs.scrollHeight;
      return el;
    }
    function greet() {
      msgs.innerHTML = '';
      if (config.greeting) add('bot', markdown(config.greeting));
    }

    function restore() {
      greet();
      if (!state.threadId) return;
      fetch(API + '/widget/' + KEY + '/threads/' + state.threadId + '/messages?visitor_id=' + encodeURIComponent(state.visitorId))
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (list) {
          list.forEach(function (m) {
            add(m.role, m.role === 'user' ? escapeHtml(m.content) : markdown(m.content));
          });
        })
        .catch(function () {});
    }

    function send(text) {
      busy = true;
      sendBtn.disabled = true;
      add('user', escapeHtml(text));
      var bot = add('bot', '<span class="dots"><span></span><span></span><span></span></span>');
      var answer = '';

      fetch(API + '/widget/' + KEY + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: state.visitorId, thread_id: state.threadId || null, message: text })
      }).then(function (res) {
        if (!res.ok || !res.body) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            throw new Error(data.detail || 'Something went wrong. Please try again.');
          });
        }
        var reader = res.body.getReader(), decoder = new TextDecoder(), buffer = '';
        function pump() {
          return reader.read().then(function (r) {
            if (r.done) return;
            buffer += decoder.decode(r.value, { stream: true });
            var parts = buffer.split('\n\n');
            buffer = parts.pop();
            parts.forEach(function (raw) {
              var line = raw.split('\n').filter(function (l) { return l.indexOf('data: ') === 0; })[0];
              if (!line) return;
              var ev = JSON.parse(line.slice(6));
              if (ev.type === 'thread') { state.threadId = ev.thread_id; save(state); }
              else if (ev.type === 'token') { answer += ev.content; bot.innerHTML = markdown(answer); }
              else if (ev.type === 'error') { throw new Error(ev.detail); }
            });
            msgs.scrollTop = msgs.scrollHeight;
            return pump();
          });
        }
        return pump();
      }).then(function () {
        bot.innerHTML = markdown(answer || '…');
      }).catch(function (err) {
        bot.innerHTML = (answer ? markdown(answer) : '') + '<p class="err">' + escapeHtml(err.message) + '</p>';
      }).then(function () {
        busy = false;
        sendBtn.disabled = false;
        msgs.scrollTop = msgs.scrollHeight;
      });
    }

    var restored = false;
    function toggle(open) {
      panel.classList.toggle('open', open);
      if (open && !restored) { restored = true; restore(); }
      if (open) setTimeout(function () { input.focus(); }, 50);
    }
    root.querySelector('.bubble').addEventListener('click', function () { toggle(!panel.classList.contains('open')); });
    root.querySelector('.close').addEventListener('click', function () { toggle(false); });
    root.querySelector('.new').addEventListener('click', function () {
      state.threadId = null; save(state); greet();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || busy) return;
      input.value = '';
      send(text);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });
    if (script.getAttribute('data-open') === 'true') toggle(true);
  }

  fetch(API + '/widget/' + KEY + '/config')
    .then(function (r) { if (!r.ok) throw new Error('widget unavailable'); return r.json(); })
    .then(render)
    .catch(function (e) { console.warn('[agent3 widget]', e.message); host.remove(); });
})();
