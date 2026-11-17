/* ==========================================================================
   MUSEO VIRTUAL · Configuración de cada página (js/pages.js)
   Cada módulo se conecta a un controlador de tu API Quarkus:
     museos → /museos · salas → /salas · obras → /obras · categorias → /categorias
     artistas → /artistas · visitas → /visitas · recorridos → /recorridos
   ========================================================================== */
(function () {
  'use strict';
  const { crud, api, esc, fmtDate, toast, openDialog, confirmDialog, ICONS, $ } = window.Museo;

  const pages = {

    /* ---------------------------- 1. MUSEOS ---------------------------- */
    museos: () => crud({
      endpoint: '/museos', singular: 'museo', plural: 'museos',
      fields: [
        { key: 'name', label: 'Nombre', required: true, full: true, max: 100 },
        { key: 'description', label: 'Descripción', type: 'textarea', full: true, max: 200 },
        { key: 'latitude', label: 'Latitud', max: 200 },
        { key: 'longitude', label: 'Longitud', max: 200 },
        { key: 'url', label: 'Página web (URL)', type: 'url', full: true }
      ],
      card: (m, H) =>
        H.media(null, m.name, H.ICONS.museum, true) +
        '<div class="card-body"><p class="card-kicker">Museo</p><h3>' + H.esc(m.name) + '</h3>' +
        '<p class="desc">' + H.esc(m.description || 'Sin descripción.') + '</p>' +
        H.meta([
          ['Coordenadas', m.latitude && m.longitude ? m.latitude + ', ' + m.longitude : ''],
          ['Sitio web', H.linkTo(m.url), true]
        ]) + '</div>'
    }),

    /* ---------------------------- 2. SALAS ----------------------------- */
    salas: () => crud({
      endpoint: '/salas', fem: true, singular: 'sala', plural: 'salas',
      chip: (r) => r.museum && r.museum.name,
      fields: [
        { key: 'museum', label: 'Museo', ref: { endpoint: '/museos', label: (m) => m.name }, required: true, full: true },
        { key: 'name', label: 'Nombre de la sala', required: true, full: true, max: 100 },
        { key: 'description', label: 'Descripción', type: 'textarea', full: true, max: 200 },
        { key: 'capacity', label: 'Capacidad (personas)', type: 'number', min: 0 }
      ],
      card: (r, H) =>
        H.media(null, r.name, H.ICONS.room, true) +
        '<div class="card-body"><p class="card-kicker">' + H.esc(r.museum ? r.museum.name : 'Sala') + '</p><h3>' + H.esc(r.name) + '</h3>' +
        '<p class="desc">' + H.esc(r.description || 'Sin descripción.') + '</p>' +
        H.meta([['Capacidad', r.capacity != null ? r.capacity + ' personas' : '']]) + '</div>',
      extraActions: (r) => '<a class="btn small" href="obras.html?sala=' + r.id + '">Ver obras</a>'
    }),

    /* ---------------------------- 3. OBRAS ----------------------------- */
    obras: () => {
      // Filtros que llegan por la URL: obras.html?sala=1 · ?categoria=2 · ?artista=3
      const qs = new URLSearchParams(location.search);
      const sala = qs.get('sala'), cat = qs.get('categoria'), art = qs.get('artista');
      const filter = sala ? (o) => o.exhibitionRoom && String(o.exhibitionRoom.id) === sala
        : cat ? (o) => o.category && String(o.category.id) === cat
        : art ? (o) => o.artist && String(o.artist.id) === art : null;
      return crud({
        endpoint: '/obras', fem: true, singular: 'obra', plural: 'obras',
        chip: (o) => o.category && o.category.name,
        filter, filterNote: sala ? 'Filtrando por sala' : cat ? 'Filtrando por categoría' : art ? 'Filtrando por artista' : '',
        fields: [
          { key: 'name', label: 'Nombre de la obra', required: true, full: true, max: 100 },
          { key: 'description', label: 'Descripción', type: 'textarea', full: true, max: 200 },
          { key: 'imageUrl', label: 'URL de la imagen', type: 'url', full: true },
          { key: 'createdAt', label: 'Fecha de creación', type: 'datetime-local' },
          { key: 'acquiredAt', label: 'Fecha de adquisición', type: 'datetime-local' },
          { key: 'conditionPercentage', label: 'Conservación (%)', type: 'number', min: 0, max: 100 },
          { key: 'category', label: 'Categoría', ref: { endpoint: '/categorias', label: (c) => c.name }, required: true },
          { key: 'artist', label: 'Artista (opcional)', ref: { endpoint: '/artistas', label: (a) => a.name } },
          { key: 'exhibitionRoom', label: 'Sala de exposición', ref: { endpoint: '/salas', label: (s) => s.name + (s.museum ? ' · ' + s.museum.name : '') }, required: true }
        ],
        card: (o, H) =>
          H.media(o.imageUrl, o.name, H.ICONS.art) +
          '<div class="card-body"><p class="card-kicker">' + H.esc(o.category ? o.category.name : 'Obra') + '</p><h3>' + H.esc(o.name) + '</h3>' +
          '<p class="desc">' + H.esc(o.description || 'Sin descripción.') + '</p>' +
          H.meta([
            ['Artista', o.artist ? o.artist.name : 'Sin artista'],
            ['Sala', o.exhibitionRoom ? o.exhibitionRoom.name : ''],
            ['Creación', o.createdAt ? H.fmtDate(o.createdAt) : ''],
            ['Adquisición', o.acquiredAt ? H.fmtDate(o.acquiredAt) : ''],
            ['Conservación', H.bar(o.conditionPercentage), true]
          ]) + '</div>'
      });
    },

    /* --------------------------- 4. CATEGORÍAS ------------------------- */
    categorias: () => crud({
      endpoint: '/categorias', fem: true, singular: 'categoría', plural: 'categorías',
      fields: [
        { key: 'name', label: 'Nombre', required: true, full: true, max: 100 },
        { key: 'description', label: 'Descripción', type: 'textarea', full: true, max: 200 }
      ],
      card: (c, H) =>
        H.media(null, c.name, H.ICONS.tag, true) +
        '<div class="card-body"><p class="card-kicker">Categoría</p><h3>' + H.esc(c.name) + '</h3>' +
        '<p class="desc">' + H.esc(c.description || 'Sin descripción.') + '</p></div>',
      extraActions: (c) => '<a class="btn small" href="obras.html?categoria=' + c.id + '">Ver obras</a>'
    }),

    /* ---------------------------- 5. ARTISTAS -------------------------- */
    artistas: () => crud({
      endpoint: '/artistas', singular: 'artista', plural: 'artistas',
      chip: (a) => a.nationality,
      fields: [
        { key: 'name', label: 'Nombre', required: true, full: true, max: 100 },
        { key: 'nationality', label: 'Nacionalidad', full: true, max: 100 },
        { key: 'biography', label: 'Biografía', type: 'textarea', full: true, max: 1000 }
      ],
      card: (a, H) =>
        H.media(null, a.name, H.ICONS.artist, true) +
        '<div class="card-body"><p class="card-kicker">' + H.esc(a.nationality || 'Artista') + '</p><h3>' + H.esc(a.name) + '</h3>' +
        '<p class="desc">' + H.esc(a.biography || 'Sin biografía registrada.') + '</p></div>',
      extraActions: (a) => '<a class="btn small" href="obras.html?artista=' + a.id + '">Ver obras</a>'
    }),

    /* ------------------------ 6. VISITAS GUIADAS ----------------------- */
    visitas: () => {
      const estado = (t) => {
        const now = Date.now(), s = new Date(t.startAt).getTime(), e = new Date(t.endAt).getTime();
        return now < s ? 'Próxima' : now > e ? 'Finalizada' : 'Activa';
      };
      return crud({
        endpoint: '/visitas', fem: true, singular: 'visita guiada', plural: 'visitas guiadas',
        chip: estado,
        fields: [
          { key: 'name', label: 'Nombre de la visita', required: true, full: true, max: 100 },
          { key: 'description', label: 'Descripción', type: 'textarea', full: true, max: 200 },
          { key: 'startAt', label: 'Inicio', type: 'datetime-local', required: true },
          { key: 'endAt', label: 'Fin', type: 'datetime-local', required: true },
          { key: 'url', label: 'Página web (URL)', type: 'url', full: true }
        ],
        card: (t, H) => {
          const e = estado(t), cls = e === 'Activa' ? 'ok' : e === 'Próxima' ? 'warn' : 'off';
          return '<span class="badge card-badge ' + cls + '">' + e + '</span>' +
            H.media(null, t.name, H.ICONS.tour, true) +
            '<div class="card-body"><p class="card-kicker">Visita guiada</p><h3>' + H.esc(t.name) + '</h3>' +
            '<p class="desc">' + H.esc(t.description || 'Sin descripción.') + '</p>' +
            H.meta([['Inicio', H.fmtDate(t.startAt, true)], ['Fin', H.fmtDate(t.endAt, true)], ['Sitio web', H.linkTo(t.url), true]]) + '</div>';
        },
        extraActions: (t) => '<a class="btn small" href="recorridos.html?visita=' + t.id + '">Recorrido</a>'
      });
    },

    /* ----------------------- 7. RECORRIDOS (visita ↔ sala) -------------- */
    recorridos: async () => {
      const sel = $('#tour-select'), box = $('#route'), addForm = $('#add-form'), roomSel = $('#room-select'), orderIn = $('#order-input'), info = $('#tour-info');
      let stops = [], rooms = [], tours = [];

      const draw = () => {
        if (!sel.value) { box.innerHTML = '<p class="state">Elige una visita guiada para ver su recorrido.</p>'; addForm.hidden = true; info.hidden = true; return; }
        const t = tours.find((x) => String(x.id) === sel.value);
        info.hidden = false;
        info.innerHTML = '<h2>' + esc(t.name) + '</h2><p>' + esc(t.description || 'Sin descripción.') + '</p><p class="empty-hint">' + fmtDate(t.startAt, true) + ' → ' + fmtDate(t.endAt, true) + '</p>';
        addForm.hidden = false;
        const used = new Set(stops.map((s) => s.exhibitionRoom.id));
        const free = rooms.filter((r) => !used.has(r.id));
        roomSel.innerHTML = free.length
          ? free.map((r) => '<option value="' + r.id + '">' + esc(r.name + (r.museum ? ' · ' + r.museum.name : '')) + '</option>').join('')
          : '<option value="">No quedan salas por agregar</option>';
        roomSel.disabled = !free.length; $('#add-btn').disabled = !free.length;
        orderIn.value = stops.length ? Math.max(...stops.map((s) => s.sequenceNumber)) + 1 : 1;
        box.innerHTML = stops.length
          ? '<ol class="timeline">' + stops.map((s, i) =>
            '<li class="stop" style="--i:' + i + '" data-n="' + esc(s.sequenceNumber) + '" data-room="' + s.exhibitionRoom.id + '" data-seq="' + esc(s.sequenceNumber) + '">' +
            '<div><h3>' + esc(s.exhibitionRoom.name) + '</h3><small>' + esc(s.exhibitionRoom.museum ? s.exhibitionRoom.museum.name : '') +
            (s.exhibitionRoom.capacity != null ? ' · capacidad ' + esc(s.exhibitionRoom.capacity) : '') + '</small></div>' +
            '<div class="card-actions"><button class="btn ghost small" data-act="order">Cambiar orden</button><button class="btn danger small" data-act="remove">Quitar</button></div></li>').join('') + '</ol>'
          : '<p class="state">Esta visita todavía no tiene salas. Agrega la primera abajo.</p>';
      };

      const loadStops = async () => {
        if (!sel.value) { stops = []; return draw(); }
        try { stops = (await api('/recorridos/visita/' + sel.value)) || []; stops.sort((a, b) => a.sequenceNumber - b.sequenceNumber); }
        catch (e) { toast(e.message, 'error'); stops = []; }
        draw();
      };

      try {
        [tours, rooms] = await Promise.all([api('/visitas'), api('/salas')]);
      } catch (e) { box.innerHTML = '<p class="state error">' + esc(e.message) + '</p>'; return; }
      sel.innerHTML = '<option value="">— Selecciona una visita —</option>' + tours.map((t) => '<option value="' + t.id + '">' + esc(t.name) + '</option>').join('');
      const pre = new URLSearchParams(location.search).get('visita');
      if (pre && tours.some((t) => String(t.id) === pre)) sel.value = pre;
      sel.addEventListener('change', loadStops);

      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api('/recorridos', { method: 'POST', body: { id: { tourId: Number(sel.value), exhibitionRoomId: Number(roomSel.value) }, sequenceNumber: Number(orderIn.value) } });
          toast('Sala agregada al recorrido'); loadStops();
        } catch (err) { toast(err.message, 'error'); }
      });

      box.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        const li = b.closest('.stop'), roomId = li.dataset.room;
        if (b.dataset.act === 'remove') {
          if (!(await confirmDialog('¿Quitar esta sala del recorrido?', 'Quitar'))) return;
          try { await api('/recorridos/' + sel.value + '/' + roomId, { method: 'DELETE' }); toast('Sala quitada'); loadStops(); }
          catch (err) { toast(err.message, 'error'); }
        } else {
          const ok = await openDialog('Cambiar orden', '<label class="field"><span>Posición en el recorrido <em>*</em></span><input name="seq" type="number" min="1" required value="' + esc(li.dataset.seq) + '"></label>', {
            onSubmit: (form) => api('/recorridos/' + sel.value + '/' + roomId, { method: 'PUT', body: { sequenceNumber: Number(form.elements.seq.value) } })
          });
          if (ok) { toast('Orden actualizado'); loadStops(); }
        }
      });
      await loadStops();
    },

    /* ----------------------------- INICIO ------------------------------ */
    inicio: async () => {
      const counts = { museos: '/museos', salas: '/salas', obras: '/obras', categorias: '/categorias', artistas: '/artistas', visitas: '/visitas' };
      let failed = 0;
      await Promise.all(Object.entries(counts).map(async ([k, url]) => {
        const el = document.querySelector('[data-count="' + k + '"]');
        try { const l = await api(url); if (el) el.textContent = l.length + (l.length === 1 ? ' registro' : ' registros'); if (k === 'obras') featured(l); }
        catch (e) { failed++; if (el) el.textContent = ''; }
      }));
      if (failed === Object.keys(counts).length) {
        const b = document.createElement('div');
        b.className = 'banner-offline';
        b.textContent = 'No hay conexión con la API. Enciende el servidor con ./mvnw quarkus:dev y recarga la página.';
        document.body.prepend(b);
      }
      function featured(list) {
        const withImg = list.filter((o) => window.Museo.safeUrl(o.imageUrl)).slice(0, 3);
        const box = $('#featured');
        if (!box || !withImg.length) return;
        box.hidden = false;
        $('#featured-grid').innerHTML = withImg.map((o, i) =>
          '<article class="card" style="--i:' + i + '">' + window.Museo.media(o.imageUrl, o.name, ICONS.art) +
          '<div class="card-body"><p class="card-kicker">' + esc(o.category ? o.category.name : 'Obra') + '</p><h3>' + esc(o.name) + '</h3>' +
          '<p class="desc">' + esc(o.description || '') + '</p></div><div class="card-actions"><a class="btn small" href="obras.html">Ver todas las obras</a></div></article>').join('');
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const run = pages[document.body.dataset.page];
    if (run) run();
  });
})();
