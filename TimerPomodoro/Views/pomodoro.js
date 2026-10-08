(function () {
    'use strict';
    var $ = function (id) { return document.getElementById(id); };

    /* ---------- tema (lembra a escolha) ---------- */
    var root = document.documentElement;
    var themeBtn = $('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var t = root.dataset.theme === 'dark' ? 'light' : 'dark';
            root.dataset.theme = t;
            try { localStorage.setItem('tema', t); } catch (e) { }
        });
    }

    /* ---------- relatório de produtividade (modal) ---------- */
    var g = $;
    var modal = g('reportModal');
    if (modal) {
        // Busca os dados no servidor: GET Home/Relatorio?inicio=yyyy-MM-dd&fim=yyyy-MM-dd
        // Resposta esperada: { pomodoros: 0, minutos: 0, tarefas: [ { titulo: "", pomodoros: 0, minutos: 0 } ] }
        var carregar = function () {
            var url = modal.dataset.url + '?inicio=' + g('repIni').value + '&fim=' + g('repFim').value;
            fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                .then(function (r) { return r.json(); })
                .then(mostrar)
                .catch(function () { mostrar({ pomodoros: 0, minutos: 0, tarefas: [] }); });
        };

        var fmt = function (min) { min = Math.round(min || 0); return Math.floor(min / 60) + 'h ' + (min % 60) + 'm'; };
        var hoje = function () { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
        var mostrar = function (r) {
            g('repQtd').textContent = r.pomodoros || 0;
            g('repTempo').textContent = fmt(r.minutos);
            var body = g('repBody'); body.innerHTML = '';
            var itens = r.tarefas || [];
            if (!itens.length) {
                body.innerHTML = '<tr><td colspan="3" class="none">Nenhum registro encontrado para o período selecionado.</td></tr>';
                return;
            }
            itens.forEach(function (t) {
                var tr = document.createElement('tr');
                [t.titulo, t.pomodoros, fmt(t.minutos)].forEach(function (v) {
                    var td = document.createElement('td'); td.textContent = v; tr.appendChild(td);
                });
                body.appendChild(tr);
            });
        };
        var abrir = function () {
            modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
            if (!g('repIni').value) { g('repIni').value = g('repFim').value = hoje(); }
            carregar();
        };
        var fechar = function () { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };
        g('repBtn').addEventListener('click', abrir);
        g('repX').addEventListener('click', fechar);
        g('repFechar').addEventListener('click', fechar);
        g('repFiltrar').addEventListener('click', carregar);
        modal.addEventListener('click', function (e) { if (e.target === modal) fechar(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
    }

    /* ---------- timer (só roda na tela do timer) ---------- */
    var modes = $('modes');
    if (!modes) return;

    var cfg = {
        focus: +modes.dataset.focus,
        short: +modes.dataset.short,
        long: +modes.dataset.long
    };
    var names = { focus: 'Foco', short: 'Pausa Curta', long: 'Pausa Longa' };
    var C = 2 * Math.PI * 128;
    var mode = 'focus', total = cfg.focus * 60, left = total, tick = null;
    var cycles = parseInt($('nowCycles').textContent, 10) || 0;

    function render() {
        var m = String(Math.floor(left / 60)).padStart(2, '0');
        var s = String(left % 60).padStart(2, '0');
        $('time').textContent = m + ':' + s;
        $('modeLabel').textContent = names[mode];
        var p = Math.max((total - left) / total, 0.04);
        $('prog').setAttribute('stroke-dasharray', (p * C) + ' ' + C);
        $('nowCycles').textContent = cycles;
        document.querySelectorAll('#modes button').forEach(function (b) {
            b.classList.toggle('sel', b.dataset.mode === mode);
        });
    }

    function stop() { clearInterval(tick); tick = null; }

    function setMode(m) {
        stop();
        mode = m;
        total = left = cfg[m] * 60;
        render();
    }

    $('start').addEventListener('click', function () {
        if (tick) return;
        tick = setInterval(function () {
            left--;
            if (left <= 0) {
                stop();
                left = 0;
                if (mode === 'focus') cycles++;
                // aqui você pode chamar seu backend (ex.: fetch('/Home/FinalizarCiclo', { method: 'POST' }))
            }
            render();
        }, 1000);
    });
    $('pause').addEventListener('click', stop);
    $('reset').addEventListener('click', function () { setMode(mode); });
    document.querySelectorAll('#modes button').forEach(function (b) {
        b.addEventListener('click', function () { setMode(b.dataset.mode); });
    });

    render();
})();
