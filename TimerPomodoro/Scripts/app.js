var app = angular.module('pomodoroApp', []);

app.controller('timerController', function ($scope, $interval) {
    var TEMPO_FOCO = 25 * 60;
    var TEMPO_PAUSA_CURTA = 5 * 60;
    var TEMPO_PAUSA_LONGA = 15 * 60;
    var promessaTimer;
    var ciclosCompletados = 0;

    $scope.tempoAtual = TEMPO_FOCO;
    $scope.faseAtual = "Foco";
    $scope.tempoFormatado = "25:00";

    function atualizarTela() {
        var minutos = Math.floor($scope.tempoAtual / 60);
        var segundos = $scope.tempoAtual % 60;
        minutos = minutos < 10 ? "0" + minutos : minutos;
        segundos = segundos < 10 ? "0" + segundos : segundos;
        $scope.tempoFormatado = minutos + ":" + segundos;
    }

    function avancarFase() {
        $scope.pausar();

        if ($scope.faseAtual === "Foco") {
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
});