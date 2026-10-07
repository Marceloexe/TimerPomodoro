USE TimerPomodoro;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ObterRelatorioResumo
    @DataInicio DATETIME,
    @DataFim DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        COUNT(s.Id) AS TotalPomodoros,
        ISNULL(SUM(DATEDIFF(MINUTE, s.DataInicio, s.DataFim)), 0) AS TempoTotalMinutos
    FROM SessaoFoco s
    WHERE s.DataInicio >= @DataInicio AND s.DataFim <= @DataFim;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_ObterRelatorioPorTarefa
    @DataInicio DATETIME,
    @DataFim DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ISNULL(t.Titulo, 'Sem Tarefa Vinculada') AS NomeTarefa,
        COUNT(s.Id) AS PomodorosConcluidos,
        ISNULL(SUM(DATEDIFF(MINUTE, s.DataInicio, s.DataFim)), 0) AS TempoTotalMinutos
    FROM SessaoFoco s
    LEFT JOIN Tarefas t ON s.TarefaId = t.Id
    WHERE s.DataInicio >= @DataInicio AND s.DataFim <= @DataFim
    GROUP BY t.Titulo;
END
GO