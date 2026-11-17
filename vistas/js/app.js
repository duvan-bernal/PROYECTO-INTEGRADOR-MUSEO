/* ==========================================================================
   MUSEO VIRTUAL · Núcleo (js/app.js)
   - Cabecera y pie compartidos
   - Cliente de la API (fetch hacia los controladores Quarkus)
   - Avisos, diálogos y motor CRUD genérico
   Las páginas se configuran en js/pages.js
   ========================================================================== */
(function () {
  'use strict';

  /* URL base de la API. Vacío = mismo servidor (Quarkus sirve HTML y API).
     Si abres los HTML desde otro servidor, define antes: window.MUSEO_API = 'http://localhost:8080' */
  const API = (window.MUSEO_API || '').replace(/\/$/, '');

  const NAV = [
    ['index.html', 'Inicio', 'inicio'],
    ['museos.html', 'Museos', 'museos'],
    ['salas.html', 'Salas', 'salas'],
    ['obras.html', 'Obras', 'obras'],
    ['categorias.html', 'Categorías', 'categorias'],
    ['artistas.html', 'Artistas', 'artistas'],
    ['visitas.html', 'Visitas', 'visitas'],
    ['recorridos.html', 'Recorridos', 'recorridos']
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => { const t = String(u || '').trim(); return /^(https?:\/\/|\/|images\/)/i.test(t) ? t : ''; };

  function fmtDate(iso, withTime) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return esc(iso);
    return withTime
      ? d.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const toInputDate = (iso) => (iso ? String(iso).slice(0, 16) : '');

  const ICONS = {
    museum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9 12 4l9 5"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 20h18M4 18h16"/></svg>',
    room: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V10a7 7 0 0 1 14 0v11"/><path d="M3 21h18M9 21v-7a3 3 0 0 1 6 0v7"/></svg>',
    art: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1"/><rect x="6" y="7" width="12" height="10"/><path d="m7 15 3.5-4 3 3 2-2 2 3"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/></svg>',
    artist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c5 0 9 3.6 9 8 0 3-2 4-4 4h-2c-1.5 0-2 1-1.4 2.2.6 1.2.2 2.8-1.6 2.8-5 0-9-3.6-9-8s4-9 9-9z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16" cy="10" r="1"/></svg>',
    tour: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>',
    route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8 6h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
  };

  /* ---------- Cliente de la API ---------- */
  async function api(path, opts = {}) {
    const init = { method: opts.method || 'GET', headers: { Accept: 'application/json' } };
    if (opts.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    let res;
    try {
      res = await fetch(API + path, init);
    } catch (e) {
      const err = new Error('No se pudo conectar con el servidor. ¿Está encendido Quarkus (./mvnw quarkus:dev)?');
      err.offline = true;
      throw err;
    }
    const text = await res.text();
    let data = text;
    try { data = text ? JSON.parse(text) : null; } catch (_) { /* era texto plano */ }
    if (!res.ok) {
      const msg = typeof data === 'string' && data ? data : (data && data.message) || ('Error ' + res.status);
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  /* ---------- Avisos ---------- */
  function toast(msg, type = 'ok') {
    let box = $('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 4500);
  }

  /* ---------- Diálogos ---------- */
  function openDialog(title, bodyHtml, { submit = 'Guardar', onSubmit, danger = false, wide = false } = {}) {
    return new Promise((resolve) => {
      const dlg = document.createElement('dialog');
      dlg.setAttribute('aria-labelledby', 'dlg-title');
      dlg.innerHTML =
        '<form class="dlg-form">' +
        '<div class="dlg-head"><h2 id="dlg-title">' + esc(title) + '</h2><button type="button" class="dlg-x" data-close aria-label="Cerrar">&times;</button></div>' +
        '<div class="dlg-body">' + bodyHtml + '<div class="form-error" hidden></div></div>' +
        '<div class="dlg-foot"><button type="button" class="btn ghost" data-close>Cancelar</button>' +
        '<button type="submit" class="btn ' + (danger ? 'danger' : '') + '">' + esc(submit) + '</button></div></form>';
      document.body.appendChild(dlg);
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      const form = $('form', dlg), errBox = $('.form-error', dlg), okBtn = $('button[type=submit]', dlg);
      dlg.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dlg.close()));
      dlg.addEventListener('close', () => { dlg.remove(); finish(false); });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errBox.hidden = true;
        okBtn.disabled = true;
        try {
          if (onSubmit) await onSubmit(form);
          finish(true);
          dlg.close();
        } catch (err) {
          errBox.textContent = err.message;
          errBox.hidden = false;
          okBtn.disabled = false;
        }
      });
      dlg.showModal();
      const first = form.querySelector('input,select,textarea');
      if (first) first.focus();
    });
  }
  const confirmDialog = (msg, label = 'Eliminar') =>
    openDialog('Confirmar', '<p class="confirm-text">' + esc(msg) + '</p>', { submit: label, danger: true });

  /* ---------- Cabecera y pie ---------- */
  function mountLayout() {
    const page = document.body.dataset.page || 'inicio';
    const header = $('#site-header');
    if (header) {
      header.outerHTML =
        '<header class="site-header"><div class="container header-bar">' +
        '<a class="brand" href="index.html" aria-label="Museo Virtual, inicio">' +
        '<svg viewBox="0 0 48 48" fill="none" stroke="#c8a251" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 3 45 24 24 45 3 24Z"/><path d="M24 11 37 24 24 37 11 24Z"/><path d="M24 17v14M17 24h14"/><circle cx="24" cy="24" r="2.2" fill="#c8a251"/></svg>' +
        '<span>Museo Virtual<small>Patrimonio y memoria</small></span></a>' +
        '<button class="nav-toggle" aria-expanded="false" aria-controls="nav" aria-label="Abrir menú">&#9776;</button>' +
        '<nav class="nav" id="nav" aria-label="Principal"><ul>' +
        NAV.map((n) => '<li><a href="' + n[0] + '"' + (n[2] === page ? ' aria-current="page"' : '') + '>' + n[1] + '</a></li>').join('') +
        '</ul></nav></div></header>';
      const toggle = $('.nav-toggle'), nav = $('#nav');
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
      });
    }
    const footer = $('#site-footer');
    if (footer) {
      footer.outerHTML =
        '<footer class="site-footer"><div class="container">' +
        '<p class="brandline">Museo Virtual</p>' +
        '<p>Sistema de Gestión de Museos · Universidad Santo Tomás, Tunja · POO 2026-2</p>' +
        '</div></footer>';
    }
  }

  /* ---------- Piezas reutilizables para tarjetas ---------- */
  function media(url, alt, icon, wide) {
    const u = safeUrl(url);
    return '<div class="card-media' + (wide ? ' wide' : '') + '"><div class="ph">' + (icon || ICONS.art) + '</div>' +
      (u ? '<img loading="lazy" src="' + esc(u) + '" alt="' + esc(alt) + '" onerror="this.remove()">' : '') + '</div>';
  }
  function meta(rows) {
    const li = rows.filter((r) => r && r[1] !== null && r[1] !== undefined && r[1] !== '')
      .map((r) => '<li><b>' + esc(r[0]) + '</b><span>' + (r[2] ? r[1] : esc(r[1])) + '</span></li>').join('');
    return li ? '<ul class="meta">' + li + '</ul>' : '';
  }
  const linkTo = (url) => { const u = safeUrl(url); return u ? '<a class="link-inline" href="' + esc(u) + '" target="_blank" rel="noopener">Abrir enlace</a>' : ''; };
  const bar = (v) => {
    if (v === null || v === undefined) return '—';
    const cls = v >= 70 ? '' : v >= 40 ? 'mid' : 'low';
    return '<span style="flex:1"><b style="color:var(--wine-800)">' + esc(v) + '%</b><span class="bar"><i class="' + cls + '" style="--v:' + Math.max(0, Math.min(100, v)) + '%"></i></span></span>';
  };

  /* ---------- Motor CRUD genérico ---------- */
  async function crud(cfg) {
    const grid = $('#grid'), stateEl = $('#state'), chipsEl = $('#chips'), q = $('#q'), btnNew = $('#btn-new');
    let items = [], refs = {}, chip = 'all';
    const H = { esc, fmtDate, media, meta, linkTo, bar, ICONS, safeUrl };

    const showState = (html, cls) => { stateEl.className = 'state ' + (cls || ''); stateEl.innerHTML = html; stateEl.hidden = false; };
    const hideState = () => { stateEl.hidden = true; };

    async function load() {
      grid.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
      hideState();
      try {
        const refFields = cfg.fields.filter((f) => f.ref);
        const [list, ...rs] = await Promise.all([api(cfg.endpoint), ...refFields.map((f) => api(f.ref.endpoint))]);
        items = Array.isArray(list) ? list : [];
        refFields.forEach((f, i) => { refs[f.key] = Array.isArray(rs[i]) ? rs[i] : []; });
        render();
      } catch (e) {
        grid.innerHTML = '';
        showState(esc(e.message) + '<br><button class="btn ghost small" id="retry">Reintentar</button>', 'error');
        $('#retry').addEventListener('click', load);
      }
    }

    function render() {
      const term = (q.value || '').trim().toLowerCase();
      const base = cfg.filter ? items.filter(cfg.filter) : items;
      const note = cfg.filter && cfg.filterNote ? '<a class="chip" href="' + location.pathname.split('/').pop() + '">&times; ' + esc(cfg.filterNote) + '</a>' : '';
      if (note) chipsEl.innerHTML = note;
      if (cfg.chip) {
        const labels = [...new Set(base.map(cfg.chip).filter(Boolean))].sort();
        if (chip !== 'all' && !labels.includes(chip)) chip = 'all';
        chipsEl.innerHTML = note + (labels.length
          ? ['all', ...labels].map((l) => '<button class="chip" aria-pressed="' + (l === chip) + '" data-chip="' + esc(l) + '">' + (l === 'all' ? 'Todos' : esc(l)) + '</button>').join('')
          : '');
      }
      const shown = base.filter((it) =>
        (chip === 'all' || cfg.chip(it) === chip) && (!term || JSON.stringify(it).toLowerCase().includes(term)));
      grid.innerHTML = shown.map((it, i) =>
        '<article class="card" style="--i:' + Math.min(i, 12) + '" data-id="' + it.id + '">' + cfg.card(it, H) +
        '<div class="card-actions">' + (cfg.extraActions ? cfg.extraActions(it, H) : '') + '<span class="spacer"></span>' +
        '<button class="btn ghost small" data-act="edit">Editar</button>' +
        '<button class="btn danger small" data-act="del">Eliminar</button></div></article>').join('');
      if (!base.length) showState('Aún no hay ' + cfg.plural + ' registrados.<br><button class="btn" id="empty-new">Crear ' + cfg.singular + '</button>');
      else if (!shown.length) showState('Sin resultados para tu búsqueda.');
      else hideState();
      const en = $('#empty-new'); if (en) en.addEventListener('click', () => openForm(null));
    }

    function fieldHtml(f, item) {
      const val = item ? item[f.key] : '';
      const req = f.required ? ' required' : '';
      const star = f.required ? ' <em>*</em>' : '';
      const cls = 'field' + (f.full ? ' full' : '');
      let ctl;
      if (f.ref) {
        const cur = item && item[f.key] ? item[f.key].id : '';
        const opts = (refs[f.key] || []).map((o) => '<option value="' + o.id + '"' + (o.id === cur ? ' selected' : '') + '>' + esc(f.ref.label(o)) + '</option>').join('');
        const none = f.required ? '<option value="" disabled' + (cur ? '' : ' selected') + '>' + ((refs[f.key] || []).length ? 'Selecciona…' : 'Primero crea uno en su módulo') + '</option>' : '<option value="">— Ninguno —</option>';
        ctl = '<select name="' + f.key + '"' + req + '>' + none + opts + '</select>';
      } else if (f.type === 'textarea') {
        ctl = '<textarea name="' + f.key + '" maxlength="' + (f.max || 1000) + '"' + req + '>' + esc(val) + '</textarea>';
      } else {
        const v = f.type === 'datetime-local' ? toInputDate(val) : (val ?? '');
        ctl = '<input name="' + f.key + '" type="' + (f.type || 'text') + '" value="' + esc(v) + '"' + req +
          (f.min !== undefined ? ' min="' + f.min + '"' : '') + (f.max !== undefined && f.type === 'number' ? ' max="' + f.max + '"' : '') +
          (f.type === 'text' || !f.type || f.type === 'url' ? ' maxlength="' + (f.max || 200) + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + '>';
      }
      return '<label class="' + cls + '"><span>' + esc(f.label) + star + '</span>' + ctl + '</label>';
    }

    function readValues(form) {
      const o = {};
      cfg.fields.forEach((f) => {
        const v = form.elements[f.key].value;
        if (f.ref) o[f.key] = v ? { id: Number(v) } : null;
        else if (f.type === 'number') o[f.key] = v === '' ? null : Number(v);
        else if (f.type === 'datetime-local') o[f.key] = v ? (v.length === 16 ? v + ':00' : v) : null;
        else o[f.key] = v.trim() === '' ? null : v.trim();
      });
      return o;
    }

    async function openForm(item) {
      const body = '<div class="form-grid">' + cfg.fields.map((f) => fieldHtml(f, item)).join('') + '</div>';
      const ok = await openDialog((item ? 'Editar ' : (cfg.fem ? 'Nueva ' : 'Nuevo ')) + cfg.singular, body, {
        onSubmit: async (form) => {
          const payload = readValues(form);
          if (item) await api(cfg.endpoint + '/' + item.id, { method: 'PUT', body: payload });
          else await api(cfg.endpoint, { method: 'POST', body: payload });
        }
      });
      if (ok) { toast(item ? 'Cambios guardados' : 'Registro creado'); load(); }
    }

    async function remove(item) {
      const ok = await confirmDialog('¿Eliminar «' + (item.name || cfg.singular) + '»? Esta acción no se puede deshacer.');
      if (!ok) return;
      try {
        await api(cfg.endpoint + '/' + item.id, { method: 'DELETE' });
        toast('Registro eliminado');
        load();
      } catch (e) {
        toast(e.status >= 500 ? 'No se pudo eliminar: probablemente tiene registros asociados (salas, obras, visitas…).' : e.message, 'error');
      }
    }

    grid.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const item = items.find((x) => String(x.id) === b.closest('.card').dataset.id);
      if (b.dataset.act === 'edit') openForm(item); else remove(item);
    });
    chipsEl.addEventListener('click', (e) => { const c = e.target.closest('[data-chip]'); if (c) { chip = c.dataset.chip; render(); } });
    q.addEventListener('input', render);
    btnNew.addEventListener('click', () => openForm(null));
    load();
  }

  window.Museo = { api, esc, safeUrl, fmtDate, toast, openDialog, confirmDialog, crud, ICONS, media, meta, bar, linkTo, $ };
  document.addEventListener('DOMContentLoaded', mountLayout);
})();
