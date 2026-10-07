CREATE DATABASE TimerPomodoro;
GO

USE TimerPomodoro;
GO


CREATE TABLE Tarefa
(
    Id INT IDENTITY(1,1) NOT NULL,

    Titulo VARCHAR(200) NOT NULL,

    Descricao VARCHAR(MAX) NULL,

    PomodorosConcluidos INT NOT NULL
        CONSTRAINT DF_Tarefa_PomodorosConcluidos DEFAULT 0,

    TempoFoco INT NOT NULL
        CONSTRAINT DF_Tarefa_TempoFoco DEFAULT 25,

    PausaCurta INT NOT NULL
        CONSTRAINT DF_Tarefa_PausaCurta DEFAULT 5,

    PausaLonga INT NOT NULL
        CONSTRAINT DF_Tarefa_PausaLonga DEFAULT 15,

    Concluida BIT NOT NULL
        CONSTRAINT DF_Tarefa_Concluida DEFAULT 0,

    Arquivada BIT NOT NULL
        CONSTRAINT DF_Tarefa_Arquivada DEFAULT 0,

    DataCriacao DATETIME NOT NULL
        CONSTRAINT DF_Tarefa_DataCriacao DEFAULT GETDATE(),

    CONSTRAINT PK_Tarefa
        PRIMARY KEY (Id)
);
GO



CREATE TABLE SessaoFoco
(
    Id INT IDENTITY(1,1) NOT NULL,

    TarefaId INT NULL,

    DataInicio DATETIME NOT NULL,

    DataFim DATETIME NOT NULL,

    DuracaoMinutos INT NOT NULL,

    CONSTRAINT PK_SessaoFoco
        PRIMARY KEY (Id),

    CONSTRAINT FK_SessaoFoco_Tarefa
        FOREIGN KEY (TarefaId)
        REFERENCES Tarefa(Id)
);
GO



CREATE INDEX IX_SessaoFoco_DataInicio_TarefaId
ON SessaoFoco
(
    DataInicio,
    TarefaId
);
GO



CREATE PROCEDURE sp_ObterRelatorioPomodoro
    @DataInicio DATETIME = NULL,
    @DataFim DATETIME = NULL
AS
BEGIN

    SET NOCOUNT ON;

    SELECT
        SF.Id AS SessaoId,
        SF.TarefaId,
        T.Titulo AS Tarefa,
        SF.DataInicio,
        SF.DataFim,
        SF.DuracaoMinutos,
        T.Concluida,
        T.Arquivada

    FROM SessaoFoco SF

    LEFT JOIN Tarefa T
        ON T.Id = SF.TarefaId

    WHERE
        (@DataInicio IS NULL
            OR SF.DataInicio >= @DataInicio)

    AND
        (@DataFim IS NULL
            OR SF.DataInicio <= @DataFim)

    ORDER BY
        SF.DataInicio DESC;

END;
GO