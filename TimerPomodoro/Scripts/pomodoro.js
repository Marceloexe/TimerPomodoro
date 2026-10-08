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
            var url = modal.dataset.url + '?dataInicio=' + g('repIni').value + '&dataFim=' + g('repFim').value;
            fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                .then(function (r) { if (!r.ok) throw new Error('Falha no relatório'); return r.json(); })
                .then(mostrar)
                .catch(function () { g('repQtd').textContent = '—'; g('repTempo').textContent = '—'; g('repBody').innerHTML = '<tr><td colspan="3" class="none">Não foi possível carregar o relatório. Confira a conexão com o banco e tente novamente.</td></tr>'; });
        };

        var fmt = function (min) { min = Math.round(min || 0); return Math.floor(min / 60) + 'h ' + (min % 60) + 'm'; };
        var hoje = function () { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
        var mostrar = function (r) {
            g('repQtd').textContent = r.TotalPomodoros || 0;
            g('repTempo').textContent = r.TempoTotal || '0h 0m';
            var body = g('repBody'); body.innerHTML = '';
            var itens = r.DetalhamentoTarefas || [];
            if (!itens.length) {
                body.innerHTML = '<tr><td colspan="3" class="none">Nenhum registro encontrado para o período selecionado.</td></tr>';
                return;
            }
            itens.forEach(function (t) {
                var tr = document.createElement('tr');
                [t.NomeTarefa, t.PomodorosConcluidos, t.TempoTotal].forEach(function (v) {
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

})();
