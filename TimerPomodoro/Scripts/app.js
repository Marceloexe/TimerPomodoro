var app = angular.module('pomodoroApp', []);

app.controller('timerController', function ($scope, $interval, $http, $timeout, $window) {

    $scope.redirecionar = function (url) {
        $window.location.href = url;
    };

    var TEMPO_FOCO = 25 * 60;
    var TEMPO_PAUSA_CURTA = 5 * 60;
    var TEMPO_PAUSA_LONGA = 15 * 60;

    $scope.tempoFocoCustom = 25;
    $scope.pausaCurtaCustom = 5;
    $scope.pausaLongaCustom = 15;

    var promessaTimer;
    var ciclosCompletados = 0;
    var tocadorDeAudio = new Audio((window.pomodoroBaseUrl || '/') + 'despertador-iphone.mp3');
    var dataInicioSessaoAtual = null;

    $scope.tempoAtual = TEMPO_FOCO;
    $scope.faseAtual = "Foco";
    $scope.tarefas = [];
    $scope.tarefaAtiva = null;
    $scope.mensagemErroPersistencia = null;

    var hoje = new Date();
    $scope.filtroRelatorio = {
        dataInicio: hoje,
        dataFim: hoje
    };

    $scope.relatorioData = {
        TotalPomodoros: 0,
        TempoTotal: '0h 0m',
        DetalhamentoTarefas: []
    };

    $scope.abrirModalRelatorio = function () {
        $scope.buscarRelatorio();
    };

    $scope.buscarRelatorio = function () {
        var inicioStr = $scope.filtroRelatorio.dataInicio ? new Date($scope.filtroRelatorio.dataInicio).toISOString().split('T')[0] : '';
        var fimStr = $scope.filtroRelatorio.dataFim ? new Date($scope.filtroRelatorio.dataFim).toISOString().split('T')[0] : '';

        $http.get((window.pomodoroBaseUrl || '/') + 'Tarefas/ObterRelatorioHoras', {
            params: { dataInicio: inicioStr, dataFim: fimStr }
        }).then(function (response) {
            if (response.data) {
                $scope.relatorioData = response.data;
            }
        }).catch(function (err) {
            console.error('Erro ao carregar relatório de produtividade:', err);
        });
    };

    var tarefaSalva = localStorage.getItem('tarefaAtiva');
    if (tarefaSalva) {
        try {
            var t = JSON.parse(tarefaSalva);
            $scope.tarefaAtiva = t;
            TEMPO_FOCO = (t.TempoFoco || 25) * 60;
            TEMPO_PAUSA_CURTA = (t.PausaCurta || 5) * 60;
            TEMPO_PAUSA_LONGA = (t.PausaLonga || 15) * 60;
            $scope.tempoFocoCustom = t.TempoFoco || 25;
            $scope.pausaCurtaCustom = t.PausaCurta || 5;
            $scope.pausaLongaCustom = t.PausaLonga || 15;
            $scope.tempoAtual = TEMPO_FOCO;
        } catch (e) {
            console.error('Erro ao ler localStorage:', e);
        }
    }

    $scope.limparFormulario = function () {
        $scope.novaTarefa = {
            Id: 0,
            Titulo: '',
            Descricao: '',
            TempoFoco: 25,
            PausaCurta: 5,
            PausaLonga: 15,
            PomodorosConcluidos: 0,
            Concluida: false
        };
    };

    $scope.carregarTarefas = function () {
        $http.get((window.pomodoroBaseUrl || '/') + 'Tarefas/Listar').then(function (response) {
            if (response.data && Array.isArray(response.data)) {
                $scope.tarefas = response.data;
            }
        }).catch(function (error) {
            console.error('[ERRO API] Falha ao carregar lista de tarefas:', error);
        });
    };

    $scope.salvarTarefa = function () {
        if (!$scope.novaTarefa.Titulo) return;

        $http.post((window.pomodoroBaseUrl || '/') + 'Tarefas/Salvar', $scope.novaTarefa).then(function (response) {
            $scope.carregarTarefas();
            $scope.limparFormulario();
        }).catch(function (err) {
            alert('Não foi possível salvar a tarefa no banco de dados.');
            console.error('[ERRO CRUD] Falha em salvarTarefa:', err);
        });
    };

    $scope.selecionarETimer = function (tarefa, urlRedirecionamento) {
        $scope.selecionarTarefa(tarefa);
        localStorage.setItem('tarefaAtiva', JSON.stringify(tarefa));

        if (urlRedirecionamento) {
            $window.location.href = urlRedirecionamento;
        }
    };

    $scope.editarTarefa = function (tarefa) {
        $scope.novaTarefa = angular.copy(tarefa);
    };

    $scope.deletarTarefa = function (id) {
        if (confirm("Deseja eliminar esta tarefa?")) {
            $http.post((window.pomodoroBaseUrl || '/') + 'Tarefas/Excluir/' + id).then(function () {
                if ($scope.tarefaAtiva && $scope.tarefaAtiva.Id === id) {
                    $scope.tarefaAtiva = null;
                    localStorage.removeItem('tarefaAtiva');
                }
                $scope.carregarTarefas();
            }).catch(function (err) {
                alert('Erro ao excluir tarefa.');
                console.error('[ERRO CRUD] Falha ao excluir:', err);
            });
        }
    };

    $scope.selecionarTarefa = function (tarefa) {
        $scope.tarefaAtiva = tarefa;

        TEMPO_FOCO = (tarefa.TempoFoco || 25) * 60;
        TEMPO_PAUSA_CURTA = (tarefa.PausaCurta || 5) * 60;
        TEMPO_PAUSA_LONGA = (tarefa.PausaLonga || 15) * 60;

        $scope.tempoFocoCustom = tarefa.TempoFoco || 25;
        $scope.pausaCurtaCustom = tarefa.PausaCurta || 5;
        $scope.pausaLongaCustom = tarefa.PausaLonga || 15;

        $scope.pausar();
        if ($scope.faseAtual === "Foco") $scope.tempoAtual = TEMPO_FOCO;
        else if ($scope.faseAtual === "Pausa Curta") $scope.tempoAtual = TEMPO_PAUSA_CURTA;
        else $scope.tempoAtual = TEMPO_PAUSA_LONGA;

        atualizarTela();
    };

    function registrarSessaoConcluida() {
        if (!$scope.tarefaAtiva) return;

        var payloadSessao = {
            TarefaId: $scope.tarefaAtiva.Id,
            DataInicio: dataInicioSessaoAtual ? dataInicioSessaoAtual.toISOString() : new Date().toISOString(),
            DataFim: new Date().toISOString()
        };

        $scope.tarefaAtiva.PomodorosConcluidos = ($scope.tarefaAtiva.PomodorosConcluidos || 0) + 1;

        $http.post((window.pomodoroBaseUrl || '/') + 'Tarefas/SalvarSessao', payloadSessao)
            .then(function (res) {
                if (res.data && res.data.sucesso) {
                    $scope.tarefaAtiva.PomodorosConcluidos = res.data.pomodorosConcluidos;
                    localStorage.setItem('tarefaAtiva', JSON.stringify($scope.tarefaAtiva));
                }
            })
            .catch(function (error) {
                console.error('[FALHA DE PERSISTÊNCIA DA SESSÃO]', {
                    momento: new Date().toISOString(),
                    tarefaId: payloadSessao.TarefaId,
                    statusHttp: error.status,
                    detalhes: error.data || 'Servidor indisponível / Sem conexão'
                });

                $scope.mensagemErroPersistencia = "Aviso: Conexão com o banco falhou. A sessão foi contabilizada na tela, mas não foi salva no servidor.";

                $timeout(function () {
                    $scope.mensagemErroPersistencia = null;
                }, 6000);
            });
    }

    function avancarFase() {
        $scope.pausar();
        tocadorDeAudio.play().catch(function (e) { console.error(e); });

        if ($scope.faseAtual === "Foco") {
            registrarSessaoConcluida();
            ciclosCompletados++;

            if (ciclosCompletados % 4 === 0) {
                $scope.faseAtual = "Pausa Longa";
                $scope.tempoAtual = TEMPO_PAUSA_LONGA;
            } else {
                $scope.faseAtual = "Pausa Curta";
                $scope.tempoAtual = TEMPO_PAUSA_CURTA;
            }
        } else {
            $scope.faseAtual = "Foco";
            $scope.tempoAtual = TEMPO_FOCO;
        }

        atualizarTela();
    }

    $scope.mudarFase = function (fase) {
        $scope.pausar();
        dataInicioSessaoAtual = null;
        $scope.faseAtual = fase;
        $scope.tempoAtual = fase === "Foco" ? TEMPO_FOCO : fase === "Pausa Curta" ? TEMPO_PAUSA_CURTA : TEMPO_PAUSA_LONGA;
        atualizarTela();
    };

    function atualizarTela() {
        var total = $scope.faseAtual === "Foco" ? TEMPO_FOCO : $scope.faseAtual === "Pausa Curta" ? TEMPO_PAUSA_CURTA : TEMPO_PAUSA_LONGA;
        $scope.progressoTimer = Math.max(0.04, Math.min(1, (total - $scope.tempoAtual) / total)) * 805;
        var minutos = Math.floor($scope.tempoAtual / 60);
        var segundos = $scope.tempoAtual % 60;
        $scope.tempoFormatado = (minutos < 10 ? "0" : "") + minutos + ":" + (segundos < 10 ? "0" : "") + segundos;
    }

    $scope.iniciar = function () {
        tocadorDeAudio.pause();
        if (angular.isDefined(promessaTimer)) return;

        if ($scope.faseAtual === "Foco" && !dataInicioSessaoAtual) {
            dataInicioSessaoAtual = new Date();
        }

        promessaTimer = $interval(function () {
            if ($scope.tempoAtual > 0) {
                $scope.tempoAtual--;
                atualizarTela();
            } else {
                avancarFase();
                dataInicioSessaoAtual = null;
            }
        }, 1000);
    };

    $scope.pausar = function () {
        tocadorDeAudio.pause();
        if (angular.isDefined(promessaTimer)) {
            $interval.cancel(promessaTimer);
            promessaTimer = undefined;
        }
    };

    $scope.resetar = function () {
        $scope.pausar();
        dataInicioSessaoAtual = null;
        $scope.tempoAtual = TEMPO_FOCO;
        $scope.faseAtual = "Foco";
        ciclosCompletados = 0;
        atualizarTela();
    };

    $scope.limparFormulario();
    atualizarTela();
    $scope.carregarTarefas();
});