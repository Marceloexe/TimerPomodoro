(function () {
    'use strict';
    var $ = function (id) { return document.getElementById(id); };

    var root = document.documentElement;
    var themeBtn = $('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var t = root.dataset.theme === 'dark' ? 'light' : 'dark';
            root.dataset.theme = t;
            try { localStorage.setItem('tema', t); } catch (e) { }
        });
    }

    var g = $;
    var modal = g('reportModal');
    if (modal) {
        var carregar = function () {
            var url = modal.dataset.url + '?dataInicio=' + encodeURIComponent(g('repIni').value) + '&dataFim=' + encodeURIComponent(g('repFim').value);

            fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                .then(function (r) {
                    if (!r.ok) throw new Error('Falha no relatorio');
                    return r.json();
                })
                .then(mostrar)
                .catch(function () {
                    g('repQtd').textContent = '—';
                    g('repTempo').textContent = '—';
                    // Benotzung vun HTML Entities fir d'Sonderzeechen ze garantéieren
                    g('repBody').innerHTML = '<tr><td colspan="3" class="none">N&atilde;o foi poss&iacute;vel carregar o relat&oacute;rio. Confira a conex&atilde;o com o banco e tente novamente.</td></tr>';
                });
        };

        var fmt = function (min) { min = Math.round(min || 0); return Math.floor(min / 60) + 'h ' + (min % 60) + 'm'; };
        var hoje = function () { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

        var mostrar = function (r) {
            g('repQtd').textContent = r.TotalPomodoros || 0;
            g('repTempo').textContent = r.TempoTotal || '0h 0m';
            var body = g('repBody'); body.innerHTML = '';
            var itens = r.DetalhamentoTarefas || [];

            if (!itens.length) {
                body.innerHTML = '<tr><td colspan="3" class="none">Nenhum registro encontrado para o per&iacute;odo selecionado.</td></tr>';
                return;
            }

            itens.forEach(function (t) {
                var tr = document.createElement('tr');
                [t.NomeTarefa, t.PomodorosConcluidos, t.TempoTotal].forEach(function (v) {
                    var td = document.createElement('td');
                    td.textContent = v !== undefined && v !== null ? v : '';
                    tr.appendChild(td);
                });
                body.appendChild(tr);
            });
        };

        var abrir = function () {
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            if (!g('repIni').value) { g('repIni').value = g('repFim').value = hoje(); }
            carregar();
        };

        var fechar = function () {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
        };

        g('repBtn').addEventListener('click', abrir);
        g('repX').addEventListener('click', fechar);
        g('repFechar').addEventListener('click', fechar);
        g('repFiltrar').addEventListener('click', carregar);

        modal.addEventListener('click', function (e) { if (e.target === modal) fechar(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
    }
})();