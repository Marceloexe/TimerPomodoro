USE [TimerPomodoro];
GO

CREATE OR ALTER PROCEDURE dbo.sp_ObterRelatorioPomodoro
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ISNULL(SUM(CASE 
            WHEN CAST(DataInicio AS DATE) = CAST(GETDATE() AS DATE) 
            THEN DATEDIFF(MINUTE, DataInicio, DataFim) ELSE 0 
        END), 0) AS MinutosHoje,

        ISNULL(SUM(CASE 
            WHEN DataInicio >= DATEADD(dd, -(DATEPART(dw, GETDATE())-2), CAST(GETDATE() AS DATE)) 
            THEN DATEDIFF(MINUTE, DataInicio, DataFim) ELSE 0 
        END), 0) AS MinutosSemana,

        ISNULL(SUM(CASE 
            WHEN MONTH(DataInicio) = MONTH(GETDATE()) AND YEAR(DataInicio) = YEAR(GETDATE()) 
            THEN DATEDIFF(MINUTE, DataInicio, DataFim) ELSE 0 
        END), 0) AS MinutosMes,

        ISNULL(SUM(CASE 
            WHEN YEAR(DataInicio) = YEAR(GETDATE()) 
            THEN DATEDIFF(MINUTE, DataInicio, DataFim) ELSE 0 
        END), 0) AS MinutosAno
    FROM SessaoFoco;
END;
GO