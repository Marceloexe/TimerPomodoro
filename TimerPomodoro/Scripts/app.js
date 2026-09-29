var app = angular.module('pomodoroApp', []);

app.controller('timerController', function ($scope, $interval, $window) {

    var tempoFocoSalvo = localStorage.getItem('tempoFoco');
    var tempoPausaCurtaSalva = localStorage.getItem('tempoPausaCurta');
    var tempoPausaLongaSalva = localStorage.getItem('tempoPausaLonga');

    var TEMPO_FOCO = tempoFocoSalvo ? parseInt(tempoFocoSalvo) : 25 * 60;
    var TEMPO_PAUSA_CURTA = tempoPausaCurtaSalva ? parseInt(tempoPausaCurtaSalva) : 5 * 60;
    var TEMPO_PAUSA_LONGA = tempoPausaLongaSalva ? parseInt(tempoPausaLongaSalva) : 15 * 60;

    $scope.tempoFocoCustom = TEMPO_FOCO / 60;
    $scope.pausaCurtaCustom = TEMPO_PAUSA_CURTA / 60;
    $scope.pausaLongaCustom = TEMPO_PAUSA_LONGA / 60;

    var promessaTimer;
    var ciclosCompletados = 0;
    var tocadorDeAudio = new Audio('despertador-iphone.mp3');

    $scope.tempoAtual = TEMPO_FOCO;
    $scope.faseAtual = "Foco";

    $scope.salvarConfiguracao = function () {
        var tempoFocoSeg = ($scope.tempoFocoCustom || 25) * 60;
        var pausaCurtaSeg = ($scope.pausaCurtaCustom || 5) * 60;
        var pausaLongaSeg = ($scope.pausaLongaCustom || 15) * 60;

        localStorage.setItem('tempoFoco', tempoFocoSeg);
        localStorage.setItem('tempoPausaCurta', pausaCurtaSeg);
        localStorage.setItem('tempoPausaLonga', pausaLongaSeg);

        alert('Configurações salvas com sucesso!');
        $window.location.href = '/Home/Index';
    };

    $scope.tarefas = [];
    $scope.tarefaAtiva = null;
    $scope.novaTarefa = { Id: 0, Titulo: '', Descricao: '', PomodorosEstimados: 1, PomodorosConcluidos: 0, Concluida: false };

    $scope.carregarTarefas = function () {
        var tarefasSalvas = localStorage.getItem('listaTarefas');
        $scope.tarefas = tarefasSalvas ? JSON.parse(tarefasSalvas) : [];
    };

    function guardarTarefasNoStorage() {
        localStorage.setItem('listaTarefas', JSON.stringify($scope.tarefas));
    }

    $scope.selecionarTarefa = function (tarefa) {
        $scope.tarefaAtiva = tarefa;
    };

    $scope.salvarTarefa = function () {
        if (!$scope.novaTarefa.Titulo) return;

        if ($scope.novaTarefa.Id === 0) {
            $scope.novaTarefa.Id = new Date().getTime();
            $scope.novaTarefa.PomodorosConcluidos = 0;
            $scope.tarefas.push(angular.copy($scope.novaTarefa));
        } else {
            for (var i = 0; i < $scope.tarefas.length; i++) {
                if ($scope.tarefas[i].Id === $scope.novaTarefa.Id) {
                    $scope.tarefas[i] = angular.copy($scope.novaTarefa);
                    break;
                }
            }
        }

        guardarTarefasNoStorage();
        $scope.limparFormulario();
    };

    $scope.editarTarefa = function (tarefa) {
        $scope.novaTarefa = angular.copy(tarefa);
    };

    $scope.deletarTarefa = function (id) {
        if (confirm("Deseja eliminar esta tarefa?")) {
            $scope.tarefas = $scope.tarefas.filter(function (t) { return t.Id !== id; });
            if ($scope.tarefaAtiva && $scope.tarefaAtiva.Id === id) {
                $scope.tarefaAtiva = null;
            }
            guardarTarefasNoStorage();
        }
    };

    $scope.limparFormulario = function () {
        $scope.novaTarefa = { Id: 0, Titulo: '', Descricao: '', PomodorosEstimados: 1, PomodorosConcluidos: 0, Concluida: false };
    };

    function atualizarTela() {
        var minutos = Math.floor($scope.tempoAtual / 60);
        var segundos = $scope.tempoAtual % 60;
        $scope.tempoFormatado = (minutos < 10 ? "0" : "") + minutos + ":" + (segundos < 10 ? "0" : "") + segundos;
    }

    function registrarSessaoConcluida() {
        if ($scope.tarefaAtiva) {
            $scope.tarefaAtiva.PomodorosConcluidos = ($scope.tarefaAtiva.PomodorosConcluidos || 0) + 1;

            for (var i = 0; i < $scope.tarefas.length; i++) {
                if ($scope.tarefas[i].Id === $scope.tarefaAtiva.Id) {
                    $scope.tarefas[i].PomodorosConcluidos = $scope.tarefaAtiva.PomodorosConcluidos;
                    break;
                }
            }
            guardarTarefasNoStorage();
        }
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

    $scope.iniciar = function () {
        tocadorDeAudio.pause();
        if (angular.isDefined(promessaTimer)) return;

        promessaTimer = $interval(function () {
            if ($scope.tempoAtual > 0) {
                $scope.tempoAtual--;
                atualizarTela();
            } else {
                avancarFase();
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
        $scope.tempoAtual = TEMPO_FOCO;
        $scope.faseAtual = "Foco";
        ciclosCompletados = 0;
        atualizarTela();
    };

    $scope.configuracao = function () {
        $window.location.href = '/Home/Configuracao';
    };

    atualizarTela();
    $scope.carregarTarefas();
});